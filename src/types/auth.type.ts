import { User } from '@/generated/prisma';

/**
 * User in request object after validation
 */
export type CurrentUser = Pick<User, 'id' | 'email' | 'shopifyCustomerId'>;

/**
 * Result structure returned by local and social login.
 */
export interface AuthenticateResult {
  user: CurrentUser;
  isNewUser: boolean;
}

export type JwtTokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * social login providers. local is the method using Id and Password.
 */
export type SocialProvider = 'local' | 'google' | 'apple' | 'kakao';

/**
 * Social user profile received from social provider.
 */
export interface SocialProfile {
  email: string;
  providerId: string;
  firstName?: string;
  lastName?: string;
}
