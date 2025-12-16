// src/modules/users/users.service.ts

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@/generated/prisma';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import { SocialProvider } from '@/types/auth.type';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new user in the database.
   * Used during the first social login (upsert).
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  /**
   * Updates the user profile
   */
  updatePersonalInfo(
    userId: number,
    updatePersonalInfoDto: UpdatePersonalInfoDto
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updatePersonalInfoDto,
    });
  }

  /**
   * Deltes a user
   */
  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  /**
   * Finds a user by id.
   */
  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Finds a user by email address.
   * Required by the AuthService for login/upsert check.
   */
  async findOneByEmail(email: string, provider: SocialProvider) {
    return this.prisma.user.findFirst({
      where: { email, provider },
    });
  }

  /**
   * Updates the user's refresh token hash.
   * Essential for JWT security (token reuse prevention and logout).
   */
  // async updateRefreshTokenHash(userId: number, token: string | null) {
  //   // Hash the refresh token before storing it (or set to null on logout)
  //   const hashedToken = token ? await bcrypt.hash(token, 10) : null;

  //   return this.prisma.user.update({
  //     where: { id: userId },
  //     data: { refreshTokenHash: hashedToken },
  //   });
  // }

}
