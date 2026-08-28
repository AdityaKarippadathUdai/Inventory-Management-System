import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionGuard } from './auth.guards.js';
import { RequirePermission } from './auth.decorators.js';
import { CreateTransferDto, ReceiveTransferDto, ReasonDto, TransferListDto } from './transfer.dto.js';
import { TransfersService } from './transfers.service.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiTags('Transfers') @ApiBearerAuth() @UseGuards(JwtAuthGuard, PermissionGuard) @Controller('transfers')
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}
  @Get() @RequirePermission('TRANSFER_VIEW') list(@Query() q: TransferListDto, @Req() req: AuthenticatedRequest) { return this.transfers.list(q, req.user); }
  @Get(':id') @RequirePermission('TRANSFER_VIEW') get(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.transfers.get(id, req.user); }
  @Post() @RequirePermission('TRANSFER_CREATE') create(@Body() dto: CreateTransferDto, @Req() req: AuthenticatedRequest) { return this.transfers.create(dto, req.user); }
  @Post(':id/submit') @RequirePermission('TRANSFER_CREATE') submit(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.transfers.submit(id, req.user); }
  @Post(':id/approve') @RequirePermission('TRANSFER_APPROVE') approve(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.transfers.approve(id, req.user); }
  @Post(':id/reject') @RequirePermission('TRANSFER_APPROVE') reject(@Param('id') id: string, @Body() dto: ReasonDto, @Req() req: AuthenticatedRequest) { return this.transfers.reject(id, dto, req.user); }
  @Post(':id/dispatch') @RequirePermission('TRANSFER_DISPATCH') dispatch(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.transfers.dispatch(id, req.user); }
  @Post(':id/receive') @RequirePermission('TRANSFER_RECEIVE') receive(@Param('id') id: string, @Body() dto: ReceiveTransferDto, @Req() req: AuthenticatedRequest) { return this.transfers.receive(id, dto, req.user); }
  @Post(':id/cancel') @RequirePermission('TRANSFER_CANCEL') cancel(@Param('id') id: string, @Body() dto: ReasonDto, @Req() req: AuthenticatedRequest) { return this.transfers.cancel(id, dto, req.user); }
}
