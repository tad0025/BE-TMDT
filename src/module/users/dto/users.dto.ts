import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UserProfileResponse {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsOptional()
    avatarUrl: string;

    @IsString()
    @IsOptional()
    phone: string;

    @IsString()
    @IsOptional()
    gender: string;

    @IsString()
    @IsOptional()
    dateOfBirth: string;

    @IsString()
    @IsNotEmpty()
    createdAt: string;

    @IsString()
    @IsOptional()
    updatedAt: string;
}

export class UpdateProfileRequest {
    @IsString()
    @IsOptional()
    fullName: string;

    @IsString()
    @IsOptional()
    phone: string;

    @IsString()
    @IsOptional()
    gender: string;

    @IsString()
    @IsOptional()
    dateOfBirth: string;
}