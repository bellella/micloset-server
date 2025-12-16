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
import {
  AuthenticateResult,
  CurrentUser,
  SocialProfile,
  SocialProvider,
} from '@/types/auth.type';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private shopifyService: ShopifyService
  ) {}

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
        firstName: profile.firstName,
        lastName: profile.lastName,
      });

      // Only create user in DB after successful Shopify customer creation
      user = await this.usersService.create({
        email,
        provider,
        firstName: profile.firstName,
        lastName: profile.lastName,
        shopifyCustomerId: shopifyResult.customer.id,
      });
    }
    const cookieUser: CurrentUser = {
      id: user.id,
      email: user.email,
      shopifyCustomerId: user.shopifyCustomerId,
    };

    return { user: cookieUser, isNewUser };
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

}
