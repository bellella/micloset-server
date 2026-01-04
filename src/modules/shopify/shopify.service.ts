import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion, Session } from '@shopify/shopify-api';
import { ShopifyCustomer } from './dto/customer.dto';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';
import { ShopifyOrder } from './dto/order.dto';
import { ShopifyImage } from './dto/product.dto';

@Injectable()
export class ShopifyService {
  private shopify: ReturnType<typeof shopifyApi>;
  private session: Session;
  private client: any;

  constructor(private configService: ConfigService) {
    const adminAccessToken = this.configService.get<string>(
      'SHOPIFY_ADMIN_ACCESS_TOKEN',
      ''
    );
    const shopName = this.configService.get<string>('SHOPIFY_SHOP_NAME', '');
    const apiSecretKey = this.configService.get<string>(
      'SHOPIFY_API_SECRET',
      'not-needed'
    );

    if (!adminAccessToken || !shopName) {
      throw new Error('Shopify Admin API configuration is missing');
    }

    // Initialize Shopify API
    this.shopify = shopifyApi({
      apiKey: '78942ec25826ba03e84c42c0eb940f00',
      apiSecretKey,
      scopes: ['read_customers', 'read_products', 'read_orders'],
      hostName: `${shopName}.myshopify.com`,
      apiVersion: ApiVersion.April25,
      isEmbeddedApp: false,
      isCustomStoreApp: true,
      adminApiAccessToken: adminAccessToken,
    });

    // Create session for Admin API
    this.session = new Session({
      id: `offline_${shopName}`,
      shop: `${shopName}.myshopify.com`,
      state: 'state',
      isOnline: false,
      accessToken: adminAccessToken,
    });

    // Create GraphQL client
    this.client = new this.shopify.clients.Graphql({ session: this.session });
  }

