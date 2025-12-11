import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { FileModule } from './modules/files/file.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ShopifyModule } from './modules/shopify/shopify.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FileModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthModule,
    MailModule,
    ReviewsModule,
    WishlistModule,
    ShopifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
