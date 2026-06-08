import { IsEnum, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { DistributionType, VoucherStatus, VoucherType } from '../entities/voucher.entity';
import { Type } from 'class-transformer';

export class GetVouchersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsEnum(VoucherStatus)
  status?: VoucherStatus;

  @IsOptional()
  @IsEnum(DistributionType)
  distribution_type?: DistributionType;
}

export class CreateVoucherRequestDto {
  @IsString()
  title: string;

  @IsString()
  code: string;

  @IsEnum(DistributionType)
  distribution_type: DistributionType;

  @IsEnum(VoucherType)
  voucher_type: VoucherType;

  @IsNumber()
  discount_value: number;

  @IsOptional()
  @IsNumber()
  max_discount_amount?: number;

  @IsNumber()
  min_order_value: number;

  @IsNumber()
  total_limit: number;

  @IsNumber()
  limit_per_user: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}

export class UpdateVoucherStatusRequestDto {
  @IsEnum(VoucherStatus)
  status: VoucherStatus;
}

export class UpdateVoucherRequestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  discount_value?: number;

  @IsOptional()
  @IsNumber()
  max_discount_amount?: number;

  @IsOptional()
  @IsNumber()
  total_limit?: number;

  @IsOptional()
  @IsNumber()
  limit_per_user?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(VoucherStatus)
  status?: VoucherStatus;
}
