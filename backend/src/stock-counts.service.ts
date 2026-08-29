import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
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
  StockCountResponseDto,
  StockCountItemResponseDto,
  VarianceReportItemDto,
  VarianceSummaryDto,
  ListStockCountsDto,
  ListVariancesDto,
  VarianceSeverity,
  ReconciliationPreviewDto,
} from './stock-counts.dto.js';
import {
  STOCK_COUNT_STATUSES,
  STOCK_COUNT_TYPES,
  VARIANCE_SEVERITY,
  VARIANCE_THRESHOLDS,
  VALID_TRANSITIONS,
} from './stock-counts.constants.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class StockCountsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate variance severity based on percentage
   */
  private calculateSeverity(variancePercentage: number): string {
    const absVariance = Math.abs(variancePercentage);

    if (absVariance <= VARIANCE_THRESHOLDS.NONE_MAX) return VARIANCE_SEVERITY.NONE;
    if (absVariance <= VARIANCE_THRESHOLDS.LOW_MAX) return VARIANCE_SEVERITY.LOW;
    if (absVariance <= VARIANCE_THRESHOLDS.MEDIUM_MAX) return VARIANCE_SEVERITY.MEDIUM;
    if (absVariance <= VARIANCE_THRESHOLDS.HIGH_MAX) return VARIANCE_SEVERITY.HIGH;
    return VARIANCE_SEVERITY.CRITICAL;
  }

  /**
   * Calculate variance and percentage safely
   */
  private calculateVariance(
    systemQuantity: number,
    countedQuantity: number,
  ): { varianceQuantity: number; variancePercentage: number } {
    const varianceQuantity = countedQuantity - systemQuantity;

    let variancePercentage = 0;
    if (systemQuantity > 0) {
      variancePercentage = (varianceQuantity / systemQuantity) * 100;
    } else if (systemQuantity === 0 && countedQuantity > 0) {
      // If system has 0 but counted has items, mark as high variance
      variancePercentage = 100;
    }

    return {
      varianceQuantity,
      variancePercentage: Math.round(variancePercentage * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Validate status transition
   */
  private validateTransition(currentStatus: string, newStatus: string): void {
    const allowedTransitions = (VALID_TRANSITIONS as any)[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Generate unique count number
   */
  private async generateCountNumber(): Promise<string> {
    const lastCount = await this.prisma.stockCount.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { countNumber: true },
    });

    let nextNumber = 1;
    if (lastCount && lastCount.countNumber.startsWith('COUNT-')) {
      const lastNum = parseInt(lastCount.countNumber.substring(6));
      nextNumber = lastNum + 1;
    }

    return `COUNT-${String(nextNumber).padStart(6, '0')}`;
  }

  /**
   * Create a new stock count
   */
  async createStockCount(
    dto: CreateStockCountDto,
    userId: string,
  ): Promise<StockCountResponseDto> {
    // Validate warehouse
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    if (warehouse.status !== 'ACTIVE' || !warehouse.isActive) {
      throw new BadRequestException('Warehouse is not active');
    }

    // Validate products if provided
    let productsToCount: string[] = dto.productIds || [];

    if (dto.countType === STOCK_COUNT_TYPES.FULL) {
      // For FULL count, get all active products in warehouse
      const inventoryItems = await this.prisma.inventory.findMany({
        where: {
          warehouseId: dto.warehouseId,
          product: { isActive: true, status: 'ACTIVE' },
        },
        select: { productId: true },
        distinct: ['productId'],
      });
      productsToCount = inventoryItems.map((item) => item.productId);
    } else if (dto.countType === STOCK_COUNT_TYPES.PARTIAL) {
      // Validate provided products exist
      if (!dto.productIds || dto.productIds.length === 0) {
        throw new BadRequestException('PARTIAL count requires at least one product');
      }

      const products = await this.prisma.product.findMany({
        where: {
          id: { in: dto.productIds },
        },
      });

      if (products.length !== dto.productIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      // Check for duplicates
      if (new Set(dto.productIds).size !== dto.productIds.length) {
        throw new BadRequestException('Duplicate products provided');
      }

      // Validate all products are active
      const inactiveProducts = products.filter((p) => !p.isActive || p.status !== 'ACTIVE');
      if (inactiveProducts.length > 0) {
        throw new BadRequestException('One or more products are not active');
      }

      productsToCount = dto.productIds;
    } else if (dto.countType === STOCK_COUNT_TYPES.CYCLE) {
      // Similar to PARTIAL - requires product selection
      if (!dto.productIds || dto.productIds.length === 0) {
        throw new BadRequestException('CYCLE count requires at least one product');
      }

      const products = await this.prisma.product.findMany({
        where: { id: { in: dto.productIds } },
      });

      if (products.length !== dto.productIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      if (new Set(dto.productIds).size !== dto.productIds.length) {
        throw new BadRequestException('Duplicate products provided');
      }

      productsToCount = dto.productIds;
    } else if (dto.countType === STOCK_COUNT_TYPES.SPOT_CHECK) {
      // Small verification count
      if (!dto.productIds || dto.productIds.length === 0) {
        throw new BadRequestException('SPOT_CHECK requires at least one product');
      }

      const products = await this.prisma.product.findMany({
        where: { id: { in: dto.productIds } },
      });

      if (products.length !== dto.productIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      productsToCount = dto.productIds;
    }

    if (productsToCount.length === 0) {
      throw new BadRequestException('No products to count');
    }

    // Generate count number and create in transaction
    const countNumber = await this.generateCountNumber();

    const stockCount = await this.prisma.$transaction(async (tx) => {
      // Create stock count
      const count = await tx.stockCount.create({
        data: {
          countNumber,
          warehouseId: dto.warehouseId,
          countType: dto.countType,
          status: STOCK_COUNT_STATUSES.DRAFT,
          createdById: userId,
          notes: dto.notes,
        },
        include: {
          warehouse: true,
          createdBy: true,
        },
      });

      // Create items for each product
      await tx.stockCountItem.createMany({
        data: productsToCount.map((productId) => ({
          stockCountId: count.id,
          productId,
          systemQuantity: 0, // Will be set when count is started
          countedQuantity: null,
        })),
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_CREATED',
          entity: 'STOCK_COUNT',
          entityId: count.id,
          details: {
            countNumber: count.countNumber,
            warehouseId: count.warehouseId,
            countType: count.countType,
            itemCount: productsToCount.length,
          },
        },
      });

      return count;
    });

    return this.mapStockCountToResponse(stockCount);
  }

  /**
   * Get stock count by ID
   */
  async getStockCount(id: string): Promise<StockCountResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id },
      include: {
        warehouse: true,
        createdBy: true,
        reviewedBy: true,
        approvedBy: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    return this.mapStockCountToResponse(count);
  }

  /**
   * List stock counts with pagination and filters
   */
  async listStockCounts(
    dto: ListStockCountsDto,
  ): Promise<{ data: StockCountResponseDto[]; total: number; page: number; pageSize: number }> {
    const where: Prisma.StockCountWhereInput = {};

    if (dto.warehouseId) {
      where.warehouseId = dto.warehouseId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.countType) {
      where.countType = dto.countType;
    }

    if (dto.dateFrom || dto.dateTo) {
      where.createdAt = {};
      if (dto.dateFrom) {
        where.createdAt.gte = new Date(dto.dateFrom);
      }
      if (dto.dateTo) {
        where.createdAt.lte = new Date(dto.dateTo);
      }
    }

    if (dto.search) {
      where.OR = [
        { countNumber: { contains: dto.search, mode: 'insensitive' } },
        { warehouse: { name: { contains: dto.search, mode: 'insensitive' } } },
      ];
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const [counts, total] = await Promise.all([
      this.prisma.stockCount.findMany({
        where,
        include: {
          warehouse: true,
          createdBy: true,
          reviewedBy: true,
          approvedBy: true,
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.stockCount.count({ where }),
    ]);

    return {
      data: counts.map((count) => this.mapStockCountToResponse(count)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Start a stock count - snapshot system quantities
   */
  async startStockCount(
    id: string,
    dto: StartStockCountDto,
    userId: string,
  ): Promise<StockCountResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { items: true, warehouse: true, createdBy: true },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    this.validateTransition(count.status, STOCK_COUNT_STATUSES.IN_PROGRESS);

    // Snapshot system quantities from inventory
    const result = await this.prisma.$transaction(async (tx) => {
      const items = await tx.stockCountItem.findMany({
        where: { stockCountId: id },
        include: { product: true },
      });

      // Get current inventory for each product
      const inventoryData = await tx.inventory.findMany({
        where: {
          warehouseId: count.warehouseId,
          productId: { in: items.map((i) => i.productId) },
        },
      });

      const inventoryMap = new Map(inventoryData.map((inv) => [inv.productId, inv]));

      // Update items with current system quantities
      for (const item of items) {
        const inventory = inventoryMap.get(item.productId);
        const systemQuantity = inventory?.quantityOnHand || 0;

        await tx.stockCountItem.update({
          where: { id: item.id },
          data: { systemQuantity },
        });
      }

      // Update count status
      const updated = await tx.stockCount.update({
        where: { id },
        data: {
          status: STOCK_COUNT_STATUSES.IN_PROGRESS,
          startedAt: new Date(),
          notes: dto.notes || count.notes,
        },
        include: {
          warehouse: true,
          createdBy: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_STARTED',
          entity: 'STOCK_COUNT',
          entityId: id,
          details: {
            countNumber: count.countNumber,
            warehouseId: count.warehouseId,
            itemCount: items.length,
          },
        },
      });

      return updated;
    });

    return this.mapStockCountToResponse(result);
  }

  /**
   * Update a count item with counted quantity
   */
  async updateCountItem(
    countId: string,
    itemId: string,
    dto: UpdateCountItemDto,
    userId: string,
  ): Promise<StockCountItemResponseDto> {
    const item = await this.prisma.stockCountItem.findUnique({
      where: { id: itemId },
      include: { stockCount: true, product: true },
    });

    if (!item) {
      throw new NotFoundException('Stock count item not found');
    }

    if (item.stockCountId !== countId) {
      throw new BadRequestException('Item does not belong to this stock count');
    }

    if (item.stockCount.status !== STOCK_COUNT_STATUSES.IN_PROGRESS) {
      throw new BadRequestException('Stock count is not in progress');
    }

    if (dto.countedQuantity < 0) {
      throw new BadRequestException('Counted quantity cannot be negative');
    }

    // Calculate variance
    const { varianceQuantity, variancePercentage } = this.calculateVariance(
      item.systemQuantity,
      dto.countedQuantity,
    );

    const severity = this.calculateSeverity(variancePercentage);

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.stockCountItem.update({
        where: { id: itemId },
        data: {
          countedQuantity: dto.countedQuantity,
          varianceQuantity,
          variancePercentage,
          severity,
          notes: dto.notes,
          countedAt: new Date(),
        },
        include: { product: true },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_ITEM_UPDATED',
          entity: 'STOCK_COUNT_ITEM',
          entityId: itemId,
          details: {
            stockCountId: countId,
            productId: item.productId,
            systemQuantity: item.systemQuantity,
            countedQuantity: dto.countedQuantity,
            varianceQuantity,
            variancePercentage,
            severity,
          },
        },
      });

      return updatedItem;
    });

    return this.mapItemToResponse(updated);
  }

  /**
   * Submit stock count for review
   */
  async submitStockCount(
    id: string,
    dto: SubmitStockCountDto,
    userId: string,
  ): Promise<StockCountResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { items: true, warehouse: true, createdBy: true },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    this.validateTransition(count.status, STOCK_COUNT_STATUSES.SUBMITTED);

    // Validate all items have counted quantities
    const incompletItems = count.items.filter((item) => item.countedQuantity === null);
    if (incompletItems.length > 0) {
      throw new BadRequestException(
        `${incompletItems.length} item(s) do not have counted quantities`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockCount.update({
        where: { id },
        data: {
          status: STOCK_COUNT_STATUSES.SUBMITTED,
          submittedAt: new Date(),
          notes: dto.notes || count.notes,
        },
        include: {
          warehouse: true,
          createdBy: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_SUBMITTED',
          entity: 'STOCK_COUNT',
          entityId: id,
          details: {
            countNumber: count.countNumber,
            warehouseId: count.warehouseId,
          },
        },
      });

      return updated;
    });

    return this.mapStockCountToResponse(result);
  }

  /**
   * Review stock count
   */
  async reviewStockCount(
    id: string,
    dto: ReviewStockCountDto,
    userId: string,
  ): Promise<StockCountResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { warehouse: true, createdBy: true },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    this.validateTransition(count.status, STOCK_COUNT_STATUSES.UNDER_REVIEW);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockCount.update({
        where: { id },
        data: {
          status: STOCK_COUNT_STATUSES.UNDER_REVIEW,
          reviewedAt: new Date(),
          reviewedById: userId,
          notes: dto.notes || count.notes,
        },
        include: {
          warehouse: true,
          createdBy: true,
          reviewedBy: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_REVIEWED',
          entity: 'STOCK_COUNT',
          entityId: id,
          details: {
            countNumber: count.countNumber,
            warehouseId: count.warehouseId,
          },
        },
      });

      return updated;
    });

    return this.mapStockCountToResponse(result);
  }

  /**
   * Approve stock count
   */
  async approveStockCount(
    id: string,
    dto: ApproveStockCountDto,
    userId: string,
  ): Promise<StockCountResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { warehouse: true, createdBy: true, reviewedBy: true },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    this.validateTransition(count.status, STOCK_COUNT_STATUSES.APPROVED);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockCount.update({
        where: { id },
        data: {
          status: STOCK_COUNT_STATUSES.APPROVED,
          approvedAt: new Date(),
          approvedById: userId,
          notes: dto.notes || count.notes,
        },
        include: {
          warehouse: true,
          createdBy: true,
          reviewedBy: true,
          approvedBy: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_APPROVED',
          entity: 'STOCK_COUNT',
          entityId: id,
          details: {
            countNumber: count.countNumber,
            warehouseId: count.warehouseId,
          },
        },
      });

      return updated;
    });

    return this.mapStockCountToResponse(result);
  }

  /**
   * Reject stock count
   */
  async rejectStockCount(
    id: string,
    dto: RejectStockCountDto,
    userId: string,
  ): Promise<StockCountResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { warehouse: true, createdBy: true, reviewedBy: true },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    this.validateTransition(count.status, STOCK_COUNT_STATUSES.REJECTED);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockCount.update({
        where: { id },
        data: {
          status: STOCK_COUNT_STATUSES.REJECTED,
          reviewedAt: new Date(),
          reviewedById: userId,
          rejectionReason: dto.reason,
          notes: dto.notes || count.notes,
        },
        include: {
          warehouse: true,
          createdBy: true,
          reviewedBy: true,
          approvedBy: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_REJECTED',
          entity: 'STOCK_COUNT',
          entityId: id,
          details: {
            countNumber: count.countNumber,
            warehouseId: count.warehouseId,
            reason: dto.reason,
          },
        },
      });

      return updated;
    });

    return this.mapStockCountToResponse(result);
  }

  /**
   * Reopen a rejected stock count
   */
  async reopenStockCount(
    id: string,
    dto: ReopenStockCountDto,
    userId: string,
  ): Promise<StockCountResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { warehouse: true, createdBy: true },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    this.validateTransition(count.status, STOCK_COUNT_STATUSES.IN_PROGRESS);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockCount.update({
        where: { id },
        data: {
          status: STOCK_COUNT_STATUSES.IN_PROGRESS,
          notes: dto.notes || count.notes,
        },
        include: {
          warehouse: true,
          createdBy: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_REOPENED',
          entity: 'STOCK_COUNT',
          entityId: id,
          details: {
            countNumber: count.countNumber,
            warehouseId: count.warehouseId,
          },
        },
      });

      return updated;
    });

    return this.mapStockCountToResponse(result);
  }

  /**
   * Cancel a stock count
   */
  async cancelStockCount(
    id: string,
    dto: CancelStockCountDto,
    userId: string,
  ): Promise<StockCountResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { warehouse: true, createdBy: true },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    // Can cancel from DRAFT, IN_PROGRESS, or SUBMITTED
    if (
      ![
        STOCK_COUNT_STATUSES.DRAFT,
        STOCK_COUNT_STATUSES.IN_PROGRESS,
        STOCK_COUNT_STATUSES.SUBMITTED,
      ].includes(count.status as any)
    ) {
      throw new BadRequestException('Stock count cannot be cancelled in its current state');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockCount.update({
        where: { id },
        data: {
          status: STOCK_COUNT_STATUSES.CANCELLED,
          notes: `Cancelled: ${dto.reason || 'No reason provided'}\n${count.notes || ''}`,
        },
        include: {
          warehouse: true,
          createdBy: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_COUNT_CANCELLED',
          entity: 'STOCK_COUNT',
          entityId: id,
          details: {
            countNumber: count.countNumber,
            warehouseId: count.warehouseId,
            reason: dto.reason,
          },
        },
      });

      return updated;
    });

    return this.mapStockCountToResponse(result);
  }

  /**
   * Get variance report with filters
   */
  async getVarianceReport(
    dto: ListVariancesDto,
  ): Promise<{ data: VarianceReportItemDto[]; total: number; page: number; pageSize: number }> {
    const where: Prisma.StockCountItemWhereInput = {};

    if (dto.warehouseId) {
      where.stockCount = { warehouseId: dto.warehouseId };
    }

    if (dto.productId) {
      where.productId = dto.productId;
    }

    if (dto.severity) {
      where.severity = dto.severity;
    }

    if (dto.countType) {
      where.stockCount = { ...(where.stockCount as any), countType: dto.countType };
    }

    if (dto.status) {
      where.stockCount = { ...(where.stockCount as any), status: dto.status };
    }

    if (dto.dateFrom || dto.dateTo) {
      where.stockCount = {
        ...(where.stockCount as any),
        createdAt: {},
      };
      if (dto.dateFrom) {
        (where.stockCount as any).createdAt.gte = new Date(dto.dateFrom);
      }
      if (dto.dateTo) {
        (where.stockCount as any).createdAt.lte = new Date(dto.dateTo);
      }
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.stockCountItem.findMany({
        where,
        include: {
          product: true,
          stockCount: { include: { warehouse: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.stockCountItem.count({ where }),
    ]);

    return {
      data: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        warehouseId: item.stockCount.warehouse.id,
        warehouseName: item.stockCount.warehouse.name,
        systemQuantity: item.systemQuantity,
        countedQuantity: item.countedQuantity || 0,
        varianceQuantity: item.varianceQuantity,
        variancePercentage: item.variancePercentage,
        severity: item.severity as VarianceSeverity,
        countNumber: item.stockCount.countNumber,
        countStatus: item.stockCount.status,
        countType: item.stockCount.countType as any,
        createdAt: item.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get variance summary for warehouse
   */
  async getVarianceSummary(warehouseId?: string): Promise<VarianceSummaryDto> {
    const where: Prisma.StockCountItemWhereInput = {};

    if (warehouseId) {
      where.stockCount = { warehouseId };
    }

    const items = await this.prisma.stockCountItem.findMany({
      where: { ...where, countedQuantity: { not: null } },
    });

    const totalItemsCounted = items.length;
    const itemsWithVariance = items.filter((item) => item.varianceQuantity !== 0).length;
    const totalPositiveVariance = items
      .filter((item) => item.varianceQuantity > 0)
      .reduce((sum, item) => sum + item.varianceQuantity, 0);
    const totalNegativeVariance = items
      .filter((item) => item.varianceQuantity < 0)
      .reduce((sum, item) => sum + Math.abs(item.varianceQuantity), 0);
    const totalAbsoluteVariance = items.reduce((sum, item) => sum + Math.abs(item.varianceQuantity), 0);

    const severityCounts = {
      [VARIANCE_SEVERITY.LOW]: 0,
      [VARIANCE_SEVERITY.MEDIUM]: 0,
      [VARIANCE_SEVERITY.HIGH]: 0,
      [VARIANCE_SEVERITY.CRITICAL]: 0,
    };

    items.forEach((item) => {
      if (item.severity === VARIANCE_SEVERITY.LOW) severityCounts[VARIANCE_SEVERITY.LOW]++;
      else if (item.severity === VARIANCE_SEVERITY.MEDIUM) severityCounts[VARIANCE_SEVERITY.MEDIUM]++;
      else if (item.severity === VARIANCE_SEVERITY.HIGH) severityCounts[VARIANCE_SEVERITY.HIGH]++;
      else if (item.severity === VARIANCE_SEVERITY.CRITICAL) severityCounts[VARIANCE_SEVERITY.CRITICAL]++;
    });

    return {
      totalItemsCounted,
      itemsWithVariance,
      totalPositiveVariance,
      totalNegativeVariance,
      totalAbsoluteVariance,
      lowSeverityItems: severityCounts[VARIANCE_SEVERITY.LOW],
      mediumSeverityItems: severityCounts[VARIANCE_SEVERITY.MEDIUM],
      highSeverityItems: severityCounts[VARIANCE_SEVERITY.HIGH],
      criticalSeverityItems: severityCounts[VARIANCE_SEVERITY.CRITICAL],
    };
  }

  /**
   * Get reconciliation preview
   */
  async getReconciliationPreview(countId: string): Promise<ReconciliationPreviewDto[]> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id: countId },
      include: {
        items: {
          include: { product: true },
        },
        warehouse: true,
      },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    if (count.status !== STOCK_COUNT_STATUSES.APPROVED) {
      throw new BadRequestException('Only approved counts can be reconciled');
    }

    // Get current inventory
    const inventories = await this.prisma.inventory.findMany({
      where: {
        warehouseId: count.warehouseId,
        productId: { in: count.items.map((i) => i.productId) },
      },
    });

    const inventoryMap = new Map(inventories.map((inv) => [inv.productId, inv]));

    return count.items.map((item) => {
      const inventory = inventoryMap.get(item.productId);
      const currentStock = inventory?.quantityOnHand || 0;
      const reserved = inventory?.quantityReserved || 0;
      const available = currentStock - reserved;
      const countedQuantity = item.countedQuantity || 0;
      const adjustment = countedQuantity - currentStock;

      // Detect stale count
      const isStale = currentStock !== item.systemQuantity;

      return {
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
        },
        currentStock,
        reserved,
        available,
        countedQuantity,
        variance: item.varianceQuantity,
        adjustmentQuantity: adjustment,
        adjustmentType: adjustment > 0 ? 'INCREASE' : adjustment < 0 ? 'DECREASE' : 'NO_CHANGE',
        severity: item.severity as VarianceSeverity,
        staleStatus: isStale ? 'STALE' : 'VALID',
      };
    });
  }

  // Helper mapping functions
  private mapStockCountToResponse(count: any): StockCountResponseDto {
    const varianceItems = count.items || [];
    const variances = varianceItems.filter((item: any) => item.varianceQuantity !== 0);

    return {
      id: count.id,
      countNumber: count.countNumber,
      warehouseId: count.warehouseId,
      warehouseName: count.warehouse?.name || '',
      countType: count.countType,
      status: count.status,
      startedAt: count.startedAt,
      submittedAt: count.submittedAt,
      reviewedAt: count.reviewedAt,
      approvedAt: count.approvedAt,
      completedAt: count.completedAt,
      createdById: count.createdById,
      createdByName: count.createdBy?.name || '',
      reviewedById: count.reviewedById,
      reviewedByName: count.reviewedBy?.name,
      approvedById: count.approvedById,
      approvedByName: count.approvedBy?.name,
      rejectionReason: count.rejectionReason,
      notes: count.notes,
      itemCount: varianceItems.length,
      varianceItemCount: variances.length,
      positiveVariance: variances
        .filter((item: any) => item.varianceQuantity > 0)
        .reduce((sum: number, item: any) => sum + item.varianceQuantity, 0),
      negativeVariance: Math.abs(
        variances
          .filter((item: any) => item.varianceQuantity < 0)
          .reduce((sum: number, item: any) => sum + item.varianceQuantity, 0),
      ),
      highSeverityCount: varianceItems.filter((item: any) => item.severity === VARIANCE_SEVERITY.HIGH)
        .length,
      criticalSeverityCount: varianceItems.filter((item: any) => item.severity === VARIANCE_SEVERITY.CRITICAL)
        .length,
      items: count.items?.map((item: any) => this.mapItemToResponse(item)),
      createdAt: count.createdAt,
      updatedAt: count.updatedAt,
    };
  }

  private mapItemToResponse(item: any): StockCountItemResponseDto {
    return {
      id: item.id,
      stockCountId: item.stockCountId,
      productId: item.productId,
      productName: item.product?.name || '',
      productSku: item.product?.sku || '',
      systemQuantity: item.systemQuantity,
      countedQuantity: item.countedQuantity,
      varianceQuantity: item.varianceQuantity,
      variancePercentage: item.variancePercentage,
      severity: item.severity as VarianceSeverity,
      notes: item.notes,
      countedAt: item.countedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
