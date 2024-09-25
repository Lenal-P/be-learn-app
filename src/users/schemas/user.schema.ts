/* eslint-disable prettier/prettier */
// user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  [x: string]: any;
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop({ type: String })
  resetOtp: string;

  @Prop({ type: Date }) 
  resetOtpExpire: Date;

  constructor(user: User) {
    this._id = user._id.toString();
    this.email = user.email;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);