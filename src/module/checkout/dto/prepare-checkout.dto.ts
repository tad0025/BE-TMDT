import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PrepareCheckoutItemDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class PrepareCheckoutDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PrepareCheckoutItemDto)
    items: PrepareCheckoutItemDto[];

    @IsNumber()
    @IsOptional()
    addressId?: number;
}