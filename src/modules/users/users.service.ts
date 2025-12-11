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

  /**
   * Updates user's Shopify access token and expiration time
   */
  async updateShopifyToken(
    userId: number,
    accessToken: string,
    expiresAt: string
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        shopifyAccessToken: accessToken,
        shopifyAccessTokenExpiresAt: new Date(expiresAt),
      },
    });
  }

  /**
   * Gets user's Shopify access token with expiration info
   */
  async getShopifyToken(userId: number): Promise<{
    accessToken: string | null;
    expiresAt: Date | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        shopifyAccessToken: true,
        shopifyAccessTokenExpiresAt: true,
      },
    });

    return {
      accessToken: user?.shopifyAccessToken || null,
      expiresAt: user?.shopifyAccessTokenExpiresAt || null,
    };
  }

  /**
   * Gets user's Shopify credentials (email and password hash) for token re-authentication
   */
  async getShopifyCredentials(userId: number): Promise<{
    email: string | null;
    passwordHash: string | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        shopifyPasswordHash: true,
      },
    });

    return {
      email: user?.email || null,
      passwordHash: user?.shopifyPasswordHash || null,
    };
  }
}
