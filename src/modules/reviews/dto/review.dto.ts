import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';
import { Review } from '@/generated/prisma/entities/review';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string; // Shopify Product ID (e.g., "gid://shopify/Product/12345")

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lineItemId: string; // Shopify LineItem ID (e.g., "gid://shopify/LineItem/12345")

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number; // 1 to 5 stars

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
  })
  @IsOptional()
  images?: string[]; // Array of image URLs (handled by controller)
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

class ReviewWithoutUser extends OmitType(Review, ['user'] as const) {
  @ApiProperty({ type: String })
  productImageUrl?: string;
}

export class GetMyReviewsResponse extends CursorResponseDto<ReviewWithoutUser> {
  @ApiProperty({ type: [ReviewWithoutUser] })
  declare items: ReviewWithoutUser[];
}

export class GetAllByProductIdResponse extends CursorResponseDto<Review> {
  @ApiProperty({ type: [Review] })
  declare items: Review[];
}

export class UpdateReviewResponse extends ReviewWithoutUser {}

export class ReviewableLineItem {
  @ApiProperty()
  lineItemId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderNumber: number;

  @ApiProperty()
  processedAt: string;

  @ApiProperty({ required: false })
  variant?: {
    id: string;
    title: string;
    image?: {
      url: string;
    };
    price: string;
  };

  @ApiProperty()
  hasReviewed: boolean;
}

export class GetReviewableItemsResponse {
  @ApiProperty({ type: [ReviewableLineItem] })
  targetOrderItems: ReviewableLineItem[]; // Items from the specified orderId (if provided)

  @ApiProperty({ type: [ReviewableLineItem] })
  otherItems: ReviewableLineItem[]; // Items from other orders
}
