import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionGuard } from './auth.guards.js';
import { RequirePermission } from './auth.decorators.js';
import { ActiveStatus, CategoryDto, ListDto, ProductDto, ProductStatus, SupplierDto, WarehouseDto } from './master-data.dto.js';
import { MasterDataService } from './master-data.service.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiBearerAuth() @UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('Warehouses') @Controller('warehouses')
export class WarehousesController {
  constructor(private readonly service: MasterDataService) {}
  @Get() @RequirePermission('WAREHOUSE_VIEW') list(@Query() query: ListDto) { return this.service.warehouses(query); }
  @Get(':id') @RequirePermission('WAREHOUSE_VIEW') get(@Param('id') id: string) { return this.service.warehouse(id); }
  @Post() @RequirePermission('WAREHOUSE_CREATE') create(@Body() dto: WarehouseDto, @Req() req: AuthenticatedRequest) { return this.service.createWarehouse(dto, req.user); }
  @Patch(':id') @RequirePermission('WAREHOUSE_UPDATE') update(@Param('id') id: string, @Body() dto: Partial<WarehouseDto>, @Req() req: AuthenticatedRequest) { return this.service.updateWarehouse(id, dto, req.user); }
  @Delete(':id') @RequirePermission('WAREHOUSE_DELETE') remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.service.deleteWarehouse(id, req.user); }
  @Patch(':id/status') @RequirePermission('WAREHOUSE_UPDATE') status(@Param('id') id: string, @Body('status') status: ActiveStatus, @Req() req: AuthenticatedRequest) { return this.service.statusWarehouse(id, status, req.user); }
  @Patch(':id/manager') @RequirePermission('WAREHOUSE_UPDATE') manager(@Param('id') id: string, @Body('managerId') managerId: string | null, @Req() req: AuthenticatedRequest) { return this.service.assignManager(id, managerId, req.user); }
}

@ApiBearerAuth() @UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('Categories') @Controller('categories')
export class CategoriesController {
  constructor(private readonly service: MasterDataService) {}
  @Get() @RequirePermission('CATEGORY_VIEW') list(@Query() query: ListDto) { return this.service.categories(query); }
  @Get(':id') @RequirePermission('CATEGORY_VIEW') get(@Param('id') id: string) { return this.service.category(id); }
  @Post() @RequirePermission('CATEGORY_CREATE') create(@Body() dto: CategoryDto, @Req() req: AuthenticatedRequest) { return this.service.createCategory(dto, req.user); }
  @Patch(':id') @RequirePermission('CATEGORY_UPDATE') update(@Param('id') id: string, @Body() dto: CategoryDto, @Req() req: AuthenticatedRequest) { return this.service.updateCategory(id, dto, req.user); }
  @Delete(':id') @RequirePermission('CATEGORY_DELETE') remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.service.deleteCategory(id, req.user); }
  @Patch(':id/status') @RequirePermission('CATEGORY_UPDATE') status(@Param('id') id: string, @Body('status') status: ActiveStatus, @Req() req: AuthenticatedRequest) { return this.service.statusCategory(id, status, req.user); }
}

@ApiBearerAuth() @UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('Products') @Controller('products')
export class ProductsController {
  constructor(private readonly service: MasterDataService) {}
  @Get() @RequirePermission('PRODUCT_VIEW') list(@Query() query: ListDto & { categoryId?: string; brand?: string; sku?: string; barcode?: string }) { return this.service.products(query); }
  @Get(':id') @RequirePermission('PRODUCT_VIEW') get(@Param('id') id: string) { return this.service.product(id); }
  @Post() @RequirePermission('PRODUCT_CREATE') create(@Body() dto: ProductDto, @Req() req: AuthenticatedRequest) { return this.service.createProduct(dto, req.user); }
  @Patch(':id') @RequirePermission('PRODUCT_UPDATE') update(@Param('id') id: string, @Body() dto: Partial<ProductDto>, @Req() req: AuthenticatedRequest) { return this.service.updateProduct(id, dto, req.user); }
  @Delete(':id') @RequirePermission('PRODUCT_DELETE') remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.service.deleteProduct(id, req.user); }
  @Patch(':id/status') @RequirePermission('PRODUCT_UPDATE') status(@Param('id') id: string, @Body('status') status: ProductStatus, @Req() req: AuthenticatedRequest) { return this.service.statusProduct(id, status, req.user); }
}

@ApiBearerAuth() @UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('Suppliers') @Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: MasterDataService) {}
  @Get() @RequirePermission('SUPPLIER_VIEW') list(@Query() query: ListDto) { return this.service.suppliers(query); }
  @Get(':id') @RequirePermission('SUPPLIER_VIEW') get(@Param('id') id: string) { return this.service.supplier(id); }
  @Post() @RequirePermission('SUPPLIER_CREATE') create(@Body() dto: SupplierDto, @Req() req: AuthenticatedRequest) { return this.service.createSupplier(dto, req.user); }
  @Patch(':id') @RequirePermission('SUPPLIER_UPDATE') update(@Param('id') id: string, @Body() dto: Partial<SupplierDto>, @Req() req: AuthenticatedRequest) { return this.service.updateSupplier(id, dto, req.user); }
  @Delete(':id') @RequirePermission('SUPPLIER_DELETE') remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.service.deleteSupplier(id, req.user); }
  @Patch(':id/status') @RequirePermission('SUPPLIER_UPDATE') status(@Param('id') id: string, @Body('status') status: ActiveStatus, @Req() req: AuthenticatedRequest) { return this.service.statusSupplier(id, status, req.user); }
}
