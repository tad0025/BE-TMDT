import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    provinceCode: string;

    @IsString()
    @IsNotEmpty()
    provinceName: string;

    @IsString()
    @IsNotEmpty()
    districtCode: string;

    @IsString()
    @IsNotEmpty()
    districtName: string;

    @IsString()
    @IsNotEmpty()
    wardCode: string;

    @IsString()
    @IsNotEmpty()
    wardName: string;

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsNumber()
    @IsOptional()
    latitude?: number;

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

    @IsString()
    @IsOptional()
    provinceCode?: string;

    @IsString()
    @IsOptional()
    provinceName?: string;

    @IsString()
    @IsOptional()
    districtCode?: string;

    @IsString()
    @IsOptional()
    districtName?: string;

    @IsString()
    @IsOptional()
    wardCode?: string;

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

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class AddressDto {
    id: number;
    fullName: string;
    phoneNumber: string;
    provinceCode: string;
    provinceName: string;
    districtCode: string;
    districtName: string;
    wardCode: string;
    wardName: string;
    street: string;
    latitude: number;
    longitude: number;
    fullAddress: string;
    isDefault: boolean;
    createdAt: Date;
}
