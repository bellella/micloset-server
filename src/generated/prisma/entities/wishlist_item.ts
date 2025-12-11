import { User } from './user';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WishlistItem {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  productId: string;

  @ApiPropertyOptional({ type: String })
  variantId?: string;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: Date })
  createdAt: Date;
}
