import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  GetMyReviewsResponse,
  UpdateReviewDto,
  UpdateReviewResponse,
} from './dto/review.dto';
import { ReqUser } from '@/common/decorators/user.decorator';
import type { CurrentUser } from '@/types/auth.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Review } from '@/generated/prisma/entities/review';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteResultDto } from '@/common/dto/delete-result.dto';
import { CursorRequestDto } from '@/common/dto/cursor-request.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /reviews
   * Creates a new review. Requires Session Auth.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ type: Number })
  async create(
    @ReqUser() user: CurrentUser,
    @Body() createReviewDto: CreateReviewDto
  ) {
    const review = await this.reviewsService.create(user.id, createReviewDto);
    return review.id;
  }

  /**
   * Get the current user's review list with infinite scroll.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetMyReviewsResponse })
  async getAllByUserId(
    @ReqUser() user: CurrentUser,
    @Query() query: CursorRequestDto
  ) {
    return this.reviewsService.findAllByUserId(user.id, query);
  }

  /**
   * GET /reviews/product/:productId
   * Public endpoint to fetch reviews for a product page.
   * Note: Assuming productId is a string (Shopify ID).
   * Since Shopify IDs contain slashes (gid://...), you might need to encode them
   * or pass them as a query param (?productId=...) instead of a URL param.
   * Here, we assume passed as query param for safety: GET /reviews?productId=...
   * OR handle URL encoding on client side.
   */
  @Get('product/:productId')
  @ApiCreatedResponse({ type: [Review] })
  async getAllByProductId(
    @Query() query: CursorRequestDto,
    @Param('productId') productId: string
  ) {
    // Decoding might be needed if the ID comes in encoded format
    const decodedId = decodeURIComponent(productId);
    return this.reviewsService.findAllByProduct(decodedId, query);
  }

  /**
   * Update a specific review.
   * * Only the owner of the review can update it.
   * * If the review does not belong to the user, a 404 or 403 error will occur.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: UpdateReviewResponse })
  async updateReview(
    @ReqUser() user: CurrentUser,
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewDto
  ) {
    return this.reviewsService.update(user.id, +reviewId, dto);
  }

  /**
   * DELETE /reviews/:id
   * Deletes a review. User must own the review.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ type: DeleteResultDto })
  async remove(
    @ReqUser() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number
  ): Promise<DeleteResultDto> {
    const review = await this.reviewsService.remove(user.id, id);
    return { success: true, deletedId: review.id };
  }
}
