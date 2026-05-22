import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { EOrderStatus } from './enums/EOrderStatus.enum';
import { ENV_VARS } from '../../constants/env.constants';
import { Product } from '../products/entities/product.entity';

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
  ) { }

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(`Missing env: ${key}`);
    }

    return value;
  }

  async createMoMoPayment(payload: { items: { productId: string; quantity: number }[] }, userId: string) {
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    let calculatedTotalAmount = 0;
    const validOrderItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of payload.items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Sản phẩm không tồn tại`);
      }

      const realPrice = Number(product.price);
      calculatedTotalAmount += realPrice * item.quantity;

      validOrderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: realPrice,
      });
    }

    let order = this.orderRepository.create({
      userId: userId,
      amount: calculatedTotalAmount,
      status: EOrderStatus.PENDING,
    });
    order = await this.orderRepository.save(order);
    const orderId = order.id;

    const orderItems = validOrderItems.map(item => this.orderItemRepository.create({
      orderId: orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));
    await this.orderItemRepository.save(orderItems);

    const partnerCode = this.getRequiredEnv(ENV_VARS.MOMO_PARTNER_CODE);
    const accessKey = this.getRequiredEnv(ENV_VARS.MOMO_ACCESS_KEY);
    const secretKey = this.getRequiredEnv(ENV_VARS.MOMO_SECRET_KEY);
    const endpoint = this.getRequiredEnv(ENV_VARS.MOMO_ENDPOINT);
    const redirectUrl = this.getRequiredEnv(ENV_VARS.MOMO_REDIRECT_URL);
    const ipnUrl = this.getRequiredEnv(ENV_VARS.MOMO_IPN_URL);

    const amount = Math.round(Number(calculatedTotalAmount)).toString();
    const orderInfo = 'Thanh toan don hang ' + orderId;
    const requestId = orderId;
    const extraData = '';
    const requestType = 'payWithMethod';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = {
      partnerCode,
      partnerName: "Test Store",
      storeId: "store-1",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: "vi",
      requestType,
      autoCapture: true,
      extraData,
      orderGroupId: "",
      signature
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

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('Error connecting to MoMo');
    }
  }

  async processMoMoIPN(ipnData: any) {
    const accessKey = this.getRequiredEnv(ENV_VARS.MOMO_ACCESS_KEY);
    const secretKey = this.getRequiredEnv(ENV_VARS.MOMO_SECRET_KEY);

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature: reqSignature
    } = ipnData;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (signature !== reqSignature) {
      console.log('Invalid signature from MoMo IPN');
      return false;
    }

    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order) {
      if (resultCode === 0) {
        order.status = EOrderStatus.PAID;
      } else {
        order.status = EOrderStatus.FAILED;
      }
      await this.orderRepository.save(order);
    }

    return true;
  }

  async getPaymentStatus(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId, userId } });
    if (!order) return null;
    return order.status;
  }
}
