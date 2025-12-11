import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ShopifyService } from '../shopify/shopify.service';
import { JwtPayload } from '@/types/jwt.type';
import { LocalRegisterDto } from './dto/local-auth.dto';
import { User } from '@/generated/prisma';
import * as crypto from 'crypto';
import {
  AuthenticateResult,
  CurrentUser,
  SocialProfile,
  SocialProvider,
} from '@/types/auth.type';

@Injectable()
export class AuthService {
  private readonly ENCRYPTION_KEY: Buffer;
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-cbc';

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private shopifyService: ShopifyService
  ) {
    // Use JWT_SECRET as base for encryption key (32 bytes for aes-256)
    const secret = this.configService.get<string>('JWT_SECRET') || '';
    this.ENCRYPTION_KEY = crypto
      .createHash('sha256')
      .update(secret)
      .digest();
  }

  /**
   * Registers a new user with email and password.
   */
  // async registerLocalUser(localRegisterDto: LocalRegisterDto): Promise<User> {
  //   const existingUser = await this.usersService.findOneByEmail(
  //     localRegisterDto.email
  //   );
  //   if (existingUser) {
  //     throw new UnauthorizedException('User with this email already exists.');
  //   }

  //   // Hash the password before storage
  //   const hashedPassword = await bcrypt.hash(localRegisterDto.password, 10);

  //   // Call UsersService to create the user
  //   return this.usersService.create({
  //     ...localRegisterDto,
  //     password: hashedPassword,
  //     provider: 'local',
  //   });
  // }

  /**
   * Validates local user credentials (used by LocalStrategy).
   * @returns The User entity if credentials are valid, otherwise null.
   */
  // async validateLocalUser(email: string, pass: string): Promise<User | null> {
  //   const user = await this.usersService.findOneByEmail(email);

  //   if (!user || !user.password) {
  //     return null;
  //   }

  //   const isMatch = await bcrypt.compare(pass, user.password);

  //   if (isMatch) {
  //     // Credentials are valid
  //     return user;
  //   }
  //   return null;
  // }

  /**
   * Finds or creates a user based on the social profile.
   * Creates Shopify customer account for new users and returns the user with isNewUser flag.
   */
  async authenticateSocialUser(
    profile: SocialProfile,
    provider: SocialProvider
  ): Promise<AuthenticateResult> {
    const email = profile.email;
    let user = await this.usersService.findOneByEmail(email, provider);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;

      // Use fixed password from environment variable for all Shopify accounts
      const shopifyPassword =
        this.configService.get<string>('SHOPIFY_CUSTOMER_PASSWORD') || '';

      if (!shopifyPassword) {
        throw new HttpException(
          'SHOPIFY_CUSTOMER_PASSWORD is not configured',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Create Shopify customer first - if this fails, don't create user in DB
      const shopifyResult = await this.shopifyService.createCustomer({
        email,
        password: shopifyPassword,
        firstName: profile.firstName,
        lastName: profile.lastName,
      });

      console.log(shopifyResult, '!!!');

      // Only create user in DB after successful Shopify customer creation
      user = await this.usersService.create({
        email,
        provider,
        firstName: profile.firstName,
        lastName: profile.lastName,
        shopifyCustomerId: shopifyResult.customer.id,
        shopifyAccessToken: shopifyResult.customerAccessToken.accessToken,
        shopifyAccessTokenExpiresAt: new Date(
          shopifyResult.customerAccessToken.expiresAt
        ),
        shopifyPasswordHash: this.encryptPassword(shopifyPassword),
      });
    }
    const cookieUser: CurrentUser = {
      id: user.id,
      email: user.email,
      shopifyCustomerId: user.shopifyCustomerId,
      shopifyAccessToken: user.shopifyAccessToken,
      shopifyAccessTokenExpiresAt: user.shopifyAccessTokenExpiresAt,
    };

    return { user: cookieUser, isNewUser };
  }

  /**
   * Encrypts password using AES-256-CBC for secure storage
   */
  private encryptPassword(password: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.ENCRYPTION_ALGORITHM,
      this.ENCRYPTION_KEY,
      iv
    );
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypts password from encrypted string
   */
  private decryptPassword(encryptedPassword: string): string {
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      this.ENCRYPTION_ALGORITHM,
      this.ENCRYPTION_KEY,
      iv
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generates Access Token and Refresh Token for the user.
   */
  async getTokens(currentUser: CurrentUser) {
    // Generate Access Token (short lived)
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(currentUser, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '3d',
      }),
      // Generate Refresh Token (long lived)
      this.jwtService.signAsync(currentUser, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Refreshes Shopify access token for a user
   */
  async refreshShopifyToken(
    userId: number
  ): Promise<{ accessToken: string; expiresAt: string }> {
    // Get current token info
    const { accessToken, expiresAt } =
      await this.usersService.getShopifyToken(userId);

    if (!accessToken) {
      throw new HttpException(
        'No Shopify token found for this user',
        HttpStatus.NOT_FOUND
      );
    }

    // Check if token is expired or about to expire
    const isExpired = this.shopifyService.isTokenExpired(expiresAt);

    if (!isExpired) {
      // Token is still valid, no need to refresh
      return {
        accessToken,
        expiresAt: expiresAt!.toISOString(),
      };
    }

    // Token is expired, try to renew it
    try {
      const newToken =
        await this.shopifyService.renewCustomerAccessToken(accessToken);

      // Update user's token in database
      await this.usersService.updateShopifyToken(
        userId,
        newToken.accessToken,
        newToken.expiresAt
      );

      return {
        accessToken: newToken.accessToken,
        expiresAt: newToken.expiresAt,
      };
    } catch (renewError) {
      // Token renewal failed, try to create new token using stored password
      console.log(
        'Token renewal failed, attempting re-authentication with stored password'
      );

      const { email, passwordHash } =
        await this.usersService.getShopifyCredentials(userId);

      if (!email || !passwordHash) {
        throw new HttpException(
          'Failed to refresh Shopify token. No stored credentials available. User needs to re-authenticate.',
          HttpStatus.UNAUTHORIZED
        );
      }

      try {
        // Decrypt the stored password and create new access token
        const password = this.decryptPassword(passwordHash);
        const newToken = await this.shopifyService.createCustomerAccessToken(
          email,
          password
        );

        // Update user's token in database
        await this.usersService.updateShopifyToken(
          userId,
          newToken.accessToken,
          newToken.expiresAt
        );

        return {
          accessToken: newToken.accessToken,
          expiresAt: newToken.expiresAt,
        };
      } catch (authError) {
        console.error('Failed to re-authenticate with stored password:', authError);
        throw new HttpException(
          'Failed to refresh Shopify token. User needs to re-authenticate via social login.',
          HttpStatus.UNAUTHORIZED
        );
      }
    }
  }

  /**
   * Gets valid Shopify token for a user, refreshing if necessary
   */
  async getValidShopifyToken(userId: number): Promise<string> {
    const { accessToken } = await this.refreshShopifyToken(userId);
    return accessToken;
  }
}
