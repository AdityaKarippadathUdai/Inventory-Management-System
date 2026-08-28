import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from './prisma.service.js';
import { CreateUserDto, StatusDto, UpdateProfileDto, UpdateUserDto } from './auth.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  private include = { role: { include: { permissions: { include: { permission: true } } } } } as const;
  private publicUser(user: { id: string; name: string; email: string; isActive: boolean; lastLoginAt: Date | null; createdAt: Date; role: { name: string; permissions: { permission: { name: string } }[] } }) { return { id: user.id, name: user.name, email: user.email, isActive: user.isActive, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt, role: user.role.name, permissions: user.role.permissions.map(({ permission }) => permission.name) }; }
  private audit(userId: string, action: string, entityId: string) { return this.prisma.auditLog.create({ data: { userId, action, entity: 'USER', entityId } }); }

  async list(query: { search?: string; role?: string; isActive?: string; page?: number; limit?: number }) { const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 20)); const where = { ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { email: { contains: query.search, mode: 'insensitive' as const } }] } : {}), ...(query.role ? { role: { name: query.role } } : {}), ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}) }; const [users, total] = await Promise.all([this.prisma.user.findMany({ where, include: this.include, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.prisma.user.count({ where })]); return { data: users.map((user) => this.publicUser(user)), meta: { page, limit, total, pages: Math.ceil(total / limit) } }; }
  async find(id: string) { const user = await this.prisma.user.findUnique({ where: { id }, include: this.include }); if (!user) throw new NotFoundException('User not found'); return this.publicUser(user); }
  async create(dto: CreateUserDto) { const role = await this.prisma.role.findUnique({ where: { name: dto.role } }); if (!role) throw new NotFoundException('Role not found'); try { const user = await this.prisma.user.create({ data: { name: dto.name, email: dto.email.toLowerCase(), passwordHash: await argon2.hash(dto.password), roleId: role.id }, include: this.include }); await this.audit(user.id, 'USER_CREATED', user.id); return this.publicUser(user); } catch { throw new ConflictException('Email is already in use'); } }
  async update(id: string, dto: UpdateUserDto) { const role = dto.role ? await this.prisma.role.findUnique({ where: { name: dto.role } }) : null; if (dto.role && !role) throw new NotFoundException('Role not found'); try { const user = await this.prisma.user.update({ where: { id }, data: { name: dto.name, email: dto.email?.toLowerCase(), isActive: dto.isActive, ...(role ? { roleId: role.id } : {}) }, include: this.include }); await this.audit(user.id, dto.role ? 'ROLE_CHANGED' : 'USER_UPDATED', user.id); if (dto.isActive === false) await this.audit(user.id, 'USER_DEACTIVATED', user.id); return this.publicUser(user); } catch { throw new NotFoundException('User not found'); } }
  async status(id: string, dto: StatusDto) { return this.update(id, { isActive: dto.isActive }); }
  async remove(id: string) { await this.prisma.user.update({ where: { id }, data: { isActive: false } }); return { message: 'User deactivated' }; }
  async updateProfile(id: string, dto: UpdateProfileDto) { return this.update(id, { name: dto.name }); }
}
