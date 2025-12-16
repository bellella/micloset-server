import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShopifyService } from '../shopify/shopify.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  GetReviewableItemsResponse,
  ReviewableLineItem,
} from './dto/review.dto';
import { CursorRequestDto } from '@/common/dto/cursor-request.dto';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private shopifyService: ShopifyService
  ) {}

  /**
   * Create a review.
   * Checks if the user has already reviewed this line item to prevent duplicates.
   * Updates product rating metafield after creation.
   */
  async create(userId: number, dto: CreateReviewDto) {
    // Check for existing review because of @@unique([userId, lineItemId])
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_lineItemId: {
          userId,
          lineItemId: dto.lineItemId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this item.');
    }

    const review = await this.prisma.review.create({
      data: {
        ...dto,
        images: dto.images || [],
        userId,
      },
    });

    // Update product rating metafield
    await this.updateProductRating(dto.productId);

    return review;
  }

  /**
   * Update a review
   * Updates product rating metafield after update.
   */
  async update(userId: number, reviewId: number, dto: UpdateReviewDto) {
    const review = await this.prisma.review.update({
      where: {
        id: reviewId,
        userId: userId,
      },
      data: dto,
    });

    // Update product rating metafield
    await this.updateProductRating(review.productId);

    return review;
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
   * Updates product rating metafield after deletion.
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

    const deletedReview = await this.prisma.review.delete({
      where: { id: reviewId },
    });

    // Update product rating metafield
    await this.updateProductRating(review.productId);

    return deletedReview;
  }

  /**
   * Calculate and update product rating in Shopify metafield
   */
  private async updateProductRating(productId: string): Promise<void> {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    // Update Shopify product metafield
    await this.shopifyService.updateProductRatingMetafield(
      productId,
      averageRating,
      totalReviews
    );
  }

  /**
   * Mark a review as helpful
   */
  async markAsHelpful(userId: number, reviewId: number): Promise<void> {
    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if already marked as helpful
    const existingHelpful = await this.prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingHelpful) {
      throw new ConflictException(
        'You have already marked this review as helpful'
      );
    }

    // Create helpful record and increment count
    await this.prisma.$transaction([
      this.prisma.reviewHelpful.create({
        data: {
          reviewId,
          userId,
        },
      }),
      this.prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
      }),
    ]);
  }

  /**
   * Remove helpful mark from a review
   */
  async removeHelpful(userId: number, reviewId: number): Promise<void> {
    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if marked as helpful
    const existingHelpful = await this.prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (!existingHelpful) {
      throw new NotFoundException('You have not marked this review as helpful');
    }

    // Delete helpful record and decrement count
    await this.prisma.$transaction([
      this.prisma.reviewHelpful.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      }),
      this.prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            decrement: 1,
          },
        },
      }),
    ]);
  }

  /**
   * Get reviewable items for a user.
   * Returns items from orders that are within 7 days of closedAt or have null closedAt.
   * If orderId is provided, items from that order are returned separately.
   */
  async getReviewableItems(
    email: string,
    userId: number,
    orderId?: string
  ): Promise<GetReviewableItemsResponse> {
    // Fetch all orders for the user
    const ordersResponse = await this.shopifyService.getCustomerOrders(
      email,
      undefined,
      100 // Fetch more orders to get all reviewable items
    );

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all reviews for this user
    const userReviews = await this.prisma.review.findMany({
      where: { userId },
      select: { lineItemId: true },
    });

    const reviewedLineItemIds = new Set(userReviews.map((r) => r.lineItemId));

    const targetOrderItems: ReviewableLineItem[] = [];
    const otherItems: ReviewableLineItem[] = [];

    for (const order of ordersResponse.items) {
      // Check if order is reviewable
      const isReviewable =
        order.closedAt === null ||
        (order.closedAt && new Date(order.closedAt) >= sevenDaysAgo);

      if (!isReviewable) continue;

      const isTargetOrder = orderId ? order.id === orderId : false;

      for (const edge of order.lineItems.edges) {
        const lineItem = edge.node;
        const hasReviewed = reviewedLineItemIds.has(lineItem.id);

        const productId = lineItem.product.id;

        const reviewableItem: ReviewableLineItem = {
          lineItemId: lineItem.id,
          productId: productId,
          title: lineItem.title,
          quantity: lineItem.quantity,
          orderId: order.id,
          orderNumber: order.orderNumber,
          processedAt: order.processedAt,
          variant: {
            id: lineItem.variant.id,
            title: lineItem.variant.title,
            image: lineItem.variant.image,
            price: lineItem.variant.price,
          },
          hasReviewed,
        };

        if (isTargetOrder) {
          targetOrderItems.push(reviewableItem);
        } else {
          otherItems.push(reviewableItem);
        }
      }
    }

    return {
      targetOrderItems,
      otherItems,
    };
  }
}
