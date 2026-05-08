/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsNotEmpty, IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';
import { EUserRole } from '../../users/enums/user.enum';

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  email: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  password: string;

  @IsEnum(EUserRole, { message: 'Role không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng truyền role' })
  role: EUserRole;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

export class VerifyLoginOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp tempToken' })
  tempToken: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã OTP' })
  otp: string;
}