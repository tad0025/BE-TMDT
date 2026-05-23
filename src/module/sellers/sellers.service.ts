import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './entities/seller.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async updateSellerStats(sellerId: string): Promise<void> {
    const products = await this.productRepository.find({
      where: { seller: { id: sellerId } },
      select: ['id', 'rating'],
    });

    const totalProducts = products.length;
    const averageRating = totalProducts > 0
      ? Number((products.reduce((sum, p) => sum + (p.rating || 0), 0) / totalProducts).toFixed(1))
      : 0;

    await this.sellerRepository.update(sellerId, { totalProducts, averageRating });
  }

  async updateAllSellerStats(): Promise<void> {
    const sellers = await this.sellerRepository.find({ select: ['id'] });
    for (const seller of sellers) {
      await this.updateSellerStats(seller.id);
    }
  }
}
