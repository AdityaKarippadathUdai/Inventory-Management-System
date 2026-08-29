import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard, PermissionGuard } from './auth.guards.js';
import { RequirePermission } from './auth.decorators.js';
import { StockCountsService } from './stock-counts.service.js';
import { ReconciliationsService } from './reconciliations.service.js';
import {
  CreateStockCountDto,
  StartStockCountDto,
  UpdateCountItemDto,
  SubmitStockCountDto,
  ReviewStockCountDto,
  ApproveStockCountDto,
  RejectStockCountDto,
  ReopenStockCountDto,
  CancelStockCountDto,
  ReconcileStockCountDto,
  ListStockCountsDto,
  ListVariancesDto,
  StockCountResponseDto,
  ReconciliationResponseDto,
} from './stock-counts.dto.js';

@Controller('api/v1/stock-counts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class StockCountsController {
  constructor(
    private stockCountsService: StockCountsService,
    private reconciliationsService: ReconciliationsService,
  ) {}

  /**
   * Create a new stock count
   */
  @Post()
  @RequirePermission('STOCK_COUNT_CREATE')
  async createStockCount(
    @Body() dto: CreateStockCountDto,
    @Request() req: any,
  ): Promise<StockCountResponseDto> {
    return this.stockCountsService.createStockCount(dto, req.user.id);
  }

  /**
   * Get all stock counts with pagination
   */
  @Get()
  @RequirePermission('STOCK_COUNT_VIEW')
  async listStockCounts(@Query() dto: ListStockCountsDto) {
    return this.stockCountsService.listStockCounts(dto);
  }

  /**
   * Get a specific stock count
   */
  @Get(':id')
  @RequirePermission('STOCK_COUNT_VIEW')
  async getStockCount(@Param('id') id: string): Promise<StockCountResponseDto> {
    return this.stockCountsService.getStockCount(id);
  }

  /**
   * Start a stock count (snapshot system quantities)
   */
  @Post(':id/start')
  @RequirePermission('STOCK_COUNT_EDIT')
  async startStockCount(
    @Param('id') id: string,
    @Body() dto: StartStockCountDto,
    @Request() req: any,
  ): Promise<StockCountResponseDto> {
    return this.stockCountsService.startStockCount(id, dto, req.user.id);
  }

  /**
   * Update a count item with counted quantity
   */
  @Patch(':id/items/:itemId')
  @RequirePermission('STOCK_COUNT_EDIT')
  async updateCountItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCountItemDto,
    @Request() req: any,
  ) {
    return this.stockCountsService.updateCountItem(id, itemId, dto, req.user.id);
  }

  /**
   * Submit stock count for review
   */
  @Post(':id/submit')
  @RequirePermission('STOCK_COUNT_EDIT')
  async submitStockCount(
    @Param('id') id: string,
    @Body() dto: SubmitStockCountDto,
    @Request() req: any,
  ): Promise<StockCountResponseDto> {
    return this.stockCountsService.submitStockCount(id, dto, req.user.id);
  }

  /**
   * Review stock count
   */
  @Post(':id/review')
  @RequirePermission('STOCK_COUNT_REVIEW')
  async reviewStockCount(
    @Param('id') id: string,
    @Body() dto: ReviewStockCountDto,
    @Request() req: any,
  ): Promise<StockCountResponseDto> {
    return this.stockCountsService.reviewStockCount(id, dto, req.user.id);
  }

  /**
   * Approve stock count
   */
  @Post(':id/approve')
  @RequirePermission('STOCK_COUNT_APPROVE')
  async approveStockCount(
    @Param('id') id: string,
    @Body() dto: ApproveStockCountDto,
    @Request() req: any,
  ): Promise<StockCountResponseDto> {
    return this.stockCountsService.approveStockCount(id, dto, req.user.id);
  }

  /**
   * Reject stock count
   */
  @Post(':id/reject')
  @RequirePermission('STOCK_COUNT_REVIEW')
  async rejectStockCount(
    @Param('id') id: string,
    @Body() dto: RejectStockCountDto,
    @Request() req: any,
  ): Promise<StockCountResponseDto> {
    return this.stockCountsService.rejectStockCount(id, dto, req.user.id);
  }

  /**
   * Reopen a rejected stock count
   */
  @Post(':id/reopen')
  @RequirePermission('STOCK_COUNT_EDIT')
  async reopenStockCount(
    @Param('id') id: string,
    @Body() dto: ReopenStockCountDto,
    @Request() req: any,
  ): Promise<StockCountResponseDto> {
    return this.stockCountsService.reopenStockCount(id, dto, req.user.id);
  }

  /**
   * Cancel a stock count
   */
  @Post(':id/cancel')
  @RequirePermission('STOCK_COUNT_CANCEL')
  @HttpCode(HttpStatus.OK)
  async cancelStockCount(
    @Param('id') id: string,
    @Body() dto: CancelStockCountDto,
    @Request() req: any,
  ): Promise<StockCountResponseDto> {
    return this.stockCountsService.cancelStockCount(id, dto, req.user.id);
  }

  /**
   * Get variance report with filters
   */
  @Get('report/variances')
  @RequirePermission('STOCK_COUNT_VIEW')
  async getVarianceReport(@Query() dto: ListVariancesDto) {
    return this.stockCountsService.getVarianceReport(dto);
  }

  /**
   * Get variance summary for warehouse
   */
  @Get('report/variance-summary')
  @RequirePermission('STOCK_COUNT_VIEW')
  async getVarianceSummary(@Query('warehouseId') warehouseId?: string) {
    return this.stockCountsService.getVarianceSummary(warehouseId);
  }

  /**
   * Get reconciliation preview for approved count
   */
  @Get(':id/reconciliation-preview')
  @RequirePermission('STOCK_COUNT_RECONCILE')
  async getReconciliationPreview(@Param('id') id: string) {
    return this.stockCountsService.getReconciliationPreview(id);
  }

  /**
   * Reconcile stock count - apply inventory adjustments
   */
  @Post(':id/reconcile')
  @RequirePermission('STOCK_COUNT_RECONCILE')
  async reconcileStockCount(
    @Param('id') id: string,
    @Body() dto: ReconcileStockCountDto,
    @Request() req: any,
  ): Promise<ReconciliationResponseDto> {
    // Create and execute reconciliation in one call
    const reconciliation = await this.reconciliationsService.createReconciliation(id, req.user.id);
    await this.reconciliationsService.approveReconciliation(reconciliation.id, req.user.id);
    return this.reconciliationsService.executeReconciliation(reconciliation.id, req.user.id);
  }
}

