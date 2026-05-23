import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  shopName: string;

  @Column({ type: 'text', nullable: true })
  shopDescription: string;

  @Column('float', { default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalProducts: number;

  @CreateDateColumn()
  createdAt: Date;
}
