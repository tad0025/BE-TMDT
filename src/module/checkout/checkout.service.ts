import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { EOrderStatus } from './enums/EOrderStatus.enum';
import { EPaymentStatus } from './enums/EPaymentStatus.enum';
import { Product } from '../products/entities/product.entity';
import { Address } from '../users/entities/address-users.entity';
import { PrepareCheckoutDto } from './dto/prepare-checkout.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  PrepareCheckoutResponseDto,
  AddressResponseDto,
  CheckoutItemResponseDto,
  InvalidItemResponseDto,
} from './dto/checkout-response.dto';
import { ShippingService } from './services/shipping.service';
import { MomoService } from './services/momo.service';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private shippingService: ShippingService,
    private momoService: MomoService,
  ) { }

  private mapAddressToDto(address: Address): AddressResponseDto {
    return {
      id: address.id,
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      provinceCode: address.provinceCode,
      provinceName: address.provinceName,
      districtCode: address.districtCode,
      districtName: address.districtName,
      wardCode: address.wardCode,
      wardName: address.wardName,
      street: address.street,
      latitude: address.latitude,
      longitude: address.longitude,
      fullAddress: address.fullAddress,
    };
  }

  async prepareCheckout(dto: PrepareCheckoutDto, userId: string): Promise<PrepareCheckoutResponseDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    let address: Address | null = null;
    if (dto.addressId) {
      address = await this.addressRepository.findOne({
        where: { id: dto.addressId, userId },
      });
      if (!address) throw new NotFoundException('Không tìm thấy địa chỉ giao hàng');
    } else {
      address = await this.addressRepository.findOne({
        where: { userId, isDefault: true },
      });
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepository.findBy({ id: In(productIds) });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const validItems: CheckoutItemResponseDto[] = [];
    const invalidItems: InvalidItemResponseDto[] = [];
    let subTotal = 0;

    for (const item of dto.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        invalidItems.push({ productId: item.productId, reason: 'Sản phẩm không tồn tại' });
        continue;
      }
      if (product.stock <= 0) {
        invalidItems.push({ productId: item.productId, reason: 'Sản phẩm đã hết hàng' });
        continue;
      }
      if (item.quantity > product.stock) {
        invalidItems.push({
          productId: item.productId,
          reason: `Chỉ còn ${product.stock} sản phẩm trong kho`,
        });
        continue;
      }

      const price = Number(product.price);
      const amount = price * item.quantity;
      subTotal += amount;

      validItems.push({
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price,
          originalPrice: Number(product.originalPrice),
          discountPercentage: Number(product.discountPercentage),
        },
        quantity: item.quantity,
        amount,
      });
    }

    const { boxLength, boxWidth, boxHeight, boxWeight, packingResult } = this.shippingService.calculateOptimalBox(dto.items, productMap);
    if (packingResult) {
      console.log("[prepareCheckout] Kiện hàng tối ưu:", packingResult);
    }

    const shippingFee = address
      ? await this.shippingService.calcShippingFeeGHN(address.districtCode, address.wardCode.toString(), boxWeight, boxLength, boxWidth, boxHeight)
      : 0;

    return {
      address: address ? this.mapAddressToDto(address) : null,
      items: validItems,
      subTotal,
      shippingFee,
      totalAmount: subTotal + shippingFee,
      invalidItems,
    };
  }

  async checkoutOrder(dto: CreateOrderDto, userId: string): Promise<{ orderId: string; payUrl: string | null, paymentRequired: boolean }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    const address = await this.addressRepository.findOne({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ giao hàng');

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepository.findBy({ id: In(productIds) });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subTotal = 0;
    const validOrderItems: {
      productId: string;
      quantity: number;
      price: number;
      productName: string;
      productImageUrl: string;
      originalPrice: number;
      discountPercentage: number;
    }[] = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException(`Sản phẩm ${item.productId} không tồn tại`);
      if (item.quantity > product.stock) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" không đủ hàng (còn ${product.stock})`,
        );
      }

      const price = Number(product.price);
      subTotal += price * item.quantity;

      validOrderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price,
        productName: product.name,
        productImageUrl: product.imageUrl,
        originalPrice: Number(product.originalPrice),
        discountPercentage: Number(product.discountPercentage),
      });
    }

    const { boxLength, boxWidth, boxHeight, boxWeight, packingResult } = this.shippingService.calculateOptimalBox(dto.items, productMap);
    if (packingResult) {
      console.log("[checkoutOrder] Kiện hàng tối ưu:", packingResult);
    }

    const shippingFee = await this.shippingService.calcShippingFeeGHN(address.districtCode, address.wardCode.toString(), boxWeight, boxLength, boxWidth, boxHeight);
    const totalAmount = subTotal + shippingFee;

    let order = this.orderRepository.create({
      userId,
      addressId: address.id,
      subTotal,
      shippingFee,
      totalAmount,
      status: EOrderStatus.PENDING,
      paymentStatus: EPaymentStatus.PENDING,
      paymentMethod: dto.paymentMethod,
      snapshotAddress: this.mapAddressToDto(address),
    });
    order = await this.orderRepository.save(order);
    const orderId = order.id;

    const orderItems = validOrderItems.map((item) =>
      this.orderItemRepository.create({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        originalPrice: item.originalPrice,
        discountPercentage: item.discountPercentage,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    if (dto.paymentMethod === 'MOMO') {
      const payUrl = await this.momoService.buildMoMoPaymentUrl(orderId, totalAmount);
      return { orderId, payUrl, paymentRequired: true };
    }

    return { orderId, payUrl: null, paymentRequired: false };
  }

  async processMoMoIPN(ipnData: any): Promise<boolean> {
    const isValid = this.momoService.verifyIpnSignature(ipnData);
    if (!isValid) return false;

    const { orderId, resultCode } = ipnData;
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (order) {
      order.paymentStatus = resultCode === 0 ? EPaymentStatus.PAID : EPaymentStatus.FAILED;
      await this.orderRepository.save(order);
    }

    return true;
  }

  async getPaymentStatus(orderId: string, userId: string): Promise<any> {
    const order = await this.orderRepository.findOne({ where: { id: orderId, userId } });
    if (!order) return null;
    return {
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus
    };
  }
}
