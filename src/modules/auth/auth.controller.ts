import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Body,
  Res,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { CurrentUser } from '@/types/auth.type';
import { AuthenticateResult, JwtTokens } from '@/types/auth.type';
import express from 'express';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import {
  LoginResponseDto,
  JwtTokensResponseDto,
} from './dto/auth-response.dto';
import { ReqUser } from '@/common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Handles local user login (ID and Password).
   * Uses LocalStrategy to validate credentials.
   * Sets JWTs in HTTP-Only cookies.
   */
  // @Post('local/login')
  // @UseGuards(AuthGuard('local'))
  // async localLogin(
  //   @Req() req,
  //   @Res({ passthrough: true }) res: express.Response
  // ) {
  //   const { user } = req.user as AuthUser;

  //   // Generate JWTs and store Refresh Token hash in DB.
  //   const { accessToken, refreshToken } = await this.authService.getTokens(
  //     user.id,
  //     user.email
  //   );

  //   this.setTokensInCookies(res, accessToken, refreshToken);

  //   return {
  //     message: 'Login successful.',
  //     userId: user.id,
  //   };
  // }
  /**
   * Handles local user registration (ID and Password).
   * @param localRegisterDto DTO containing user credentials.
   * @returns Success message upon registration.
   */
  // @Post('local/register')
  // async registerLocal(@Body() localRegisterDto: LocalRegisterDto) {
  //   // AuthService handles password hashing and database creation.
  //   const user = await this.authService.registerLocalUser(localRegisterDto);

  //   return {
  //     message: 'Registration successful.',
  //     userId: user.id,
  //   };
  // }

  /**
   * Handles Google login using an Access Token provided by the client.
   * Performs token verification and user upsert (find or create).
   * @param googleLoginDto - Defined to specify the request body. Not used directly in the method logic.
   * Sets JWTs in HTTP-Only cookies.
   */
  @Post('google/token')
  @UseGuards(AuthGuard('google-token'))
  @ApiResponse({
    status: 200,
    type: LoginResponseDto,
  })
  async googleTokenLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Req() req,
    @Res({ passthrough: true }) res: express.Response
  ) {
    const { user, isNewUser } = req.user as AuthenticateResult;

    const { accessToken, refreshToken } =
      await this.authService.getTokens(user);

    this.setTokensInCookies(res, accessToken, refreshToken);

    return {
      message: isNewUser
        ? 'Google registration successful and logged in.'
        : 'Google login successful.',
      userId: user.id,
      isNewUser: isNewUser,
    };
  }

  @Post('firebase/:provider')
  @UseGuards(AuthGuard('firebase-auth'))
  @ApiResponse({
    status: 200,
    description: 'Login successful. JWT tokens set in cookies.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid Firebase ID Token',
  })
  /**
   * @param provider - The social provider name.
   * @param firebaseLoginDto - Defined to specify the request body. Not used directly in the method logic.
   * Sets JWTs in HTTP-Only cookies.
   */
  async firebaseLogin(
    @Param('provider') provider: string,
    @Body() firebaseLoginDto: FirebaseLoginDto,
    @Req() req,
    @Res({ passthrough: true }) res: express.Response
  ) {
    const { user, isNewUser } = req.user as AuthenticateResult;

    const { accessToken, refreshToken } =
      await this.authService.getTokens(user);

    this.setTokensInCookies(res, accessToken, refreshToken);

    return {
      message: isNewUser
        ? `${provider} registration successful and logged in.`
        : `${provider} login successful.`,
      userId: user.id,
      isNewUser: isNewUser,
    };
  }

  /**
   * Refresh Token Endpoint
   * This endpoint requires JWT (Refresh Token) validation
   * Used when jwt is store on the client side
   */
  // @Get('jwt/refresh')
  // @UseGuards(AuthGuard('jwt-refresh'))
  // @ApiResponse({
  //   status: 200,
  //   description: 'New tokens generated successfully',
  //   type: JwtTokensResponseDto,
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Invalid or expired Refresh Token',
  // })
  // async refreshTokens(@Req() req): Promise<JwtTokens> {
  //   // req.user contains the decoded refresh token payload (id, email)
  //   const { id, email } = req.user;

  //   return this.authService.getTokens(id, email);
  // }


  /**
   * Logout endpoint
   * Clears the authentication cookie
   */
  @Post('logout')
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('access_token');
    return { message: 'Logout successful' };
  }

  /**
   * Sets the Access Token and Refresh Token in secure HTTP-Only cookies.
   */
  private setTokensInCookies(
    res: express.Response,
    accessToken: string,
    refreshToken: string
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';
    // Access Token (Short-lived, HTTP-Only)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12 * 2, // 2 days
    });
  }
}
