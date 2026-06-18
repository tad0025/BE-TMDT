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
    @IsString()
    @IsOptional()
    prepareTempId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PrepareCheckoutItemDto)
    @IsOptional()
    items?: PrepareCheckoutItemDto[];

    @IsNumber()
    @IsOptional()
    addressId?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    voucherCodes?: string[];
}