import { Cart } from './cart';
import { Review } from './review';
import { WishlistItem } from './wishlist_item';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class User {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({ type: String })
  firebaseUid?: string;

  @ApiPropertyOptional({ type: String })
  shopifyCustomerId?: string;

  @ApiProperty({ type: String })
  provider: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiPropertyOptional({ type: String })
  firstName?: string;

  @ApiPropertyOptional({ type: String })
  lastName?: string;

  @ApiPropertyOptional({ type: String })
  shopifyAccessToken?: string;

  @ApiPropertyOptional({ type: Date })
  shopifyAccessTokenExpiresAt?: Date;

  @ApiPropertyOptional({ type: String })
  shopifyPasswordHash?: string;

  @ApiPropertyOptional({ type: () => Cart })
  cart?: Cart;

  @ApiProperty({ isArray: true, type: () => Review })
  reviews: Review[];

  @ApiProperty({ isArray: true, type: () => WishlistItem })
  wishlistItems: WishlistItem[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
