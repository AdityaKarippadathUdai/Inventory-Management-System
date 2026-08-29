import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionGuard } from './auth.guards.js';
import { RequirePermission } from './auth.decorators.js';
import { ConsumeReservationDto, CreateReservationDto, ReasonDto, ReservationListDto } from './reservation.dto.js';
import { ReservationsService } from './reservations.service.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiTags('Reservations') @ApiBearerAuth() @UseGuards(JwtAuthGuard, PermissionGuard) @Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}
  @Get() @RequirePermission('RESERVATION_VIEW') list(@Query() q: ReservationListDto, @Req() req: AuthenticatedRequest) { return this.reservations.list(q, req.user); }
  @Get('summary') @RequirePermission('RESERVATION_VIEW') summary(@Query('warehouseId') warehouseId: string | undefined, @Req() req: AuthenticatedRequest) { return this.reservations.summary(warehouseId, req.user); }
  @Get('active') @RequirePermission('RESERVATION_VIEW') active(@Req() req: AuthenticatedRequest) { return this.reservations.list({ status: 'ACTIVE' }, req.user); }
  @Get('expiring') @RequirePermission('RESERVATION_VIEW') expiring(@Req() req: AuthenticatedRequest) { return this.reservations.list({ status: 'ACTIVE' }, req.user); }
  @Get('warehouse/:warehouseId') @RequirePermission('RESERVATION_VIEW') warehouse(@Param('warehouseId') id: string, @Query() q: ReservationListDto, @Req() req: AuthenticatedRequest) { return this.reservations.list({ ...q, warehouseId: id }, req.user); }
  @Get('product/:productId') @RequirePermission('RESERVATION_VIEW') product(@Param('productId') id: string, @Query() q: ReservationListDto, @Req() req: AuthenticatedRequest) { return this.reservations.list({ ...q, productId: id }, req.user); }
  @Get(':id') @RequirePermission('RESERVATION_VIEW') get(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.reservations.get(id, req.user); }
  @Post() @RequirePermission('RESERVATION_CREATE') create(@Body() dto: CreateReservationDto, @Req() req: AuthenticatedRequest) { return this.reservations.createReservation(dto, req.user); }
  @Post(':id/activate') @RequirePermission('RESERVATION_MANAGE') activate(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.reservations.activate(id, req.user); }
  @Post(':id/consume') @RequirePermission('RESERVATION_CONSUME') consume(@Param('id') id: string, @Body() dto: ConsumeReservationDto, @Req() req: AuthenticatedRequest) { return this.reservations.consume(id, dto, req.user); }
  @Post(':id/release') @RequirePermission('RESERVATION_RELEASE') release(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.reservations.release(id, req.user); }
  @Post(':id/cancel') @RequirePermission('RESERVATION_CANCEL') cancel(@Param('id') id: string, @Body() dto: ReasonDto, @Req() req: AuthenticatedRequest) { return this.reservations.cancel(id, dto, req.user); }
}
