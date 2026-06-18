import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ECheckoutPrepareStatus } from '../enums/ECheckoutPrepareStatus.enum';

@Entity('checkout_prepares')
export class CheckoutPrepare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'json' })
  payload: any;

  @Column({ type: 'int', nullable: true })
  numberOfItems: number | null;

  @Column({ type: 'int', nullable: true })
  totalQuantity: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedTotalPrice: number | null;

  @Column({ type: 'varchar', nullable: true })
  firstProductThumbnail: string | null;

  @Column({ type: 'varchar', nullable: true })
  productNamesSummary: string | null;

  @Column({ type: 'enum', enum: ECheckoutPrepareStatus, default: ECheckoutPrepareStatus.PREPARING })
  status: ECheckoutPrepareStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp' })
  expiredAt: Date;
}
