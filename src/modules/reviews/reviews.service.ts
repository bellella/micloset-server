import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { CursorRequestDto } from '@/common/dto/cursor-request.dto';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a review.
   * Checks if the user has already reviewed the product to prevent duplicates.
   */
  async create(userId: number, dto: CreateReviewDto) {
    // Check for existing review because of @@unique([userId, productId])
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product.');
    }

    return this.prisma.review.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  /**
   * Update a review
   */
  async update(userId: number, reviewId: number, dto: UpdateReviewDto) {
    return this.prisma.review.update({
      where: {
        id: reviewId,
        userId: userId,
      },
      data: dto,
    });
  }

  /**
   * Find reviews for a specific product.
   * Includes user's first name to display "Reviewed by John".
   */
  async findAllByProduct(productId: string, dto: CursorRequestDto) {
    const { cursor, limit } = dto;

    const items = await this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
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
   * Find reviews for a specific product.
   * Includes user's first name to display "Reviewed by John".
   */
  async findAllByUserId(userId: number, dto: CursorRequestDto) {
    const { cursor, limit } = dto;

    const items = await this.prisma.review.findMany({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
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
   * Remove a review.
   * Ensures the review belongs to the requesting user before deleting.
   */
  async remove(userId: number, reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }
}
