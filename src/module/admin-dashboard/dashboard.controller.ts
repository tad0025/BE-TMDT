import { Controller, Get, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "src/core/security/jwt/jwt-auth.guard";
import { Roles } from "src/core/security/roles/roles.decorator";
import { EUserRole } from "../users/enums/user.enum";
import { ApiResponse } from "../../core/dto/ApiResponse.dto";
import { RolesGuard } from "src/core/security/roles/roles.guard";
import { DashboardPeriod } from "./dto/dashboard.dto";

@Controller('api/v1/admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EUserRole.ADMIN)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('kpi')
    async getKpiStats(@Query('period') period: DashboardPeriod) {
        const data = await this.dashboardService.getKpiStats(period);
        return new ApiResponse(true, 'Lấy KPI thành công', data);
    }

    @Get('revenue-chart')
    async getRevenueChart(@Query('period') period: DashboardPeriod) {
        const data = await this.dashboardService.getRevenueChart(period);
        return new ApiResponse(true, 'Lấy biểu đồ doanh thu thành công', data);
    }

    @Get('top-categories')
    async getTopCategories(@Query('period') period: DashboardPeriod, @Query('limit') limit: number) {
        const data = await this.dashboardService.getTopCategories(period, limit);
        return new ApiResponse(true, 'Lấy top danh mục thành công', data);
    }

    @Get('trending-products')
    async getTrendingProducts(@Query('limit') limit: number) {
        const data = await this.dashboardService.getTrendingProducts(limit);
        return new ApiResponse(true, 'Lấy sản phẩm trending thành công', data);
    }

    @Get('product-performance')
    async getProductPerformance(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
        @Query('period', new DefaultValuePipe('30d')) period: DashboardPeriod,
    ) {
        const result = await this.dashboardService.getProductPerformance(page, pageSize, period);
        const response = new ApiResponse(true, 'Lấy hiệu suất sản phẩm thành công', result.items);
        response.pagination = {
            page,
            pageSize,
            totalItems: result.totalItems,
            totalPages: result.totalPages,
        };
        return response;
    }
}