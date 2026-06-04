import { Controller, Get, Param, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { GetOrdersFilterDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles/roles.guard';
import { Roles } from '../../core/security/roles/roles.decorator';
import { EUserRole } from '../users/enums/user.enum';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';

@Controller('admin/order')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EUserRole.ADMIN)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrdersByStatus(@Query() filterDto: GetOrdersFilterDto) {
    const data = await this.ordersService.getOrdersByStatus(filterDto);
    return new ApiResponse(true, 'Lấy danh sách đơn hàng thành công', data);
  }

  @Get('status-count')
  async getOrderStatusCounts() {
    const data = await this.ordersService.getOrderStatusCounts();
    return new ApiResponse(true, 'Lấy thống kê trạng thái đơn hàng thành công', data);
  }

  @Get(':id')
  async getOrderDetailById(@Param('id') id: string) {
    const data = await this.ordersService.getOrderDetailById(id);
    return new ApiResponse(true, 'Lấy chi tiết đơn hàng thành công', data);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const data = await this.ordersService.updateOrderStatus(id, updateDto);
    return new ApiResponse(true, 'Cập nhật trạng thái đơn hàng thành công', data);
  }
}
