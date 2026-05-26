import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { PrepareCheckoutDto } from './dto/prepare-checkout.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) { }

  /**
   * POST /orders/prepare
   * Tính toán trước thông tin đơn hàng (không tạo đơn hàng thực sự).
   * FE gửi body dạng mảng: [{productId, quantity}, ...]
   */
  @UseGuards(JwtAuthGuard)
  @Post('orders/prepare')
  async prepareCheckout(
    @Body() items: { productId: string; quantity: number }[],
    @Req() req: any,
  ) {
    const dto: PrepareCheckoutDto = { items };
    const data = await this.checkoutService.prepareCheckout(dto, req.user.id);
    return { success: true, message: 'Tính toán đơn hàng thành công', data };
  }

  /**
   * POST /orders/checkout
   * Tạo đơn hàng trong DB và xử lý thanh toán (COD hoặc MoMo).
   */
  @UseGuards(JwtAuthGuard)
  @Post('orders/checkout')
  async checkoutOrder(
    @Body() dto: CreateOrderDto,
    @Req() req: any,
  ) {
    const result = await this.checkoutService.checkoutOrder(dto, req.user.id);
    return { 
      success: true, 
      message: dto.paymentMethod === 'MOMO' ? 'Tạo link thanh toán thành công' : 'Đặt hàng thành công', 
      data: result 
    };
  }

  /**
   * POST /checkout/momo/ipn
   * Nhận callback từ MoMo sau khi thanh toán.
   */
  @Post('checkout/momo/ipn')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleMoMoIPN(@Body() ipnData: any) {
    await this.checkoutService.processMoMoIPN(ipnData);
    return;
  }

  /**
   * GET /checkout/orders/:id/payment-status
   * Kiểm tra trạng thái thanh toán của một đơn hàng.
   */
  @UseGuards(JwtAuthGuard)
  @Get('checkout/orders/:id/payment-status')
  async getPaymentStatus(@Param('id') orderId: string, @Req() req: any) {
    const status = await this.checkoutService.getPaymentStatus(orderId, req.user.id);
    if (!status) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }
    return { success: true, message: 'Kiểm tra trạng thái', data: { status } };
  }
}
