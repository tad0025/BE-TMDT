import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('addresses')
export class Address {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column()
    fullName: string;

    @Column()
    phoneNumber: string;

    @Column()
    provinceCode: number;

    @Column()
    provinceName: string;

    @Column()
    districtCode: number;

    @Column()
    districtName: string;

    @Column()
    wardCode: number;

    @Column()
    wardName: string;

    @Column()
    street: string;

    @Column({ type: 'double precision', default: 0 })
    latitude: number;

    @Column({ type: 'double precision', default: 0 })
    longitude: number;

    @Column({ type: 'text' })
    fullAddress: string;

    @Column({ default: false })
    isDefault: boolean;  

    @CreateDateColumn()
    createdAt: Date;
}
