import { IsOptional, IsEnum, IsArray, IsString, ValidateNested, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EFilterState } from '../enums/EFilterState.enum';
import { PartialType } from '@nestjs/mapped-types';

export class ProductFiltersDto {
    @IsOptional()
    @IsEnum(EFilterState)
    sortBy?: EFilterState;

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return [value];
        }
        return value;
    })
    @IsArray()
    @IsString({ each: true })
    categories?: string[];

    @IsOptional()
    @IsString()
    minPrice?: string;

    @IsOptional()
    @IsString()
    maxPrice?: string;
}

export class GetAllProductDto {
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    pageSize?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => ProductFiltersDto)
    filters?: ProductFiltersDto;

    @IsOptional()
    @IsEnum(EFilterState)
    'filters[sortBy]'?: EFilterState;

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return [value];
        }
        return value;
    })
    'filters[categories]'?: string[];

    @IsOptional()
    @IsString()
    'filters[minPrice]'?: string;

    @IsOptional()
    @IsString()
    'filters[maxPrice]'?: string;
}

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    price: number;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    categoryId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    stock: number;

    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    images: string[];

    @IsOptional()
    @IsString()
    imageUrl?: string;

    /**
     * Danh sách public_id của các file đã upload lên Cloudinary (qua Signed Upload).
     * BE sẽ tự động xóa tag 'tmp' khỏi các file này sau khi tạo sản phẩm thành công.
     * FE không cần gọi PATCH /media/confirm nữa.
     */
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaPublicIds?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    originalPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountPercentage?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    materials?: string[];

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    dimensions?: number[];

    @IsOptional()
    @IsNumber()
    weight?: number;

    @IsOptional()
    @IsString()
    careInstructions?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
