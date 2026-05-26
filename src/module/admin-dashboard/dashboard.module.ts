import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../checkout/entities/order.entity';
import { OrderItem } from '../checkout/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, Product, Category]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}