/* eslint-disable prettier/prettier */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateOAuthUser(profile: any): Promise<User> {
    const email = profile.emails && profile.emails.length ? profile.emails[0].value : null;

    if (!email) {
      throw new Error('Email not found in Google profile');
    }

    let user = await this.usersService.findOneByEmail(email);

    if (!user) {
      // Nếu là OAuth user, không truyền mật khẩu hoặc để là null
      const newUser = await this.usersService.create({
        email,
        password: null,  // Không hash mật khẩu cho người dùng OAuth
      });
      user = newUser;
    }

    return user;
  }

  googleLogin(req) {
    if (!req.user) {
      return null; // Trả về null nếu không lấy được user
    }
    return {
      message: 'User Info from Google',
      user: req.user
    };
  }
}