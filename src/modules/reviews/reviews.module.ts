import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ShopifyModule } from '../shopify/shopify.module';
import { FileModule } from '../files/file.module';

@Module({
  imports: [PrismaModule, ShopifyModule, FileModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
