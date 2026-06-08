import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { ShippingService } from './services/shipping.service';
import { MomoService } from './services/momo.service';
import { VnpayService } from './services/vnpay.service';
import { PaypalService } from './services/paypal.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Address } from '../users/entities/address-users.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { MailModule } from '../mails/mail.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, Address, CartItem, User]), MailModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, ShippingService, MomoService, VnpayService, PaypalService],
  exports: [CheckoutService, ShippingService, MomoService, VnpayService, PaypalService]
})
export class CheckoutModule {}
