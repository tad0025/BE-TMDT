import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '../../core/dto/ApiResponse.dto';
import { CustomException } from '../../core/exceptions/custom.exception';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/otp.dto';
import { RegisterDto } from './dto/register.dto';
import { EUserRole } from '../users/enums/user.enum';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async login(loginDto: LoginDto): Promise<ApiResponse<any>> {
    const { email, password, role } = loginDto;
    const user = await this.userRepository.findOne({ 
      where: { email, role }, 
      select: ['id', 'email', 'password', 'role', 'fullName', 'avatarUrl', 'tokenVersion'] 
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'AUTH_FAILED', 'Tài khoản hoặc mật khẩu không đúng');
    }

    const payload = { 
      userId: user.id, 
      version: user.tokenVersion
    };

    const accessToken = this.jwtService.sign(payload);

    return new ApiResponse(true, 'Đăng nhập thành công', {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || '',
        role: user.role,
        avatarUrl: user.avatarUrl || ''
      }
    });
  }

  async register(registerDto: RegisterDto): Promise<ApiResponse<any>> {
    const { email, password, confirmPassword, otp } = registerDto;

    if (password !== confirmPassword) {
      throw new CustomException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Mật khẩu xác nhận không khớp');
    }
    
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new CustomException(HttpStatus.BAD_REQUEST, 'USER_EXISTS', 'Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      fullName: email.split('@')[0],
      role: EUserRole.USER,
    });

    const savedUser = await this.userRepository.save(newUser);

    const payload = { 
      userId: savedUser.id, 
      version: savedUser.tokenVersion 
    };

    const accessToken = this.jwtService.sign(payload);

    return new ApiResponse(true, 'Đăng ký thành công', {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName || '',
        role: savedUser.role,
        avatarUrl: savedUser.avatarUrl || ''
      }
    });
  }

  async sendOtp(dto: SendOtpDto): Promise<ApiResponse<null>> {
    // Logic gửi mail...
    return new ApiResponse(true, 'Gửi OTP thành công', null);
  }

  async logout(userId: string): Promise<ApiResponse<null>> {
    await this.userRepository.increment({ id: userId }, 'tokenVersion', 1);
    return new ApiResponse(true, 'Đăng xuất thành công', null);
  }
}