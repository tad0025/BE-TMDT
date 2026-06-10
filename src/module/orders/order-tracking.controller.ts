import { Controller, Get, Param, Patch, Body, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { GetOrdersFilterDto, UserUpdateOrderStatusDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';

@Controller('orders/tracking')
@UseGuards(JwtAuthGuard)
export class OrderTrackingController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getTrackingOrders(@Query() filterDto: GetOrdersFilterDto, @Req() req: any) {
    const data = await this.ordersService.getTrackingOrders(req.user.id, filterDto.status);
    return new ApiResponse(true, 'Lấy danh sách đơn hàng thành công', data);
  }

  @Get('count')
  async getTrackingStatusCount(@Req() req: any) {
    const data = await this.ordersService.getTrackingStatusCount(req.user.id);
    return new ApiResponse(true, 'Lấy thống kê trạng thái đơn hàng thành công', data);
  }

  @Get(':id')
  async getTrackingOrderDetail(@Param('id') id: string, @Req() req: any) {
    const data = await this.ordersService.getTrackingOrderDetail(req.user.id, id);
    return new ApiResponse(true, 'Lấy chi tiết đơn hàng thành công', data);
  }

  @Patch(':id/status')
  async updateTrackingOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UserUpdateOrderStatusDto,
    @Req() req: any,
  ) {
    const data = await this.ordersService.updateTrackingOrderStatus(req.user.id, id, updateDto);
    return new ApiResponse(true, 'Cập nhật trạng thái đơn hàng thành công', data);
  }
}
