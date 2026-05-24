import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { PrepareCheckoutDto } from './dto/prepare-checkout.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) { }

  /**
   * POST /checkout/prepare
   * Tính toán trước thông tin đơn hàng (không tạo đơn hàng thực sự).
   * FE dùng để hiển thị trang xác nhận: địa chỉ, danh sách sản phẩm, phí ship, tổng tiền.
   */
  @UseGuards(JwtAuthGuard)
  @Post('prepare')
  async prepareCheckout(
    @Body() dto: PrepareCheckoutDto,
    @Req() req: any,
  ) {
    const data = await this.checkoutService.prepareCheckout(dto, req.user.id);
    return { success: true, message: 'Tính toán đơn hàng thành công', data };
  }

  /**
   * POST /checkout/momo/create
   * Tạo đơn hàng trong DB và trả về link thanh toán MoMo.
   */
  @UseGuards(JwtAuthGuard)
  @Post('momo/create')
  async createMoMoPayment(
    @Body() dto: CreateOrderDto,
    @Req() req: any,
  ) {
    const result = await this.checkoutService.createMoMoPayment(dto, req.user.id);
    return { success: true, message: 'Tạo link thanh toán thành công', data: result };
  }

  /**
   * POST /checkout/momo/ipn
   * Nhận callback từ MoMo sau khi thanh toán.
   */
  @Post('momo/ipn')
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
  @Get('orders/:id/payment-status')
  async getPaymentStatus(@Param('id') orderId: string, @Req() req: any) {
    const status = await this.checkoutService.getPaymentStatus(orderId, req.user.id);
    if (!status) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }
    return { success: true, message: 'Kiểm tra trạng thái', data: { status } };
  }
}
