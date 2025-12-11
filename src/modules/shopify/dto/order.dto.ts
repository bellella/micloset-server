import { CursorResponseDto } from '@/common/dto/curosr-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ShopifyOrder {
  @ApiProperty()
  id: string;
  @ApiProperty()
  orderNumber: number;
  @ApiProperty()
  processedAt: string;
  @ApiProperty()
  financialStatus: string;
  @ApiProperty()
  fulfillmentStatus: string;
  @ApiProperty()
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  @ApiProperty()
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
        };
      };
    }>;
  };
}

export class getCustomerOrdersResponse extends CursorResponseDto<ShopifyOrder> {
  @ApiProperty({ type: [ShopifyOrder] })
  declare items: ShopifyOrder[];
}
