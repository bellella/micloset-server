import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';
import { Review } from '@/generated/prisma/entities/review';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId: string; // Shopify Product ID (e.g., "gid://shopify/Product/12345")

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number; // 1 to 5 stars

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

class ReviewWithoutUser extends OmitType(Review, ['user'] as const) {}

export class GetMyReviewsResponse extends CursorResponseDto<Review> {
  @ApiProperty({ type: [ReviewWithoutUser] })
  declare items: Review[];
}

export class UpdateReviewResponse extends ReviewWithoutUser {}
