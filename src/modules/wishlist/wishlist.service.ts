import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddWishlistDto } from './dto/wishlist.dto';
import { CursorRequestDto } from '@/common/dto/cursor-request.dto';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add item to wishlist.
   * Uses 'upsert' or checks existence to avoid duplicates.
   */
  async addToWishlist(userId: number, dto: AddWishlistDto) {
    // Check if already exists to handle gracefully
    const exists = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });

    if (exists) {
      // Option A: Throw error
      throw new ConflictException('Item already in wishlist');
      // Option B: Just return the existing item (Idempotent)
      // return exists;
    }

    return this.prisma.wishlistItem.create({
      data: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId,
      },
    });
  }

  /**
   * Get user's wishlist.
   */
  async getUserWishlist(userId: number, dto: CursorRequestDto) {
    const { cursor, limit } = dto;

    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: cursor ? 1 : 0, // Skip the cursor itself if present
      cursor: cursor ? { id: cursor } : undefined,
    });

    let nextCursor: number | null = null;

    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return new CursorResponseDto(items, nextCursor);
  }

  /**
   * Remove item from wishlist by Product ID.
   */
  async removeFromWishlist(userId: number, productId: string) {
    // We use deleteMany because delete requires the unique ID of the record,
    // but the client might only send the Product ID.
    // Since unique constraint exists on [userId, productId], deleteMany will delete max 1.
    return this.prisma.wishlistItem.deleteMany({
      where: {
        userId,
        productId,
      },
    });
  }
}
