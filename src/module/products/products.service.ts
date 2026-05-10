import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';
import { EFilterState } from './enums/EFilterState.enum';
import { FindOptionsWhere, FindOptionsOrder, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) { }

  async getAllProducts(page: number, pageSize: number, sortBy: EFilterState, categories: string[], minPrice: string, maxPrice: string): Promise<ApiResponse<any>> {
    const skip = (page - 1) * pageSize;
    
    let where: FindOptionsWhere<Product> = {};
    
    if (minPrice && maxPrice) {
      where.price = Between(Number(minPrice), Number(maxPrice)) as any;
    } else if (minPrice) {
      where.price = MoreThanOrEqual(Number(minPrice)) as any;
    } else if (maxPrice) {
      where.price = LessThanOrEqual(Number(maxPrice)) as any;
    }

    if (categories && categories.length > 0) {
      where.category = { id: In(categories) };
    }

    let order: FindOptionsOrder<Product> = {};
    switch (sortBy) {
      case EFilterState.PRICE_LOW_TO_HIGH:
        order.price = 'ASC';
        break;
      case EFilterState.PRICE_HIGH_TO_LOW:
        order.price = 'DESC';
        break;
      case EFilterState.POPULARITY:
        order.rating = 'DESC'; // Dùng tạm rating cho POPULARITY
        break;
      case EFilterState.NEWEST:
      default:
        order.createdAt = 'DESC';
        break;
    }

    const [products, totalItems] = await this.productsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

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
