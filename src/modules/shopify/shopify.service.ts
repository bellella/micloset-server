import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GraphQLClient, gql } from 'graphql-request';
import { ConfigService } from '@nestjs/config';
import {
  ShopifyCustomer,
  ShopifyCustomerAccessToken,
} from './dto/customer.dto';
import { CursorResponseDto } from '@/common/dto/curosr-response.dto';
import { ShopifyOrder } from './dto/order.dto';

@Injectable()
export class ShopifyService {
  private client: GraphQLClient;
  private readonly adminAccessToken: string;
  private readonly shopName: string;

  constructor(private configService: ConfigService) {
    this.adminAccessToken = this.configService.get<string>(
      'SHOPIFY_ADMIN_ACCESS_TOKEN',
      ''
    );
    this.shopName = this.configService.get<string>('SHOPIFY_SHOP_NAME', '');

    if (!this.adminAccessToken || !this.shopName) {
      throw new Error('Shopify Admin API configuration is missing');
    }

    // Admin API client only
    this.client = new GraphQLClient(
      `https://${this.shopName}.myshopify.com/admin/api/2024-10/graphql.json`,
      {
        headers: {
          'X-Shopify-Access-Token': this.adminAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  async getCustomer(customerAccessToken: string): Promise<ShopifyCustomer> {
    const query = gql`
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          email
          firstName
          lastName
          phone
          acceptsMarketing
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
      const data: any = await this.client.request(query, {
        customerAccessToken,
      });

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
    customerAccessToken: string,
    first: number = 10
  ): Promise<CursorResponseDto<ShopifyOrder>> {
    const query = gql`
      query getCustomerOrders($customerAccessToken: String!, $first: Int!) {
        customer(customerAccessToken: $customerAccessToken) {
          orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              cursor
              node {
                id
                orderNumber
                processedAt
                financialStatus
                fulfillmentStatus
                totalPrice {
                  amount
                  currencyCode
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
                        price {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data: any = await this.client.request(query, {
        customerAccessToken,
        first,
      });

      if (!data.customer) {
        throw new HttpException(
          'Customer not found or invalid access token',
          HttpStatus.NOT_FOUND
        );
      }

      return {
        items: data.customer.orders.edges.map((edge: any) => edge.node),
        nextCursor: data.customer.orders.edges.cursor,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch customer orders',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async updateCustomer(
    customerAccessToken: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      acceptsMarketing?: boolean;
    }
  ): Promise<ShopifyCustomer> {
    const mutation = gql`
      mutation customerUpdate(
        $customerAccessToken: String!
        $customer: CustomerUpdateInput!
      ) {
        customerUpdate(
          customerAccessToken: $customerAccessToken
          customer: $customer
        ) {
          customer {
            id
            email
            firstName
            lastName
            phone
            acceptsMarketing
            createdAt
            updatedAt
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    try {
      const data: any = await this.client.request(mutation, {
        customerAccessToken,
        customer: updateData,
      });

      if (data.customerUpdate.customerUserErrors.length > 0) {
        const errors = data.customerUpdate.customerUserErrors
          .map((err: any) => err.message)
          .join(', ');
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }

      return data.customerUpdate.customer;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update customer',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async createCustomer(customerData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    acceptsMarketing?: boolean;
  }): Promise<{
    customer: ShopifyCustomer;
    customerAccessToken: ShopifyCustomerAccessToken;
  }> {
    const mutation = gql`
      mutation customerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
            firstName
            lastName
            phone
            acceptsMarketing
            createdAt
            updatedAt
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    try {
      const data: any = await this.client.request(mutation, {
        input: customerData,
      });

      if (data.customerCreate.customerUserErrors.length > 0) {
        const errors = data.customerCreate.customerUserErrors
          .map((err: any) => err.message)
          .join(', ');
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }

      const customer = data.customerCreate.customer;

      // Create access token for the new customer
      const accessTokenResult = await this.createCustomerAccessToken(
        customerData.email,
        customerData.password
      );

      return {
        customer,
        customerAccessToken: accessTokenResult,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create customer',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async createCustomerAccessToken(
    email: string,
    password: string
  ): Promise<ShopifyCustomerAccessToken> {
    const mutation = gql`
      mutation customerAccessTokenCreate(
        $input: CustomerAccessTokenCreateInput!
      ) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    try {
      const data: any = await this.client.request(mutation, {
        input: {
          email,
          password,
        },
      });

      if (data.customerAccessTokenCreate.customerUserErrors.length > 0) {
        const errors = data.customerAccessTokenCreate.customerUserErrors
          .map((err: any) => err.message)
          .join(', ');
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }

      return data.customerAccessTokenCreate.customerAccessToken;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create customer access token',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async renewCustomerAccessToken(
    accessToken: string
  ): Promise<ShopifyCustomerAccessToken> {
    const mutation = gql`
      mutation customerAccessTokenRenew($customerAccessToken: String!) {
        customerAccessTokenRenew(customerAccessToken: $customerAccessToken) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const data: any = await this.client.request(mutation, {
        customerAccessToken: accessToken,
      });

      if (data.customerAccessTokenRenew.userErrors.length > 0) {
        const errors = data.customerAccessTokenRenew.userErrors
          .map((err: any) => err.message)
          .join(', ');
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }

      return data.customerAccessTokenRenew.customerAccessToken;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to renew customer access token',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getOrderById(orderId: string): Promise<ShopifyOrder> {
    const query = gql`
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
      const data: any = await this.client.request(query, {
        id: orderId,
      });

      if (!data.order) {
        throw new HttpException(
          'Order not found',
          HttpStatus.NOT_FOUND
        );
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

  isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return true;

    // Add 5 minute buffer before actual expiration
    const bufferMs = 5 * 60 * 1000;
    return new Date().getTime() + bufferMs >= new Date(expiresAt).getTime();
  }
}
