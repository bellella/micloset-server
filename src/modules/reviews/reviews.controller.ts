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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  GetMyReviewsResponse,
  UpdateReviewDto,
  UpdateReviewResponse,
  GetReviewableItemsResponse,
  GetAllByProductIdResponse,
} from './dto/review.dto';
import { ReqUser } from '@/common/decorators/user.decorator';
import type { CurrentUser } from '@/types/auth.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiCreatedResponse, ApiOkResponse, ApiConsumes } from '@nestjs/swagger';
import { DeleteResultDto } from '@/common/dto/delete-result.dto';
import { CursorRequestDto } from '@/common/dto/cursor-request.dto';
import { FilesService } from '../files/file.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly filesService: FilesService
  ) {}

  /**
   * POST /reviews
   * Creates a new review. Requires Session Auth.
   * Supports multipart/form-data for image uploads (max 5 images)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: Number })
  async create(
    @ReqUser() user: CurrentUser,
    @Body() createReviewDto: CreateReviewDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    // Upload images to S3 if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await Promise.all(
        files.map((file) => this.filesService.uploadToS3(file))
      );
    }

    // Merge uploaded image URLs with DTO
    const reviewData = {
      ...createReviewDto,
      images: imageUrls,
    };

    const review = await this.reviewsService.create(user.id, reviewData);
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
   * Get reviewable items for the current user.
   * If orderId is provided, items from that order are returned separately.
   */
  @Get('reviewable')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetReviewableItemsResponse })
  async getReviewableItems(
    @ReqUser() user: CurrentUser,
    @Query('orderId') orderId?: string
  ) {
    return this.reviewsService.getReviewableItems(user.email, user.id, orderId);
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
  @ApiCreatedResponse({ type: GetAllByProductIdResponse })
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

  /**
   * POST /reviews/:id/helpful
   * Mark a review as helpful.
   */
  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Review marked as helpful' })
  async markAsHelpful(
    @ReqUser() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean }> {
    await this.reviewsService.markAsHelpful(user.id, id);
    return { success: true };
  }

  /**
   * DELETE /reviews/:id/helpful
   * Remove helpful mark from a review.
   */
  @Delete(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Helpful mark removed' })
  async removeHelpful(
    @ReqUser() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean }> {
    await this.reviewsService.removeHelpful(user.id, id);
    return { success: true };
  }
}
