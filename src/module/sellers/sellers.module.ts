import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller } from './entities/seller.entity';
import { Product } from '../products/entities/product.entity';
import { SellersService } from './sellers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Seller, Product])],
  providers: [SellersService],
  exports: [SellersService, TypeOrmModule],
})
export class SellersModule {}
