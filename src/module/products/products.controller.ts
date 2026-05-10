import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { getallProductDto } from './dto/getallProduct.dto';

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
}
