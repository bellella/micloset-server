import { Module, forwardRef } from '@nestjs/common';
import { ShopifyController } from './shopify.controller';
import { ShopifyService } from './shopify.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ShopifyTokenGuard } from './guards/shopify-token.guard';

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule],
  controllers: [ShopifyController],
  providers: [ShopifyService, ShopifyTokenGuard],
  exports: [ShopifyService],
})
export class ShopifyModule {}
