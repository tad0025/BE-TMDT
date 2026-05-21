import { Controller, Get, Param, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { getallProductDto } from './dto/getallProduct.dto';
import { JwtAuthGuard } from '../../core/security/jwt/jwt-auth.guard';
import { UseGuards, Post } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../core/security/jwt/optional-jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAllProducts(@Query() dto: getallProductDto, @Req() req: any) {
    const pageNumber = dto?.page ? parseInt(dto.page.toString(), 10) : 1;
    const sizeNumber = dto?.pageSize ? parseInt(dto.pageSize.toString(), 10) : 50;

    const sortBy = dto?.['filters[sortBy]'];
    const minPrice = dto?.['filters[minPrice]'] || undefined;
    const maxPrice = dto?.['filters[maxPrice]'] || undefined;

    let categories: string[] | undefined;
    const rawQuery = req.query as Record<string, any>;

    const rawFiltersObj = rawQuery?.filters as Record<string, any>;
    if (rawFiltersObj?.categories) {
      const rawCats = rawFiltersObj.categories;
      categories = Array.isArray(rawCats) ? rawCats : [rawCats];
    } else {
      const catMap: Record<number, string> = {};
      for (const key of Object.keys(rawQuery)) {
        const match = key.match(/^filters\[categories\]\[(\d+)\]$/);
        if (match) catMap[Number(match[1])] = rawQuery[key] as string;
      }
      const catValues = Object.keys(catMap)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => catMap[Number(k)]);
      if (catValues.length > 0) categories = catValues;
    }

    return this.productsService.getAllProducts(
      pageNumber,
      sizeNumber,
      sortBy,
      categories,
      minPrice,
      maxPrice,
    );
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
}
