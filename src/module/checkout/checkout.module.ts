import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Address } from '../users/entities/address-users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, Address])],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService]
})
export class CheckoutModule {}
