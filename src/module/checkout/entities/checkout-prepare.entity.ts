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

  @Column({ type: 'enum', enum: ECheckoutPrepareStatus, default: ECheckoutPrepareStatus.PREPARING })
  status: ECheckoutPrepareStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp' })
  expiredAt: Date;
}
