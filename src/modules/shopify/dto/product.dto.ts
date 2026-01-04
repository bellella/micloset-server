import { ApiProperty } from '@nestjs/swagger';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';

export interface ShopifyImage {
  id?: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  availableForSale: boolean;
  sku?: string;
  image?: ShopifyImage;
}

export interface ShopifyPriceRange {
  minVariantPrice: {
    amount: string;
    currencyCode: string;
  };
  maxVariantPrice: {
    amount: string;
    currencyCode: string;
  };
}

export class ShopifyProduct {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  descriptionHtml?: string;

  @ApiProperty()
  handle: string;

  @ApiProperty()
  featuredImage?: ShopifyImage;

  @ApiProperty()
  images: {
    edges: Array<{
      node: ShopifyImage;
    }>;
  };

  @ApiProperty()
  variants: {
    edges: Array<{
      node: ShopifyProductVariant;
    }>;
  };

  @ApiProperty()
  priceRange: ShopifyPriceRange;

  @ApiProperty()
  availableForSale: boolean;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  vendor?: string;

  @ApiProperty()
  productType?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class GetProductsResponse extends CursorResponseDto<ShopifyProduct> {
  @ApiProperty({ type: [ShopifyProduct] })
  declare items: ShopifyProduct[];
}
