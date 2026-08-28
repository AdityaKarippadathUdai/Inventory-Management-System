import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from './prisma.service.js';
import { AuthenticatedUser } from './auth.types.js';
import { LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  private publicUser(user: { id: string; name: string; email: string; isActive: boolean; lastLoginAt: Date | null; createdAt: Date; role: { name: string; permissions: { permission: { name: string } }[] } }) {
    return { id: user.id, name: user.name, email: user.email, isActive: user.isActive, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt, role: user.role.name, permissions: user.role.permissions.map(({ permission }) => permission.name) };
  }

  private audit(userId: string | undefined, action: string, entityId: string) { return this.prisma.auditLog.create({ data: { userId, action, entity: 'AUTH', entityId } }); }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, dto.password))) throw new UnauthorizedException('Invalid email or password');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit(user.id, 'LOGIN_SUCCESS', user.id);
    const authUser: AuthenticatedUser = { id: user.id, email: user.email, role: user.role.name, permissions: user.role.permissions.map(({ permission }) => permission.name) };
    return { accessToken: await this.jwt.signAsync(authUser, this.accessTokenOptions()), refreshToken: await this.createRefreshToken(user.id), user: this.publicUser(user) };
  }

  private hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }

  private accessTokenOptions(): JwtSignOptions {
    return { secret: process.env.JWT_ACCESS_SECRET, expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as JwtSignOptions['expiresIn'] };
  }

  private async createRefreshToken(userId: string) {
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.duration(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'));
    await this.prisma.refreshToken.create({ data: { userId, tokenHash: this.hashToken(token), expiresAt } });
    return token;
  }

  private duration(value: string) { const match = /^(\d+)([smhd])$/.exec(value); if (!match) return 7 * 86400000; const units: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 }; return Number(match[1]) * units[match[2]]; }

  async refresh(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.hashToken(token) }, include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || !stored.user.isActive) throw new UnauthorizedException('Invalid refresh token');
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const authUser = { id: stored.user.id, email: stored.user.email, role: stored.user.role.name, permissions: stored.user.role.permissions.map(({ permission }) => permission.name) };
    return { accessToken: await this.jwt.signAsync(authUser, this.accessTokenOptions()), refreshToken: await this.createRefreshToken(stored.userId) };
  }

  async logout(token?: string) { if (token) await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } }); }

  async me(userId: string) { const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: { include: { permissions: { include: { permission: true } } } } } }); if (!user) throw new UnauthorizedException(); return this.publicUser(user); }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.currentPassword))) throw new BadRequestException('Current password is incorrect');
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(dto.password) } });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit(userId, 'PASSWORD_CHANGED', userId);
    return { message: 'Password changed successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (user) { const token = randomBytes(32).toString('base64url'); await this.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: this.hashToken(token), expiresAt: new Date(Date.now() + 3600000) } }); await this.audit(user.id, 'PASSWORD_RESET_REQUESTED', user.id); }
    return { message: 'If the account exists, password reset instructions will be sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: this.hashToken(dto.token) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw new BadRequestException('Invalid or expired reset token');
    await this.prisma.$transaction([this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await argon2.hash(dto.password) } }), this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }), this.prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } })]);
    await this.audit(record.userId, 'PASSWORD_RESET', record.userId);
    return { message: 'Password reset successfully' };
  }
}
