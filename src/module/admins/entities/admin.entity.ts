import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  department: string; // example field

  @CreateDateColumn()
  createdAt: Date;
}
