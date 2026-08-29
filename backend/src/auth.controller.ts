import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto.js';
import { JwtAuthGuard } from './auth.guards.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  private setRefreshCookie(response: Response, token: string) { response.cookie('refresh_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth', maxAge: 7 * 86400000 }); }

  @Post('login') @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) { const result = await this.auth.login(dto); this.setRefreshCookie(response, result.refreshToken); return { success: true, data: { accessToken: result.accessToken, user: result.user } }; }

  @Post('register') @HttpCode(201)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) { const result = await this.auth.register(dto); this.setRefreshCookie(response, result.refreshToken); return { success: true, data: { accessToken: result.accessToken, user: result.user } }; }

  @Post('refresh') @HttpCode(200)
  async refresh(@Req() request: AuthenticatedRequest, @Body('refreshToken') bodyToken: string, @Res({ passthrough: true }) response: Response) { const result = await this.auth.refresh(request.cookies?.refresh_token ?? bodyToken); this.setRefreshCookie(response, result.refreshToken); return { success: true, data: { accessToken: result.accessToken } }; }

  @Post('logout') @HttpCode(204)
  async logout(@Req() request: AuthenticatedRequest, @Body('refreshToken') bodyToken: string, @Res({ passthrough: true }) response: Response) { await this.auth.logout(request.cookies?.refresh_token ?? bodyToken); response.clearCookie('refresh_token', { path: '/api/v1/auth' }); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Post('change-password')
  changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) { return this.auth.changePassword(request.user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get('me')
  me(@Req() request: AuthenticatedRequest) { return this.auth.me(request.user.id); }

  @Post('forgot-password') forgotPassword(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto); }
  @Post('reset-password') resetPassword(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto); }
}
