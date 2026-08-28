import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto, StatusDto, UpdateProfileDto, UpdateUserDto } from './auth.dto.js';
import { JwtAuthGuard, PermissionGuard } from './auth.guards.js';
import { RequirePermission } from './auth.decorators.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiTags('Users') @ApiBearerAuth() @UseGuards(JwtAuthGuard, PermissionGuard) @Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() @RequirePermission('USER_VIEW') list(@Query() query: { search?: string; role?: string; isActive?: string; page?: number; limit?: number }) { return this.users.list(query); }
  @Get('me') me(@Req() request: AuthenticatedRequest) { return this.users.find(request.user.id); }
  @Patch('me') updateMe(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) { return this.users.updateProfile(request.user.id, dto); }
  @Get(':id') @RequirePermission('USER_VIEW') find(@Param('id') id: string) { return this.users.find(id); }
  @Post() @RequirePermission('USER_CREATE') create(@Body() dto: CreateUserDto) { return this.users.create(dto); }
  @Patch(':id') @RequirePermission('USER_UPDATE') update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.users.update(id, dto); }
  @Patch(':id/status') @RequirePermission('USER_UPDATE') status(@Param('id') id: string, @Body() dto: StatusDto) { return this.users.status(id, dto); }
  @Delete(':id') @RequirePermission('USER_DELETE') remove(@Param('id') id: string) { return this.users.remove(id); }
}
