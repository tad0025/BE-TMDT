import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @UseGuards(JwtAuthGuard)
  @Post('momo/create')
  async createMoMoPayment(
    @Body() body: { amount: number; items: { productId: string; quantity: number; price: number }[] },
    @Req() req: any
  ) {
    const payUrl = await this.checkoutService.createMoMoPayment(body, req.user.id);
    return { success: true, message: 'Tạo link thanh toán thành công', data: { payUrl } };
  }

  @Post('momo/ipn')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleMoMoIPN(@Body() ipnData: any) {
    await this.checkoutService.processMoMoIPN(ipnData);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id/payment-status')
  async getPaymentStatus(@Param('id') orderId: string, @Req() req: any) {
    const status = await this.checkoutService.getPaymentStatus(orderId, req.user.id);
    if (!status) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }
    return { success: true, message: 'Kiểm tra trạng thái', data: { status } };
  }
}
