import { Controller, Get, Param, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Put, Delete } from '@nestjs/common';
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

  @Get('items')
  @HttpCode(HttpStatus.OK)
  async getCartItems(@Req() req: any) {
    const items = await this.cartService.getCartItems(req.user.id);
    return { success: true, message: 'Lấy danh sách giỏ hàng thành công', data: items };
  }
  
  @Put('items/:productId')
  @HttpCode(HttpStatus.OK)
  async updateQuantity(
    @Param('productId') productId: string, 
    @Body() body: { quantity: number }, 
    @Req() req: any
  ) {
    const totalCartItems = await this.cartService.updateQuantity(req.user.id, productId, body.quantity);
    return { success: true, message: 'Cập nhật số lượng thành công', data: { totalCartItems } };
  }

  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  async removeFromCart(
    @Param('productId') productId: string, 
    @Req() req: any
  ) {
    const totalCartItems = await this.cartService.removeFromCart(req.user.id, productId);
    return { success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng', data: { totalCartItems } };
  }
}