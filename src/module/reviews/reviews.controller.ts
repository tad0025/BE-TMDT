import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':productId')
  @HttpCode(HttpStatus.OK)
  async getReviewsByProductId(@Param('productId') productId: string) {
    const data = await this.reviewsService.getReviewsByProductId(productId);
    return { success: true, message: 'Lấy đánh giá thành công', data };
  }
}