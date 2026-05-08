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
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  private otps = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  async login(loginDto: LoginDto): Promise<ApiResponse<any>> {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ 
      where: { email }, 
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
    
    const record = this.otps.get(email);
    if (!record) {
      throw new CustomException(HttpStatus.BAD_REQUEST, 'OTP_NOT_FOUND', 'Mã OTP không tồn tại hoặc chưa được gửi');
    }
    if (Date.now() > record.expiresAt) {
      this.otps.delete(email);
      throw new CustomException(HttpStatus.BAD_REQUEST, 'OTP_EXPIRED', 'Mã OTP đã hết hạn');
    }
    if (record.otp !== otp) {
      throw new CustomException(HttpStatus.BAD_REQUEST, 'OTP_INVALID', 'Mã OTP không chính xác');
    }
    this.otps.delete(email);

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
    const { email } = dto;
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this.otps.set(email, { otp: generatedOtp, expiresAt });

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Mã xác thực OTP',
        text: `Mã OTP của bạn là: ${generatedOtp}. Mã này có hiệu lực trong 5 phút.`,
        html: `<p>Mã OTP của bạn là: <strong>${generatedOtp}</strong></p><p>Mã này có hiệu lực trong 5 phút.</p>`,
      });
    } catch (error) {
      console.error('Mail send error:', error);
      throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, 'MAIL_FAILED', 'Không thể gửi email OTP, vui lòng thử lại sau.');
    }

    return new ApiResponse(true, 'Gửi OTP thành công', null);
  }

  async logout(userId: string): Promise<ApiResponse<null>> {
    await this.userRepository.increment({ id: userId }, 'tokenVersion', 1);
    return new ApiResponse(true, 'Đăng xuất thành công', null);
  }
}