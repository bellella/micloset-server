import { User as _User } from './user';
import { Cart as _Cart } from './cart';
import { Review as _Review } from './review';
import { WishlistItem as _WishlistItem } from './wishlist_item';

export namespace PrismaModel {
  export class User extends _User {}
  export class Cart extends _Cart {}
  export class Review extends _Review {}
  export class WishlistItem extends _WishlistItem {}

  export const extraModels = [User, Cart, Review, WishlistItem];
}
