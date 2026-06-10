import { Controller, Get, Param, Req, Query, HttpCode, HttpStatus, Body, Delete, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetAllProductDto, CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { UseGuards, Post } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../core/security/jwt/optional-jwt-auth.guard';
import { RolesGuard } from '../../core/security/roles/roles.guard';
import { Roles } from '../../core/security/roles/roles.decorator';
import { EUserRole } from '../users/enums/user.enum';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAllProducts(@Query() dto: GetAllProductDto, @Req() req: any) {
    return this.productsService.getAllProducts(dto, req.query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProductById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    const data = await this.productsService.getProductById(id, userId);
    return { success: true, message: 'Lấy chi tiết sản phẩm thành công', data };
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(@Param('id') id: string, @Req() req: any) {
    const message = await this.productsService.toggleFavorite(id, req.user.id);
    return { success: true, message, data: null };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EUserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() dto: CreateProductDto, @Req() req: any) {
    const data = await this.productsService.createProduct(dto);
    return { success: true, message: 'Tạo sản phẩm thành công', data };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EUserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: any) {
    const data = await this.productsService.updateProduct(id, dto);
    return { success: true, message: 'Cập nhật sản phẩm thành công', data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EUserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteProduct(@Param('id') id: string, @Req() req: any) {
    await this.productsService.deleteProduct(id);
    return { success: true, message: 'Xóa sản phẩm thành công', data: null };
  }
}
