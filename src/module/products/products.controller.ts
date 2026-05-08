import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get() // GET /products
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const sizeNumber = parseInt(pageSize, 10) || 50;
    
    return this.productsService.findAll(pageNumber, sizeNumber);
  }
}
