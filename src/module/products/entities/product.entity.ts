import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Seller } from '../../sellers/entities/seller.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'json', nullable: true })
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

  @Column({ type: 'json', nullable: true })
  materials: string[];

  @Column({ type: 'json', nullable: true })
  dimensions: number[];

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true })
  careInstructions: string;

  @Column('float', { default: 0 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'SET NULL' })
  category: Category;

  @ManyToOne(() => Seller, { onDelete: 'CASCADE' })
  seller: Seller;
}