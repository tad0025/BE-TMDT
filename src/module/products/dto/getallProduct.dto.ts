import { IsOptional, IsEnum, IsArray, IsString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EFilterState } from "../enums/EFilterState.enum";

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

export class getallProductDto {
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