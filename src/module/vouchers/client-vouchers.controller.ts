import { Controller, Get, Param, Query, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { OptionalJwtAuthGuard } from '../../core/security/jwt/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';

@Controller('api/v1/vouchers')
export class ClientVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('valid')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getValidVouchers(@Req() req: any) {
    const userId = req.user?.id;
    const data = await this.vouchersService.getValidVouchersForClient(userId);
    return new ApiResponse(true, 'Lấy danh sách voucher thành công', data);
  }

  @Get('lookup')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async lookupVoucherByCode(@Query('code') code: string, @Req() req: any, @Query('subTotal') subTotal?: number) {
    if (!code) {
        return new ApiResponse(false, 'Vui lòng cung cấp mã code', null);
    }
    const userId = req.user?.id;
    const data = await this.vouchersService.lookupVoucherForClient(code.toUpperCase(), userId, subTotal);
    return new ApiResponse(true, 'Chi tiết voucher', data);
  }
}
