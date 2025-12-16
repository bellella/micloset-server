import { Review } from './review';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewHelpful {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  reviewId: number;

  @ApiProperty({ type: () => Review })
  review: Review;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: Date })
  createdAt: Date;
}
