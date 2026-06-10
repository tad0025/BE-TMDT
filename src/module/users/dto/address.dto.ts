import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsNotEmpty()
    provinceCode: number;

    @IsString()
    @IsNotEmpty()
    provinceName: string;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsNotEmpty()
    districtCode: number;

    @IsString()
    @IsNotEmpty()
    districtName: string;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsNotEmpty()
    wardCode: number;

    @IsString()
    @IsNotEmpty()
    wardName: string;

    @IsString()
    @IsNotEmpty()
    street: string;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsOptional()
    latitude?: number;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsOptional()
    longitude?: number;

    @IsString()
    @IsNotEmpty()
    fullAddress: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

export class UpdateAddressDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsOptional()
    provinceCode?: number;

    @IsString()
    @IsOptional()
    provinceName?: string;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsOptional()
    districtCode?: number;

    @IsString()
    @IsOptional()
    districtName?: string;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsOptional()
    wardCode?: number;

    @IsString()
    @IsOptional()
    wardName?: string;

    @IsString()
    @IsOptional()
    street?: string;

    @IsNumber()
    @IsOptional()
    latitude?: number;

    @IsNumber()
    @IsOptional()
    longitude?: number;

    @IsString()
    @IsOptional()
    fullAddress?: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

export class AddressDto {
    id: number;
    fullName: string;
    phoneNumber: string;
    provinceCode: number;
    provinceName: string;
    districtCode: number;
    districtName: string;
    wardCode: number;
    wardName: string;
    street: string;
    latitude: number;
    longitude: number;
    fullAddress: string;
    isDefault: boolean;
    createdAt: Date;
}