  async getCustomer(customerId: string): Promise<ShopifyCustomer> {
    const query = `
      query getCustomer($customerId: ID!) {
        customer(id: $customerId) {
          id
          email
          firstName
          lastName
          phone
          createdAt
          updatedAt
          defaultAddress {
            address1
            address2
            city
            company
            country
            firstName
            lastName
            phone
            province
            zip
          }
        }
      }
    `;

    try {
      const response: any = await this.client.request(query, {
        variables: {
          customerId,
        },
      });

      const data = response.data;

      if (!data.customer) {
        throw new HttpException(
          'Customer not found or invalid access token',
          HttpStatus.NOT_FOUND
        );
      }

      return data.customer;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch customer',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getCustomerOrders(
    email: string,
    cursor?: string,
    first: number = 10
  ): Promise<CursorResponseDto<ShopifyOrder>> {
    const query = `
      query getCustomerOrders($query: String, $first: Int!, $after: String) {
        orders(first: $first, query: $query, sortKey: PROCESSED_AT, reverse: true, after: $after) {
          edges {
            cursor
            node {
              id
              name
              processedAt
              closedAt
              displayFinancialStatus
              displayFulfillmentStatus
              email
              customer {
                id
              }
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    title
                    quantity
                    image {
                      url
                    }
                    product {
                      id
                    }
                    variant {
                      id
                      title
                      image {
                        url
                      }
                      price
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    try {
      const response: any = await this.client.request(query, {
        variables: {
          query: `email:${email}`,
          first,
          after: cursor || null,
        },
      });

      const data = response.data;

      if (!data.orders) {
        throw new HttpException('Orders not found', HttpStatus.NOT_FOUND);
      }

      return {
        items: data.orders.edges.map((edge: any) => {
          const order = edge.node;
          const hasReviewableItems = this.checkIfOrderHasReviewableItems(order);

          return {
            id: order.id,
            orderNumber: parseInt(order.name.replace('#', '')),
            processedAt: order.processedAt,
            closedAt: order.closedAt,
            financialStatus: order.displayFinancialStatus,
            fulfillmentStatus: order.displayFulfillmentStatus,
            totalPrice: {
              amount: order.totalPriceSet.shopMoney.amount,
              currencyCode: order.totalPriceSet.shopMoney.currencyCode,
            },
            customer: order.customer,
            lineItems: order.lineItems,
            hasReviewableItems,
          };
        }),
        nextCursorString: data.orders.pageInfo.hasNextPage
          ? data.orders.pageInfo.endCursor
          : null,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch customer orders',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private checkIfOrderHasReviewableItems(order: any): boolean {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check if order has closedAt null or closedAt within 7 days
    if (order.closedAt === null) {
      return true;
    }

    if (order.closedAt) {
      const closedAtDate = new Date(order.closedAt);
      return closedAtDate >= sevenDaysAgo;
    }

    return false;
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<ShopifyCustomer | null> {
    const query = `
      query getCustomerByEmail($query: String!) {
        customers(first: 1, query: $query) {
          edges {
            node {
              id
              email
              firstName
              lastName
              phone
              createdAt
              updatedAt
              defaultAddress {
                address1
                address2
                city
                company
                country
                firstName
                lastName
                phone
                province
                zip
              }
            }
          }
        }
      }
    `;

    try {
      const response: any = await this.client.request(query, {
        variables: {
          query: `email:${email}`,
        },
      });

      const data = response.data;

      if (data.customers.edges.length === 0) {
        return null;
      }

      return data.customers.edges[0].node;
    } catch (error) {
      console.error('Error fetching customer by email:', error);
      return null;
    }
  }

  async createCustomer(customerData: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<{
    customer: ShopifyCustomer;
  }> {
    // First, check if customer already exists in Shopify
    const existingCustomer = await this.getCustomerByEmail(customerData.email);

    if (existingCustomer) {
      console.log(
        'Customer already exists in Shopify, returning existing customer'
      );
      return {
        customer: existingCustomer,
      };
    }

    // Customer doesn't exist, create new one
    const mutation = `
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
            firstName
            lastName
            phone
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const response: any = await this.client.request(mutation, {
        variables: {
          input: customerData,
        },
      });

      const data = response.data;

      if (data.customerCreate.userErrors.length > 0) {
        // If error is "email already taken", try to fetch the existing customer
        const emailError = data.customerCreate.userErrors.find(
          (err: any) =>
            err.field?.includes('email') &&
            err.message?.includes('already been taken')
        );

        if (emailError) {
          const existingCustomer = await this.getCustomerByEmail(
            customerData.email
          );
          if (existingCustomer) {
            return {
              customer: existingCustomer,
            };
          }
        }

        const errors = data.customerCreate.userErrors
          .map((err: any) => err.message)
          .join(', ');
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }

      const customer = data.customerCreate.customer;

      return {
        customer,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create customer',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getOrderById(orderId: string): Promise<ShopifyOrder> {
    const query = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          processedAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 50) {
            edges {
              node {
                title
                quantity
                variant {
                  id
                  title
                  image {
                    url
                  }
                  price
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response: any = await this.client.request({
        query,
        variables: {
          id: orderId,
        },
      });

      const data = response.data;

      if (!data.order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      // Transform Admin API response to match ShopifyOrder format
      return {
        id: data.order.id,
        orderNumber: parseInt(data.order.name.replace('#', '')),
        processedAt: data.order.processedAt,
        financialStatus: data.order.displayFinancialStatus,
        fulfillmentStatus: data.order.displayFulfillmentStatus,
        totalPrice: {
          amount: data.order.totalPriceSet.shopMoney.amount,
          currencyCode: data.order.totalPriceSet.shopMoney.currencyCode,
        },
        lineItems: data.order.lineItems,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch order',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Get product information by ID
   */
  async getProductById(productId: string): Promise<{
    id: string;
    title: string;
    featuredImage?: ShopifyImage;
  } | null> {
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          featuredImage {
            url
          }
        }
      }
    `;

    try {
      const response: any = await this.client.request(query, {
        variables: {
          id: productId,
        },
      });

      const data = response.data;

      if (!data.product) {
        return null;
      }

      return data.product;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  /**
   * Get product featured images by product IDs
   * Returns a map of product ID to image URL
   */
  async getProductImagesByIds(
    productIds: string[]
  ): Promise<Map<string, string>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const query = `
      query getProductImages($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            featuredImage {
              url
            }
          }
        }
      }
    `;

    try {
      const response: any = await this.client.request(query, {
        variables: {
          ids: productIds,
        },
      });

      const data = response.data;
      const imageUrlsMap = new Map<string, string>();

      if (data.nodes) {
        data.nodes.forEach((product: any) => {
          if (product && product.id && product.featuredImage?.url) {
            imageUrlsMap.set(product.id, product.featuredImage.url);
          }
        });
      }

      return imageUrlsMap;
    } catch (error) {
      console.error('Error fetching product images:', error);
      return new Map();
    }
  }

  /**
   * Update product metafield with average rating
   */
  async updateProductRatingMetafield(
    productId: string,
    averageRating: number,
    totalReviews: number
  ): Promise<void> {
    const mutation = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            metafields(first: 10) {
              edges {
                node {
                  namespace
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const response: any = await this.client.request(mutation, {
        variables: {
          input: {
            id: productId,
            metafields: [
              {
                namespace: 'custom',
                key: 'average_rating',
                value: averageRating.toFixed(2),
                type: 'number_decimal',
              },
              {
                namespace: 'custom',
                key: 'total_reviews',
                value: totalReviews.toString(),
                type: 'number_integer',
              },
            ],
          },
        },
      });

      const data = response.data;

      if (data.productUpdate.userErrors.length > 0) {
        const errors = data.productUpdate.userErrors
          .map((err: any) => err.message)
          .join(', ');
        throw new HttpException(
          `Failed to update product metafield: ${errors}`,
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update product metafield',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
