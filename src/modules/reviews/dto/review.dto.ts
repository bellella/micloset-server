import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';
import { Review } from '@/generated/prisma/entities/review';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId: string; // Shopify Product ID (e.g., "gid://shopify/Product/12345")

  @IsString()
  @IsNotEmpty()
  lineItemId: string; // Shopify LineItem ID (e.g., "gid://shopify/LineItem/12345")

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

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[]; // Array of image URLs
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

class ReviewWithoutUser extends OmitType(Review, ['user'] as const) {}

export class GetMyReviewsResponse extends CursorResponseDto<ReviewWithoutUser> {
  @ApiProperty({ type: [ReviewWithoutUser] })
  declare items: Review[];
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
