import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { CustomException } from '../../core/exceptions/custom.exception';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async getCartCount(userId: string): Promise<number> {
    const items = await this.cartItemRepository.find({ where: { user: { id: userId } } });
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<number> {
    let item = await this.cartItemRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (item) {
      item.quantity += quantity;
    } else {
      item = this.cartItemRepository.create({
        user: { id: userId },
        product: { id: productId },
        quantity,
      });
    }
    await this.cartItemRepository.save(item);
    return this.getCartCount(userId);
  }
}