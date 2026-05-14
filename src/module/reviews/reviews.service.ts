import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async getReviewsByProductId(productId: string) {
    const reviews = await this.reviewRepository.find({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const totalReview = reviews.length;
    const averageRating = totalReview > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReview 
      : 0;

    return {
      totalReview,
      averageRating,
      reviews: reviews.map((r) => ({
        reviewId: r.id,
        userId: r.user?.id,
        userName: r.user?.fullName,
        userAvatar: r.user?.avatarUrl,
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt,
      })),
    };
  }
}