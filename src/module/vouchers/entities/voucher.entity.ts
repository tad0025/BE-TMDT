import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum DistributionType {
  PUBLIC = 'PUBLIC',
  LIMITED = 'LIMITED',
}

export enum VoucherType {
  PERCENT = 'PERCENT',
  CASH = 'CASH',
  FREESHIP_CASH = 'FREESHIP_CASH',
  FREESHIP_PERCENT = 'FREESHIP_PERCENT',
}

export enum VoucherStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  EXPIRED = 'EXPIRED',
}

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: DistributionType })
  distribution_type: DistributionType;

  @Column({ type: 'enum', enum: VoucherType })
  voucher_type: VoucherType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  max_discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  min_order_value: number;

  @Column('int')
  total_limit: number;

  @Column({ type: 'int', default: 0 })
  used_count: number;

  @Column('int')
  limit_per_user: number;

  @Column({ type: 'datetime' })
  start_date: Date;

  @Column({ type: 'datetime' })
  end_date: Date;

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.ACTIVE })
  status: VoucherStatus;

  @CreateDateColumn()
  created_at: Date;
}
