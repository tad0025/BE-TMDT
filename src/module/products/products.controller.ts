import { Controller, Get, Param, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { getallProductDto } from './dto/getallProduct.dto';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { UseGuards, Post } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllProducts(@Query() dto: getallProductDto) {
    const pageNumber = dto?.page ? parseInt(dto.page.toString(), 10) : 1;
    const sizeNumber = dto?.pageSize ? parseInt(dto.pageSize.toString(), 10) : 50;

    return this.productsService.getAllProducts(
      pageNumber,
      sizeNumber,
      dto?.filters?.sortBy,
      dto?.filters?.categories,
      dto?.filters?.minPrice,
      dto?.filters?.maxPrice,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProductById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    const data = await this.productsService.getProductById(id, userId);
    return { success: true, message: 'Lấy chi tiết sản phẩm thành công', data };
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard) // Bắt buộc đăng nhập để tương tác wishlist
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(@Param('id') id: string, @Req() req: any) {
    const message = await this.productsService.toggleFavorite(id, req.user.id);
    return { success: true, message, data: null };
  }
}
