import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { EOrderStatus } from '../../checkout/enums/EOrderStatus.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'enum', enum: EOrderStatus, default: EOrderStatus.PENDING })
  status: EOrderStatus;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
