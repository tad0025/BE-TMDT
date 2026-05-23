import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { CustomException } from '../../core/exceptions/custom.exception';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

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

  async getCartItems(userId: string) {
    const items = await this.cartItemRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.seller'],
    });

    const sellerIds = [...new Set(
      items.map(item => item.product.seller?.id).filter(Boolean),
    )];

    const sellerRatingsMap = new Map<string, number>();
    for (const sellerId of sellerIds) {
      const sellerProducts = await this.productRepository.find({
        where: { seller: { id: sellerId } },
        select: ['id', 'rating'],
      });
      const total = sellerProducts.length;
      const avgRating = total > 0
        ? Number((sellerProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / total).toFixed(1))
        : 0;
      sellerRatingsMap.set(sellerId, avgRating);
    }

    return items.map(item => ({
      product: {
        id: item.product.id,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        price: Number(item.product.price),
        description: item.product.description,
        seller: item.product.seller ? {
          id: item.product.seller.id,
          name: item.product.seller.fullName,
          avatarUrl: item.product.seller.avatarUrl,
          averageRating: sellerRatingsMap.get(item.product.seller.id) || 0,
        } : null,
      },
      quantity: item.quantity,
    }));
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<number> {
    const item = await this.cartItemRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (!item) {
      throw new CustomException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Sản phẩm không có trong giỏ hàng');
    }

    if (quantity <= 0) {
      await this.cartItemRepository.remove(item);
    } else {
      item.quantity = quantity;
      await this.cartItemRepository.save(item);
    }

    return this.getCartCount(userId);
  }

  async removeFromCart(userId: string, productId: string): Promise<number> {
    const item = await this.cartItemRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (item) {
      await this.cartItemRepository.remove(item);
    }

    return this.getCartCount(userId);
  }
}