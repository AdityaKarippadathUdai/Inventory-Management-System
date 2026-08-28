import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionGuard } from './auth.guards.js';
import { RequirePermission } from './auth.decorators.js';
import { AdjustStockDto, InventoryListDto, ReceiveStockDto } from './inventory.dto.js';
import { InventoryService } from './inventory.service.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiTags('Inventory') @ApiBearerAuth() @UseGuards(JwtAuthGuard, PermissionGuard) @Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get() @RequirePermission('INVENTORY_VIEW') list(@Query() query: InventoryListDto, @Req() req: AuthenticatedRequest) { return this.inventory.list(query, req.user); }
  @Get('summary') @RequirePermission('INVENTORY_VIEW') summary(@Query('warehouseId') warehouseId: string | undefined, @Req() req: AuthenticatedRequest) { return this.inventory.summary(warehouseId, req.user); }
  @Get('low-stock') @RequirePermission('INVENTORY_VIEW') lowStock(@Query() query: InventoryListDto, @Req() req: AuthenticatedRequest) { return this.inventory.lowStock(query, req.user); }
  @Get('warehouse/:warehouseId') @RequirePermission('INVENTORY_VIEW') warehouse(@Param('warehouseId') id: string, @Query() query: InventoryListDto, @Req() req: AuthenticatedRequest) { return this.inventory.byWarehouse(id, query, req.user); }
  @Get('product/:productId') @RequirePermission('INVENTORY_VIEW') product(@Param('productId') id: string, @Query() query: InventoryListDto, @Req() req: AuthenticatedRequest) { return this.inventory.byProduct(id, query, req.user); }
  @Get(':id/history') @RequirePermission('INVENTORY_VIEW') history(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.inventory.history(id, req.user); }
  @Get(':id') @RequirePermission('INVENTORY_VIEW') get(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.inventory.get(id, req.user); }
  @Post('receive') @RequirePermission('INVENTORY_MANAGE') receive(@Body() dto: ReceiveStockDto, @Req() req: AuthenticatedRequest) { return this.inventory.receive(dto, req.user); }
  @Post('adjust') @RequirePermission('INVENTORY_MANAGE') adjust(@Body() dto: AdjustStockDto, @Req() req: AuthenticatedRequest) { return this.inventory.adjust(dto, req.user); }
}
