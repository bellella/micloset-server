import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { ReqUser } from '@/common/decorators/user.decorator';
import type { CurrentUser } from '@/types/auth.type';
import { AddWishlistDto, GetMyWishlistResponse } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CursorRequestDto } from '@/common/dto/cursor-request.dto';
import { ApiCreatedResponse } from '@nestjs/swagger';

@Controller('wishlist')
@UseGuards(JwtAuthGuard) // All wishlist routes require login
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * GET /wishlist
   * Returns the list of saved product IDs.
   */
  @Get()
  @ApiCreatedResponse({ type: GetMyWishlistResponse })
  getMyWishList(
    @ReqUser() user: CurrentUser,
    @Query() query: CursorRequestDto
  ) {
    return this.wishlistService.getUserWishlist(user.id, query);
  }

  /**
   * POST /wishlist
   * Adds an item.
   */
  @Post()
  add(@ReqUser() user: CurrentUser, @Body() dto: AddWishlistDto) {
    return this.wishlistService.addToWishlist(user.id, dto);
  }

  /**
   * DELETE /wishlist/:productId
   * Removes an item using the Shopify Product ID.
   * Note: Encode the ID on the client side if it contains slashes.
   */
  @Delete()
  remove(@ReqUser() user: CurrentUser, @Query('productId') productId: string) {
    const decodedId = decodeURIComponent(productId);
    return this.wishlistService.removeFromWishlist(user.id, decodedId);
  }
}