/**
 * Reconciliations Controller
 */
@Controller('api/v1/reconciliations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ReconciliationsController {
  constructor(private reconciliationsService: ReconciliationsService) {}

  /**
   * List reconciliations
   */
  @Get()
  @RequirePermission('RECONCILIATION_VIEW')
  async listReconciliations(
    @Query('warehouseId') warehouseId?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.reconciliationsService.listReconciliations(warehouseId, page, pageSize);
  }

  /**
   * Get a specific reconciliation
   */
  @Get(':id')
  @RequirePermission('RECONCILIATION_VIEW')
  async getReconciliation(@Param('id') id: string): Promise<ReconciliationResponseDto> {
    return this.reconciliationsService.getReconciliation(id);
  }

  /**
   * Create reconciliation for approved count
   */
  @Post(':countId/create')
  @RequirePermission('STOCK_COUNT_RECONCILE')
  async createReconciliation(
    @Param('countId') countId: string,
    @Request() req: any,
  ): Promise<ReconciliationResponseDto> {
    return this.reconciliationsService.createReconciliation(countId, req.user.id);
  }

  /**
   * Approve reconciliation
   */
  @Post(':id/approve')
  @RequirePermission('STOCK_COUNT_RECONCILE')
  async approveReconciliation(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ReconciliationResponseDto> {
    return this.reconciliationsService.approveReconciliation(id, req.user.id);
  }

  /**
   * Execute reconciliation - apply inventory adjustments
   */
  @Post(':id/execute')
  @RequirePermission('RECONCILIATION_EXECUTE')
  @HttpCode(HttpStatus.OK)
  async executeReconciliation(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ReconciliationResponseDto> {
    return this.reconciliationsService.executeReconciliation(id, req.user.id);
  }
}
