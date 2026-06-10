import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';
import { User } from '../../users/entities/user.entity';

@Entity('order_vouchers')
export class OrderVoucher {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  orderId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  voucherId: number;

  @Column()
  voucherCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'json' })
  voucherSnapshot: any; 

  @ManyToOne(() => Order, order => order.vouchers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Voucher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'voucherId' })
  voucher: Voucher;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
