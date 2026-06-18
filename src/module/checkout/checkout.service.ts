import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { EOrderStatus } from './enums/EOrderStatus.enum';
import { EPaymentStatus } from './enums/EPaymentStatus.enum';
import { Product } from '../products/entities/product.entity';
import { Address } from '../users/entities/address-users.entity';
import { PrepareCheckoutDto } from './dto/prepare-checkout.dto';
import { PrepareCartCheckoutDto } from './dto/prepare-cart-checkout.dto';
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
import { VouchersService } from '../vouchers/vouchers.service';
import { VoucherType, Voucher } from '../vouchers/entities/voucher.entity';
import { OrderVoucher } from './entities/order-voucher.entity';
import { CheckoutPrepare } from './entities/checkout-prepare.entity';
import { ECheckoutPrepareStatus } from './enums/ECheckoutPrepareStatus.enum';

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
    private vouchersService: VouchersService,
    @InjectRepository(CheckoutPrepare)
    private checkoutPrepareRepository: Repository<CheckoutPrepare>,
    private dataSource: DataSource,
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

  async prepareCheckoutAndSaveCart(dto: PrepareCartCheckoutDto, userId: string): Promise<PrepareCheckoutResponseDto> {
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        let cartItem = await this.cartItemRepository.findOne({
          where: { user: { id: userId }, product: { id: item.productId } },
        });

        if (cartItem) {
          cartItem.quantity = item.quantity;
          await this.cartItemRepository.save(cartItem);
        } else {
          cartItem = this.cartItemRepository.create({
            user: { id: userId },
            product: { id: item.productId },
            quantity: item.quantity,
          });
          await this.cartItemRepository.save(cartItem);
        }
      }
    }

    const prepareDto: PrepareCheckoutDto = {
      items: dto.items,
      addressId: dto.addressId,
      voucherCodes: dto.voucherCodes,
    };

    return this.prepareCheckout(prepareDto, userId);
  }

  async prepareCheckout(dto: PrepareCheckoutDto, userId: string): Promise<PrepareCheckoutResponseDto> {
    let prepareTempId = dto.prepareTempId;

    if (prepareTempId) {
      const existingPrepare = await this.checkoutPrepareRepository.findOne({ where: { id: prepareTempId } });
      if (!existingPrepare) {
        throw new NotFoundException('Dữ liệu prepare không tồn tại');
      }
      if (existingPrepare.userId !== userId && existingPrepare.userId !== null) {
        throw new BadRequestException('Không có quyền truy cập');
      }
      if (existingPrepare.status !== ECheckoutPrepareStatus.PREPARING) {
        throw new BadRequestException('Dữ liệu prepare đã được sử dụng hoặc hết hạn');
      }
      if (new Date(existingPrepare.expiredAt) < new Date()) {
        existingPrepare.status = ECheckoutPrepareStatus.EXPIRED;
        await this.checkoutPrepareRepository.save(existingPrepare);
        throw new BadRequestException('Dữ liệu prepare đã hết hạn');
      }

      const payload = existingPrepare.payload;
      if (dto.items && dto.items.length > 0) payload.items = dto.items;
      if (dto.addressId !== undefined) payload.addressId = dto.addressId;
      if (dto.voucherCodes !== undefined) payload.voucherCodes = dto.voucherCodes;
      
      dto.items = payload.items;
      dto.addressId = payload.addressId;
      dto.voucherCodes = payload.voucherCodes;
      
      existingPrepare.payload = payload;
      await this.checkoutPrepareRepository.save(existingPrepare);
    } else {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('Giỏ hàng trống');
      }
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 1);

      const payload = {
        items: dto.items,
        addressId: dto.addressId,
        voucherCodes: dto.voucherCodes
      };

      const prepareRecord = this.checkoutPrepareRepository.create({
        userId,
        payload,
        expiredAt,
        status: ECheckoutPrepareStatus.PREPARING
      });
      await this.checkoutPrepareRepository.save(prepareRecord);
      
      prepareTempId = prepareRecord.id;
    }

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

    let discountAmount = 0;
    let shippingDiscountAmount = 0;
    let validVouchers: Voucher[] = [];

    if (dto.voucherCodes && dto.voucherCodes.length > 0) {
      let freeshipCount = 0;
      let nonFreeshipCount = 0;

      for (const code of dto.voucherCodes) {
        try {
          const voucher = await this.vouchersService.checkVoucherEligibility(code, userId, subTotal);
          validVouchers.push(voucher);
          if (voucher.voucher_type === VoucherType.FREESHIP_CASH || voucher.voucher_type === VoucherType.FREESHIP_PERCENT) {
            freeshipCount++;
          } else {
            nonFreeshipCount++;
          }
        } catch (e) {
          throw new BadRequestException(e.message);
        }
      }

      if (freeshipCount > 1) {
        throw new BadRequestException('Chỉ được áp dụng tối đa 1 mã miễn phí vận chuyển');
      }
      if (nonFreeshipCount > 2) {
        throw new BadRequestException('Chỉ được áp dụng tối đa 2 mã giảm giá sản phẩm');
      }

      validVouchers.sort((a, b) => {
        if (a.voucher_type === VoucherType.PERCENT && b.voucher_type === VoucherType.CASH) return -1;
        if (a.voucher_type === VoucherType.CASH && b.voucher_type === VoucherType.PERCENT) return 1;
        return 0;
      });

      let remainingSubTotal = subTotal;
      for (const v of validVouchers) {
        if (v.voucher_type === VoucherType.PERCENT) {
          let discount = (subTotal * Number(v.discount_value)) / 100;
          if (v.max_discount_amount && discount > Number(v.max_discount_amount)) {
            discount = Number(v.max_discount_amount);
          }
          if (discount > remainingSubTotal) discount = remainingSubTotal;
          discountAmount += discount;
          remainingSubTotal -= discount;
          (v as any)._calculatedDiscount = discount;
        } else if (v.voucher_type === VoucherType.CASH) {
          let discount = Number(v.discount_value);
          if (discount > remainingSubTotal) discount = remainingSubTotal;
          discountAmount += discount;
          remainingSubTotal -= discount;
          (v as any)._calculatedDiscount = discount;
        }
      }
    }

    const { boxLength, boxWidth, boxHeight, boxWeight, packingResult } = this.shippingService.calculateOptimalBox(dto.items, productMap);
    if (packingResult) {
      console.log("[prepareCheckout] Kiện hàng tối ưu:", packingResult);
    }

    const shippingFee = address
      ? await this.shippingService.calcShippingFeeGHN(address.districtCode, address.wardCode.toString(), boxWeight, boxLength, boxWidth, boxHeight)
      : 0;

    const appliedVouchers: { voucherCode: string; voucherType: string; discountValue: number }[] = [];

    for (const v of validVouchers) {
       if (v.voucher_type === VoucherType.PERCENT || v.voucher_type === VoucherType.CASH) {
          if ((v as any)._calculatedDiscount > 0) {
             appliedVouchers.push({
                voucherCode: v.code,
                voucherType: v.voucher_type,
                discountValue: (v as any)._calculatedDiscount
             });
          }
       } else if (v.voucher_type === VoucherType.FREESHIP_PERCENT) {
          let discount = (shippingFee * Number(v.discount_value)) / 100;
          if (v.max_discount_amount && discount > Number(v.max_discount_amount)) {
            discount = Number(v.max_discount_amount);
          }
          if (discount > shippingFee - shippingDiscountAmount) discount = shippingFee - shippingDiscountAmount;
          shippingDiscountAmount += discount;
          if (discount > 0) {
             appliedVouchers.push({
                voucherCode: v.code,
                voucherType: v.voucher_type,
                discountValue: discount
             });
          }
       } else if (v.voucher_type === VoucherType.FREESHIP_CASH) {
          let discount = Number(v.discount_value);
          if (discount > shippingFee - shippingDiscountAmount) discount = shippingFee - shippingDiscountAmount;
          shippingDiscountAmount += discount;
          if (discount > 0) {
             appliedVouchers.push({
                voucherCode: v.code,
                voucherType: v.voucher_type,
                discountValue: discount
             });
          }
       }
    }

    return {
      prepareTempId,
      address: address ? this.mapAddressToDto(address) : null,
      items: validItems,
      subTotal,
      shippingFee,
      discountAmount,
      shippingDiscountAmount,
      appliedVouchers,
      totalAmount: subTotal - discountAmount + shippingFee - shippingDiscountAmount,
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

    let discountAmount = 0;
    let shippingDiscountAmount = 0;
    let validVouchers: Voucher[] = [];

    if (dto.voucherCodes && dto.voucherCodes.length > 0) {
      let freeshipCount = 0;
      let nonFreeshipCount = 0;

      for (const code of dto.voucherCodes) {
        try {
          const voucher = await this.vouchersService.checkVoucherEligibility(code, userId, subTotal);
          validVouchers.push(voucher);
          if (voucher.voucher_type === VoucherType.FREESHIP_CASH || voucher.voucher_type === VoucherType.FREESHIP_PERCENT) {
            freeshipCount++;
          } else {
            nonFreeshipCount++;
          }
        } catch (e) {
          throw new BadRequestException(e.message);
        }
      }

      if (freeshipCount > 1) {
        throw new BadRequestException('Chỉ được áp dụng tối đa 1 mã miễn phí vận chuyển');
      }
      if (nonFreeshipCount > 2) {
        throw new BadRequestException('Chỉ được áp dụng tối đa 2 mã giảm giá sản phẩm');
      }

      validVouchers.sort((a, b) => {
        if (a.voucher_type === VoucherType.PERCENT && b.voucher_type === VoucherType.CASH) return -1;
        if (a.voucher_type === VoucherType.CASH && b.voucher_type === VoucherType.PERCENT) return 1;
        return 0;
      });

      let remainingSubTotal = subTotal;
      for (const v of validVouchers) {
        if (v.voucher_type === VoucherType.PERCENT) {
          let discount = (subTotal * Number(v.discount_value)) / 100;
          if (v.max_discount_amount && discount > Number(v.max_discount_amount)) {
            discount = Number(v.max_discount_amount);
          }
          if (discount > remainingSubTotal) discount = remainingSubTotal;
          discountAmount += discount;
          remainingSubTotal -= discount;
          (v as any)._calculatedDiscount = discount;
        } else if (v.voucher_type === VoucherType.CASH) {
          let discount = Number(v.discount_value);
          if (discount > remainingSubTotal) discount = remainingSubTotal;
          discountAmount += discount;
          remainingSubTotal -= discount;
          (v as any)._calculatedDiscount = discount;
        }
      }

      for (const v of validVouchers) {
        if (v.voucher_type === VoucherType.FREESHIP_PERCENT) {
            let discount = (shippingFee * Number(v.discount_value)) / 100;
            if (v.max_discount_amount && discount > Number(v.max_discount_amount)) {
              discount = Number(v.max_discount_amount);
            }
            if (discount > shippingFee - shippingDiscountAmount) discount = shippingFee - shippingDiscountAmount;
            shippingDiscountAmount += discount;
            (v as any)._calculatedDiscount = discount;
        } else if (v.voucher_type === VoucherType.FREESHIP_CASH) {
            let discount = Number(v.discount_value);
            if (discount > shippingFee - shippingDiscountAmount) discount = shippingFee - shippingDiscountAmount;
            shippingDiscountAmount += discount;
            (v as any)._calculatedDiscount = discount;
        }
      }
    }

    const totalAmount = subTotal - discountAmount + shippingFee - shippingDiscountAmount;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let orderId: string;
    try {
      if (dto.paymentMethod === 'COD') {
        for (const v of validVouchers) {
          const lockedVoucher = await queryRunner.manager.createQueryBuilder(Voucher, 'voucher')
            .setLock('pessimistic_write')
            .where('voucher.id = :id', { id: v.id })
            .getOne();
          if (!lockedVoucher) {
            throw new BadRequestException(`Mã voucher không tồn tại`);
          }
          if (lockedVoucher.used_count >= lockedVoucher.total_limit) {
            throw new BadRequestException(`Mã voucher ${lockedVoucher.code} đã hết lượt sử dụng`);
          }
          lockedVoucher.used_count += 1;
          await queryRunner.manager.save(lockedVoucher);
        }
      }

      let order = queryRunner.manager.create(Order, {
        userId,
        addressId: address.id,
        subTotal,
        shippingFee,
        discountAmount,
        shippingDiscountAmount,
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
      order = await queryRunner.manager.save(order);
      orderId = order.id;

      const orderItems = validOrderItems.map((item) =>
        queryRunner.manager.create(OrderItem, {
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
      await queryRunner.manager.save(orderItems);

      if (validVouchers.length > 0) {
        const orderVouchers = validVouchers.map(v => {
          return queryRunner.manager.create(OrderVoucher, {
            orderId,
            userId,
            voucherId: v.id,
            voucherCode: v.code,
            discountAmount: (v as any)._calculatedDiscount,
            voucherSnapshot: {
              code: v.code,
              title: v.title,
              voucher_type: v.voucher_type,
              discount_value: Number(v.discount_value),
              max_discount_amount: v.max_discount_amount ? Number(v.max_discount_amount) : null,
              min_order_value: Number(v.min_order_value)
            }
          });
        });
        await queryRunner.manager.save(orderVouchers);
      }

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

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
        orderCode: orderId,
        customerName: address.fullName,
        newStatus: 'Đơn hàng đang chờ được xử lý',
        updatedAt: new Date().toLocaleString('vi-VN'),
        orderItems: validOrderItems
      });
    }

    return { orderId, payUrl: null, paymentRequired: false };
  }

  private async consumeVouchersForOrder(orderId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderVouchers = await queryRunner.manager.find(OrderVoucher, { where: { orderId } });
      for (const ov of orderVouchers) {
        const lockedVoucher = await queryRunner.manager.createQueryBuilder(Voucher, 'voucher')
          .setLock('pessimistic_write')
          .where('voucher.id = :id', { id: ov.voucherId })
          .getOne();
        if (lockedVoucher) {
            lockedVoucher.used_count += 1;
            await queryRunner.manager.save(lockedVoucher);
        }
      }
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.error('Lỗi khi consume voucher cho đơn hàng PAID:', e);
    } finally {
      await queryRunner.release();
    }
  }

  async rollbackVouchersForOrder(orderId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderVouchers = await queryRunner.manager.find(OrderVoucher, { where: { orderId } });
      for (const ov of orderVouchers) {
        const lockedVoucher = await queryRunner.manager.createQueryBuilder(Voucher, 'voucher')
          .setLock('pessimistic_write')
          .where('voucher.id = :id', { id: ov.voucherId })
          .getOne();
        if (lockedVoucher && lockedVoucher.used_count > 0) {
            lockedVoucher.used_count -= 1;
            await queryRunner.manager.save(lockedVoucher);
        }
      }
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.error('Lỗi khi rollback voucher cho đơn hàng:', e);
    } finally {
      await queryRunner.release();
    }
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

      // If MOMO payment succeeded, clear items from cart and consume vouchers
      if (resultCode === 0) {
        const orderItems = await this.orderItemRepository.find({ where: { orderId } });
        const productIds = orderItems.map(item => item.productId);
        await this.clearPurchasedItemsFromCart(order.userId, productIds);
        await this.consumeVouchersForOrder(orderId);
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
      await this.consumeVouchersForOrder(orderId);
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
      await this.consumeVouchersForOrder(orderId);
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
