import { Injectable, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';
import { EFilterState } from './enums/EFilterState.enum';
import { FindOptionsWhere, FindOptionsOrder, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { CustomException } from '../../core/exceptions/custom.exception';
import { Favorite } from './entities/favorite.entity';
import { Category } from '../categories/entities/category.entity';
import { GetAllProductDto, CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { MediaService } from '../media/media.service';
import { OpensearchService } from '../opensearch/opensearch.service';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  async onModuleInit() {
    this.logger.log('Bắt đầu đồng bộ tự động danh sách sản phẩm lên OpenSearch...');
    this.syncProductsToOpensearch()
      .then((msg) => this.logger.log(msg))
      .catch((err) => this.logger.error('Lỗi khi đồng bộ sản phẩm lên OpenSearch:', err.message));
  }

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly mediaService: MediaService,
    private readonly opensearchService: OpensearchService,
  ) { }

  async getAllProducts(dto: GetAllProductDto, rawQuery: Record<string, any>): Promise<ApiResponse<any>> {
    const page = dto?.page ? parseInt(dto.page.toString(), 10) : 1;
    const pageSize = dto?.pageSize ? parseInt(dto.pageSize.toString(), 10) : 50;

    const sortBy = dto?.['filters[sortBy]'];
    const minPrice = dto?.['filters[minPrice]'] || undefined;
    const maxPrice = dto?.['filters[maxPrice]'] || undefined;

    let categories: string[] | undefined;

    const rawFiltersObj = rawQuery?.filters as Record<string, any>;
    if (rawFiltersObj?.categories) {
      const rawCats = rawFiltersObj.categories;
      categories = Array.isArray(rawCats) ? rawCats : [rawCats];
    } else {
      const catMap: Record<number, string> = {};
      for (const key of Object.keys(rawQuery || {})) {
        const match = key.match(/^filters\[categories\]\[(\d+)\]$/);
        if (match) catMap[Number(match[1])] = rawQuery[key] as string;
      }
      const catValues = Object.keys(catMap)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => catMap[Number(k)]);
      if (catValues.length > 0) categories = catValues;
    }

    const skip = (page - 1) * pageSize;

    // Debug log để kiểm tra giá trị nhận vào
    console.log('[getAllProducts] categories =', categories, '| type =', typeof categories, '| isArray =', Array.isArray(categories));
    console.log('[getAllProducts] sortBy =', sortBy, '| minPrice =', minPrice, '| maxPrice =', maxPrice);

    const qb = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (dto.search) {
      const matchedIds = await this.opensearchService.searchProductIds(dto.search);
      if (matchedIds.length === 0) {
        // Trả về mảng rỗng nếu không có sản phẩm nào khớp với từ khóa trong OpenSearch
        const response = new ApiResponse(true, 'Lấy danh sách sản phẩm thành công', []);
        response.pagination = { page, pageSize, totalItems: 0, totalPages: 0 };
        return response;
      }
      qb.andWhere('product.id IN (:...matchedIds)', { matchedIds });
    }

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
      stock: Number(product.stock),
      soldCount: Number(product.soldCount),
      images: safeParseArray(product.images),
      materials: safeParseArray(product.materials),
      dimensions: safeParseArray(product.dimensions),
      weight: product.weight ? Number(product.weight) : undefined,
      careInstructions: product.careInstructions,
      categoryName: product.category?.name || 'Chưa phân loại',
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
      relations: ['category', 'seller', 'seller.user'],
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

    return {
      ...product,
      stock: Number(product.stock),
      soldCount: Number(product.soldCount),
      weight: product.weight ? Number(product.weight) : undefined,
      images: safeParseArray(product.images),
      materials: safeParseArray(product.materials),
      dimensions: safeParseArray(product.dimensions),
      categoryName: product.category?.name || 'Chưa phân loại',
      categoryId: product.category?.id,
      isFavorite,
      sellerInfo: {
        id: product.seller?.id,
        name: product.seller?.user?.fullName,
        avatarUrl: product.seller?.user?.avatarUrl,
        totalProducts: product.seller?.totalProducts || 0,
        averageRating: product.seller?.averageRating || 0,
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

  async createProduct(dto: CreateProductDto) {
    const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new CustomException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Danh mục không tồn tại');
    }

    const { mediaPublicIds, ...productData } = dto;

    const product = this.productsRepository.create({
      ...productData,
      category,
    });

    const saved = await this.productsRepository.save(product);

    // Tự động xóa tag 'tmp' sau khi tạo sản phẩm thành công
    // FE không cần gọi PATCH /media/confirm riêng
    if (mediaPublicIds && mediaPublicIds.length > 0) {
      try {
        await this.mediaService.confirmUpload(mediaPublicIds);
      } catch (err) {
        // Không throw — lỗi confirm không được phép huỷ việc lưu sản phẩm
        this.logger.warn(`[createProduct] Could not confirm media for product ${saved.id}: ${err?.message}`);
      }
    }

    // Index vao OpenSearch
    await this.opensearchService.indexProduct(saved);

    return saved;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new CustomException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Sản phẩm không tồn tại');
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new CustomException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Danh mục không tồn tại');
      }
      product.category = category;
    }

    const { mediaPublicIds, ...updateData } = dto;
    Object.assign(product, updateData);
    delete (product as any).categoryId;

    const saved = await this.productsRepository.save(product);

    // Tự động xóa tag 'tmp' sau khi cập nhật sản phẩm thành công
    if (mediaPublicIds && mediaPublicIds.length > 0) {
      try {
        await this.mediaService.confirmUpload(mediaPublicIds);
      } catch (err) {
        this.logger.warn(`[updateProduct] Could not confirm media for product ${id}: ${err?.message}`);
      }
    }

    // Cap nhat vao OpenSearch
    await this.opensearchService.updateProduct(id, saved);

    return saved;
  }

  async syncProductsToOpensearch() {
    const products = await this.productsRepository.find({ relations: ['category'] });
    let count = 0;
    for (const p of products) {
      await this.opensearchService.indexProduct(p);
      count++;
    }
    return `Đã đồng bộ ${count} sản phẩm lên OpenSearch thành công.`;
  }

  async deleteProduct(id: string) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new CustomException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Sản phẩm không tồn tại');
    }

    await this.productsRepository.remove(product);
    await this.opensearchService.removeProduct(id);
  }
}
