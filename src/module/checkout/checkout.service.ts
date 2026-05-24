import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { EOrderStatus } from './enums/EOrderStatus.enum';
import { ENV_VARS } from '../../constants/env.constants';
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

// Phí ship tạm tính theo khoảng cách đến kho (đơn vị: VNĐ)
// Sẽ cập nhật bằng Google Maps API sau
const SHOP_LAT = 10.7769; // Vĩ độ kho hàng (ví dụ: TPHCM)
const SHOP_LNG = 106.7009; // Kinh độ kho hàng
const SHIP_FEE_PER_KM = 3000; // 3.000 VNĐ/km
const BASE_SHIP_FEE = 15000;   // Phí cơ bản

@Injectable()
export class CheckoutService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) { }

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new InternalServerErrorException(`Missing env: ${key}`);
    return value;
  }

  /**
   * Haversine formula – tính khoảng cách (km) giữa 2 tọa độ.
   * Sẽ thay bằng Google Maps Distance Matrix API sau.
   */
  private calcDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private calcShippingFee(lat: number, lng: number): number {
    const distKm = this.calcDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
    return Math.round(BASE_SHIP_FEE + distKm * SHIP_FEE_PER_KM);
  }

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

  // ─── prepareCheckout ─────────────────────────────────────────────────────────

  /**
   * Tính toán trước thông tin đơn hàng (không tạo order trong DB).
   * FE dùng response này để hiển thị trang xác nhận thanh toán.
   */
  async prepareCheckout(dto: PrepareCheckoutDto, userId: string): Promise<PrepareCheckoutResponseDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    // 1. Lấy địa chỉ giao hàng
    let address: Address | null = null;
    if (dto.addressId) {
      address = await this.addressRepository.findOne({
        where: { id: dto.addressId, userId },
      });
      if (!address) throw new NotFoundException('Không tìm thấy địa chỉ giao hàng');
    } else {
      // Dùng địa chỉ mặc định nếu không truyền addressId
      address = await this.addressRepository.findOne({
        where: { userId, isDefault: true },
      });
    }

    // 2. Validate sản phẩm
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

    // 3. Tính phí ship
    const shippingFee = address
      ? this.calcShippingFee(address.latitude, address.longitude)
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

  // ─── createMoMoPayment ───────────────────────────────────────────────────────

  /**
   * Tạo đơn hàng trong DB rồi tạo link thanh toán MoMo.
   * Sử dụng CreateOrderDto (có addressId bắt buộc).
   */
  async createMoMoPayment(dto: CreateOrderDto, userId: string): Promise<{ orderId: string; payUrl: string }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    // 1. Lấy địa chỉ giao hàng
    const address = await this.addressRepository.findOne({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ giao hàng');

    // 2. Validate sản phẩm & tính tiền
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

    const shippingFee = this.calcShippingFee(address.latitude, address.longitude);
    const totalAmount = subTotal + shippingFee;

    // 3. Lưu Order
    let order = this.orderRepository.create({
      userId,
      addressId: address.id,
      subTotal,
      shippingFee,
      totalAmount,
      status: EOrderStatus.PENDING,
      snapshotAddress: this.mapAddressToDto(address),
    });
    order = await this.orderRepository.save(order);
    const orderId = order.id;

    // 4. Lưu OrderItems (snapshot sản phẩm)
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

    // 5. Tạo link thanh toán MoMo
    const payUrl = await this.buildMoMoPaymentUrl(orderId, totalAmount);
    return { orderId, payUrl };
  }

  private async buildMoMoPaymentUrl(orderId: string, totalAmount: number): Promise<string> {
    const partnerCode = this.getRequiredEnv(ENV_VARS.MOMO_PARTNER_CODE);
    const accessKey = this.getRequiredEnv(ENV_VARS.MOMO_ACCESS_KEY);
    const secretKey = this.getRequiredEnv(ENV_VARS.MOMO_SECRET_KEY);
    const endpoint = this.getRequiredEnv(ENV_VARS.MOMO_ENDPOINT);
    const redirectUrl = this.getRequiredEnv(ENV_VARS.MOMO_REDIRECT_URL);
    const ipnUrl = this.getRequiredEnv(ENV_VARS.MOMO_IPN_URL);

    const amount = Math.round(totalAmount).toString();
    const orderInfo = 'Thanh toan don hang ' + orderId;
    const requestId = orderId;
    const extraData = '';
    const requestType = 'payWithMethod';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = {
      partnerCode,
      partnerName: 'Test Store',
      storeId: 'store-1',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      orderGroupId: '',
      signature,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(requestBody)).toString(),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.resultCode !== 0) {
        throw new InternalServerErrorException(data.message || 'MoMo payment creation failed');
      }
      return data.payUrl;
    } catch (error) {
      console.error('MoMo Error:', error);
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException('Error connecting to MoMo');
    }
  }

  // ─── MoMo IPN ────────────────────────────────────────────────────────────────

  async processMoMoIPN(ipnData: any): Promise<boolean> {
    const accessKey = this.getRequiredEnv(ENV_VARS.MOMO_ACCESS_KEY);
    const secretKey = this.getRequiredEnv(ENV_VARS.MOMO_SECRET_KEY);

    const {
      partnerCode, orderId, requestId, amount, orderInfo, orderType,
      transId, resultCode, message, payType, responseTime, extraData,
      signature: reqSignature,
    } = ipnData;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (signature !== reqSignature) {
      console.log('Invalid signature from MoMo IPN');
      return false;
    }

    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order) {
      order.status = resultCode === 0 ? EOrderStatus.PAID : EOrderStatus.FAILED;
      await this.orderRepository.save(order);
    }

    return true;
  }

  // ─── getPaymentStatus ─────────────────────────────────────────────────────────

  async getPaymentStatus(orderId: string, userId: string): Promise<EOrderStatus | null> {
    const order = await this.orderRepository.findOne({ where: { id: orderId, userId } });
    if (!order) return null;
    return order.status;
  }
}
