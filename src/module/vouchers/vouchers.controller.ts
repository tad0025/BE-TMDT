import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles/roles.guard';
import { Roles } from '../../core/security/roles/roles.decorator';
import { EUserRole } from '../users/enums/user.enum';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';
import { CreateVoucherRequestDto, GetVouchersQueryDto, UpdateVoucherRequestDto, UpdateVoucherStatusRequestDto } from './dto/vouchers.dto';

@Controller('api/v1/admin/vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EUserRole.ADMIN)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getVouchers(@Query() query: GetVouchersQueryDto) {
    const data = await this.vouchersService.getVouchers(query);
    return new ApiResponse(true, 'Lấy danh sách voucher thành công', data);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getVoucherStats() {
    const data = await this.vouchersService.getVoucherStats();
    return new ApiResponse(true, 'Lấy thống kê voucher thành công', data);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getVoucherById(@Param('id') id: number) {
    const data = await this.vouchersService.getVoucherById(id);
    return new ApiResponse(true, 'Lấy chi tiết voucher thành công', data);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createVoucher(@Body() dto: CreateVoucherRequestDto) {
    const data = await this.vouchersService.createVoucher(dto);
    return new ApiResponse(true, 'Tạo voucher thành công', data);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateVoucherStatus(
    @Param('id') id: number,
    @Body() dto: UpdateVoucherStatusRequestDto,
  ) {
    const data = await this.vouchersService.updateVoucherStatus(id, dto);
    return new ApiResponse(true, 'Cập nhật trạng thái voucher thành công', data);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateVoucher(
    @Param('id') id: number,
    @Body() dto: UpdateVoucherRequestDto,
  ) {
    const data = await this.vouchersService.updateVoucher(id, dto);
    return new ApiResponse(true, 'Cập nhật voucher thành công', data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteVoucher(@Param('id') id: number) {
    const data = await this.vouchersService.deleteVoucher(id);
    return new ApiResponse(true, 'Xóa voucher thành công', data);
  }
}
