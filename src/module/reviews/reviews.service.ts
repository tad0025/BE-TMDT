import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Review } from './entities/review.entity';
import { OrderItem } from '../checkout/entities/order-item.entity';
import { CreateReviewRequestDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async getReviewsByProductId(productId: string) {
    const reviews = await this.reviewRepository.find({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    const totalReview = reviews.length;
    const averageRating = totalReview > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReview 
      : 0;

    return {
      totalReview,
      averageRating: Number(averageRating.toFixed(1)),
      reviews: reviews.map(r => ({
        reviewId: r.id,
        userId: r.user?.id || '',
        userName: r.user?.fullName || r.user?.email || 'Người dùng',
        userAvatar: r.user?.avatarUrl || '',
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt,
      }))
    };
  }

  async getOrderReviews(orderId: string) {
    const items = await this.orderItemRepository.find({
      where: { orderId },
    });
    const orderItemIds = items.map(i => i.id);
    
    let reviews: Review[] = [];
    if (orderItemIds.length > 0) {
      reviews = await this.reviewRepository.find({
        where: { orderItemId: In(orderItemIds) }
      });
    }

    return {
      orderId,
      reviews: reviews.map(r => ({
        orderItemId: r.orderItemId,
        productId: items.find(i => i.id === r.orderItemId)?.productId || '',
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt
      }))
    };
  }

  async createReviews(userId: string, request: CreateReviewRequestDto) {
    let submittedCount = 0;
    
    for (const item of request.reviews) {
      const orderItem = await this.orderItemRepository.findOne({ where: { id: item.orderItemId } });
      if (!orderItem || orderItem.isReviewed) continue;
      
      const review = this.reviewRepository.create({
        content: item.comment,
        rating: item.rating,
        user: { id: userId },
        product: { id: orderItem.productId },
        orderItemId: item.orderItemId
      });
      await this.reviewRepository.save(review);
      
      orderItem.isReviewed = true;
      await this.orderItemRepository.save(orderItem);
      submittedCount++;
    }

    return { submittedCount };
  }
}