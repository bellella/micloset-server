import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { ShopifyCustomer, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOkResponse } from '@nestjs/swagger';
import { ShopifyTokenGuard } from './guards/shopify-token.guard';
import { CursorRequestDto } from '@/common/dto/cursor-request.dto';
import { getCustomerOrdersResponse, ShopifyOrder } from './dto/order.dto';
import { ReqUser } from '@/common/decorators/user.decorator';

@Controller('shopify')
@UseGuards(JwtAuthGuard, ShopifyTokenGuard)
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Get('customer')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ShopifyCustomer })
  async getCustomer(@ReqUser('shopifyCustomerId') shopifyCustomerId) {
    return this.shopifyService.getCustomer(shopifyCustomerId);
  }

  @Get('customer/orders')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: getCustomerOrdersResponse })
  async getCustomerOrders(
    @ReqUser('email') email,
    @Query() query: CursorRequestDto
  ) {
    return this.shopifyService.getCustomerOrders(email, query.cursorString);
  }

  @Get('customer/orders/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ShopifyOrder })
  async getOrderById(@Param('orderId') orderId: string) {
    return this.shopifyService.getOrderById(orderId);
  }

  // @Post('customer/update')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({ type: ShopifyCustomer })
  // async updateCustomer(
  //   @Req() req,
  //   @Body() updateCustomerDto: UpdateCustomerDto
  // ) {
  //   return this.shopifyService.updateCustomer(
  //     req.shopifyAccessToken,
  //     updateCustomerDto
  //   );
  // }
}
