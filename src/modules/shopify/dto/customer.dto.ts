import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  acceptsMarketing?: boolean;
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
  @ApiProperty()
  defaultAddress?: ShopifyAddress | undefined;
}
