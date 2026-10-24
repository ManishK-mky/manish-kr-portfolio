import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'admin_users' })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  })
  email: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  /** bcrypt hash; never selected unless explicitly requested. */
  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, enum: ['admin'], default: 'admin' })
  role: 'admin';

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
