import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrderTrackingController } from './order-tracking.controller';
import { OrdersService } from './orders.service';
import { Order } from '../checkout/entities/order.entity';
import { OrderItem } from '../checkout/entities/order-item.entity';
import { MailModule } from '../mails/mail.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, User]), MailModule],
  controllers: [OrdersController, OrderTrackingController],
  providers: [OrdersService],
})
export class OrdersModule {}
