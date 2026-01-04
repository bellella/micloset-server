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
  closedAt?: string | null;
  @ApiProperty()
  financialStatus: string;
  @ApiProperty()
  fulfillmentStatus: string;
  @ApiProperty()
  customer?: {
    id: string;
  };
  @ApiProperty()
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  @ApiProperty()
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        quantity: number;
        product: {
          id: string;
        };
        image: {
          url;
        };
        variant: {
          id: string;
          title: string;
          image?: {
            url: string;
          };
          price: string;
        };
      };
    }>;
  };
  @ApiProperty()
  hasReviewableItems?: boolean;
}

export class getCustomerOrdersResponse extends CursorResponseDto<ShopifyOrder> {
  @ApiProperty({ type: [ShopifyOrder] })
  declare items: ShopifyOrder[];
}
