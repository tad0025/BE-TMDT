import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from 'src/core/security/jwt/jwt-auth.guard';
import { SendOtpDto } from './dto/otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login') // POST /auth/login 
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(loginDto);

    if (result.success && result.data?.accessToken) {
      res.cookie('accessToken', result.data.accessToken, {
        httpOnly: true, // Chống XSS (JavaScript không đọc được)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Chống CSRF
        maxAge: 60 * 60 * 1000, // 1 giờ
      });
    }

    return result;
  }

  @Post('otp') // POST /auth/otp 
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('register') // POST /auth/register 
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout') // POST /auth/logout 
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.logout(req.user.id);

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return result;
  }
}