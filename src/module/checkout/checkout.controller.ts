import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Get, Param, Query } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { PrepareCheckoutDto } from './dto/prepare-checkout.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) { }

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

  @UseGuards(JwtAuthGuard)
  @Post('orders/checkout')
  async checkoutOrder(
    @Body() dto: CreateOrderDto,
    @Req() req: any,
  ) {
    const ipAddr = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const result = await this.checkoutService.checkoutOrder(dto, req.user.id, ipAddr);
    
    let message = 'Đặt hàng thành công';
    if (dto.paymentMethod === 'MOMO') message = 'Tạo link thanh toán MoMo thành công';
    else if (dto.paymentMethod === 'VNPAY') message = 'Tạo link thanh toán VNPay thành công';

    return { 
      success: true, 
      message, 
      data: result 
    };
  }

  @Post('checkout/momo/ipn')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleMoMoIPN(@Body() ipnData: any) {
    await this.checkoutService.processMoMoIPN(ipnData);
    return;
  }

  @Get('checkout/vnpay/ipn')
  async handleVnpayIPN(@Query() query: any) {
    return await this.checkoutService.processVnpayIPN(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('checkout/orders/:id/payment-status')
  async getPaymentStatus(@Param('id') orderId: string, @Req() req: any) {
    const status = await this.checkoutService.getPaymentStatus(orderId, req.user.id);
    if (!status) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }
    return { success: true, message: 'Kiểm tra trạng thái', data: { status } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/checkout/result')
  async getOrderResult(@Query('orderId') orderId: string, @Req() req: any) {
    const data = await this.checkoutService.getPaymentStatus(orderId, req.user.id);
    if (!data) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }
    return { success: true, message: 'Lấy kết quả thanh toán thành công', data };
  }
}
