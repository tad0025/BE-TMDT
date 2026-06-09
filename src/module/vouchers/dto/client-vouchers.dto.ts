import { DistributionType, VoucherType } from '../entities/voucher.entity';

export class ClientVoucherResponseDto {
  id: number;
  code: string;
  title: string;
  distribution_type: DistributionType;
  voucher_type: VoucherType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_value: number;
  start_date: Date;
  end_date: Date;

  constructor(partial: Partial<ClientVoucherResponseDto>) {
    Object.assign(this, partial);
  }
}
