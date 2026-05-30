import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { ShippingService } from './services/shipping.service';
import { MomoService } from './services/momo.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Address } from '../users/entities/address-users.entity';
import { CartItem } from '../cart/entities/cart-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, Address, CartItem])],
  controllers: [CheckoutController],
  providers: [CheckoutService, ShippingService, MomoService],
  exports: [CheckoutService, ShippingService, MomoService]
})
export class CheckoutModule {}
