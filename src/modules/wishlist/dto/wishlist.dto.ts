import { CursorResponseDto } from '@/common/dto/curosr-response.dto';
import { Review } from '@/generated/prisma';
import { WishlistItem } from '@/generated/prisma/entities/wishlist_item';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddWishlistDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;
}

export class GetMyWishlistResponse extends CursorResponseDto<Review> {
  @ApiProperty({ type: [WishlistItem] })
  declare items: Review[];
}
