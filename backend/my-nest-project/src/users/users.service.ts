import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

export const BCRYPT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 12;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  findByEmailWithPassword(email: string) {
    return this.users
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  async findById(id: string) {
    const user = await this.users.findById(id).lean().exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.users.findById(id).select('+passwordHash').exec();
  }

  /**
   * Creates an admin. Only reachable from the seed/CLI scripts — there is
   * deliberately no HTTP signup endpoint.
   */
  async createAdmin(email: string, name: string, password: string) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `Admin password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }
    const existing = await this.users.exists({ email: email.toLowerCase() });
    if (existing) throw new ConflictException('Admin already exists');
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return this.users.create({ email, name, passwordHash, role: 'admin' });
  }

  async setPassword(id: string, password: string) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.users.updateOne({ _id: id }, { passwordHash }).exec();
  }

  async touchLogin(id: string) {
    await this.users.updateOne({ _id: id }, { lastLoginAt: new Date() }).exec();
  }

  count() {
    return this.users.countDocuments().exec();
  }
}
