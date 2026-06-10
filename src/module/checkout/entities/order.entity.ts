import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderVoucher } from './order-voucher.entity';
import { EOrderStatus } from '../../checkout/enums/EOrderStatus.enum';
import { EPaymentStatus } from '../../checkout/enums/EPaymentStatus.enum';
import { EPaymentMethod } from '../../checkout/enums/EPaymentMethod.enum';
import { Address } from '../../users/entities/address-users.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'enum', enum: EOrderStatus, default: EOrderStatus.PENDING })
  status: EOrderStatus;

  @Column({ type: 'enum', enum: EPaymentStatus, default: EPaymentStatus.PENDING })
  paymentStatus: EPaymentStatus;

  @Column({ type: 'enum', enum: EPaymentMethod, default: EPaymentMethod.COD })
  paymentMethod: EPaymentMethod;

  @Column({ nullable: true })
  addressId: number;

  @ManyToOne(() => Address, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingDiscountAmount: number;

  @Column({ type: 'json', nullable: true })
  snapshotAddress: object;  

  @Column({ nullable: true })
  cancelReason: string;

  @Column({ nullable: true })
  returnReason: string;

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'json', nullable: true })
  statusHistory: any;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderVoucher, (orderVoucher) => orderVoucher.order, { cascade: true })
  vouchers: OrderVoucher[];

  @CreateDateColumn()
  createdAt: Date;
}
