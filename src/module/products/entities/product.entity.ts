import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ type: 'longtext' })
  description: string;

  @Column('bigint')
  price: number;

  @Column('bigint', { nullable: true })
  originalPrice: number;

  @Column({ default: 0 })
  discountPercentage: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: 0 })
  soldCount: number;

  @Column('simple-array', { nullable: true })
  materials: string[];

  @Column({ nullable: true })
  dimensions: string;

  @Column({ nullable: true })
  weight: string;

  @Column({ nullable: true })
  careInstructions: string;

  @Column('float', { default: 0 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'SET NULL' })
  category: Category;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  seller: User;
}