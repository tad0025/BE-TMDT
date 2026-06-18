import { Type } from 'class-transformer';
import { IsOptional, IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { PrepareCheckoutItemDto } from './prepare-checkout.dto';

export class PrepareCartCheckoutDto {
  @IsString()
  @IsOptional()
  prepareTempId?: string;

  @ValidateNested({ each: true })
  @Type(() => PrepareCheckoutItemDto)
  @IsOptional()
  items?: PrepareCheckoutItemDto[];

  @IsOptional()
  @IsNumber()
  addressId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  voucherCodes?: string[];
}
