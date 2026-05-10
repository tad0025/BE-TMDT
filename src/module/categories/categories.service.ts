import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<ApiResponse<any>> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.count', 'category.products')
      .getMany();

    const formattedData = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      count: cat.count || 0,
    }));

    return {
      success: true,
      message: 'Lấy danh sách danh mục thành công',
      data: formattedData,
    };
  }
}
