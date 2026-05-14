import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('count')
  @HttpCode(HttpStatus.OK)
  async getCartCount(@Req() req: any) {
    const totalCartItems = await this.cartService.getCartCount(req.user.id);
    return { success: true, message: 'Lấy số lượng giỏ hàng thành công', data: { totalCartItems } };
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addToCart(@Body() body: { productId: string; quantity: number }, @Req() req: any) {
    const totalCartItems = await this.cartService.addToCart(req.user.id, body.productId, body.quantity);
    return { success: true, message: 'Thêm vào giỏ hàng thành công', data: { totalCartItems } };
  }
}