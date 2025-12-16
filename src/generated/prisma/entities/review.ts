import { User } from './user';
import { ReviewHelpful } from './review_helpful';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Review {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  productId: string;

  @ApiProperty({ type: String })
  lineItemId: string;

  @ApiProperty({ type: Number })
  rating: number;

  @ApiPropertyOptional({ type: String })
  title?: string;

  @ApiProperty({ type: String })
  body: string;

  @ApiProperty({ isArray: true, type: String })
  images: string[];

  @ApiProperty({ type: Number })
  helpfulCount: number;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ isArray: true, type: () => ReviewHelpful })
  helpfulUsers: ReviewHelpful[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
