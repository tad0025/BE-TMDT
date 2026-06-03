import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { EOrderStatus } from '../../checkout/enums/EOrderStatus.enum';

export class GetOrdersFilterDto {
  @IsOptional()
  @IsEnum(EOrderStatus)
  status?: EOrderStatus;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(EOrderStatus)
  status: EOrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
