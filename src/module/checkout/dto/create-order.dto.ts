import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PrepareCheckoutItemDto } from "./prepare-checkout.dto";

export class CreateOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PrepareCheckoutItemDto)
    items: PrepareCheckoutItemDto[];

    @IsNumber()
    @IsNotEmpty()
    addressId: number;
}