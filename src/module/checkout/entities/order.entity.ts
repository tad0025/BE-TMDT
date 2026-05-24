import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { EOrderStatus } from '../../checkout/enums/EOrderStatus.enum';
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

  @Column({ nullable: true })
  addressId: number;

  @ManyToOne(() => Address, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ type: 'json', nullable: true })
  snapshotAddress: object;  // Snapshot của Address tại thời điểm đặt hàng

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
