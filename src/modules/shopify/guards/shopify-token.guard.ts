import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';

@Injectable()
export class ShopifyTokenGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get valid Shopify token (auto-refresh if expired)
    const validToken = await this.authService.getValidShopifyToken(user.id);

    // Attach valid token to request
    request.shopifyAccessToken = validToken;

    return true;
  }
}
