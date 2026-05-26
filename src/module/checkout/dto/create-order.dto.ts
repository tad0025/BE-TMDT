import { IsArray, IsEnum, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PrepareCheckoutItemDto } from "./prepare-checkout.dto";
import { EPaymentMethod } from '../enums/EPaymentMethod.enum';

export class CreateOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PrepareCheckoutItemDto)
    items: PrepareCheckoutItemDto[];

    @IsNumber()
    @IsNotEmpty()
    addressId: number;

    @IsEnum(EPaymentMethod)
    @IsNotEmpty()
    paymentMethod: EPaymentMethod;
}