/* eslint-disable prettier/prettier */

import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    // Kiểm tra thông tin đăng nhập của người dùng
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Tạo JWT token và trả về
    const token = await this.authService.login(user);
    return { access_token: token.access_token };
  }
}