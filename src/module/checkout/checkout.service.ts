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
import { VnpayService } from './services/vnpay.service';
import { PaypalService } from './services/paypal.service';
import { CartItem } from '../cart/entities/cart-item.entity';
import { MailService } from '../mails/mail.service';
import { User } from '../users/entities/user.entity';

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
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private shippingService: ShippingService,
    private momoService: MomoService,
    private vnpayService: VnpayService,
    private paypalService: PaypalService,
    private mailService: MailService,
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

  async checkoutOrder(dto: CreateOrderDto, userId: string, ipAddr: string = '127.0.0.1'): Promise<{ orderId: string; payUrl: string | null, paymentRequired: boolean }> {
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
      statusHistory: [{
        status: EOrderStatus.PENDING,
        timestamp: new Date(),
        note: 'Đơn hàng đã được tạo'
      }]
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

    if (dto.paymentMethod === 'VNPAY') {
      const payUrl = this.vnpayService.buildVnpayPaymentUrl(orderId, totalAmount, ipAddr);
      return { orderId, payUrl, paymentRequired: true };
    }

    if (dto.paymentMethod === 'PAYPAL') {
      const payUrl = await this.paypalService.buildPayPalPaymentUrl(orderId, totalAmount);
      return { orderId, payUrl, paymentRequired: true };
    }

    // For COD, the order is complete, clear items from cart immediately
    await this.clearPurchasedItemsFromCart(userId, productIds);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      this.mailService.sendOrderStatusUpdateEmail(user.email, {
        orderCode: order.id,
        customerName: address.fullName,
        newStatus: 'Đơn hàng đang chờ được xử lý',
        updatedAt: order.createdAt.toLocaleString('vi-VN'),
        orderItems: validOrderItems
      });
    }

    return { orderId, payUrl: null, paymentRequired: false };
  }

  private async clearPurchasedItemsFromCart(userId: string, productIds: string[]) {
    if (!productIds || productIds.length === 0) return;
    const items = await this.cartItemRepository.find({
      where: {
        user: { id: userId },
        product: { id: In(productIds) }
      }
    });
    if (items.length > 0) {
      await this.cartItemRepository.remove(items);
    }
  }

  private async sendOnlinePaymentBillingEmail(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });
    if (!order) return;

    const user = await this.userRepository.findOne({ where: { id: order.userId } });
    if (!user) return;

    let snapshotAddress: any = order.snapshotAddress;
    if (typeof snapshotAddress === 'string') {
      try { snapshotAddress = JSON.parse(snapshotAddress); } catch (e) { }
    }

    const orderItems = order.items.map(item => ({
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      price: item.price,
      quantity: item.quantity,
      originalPrice: item.originalPrice,
      discountPercentage: item.discountPercentage,
      totalAmount: item.price * item.quantity
    }));

    this.mailService.sendBillingEmail(user.email, {
      orderCode: order.id,
      customerName: snapshotAddress?.fullName || user.fullName,
      customerEmail: user.email,
      orderItems,
      subTotal: order.subTotal,
      shippingFee: order.shippingFee,
      discount: 0,
      total: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: 'Đã thanh toán',
      createdAt: order.createdAt.toLocaleString('vi-VN')
    });
  }

  async processMoMoIPN(ipnData: any): Promise<boolean> {
    const isValid = this.momoService.verifyIpnSignature(ipnData);
    if (!isValid) return false;

    const { orderId, resultCode } = ipnData;
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (order) {
      order.paymentStatus = resultCode === 0 ? EPaymentStatus.PAID : EPaymentStatus.FAILED;
      await this.orderRepository.save(order);

      // If MOMO payment succeeded, clear items from cart
      if (resultCode === 0) {
        const orderItems = await this.orderItemRepository.find({ where: { orderId } });
        const productIds = orderItems.map(item => item.productId);
        await this.clearPurchasedItemsFromCart(order.userId, productIds);
        this.sendOnlinePaymentBillingEmail(orderId);
      }
    }

    return true;
  }

  async processVnpayIPN(query: any): Promise<{ RspCode: string; Message: string }> {
    const isValid = this.vnpayService.verifyIpnSignature(query);
    if (!isValid) return { RspCode: '97', Message: 'Invalid signature' };

    const orderId = query['vnp_TxnRef'];
    const vnp_ResponseCode = query['vnp_ResponseCode'];
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) return { RspCode: '01', Message: 'Order not found' };

    if (order.paymentStatus === EPaymentStatus.PAID) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    if (vnp_ResponseCode === '00') {
      order.paymentStatus = EPaymentStatus.PAID;
      await this.orderRepository.save(order);

      const orderItems = await this.orderItemRepository.find({ where: { orderId } });
      const productIds = orderItems.map(item => item.productId);
      await this.clearPurchasedItemsFromCart(order.userId, productIds);
      this.sendOnlinePaymentBillingEmail(orderId);
    } else {
      order.paymentStatus = EPaymentStatus.FAILED;
      await this.orderRepository.save(order);
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  async capturePayPalOrder(token: string, orderId: string): Promise<boolean> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) return false;

    if (order.paymentStatus === EPaymentStatus.PAID) return true;

    const isSuccess = await this.paypalService.captureOrder(token);

    if (isSuccess) {
      order.paymentStatus = EPaymentStatus.PAID;
      await this.orderRepository.save(order);

      const orderItems = await this.orderItemRepository.find({ where: { orderId } });
      const productIds = orderItems.map(item => item.productId);
      await this.clearPurchasedItemsFromCart(order.userId, productIds);
      this.sendOnlinePaymentBillingEmail(orderId);
      return true;
    } else {
      order.paymentStatus = EPaymentStatus.FAILED;
      await this.orderRepository.save(order);
      return false;
    }
  }

  async cancelPayPalOrder(orderId: string): Promise<boolean> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order && order.paymentStatus !== EPaymentStatus.PAID) {
      order.paymentStatus = EPaymentStatus.FAILED;
      await this.orderRepository.save(order);
      return true;
    }
    return false;
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
