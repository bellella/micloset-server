import { User } from './user';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Review {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  productId: string;

  @ApiProperty({ type: Number })
  rating: number;

  @ApiPropertyOptional({ type: String })
  title?: string;

  @ApiProperty({ type: String })
  body: string;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
