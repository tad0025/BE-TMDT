import { Controller, Get, Param, HttpCode, HttpStatus, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { CreateReviewRequestDto } from './dto/reviews.dto';
import { OptionalJwtAuthGuard } from '../../core/security/jwt/optional-jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReviews(@Body() request: CreateReviewRequestDto, @Req() req: any) {
    const data = await this.reviewsService.createReviews(req.user.id, request);
    return { success: true, message: 'Đánh giá thành công', data };
  }
}

@Controller('products')
export class ProductReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':productId/reviews')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getReviewsByProductId(@Param('productId') productId: string) {
    const data = await this.reviewsService.getReviewsByProductId(productId);
    return { success: true, message: 'Lấy đánh giá thành công', data };
  }
}

@Controller('orders')
export class OrderReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':orderId/reviews')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getOrderReviews(@Param('orderId') orderId: string, @Req() req: any) {
    const data = await this.reviewsService.getOrderReviews(orderId);
    return { success: true, message: 'Lấy đánh giá đơn hàng thành công', data };
  }
}