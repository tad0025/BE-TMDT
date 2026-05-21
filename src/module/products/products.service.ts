import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';
import { EFilterState } from './enums/EFilterState.enum';
import { FindOptionsWhere, FindOptionsOrder, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { CustomException } from '../../core/exceptions/custom.exception';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
  ) { }

  async getAllProducts(page: number, pageSize: number, sortBy?: EFilterState, categories?: string[], minPrice?: string, maxPrice?: string): Promise<ApiResponse<any>> {
    const skip = (page - 1) * pageSize;

    // Debug log để kiểm tra giá trị nhận vào
    console.log('[getAllProducts] categories =', categories, '| type =', typeof categories, '| isArray =', Array.isArray(categories));
    console.log('[getAllProducts] sortBy =', sortBy, '| minPrice =', minPrice, '| maxPrice =', maxPrice);

    const qb = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    // Lọc theo danh mục
    if (categories && Array.isArray(categories) && categories.length > 0) {
      qb.andWhere('category.id IN (:...categories)', { categories });
      console.log('[getAllProducts] Applying category filter with:', categories);
    }

    // Lọc theo giá
    const parsedMin = minPrice ? Number(minPrice) : NaN;
    const parsedMax = maxPrice ? Number(maxPrice) : NaN;
    if (!isNaN(parsedMin) && !isNaN(parsedMax)) {
      qb.andWhere('product.price BETWEEN :minPrice AND :maxPrice', { minPrice: parsedMin, maxPrice: parsedMax });
    } else if (!isNaN(parsedMin)) {
      qb.andWhere('product.price >= :minPrice', { minPrice: parsedMin });
    } else if (!isNaN(parsedMax)) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: parsedMax });
    }

    // Sắp xếp
    switch (sortBy) {
      case EFilterState.PRICE_LOW_TO_HIGH:
        qb.orderBy('product.price', 'ASC');
        break;
      case EFilterState.PRICE_HIGH_TO_LOW:
        qb.orderBy('product.price', 'DESC');
        break;
      case EFilterState.POPULARITY:
        qb.orderBy('product.rating', 'DESC');
        break;
      case EFilterState.NEWEST:
      default:
        qb.orderBy('product.createdAt', 'DESC');
        break;
    }

    qb.skip(skip).take(pageSize);

    const [products, totalItems] = await qb.getManyAndCount();
    console.log('[getAllProducts] totalItems after filter =', totalItems);

    const totalPages = Math.ceil(totalItems / pageSize);

    const safeParseArray = (value: any): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) {
        if (value.length === 1 && typeof value[0] === 'string' && value[0].startsWith('[')) {
          try { return JSON.parse(value[0]); } catch { return value; }
        }
        return value;
      }
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return [value]; }
      }
      return [];
    };

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      discountPercentage: product.discountPercentage,
      rating: product.rating,
      images: safeParseArray(product.images),
      materials: safeParseArray(product.materials),
    }));

    const response = new ApiResponse(true, 'Lấy danh sách sản phẩm thành công', formattedProducts);
    response.pagination = {
      page: Number(page),
      pageSize: Number(pageSize),
      totalItems,
      totalPages,
    };

    return response;
  }

  // Cần inject thêm Favorite Repository vào constructor nếu chưa có
  async getProductById(id: string, userId?: string) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'seller'],
    });

    if (!product) {
      throw new CustomException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Sản phẩm không tồn tại');
    }

    let isFavorite = false;
    if (userId) {
      const favorite = await this.favoriteRepository.findOne({
        where: { user: { id: userId }, product: { id } },
      });
      isFavorite = !!favorite;
    }

    const safeParseArray = (value: any): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) {
        if (value.length === 1 && typeof value[0] === 'string' && value[0].startsWith('[')) {
          try { return JSON.parse(value[0]); } catch { return value; }
        }
        return value;
      }
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return [value]; }
      }
      return [];
    };

    let totalProducts = 0;
    let averageRating = 0;
    
    if (product.seller?.id) {
      const sellerProducts = await this.productsRepository.find({
        where: { seller: { id: product.seller.id } },
        select: ['id', 'rating']
      });
      
      totalProducts = sellerProducts.length;
      if (totalProducts > 0) {
        const sumRating = sellerProducts.reduce((sum, p) => sum + (p.rating || 0), 0);
        averageRating = Number((sumRating / totalProducts).toFixed(1));
      }
    }

    return {
      ...product,
      images: safeParseArray(product.images),
      materials: safeParseArray(product.materials),
      categoryName: product.category?.name || 'Chưa phân loại',
      categoryId: product.category?.id,
      isFavorite,
      sellerInfo: {
        id: product.seller?.id,
        name: product.seller?.fullName,
        avatarUrl: product.seller?.avatarUrl,
        totalProducts,
        averageRating,
      },
    };
  }

  async toggleFavorite(productId: string, userId: string): Promise<string> {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new CustomException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Sản phẩm không tồn tại');
    }

    const favorite = await this.favoriteRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (favorite) {
      await this.favoriteRepository.remove(favorite);
      return 'Đã xóa khỏi bộ sưu tập yêu thích';
    } else {
      const newFav = this.favoriteRepository.create({
        user: { id: userId },
        product: { id: productId },
      });
      await this.favoriteRepository.save(newFav);
      return 'Đã thêm vào bộ sưu tập yêu thích';
    }
  }
}
