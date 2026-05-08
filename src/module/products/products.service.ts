import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async findAll(page: number, pageSize: number): Promise<ApiResponse<any>> {
    const skip = (page - 1) * pageSize;
    const [products, totalItems] = await this.productsRepository.findAndCount({
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    // Xử lý convert type số từ DB trả ra (decimal in typeorm returns string usually)
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      discountPercentage: product.discountPercentage,
      rating: product.rating,
    }));

    return {
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: formattedProducts,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        totalItems,
        totalPages,
      },
    };
  }
}
