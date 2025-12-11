import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CustomerAccessTokenDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

export class CreateAccessTokenDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export interface ShopifyAddress {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  province?: string;
  zip?: string;
}

export class ShopifyOrder {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
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

// export interface ShopifyCustomer {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   phone: string;
//   acceptsMarketing: boolean;
//   createdAt: string;
//   updatedAt: string;
//   orders?: {
//     edges: Array<{
//       node: ShopifyOrder;
//     }>;
//   };
//   defaultAddress?: ShopifyAddress;
// }

export class ShopifyCustomer {
  @ApiProperty()
  id: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  phone: string;
  @ApiProperty()
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
  // orders?:
  //   | {
  //       edges: Array<{
  //         node: ShopifyOrder;
  //       }>;
  //     }
  //   | undefined;
  @ApiProperty()
  defaultAddress?: ShopifyAddress | undefined;
}

export interface ShopifyCustomerAccessToken {
  accessToken: string;
  expiresAt: string;
}
