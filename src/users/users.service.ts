/* eslint-disable prettier/prettier */
// user.service.ts

import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { ForgotPasswordDto } from 'src/users/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/users/dto/reset-password.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  [x: string]: any;
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>, private readonly mailerService: MailerService) { }

  async create(createUserDto: CreateUserDto): Promise<{ _id: string; createdAt: Date }> {
    const { email, password } = createUserDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const user = await this.userModel.create({ email, password: hashedPassword });

      return {
        _id: user._id.toString(),
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Error creating user');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
  
    const user = await this.userModel.findOne({ email });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const otp = uuidv4(); // Sử dụng UUID làm OTP
    const otpExpire = Date.now() + 10 * 60 * 1000;
  
    // Lưu OTP và thời gian hết hạn vào cơ sở dữ liệu
    user.resetOtp = otp;
    user.resetOtpExpire = new Date(otpExpire);
  
    await user.save();
  
    // Gửi email chứa mã OTP cho người dùng
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Cài đặt lại mật khẩu',
      text: `Bạn đã yêu cầu đặt lại mật khẩu. OTP của bạn là ${otp}. Mã này sẽ hết hạn sau 10 phút.`,
    });
  
    return { message: 'OTP gửi thành công' };
  }

  async resetPassword(otp: string, resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { newPassword } = resetPasswordDto;
  
    // Tìm user theo OTP và kiểm tra OTP còn hiệu lực không
    const user = await this.userModel.findOne({
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() }, // OTP vẫn còn hiệu lực
    });
  
    if (!user) {
      throw new NotFoundException('OTP không hợp lệ hoặc đã hết hạn');
    }
  
    // Mã hóa mật khẩu mới và cập nhật
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    await user.save();
  
    return { message: 'Mật khẩu đã được đặt lại' };
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}