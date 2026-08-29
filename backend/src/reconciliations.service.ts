import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { ReconciliationResponseDto } from './stock-counts.dto.js';
import { RECONCILIATION_STATUSES, STOCK_COUNT_STATUSES } from './stock-counts.constants.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReconciliationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique reconciliation number
   */
  private async generateReconciliationNumber(): Promise<string> {
    const lastReconciliation = await this.prisma.inventoryReconciliation.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { reconciliationNumber: true },
    });

    let nextNumber = 1;
    if (lastReconciliation && lastReconciliation.reconciliationNumber.startsWith('REC-')) {
      const lastNum = parseInt(lastReconciliation.reconciliationNumber.substring(4));
      nextNumber = lastNum + 1;
    }

    return `REC-${String(nextNumber).padStart(6, '0')}`;
  }

  /**
   * Create reconciliation for an approved count
   */
  async createReconciliation(countId: string, userId: string): Promise<ReconciliationResponseDto> {
    const count = await this.prisma.stockCount.findUnique({
      where: { id: countId },
      include: {
        items: { include: { product: true } },
        warehouse: true,
      },
    });

    if (!count) {
      throw new NotFoundException('Stock count not found');
    }

    if (count.status !== STOCK_COUNT_STATUSES.APPROVED) {
      throw new BadRequestException('Only approved counts can be reconciled');
    }

    // Check if reconciliation already exists
    const existing = await this.prisma.inventoryReconciliation.findUnique({
      where: { stockCountId: countId },
    });

    if (existing) {
      throw new ConflictException('Reconciliation already exists for this stock count');
    }

    const reconciliationNumber = await this.generateReconciliationNumber();

    const reconciliation = await this.prisma.$transaction(async (tx) => {
      // Get current inventory states
      const inventories = await tx.inventory.findMany({
        where: {
          warehouseId: count.warehouseId,
          productId: { in: count.items.map((i) => i.productId) },
        },
      });

      const inventoryMap = new Map(inventories.map((inv) => [inv.productId, inv]));

      // Calculate adjustments
      let totalIncrease = 0;
      let totalDecrease = 0;
      const reconciliationItems = [];

      for (const item of count.items) {
        const inventory = inventoryMap.get(item.productId);
        const currentStock = inventory?.quantityOnHand || 0;
        const countedQuantity = item.countedQuantity || 0;
        const adjustmentQuantity = countedQuantity - currentStock;
        const adjustmentType =
          adjustmentQuantity > 0 ? 'INCREASE' : adjustmentQuantity < 0 ? 'DECREASE' : 'NO_CHANGE';

        if (adjustmentQuantity > 0) totalIncrease += adjustmentQuantity;
        if (adjustmentQuantity < 0) totalDecrease += Math.abs(adjustmentQuantity);

        reconciliationItems.push({
          productId: item.productId,
          systemQuantity: currentStock,
          countedQuantity,
          adjustmentQuantity,
          adjustmentType,
          reason: `Stock count reconciliation - Physical count: ${countedQuantity}, System: ${currentStock}`,
        });
      }

      const totalVariance = totalIncrease - totalDecrease;

      // Create reconciliation
      const rec = await tx.inventoryReconciliation.create({
        data: {
          reconciliationNumber,
          stockCountId: countId,
          warehouseId: count.warehouseId,
          status: RECONCILIATION_STATUSES.PENDING,
          totalIncrease,
          totalDecrease,
          totalVariance,
          items: {
            createMany: {
              data: reconciliationItems,
            },
          },
        },
        include: {
          stockCount: true,
          warehouse: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVENTORY_RECONCILIATION_CREATED',
          entity: 'INVENTORY_RECONCILIATION',
          entityId: rec.id,
          details: {
            reconciliationNumber: rec.reconciliationNumber,
            stockCountId: countId,
            warehouseId: count.warehouseId,
            totalIncrease,
            totalDecrease,
            totalVariance,
          },
        },
      });

      return rec;
    });

    return this.mapReconciliationToResponse(reconciliation);
  }

  /**
   * Approve reconciliation
   */
  async approveReconciliation(id: string, userId: string): Promise<ReconciliationResponseDto> {
    const reconciliation = await this.prisma.inventoryReconciliation.findUnique({
      where: { id },
      include: {
        stockCount: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    if (reconciliation.status !== RECONCILIATION_STATUSES.PENDING) {
      throw new BadRequestException('Reconciliation is not in pending state');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const rec = await tx.inventoryReconciliation.update({
        where: { id },
        data: {
          status: RECONCILIATION_STATUSES.APPROVED,
          approvedById: userId,
          approvedAt: new Date(),
        },
        include: {
          stockCount: true,
          warehouse: true,
          items: { include: { product: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVENTORY_RECONCILIATION_APPROVED',
          entity: 'INVENTORY_RECONCILIATION',
          entityId: id,
          details: {
            reconciliationNumber: rec.reconciliationNumber,
            stockCountId: rec.stockCountId,
          },
        },
      });

      return rec;
    });

    return this.mapReconciliationToResponse(updated);
  }

  /**
   * Execute reconciliation - apply inventory adjustments
   * This is the critical operation that must be transactional
   */
  async executeReconciliation(id: string, userId: string): Promise<ReconciliationResponseDto> {
    const reconciliation = await this.prisma.inventoryReconciliation.findUnique({
      where: { id },
      include: {
        stockCount: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    if (reconciliation.status !== RECONCILIATION_STATUSES.APPROVED) {
      throw new BadRequestException('Reconciliation must be approved before execution');
    }

    // Check if already reconciled
    const stockCount = await this.prisma.stockCount.findUnique({
      where: { id: reconciliation.stockCountId },
    });

    if (!stockCount) {
      throw new NotFoundException('Stock count not found');
    }

    if (stockCount.status === STOCK_COUNT_STATUSES.COMPLETED) {
      throw new ConflictException('Stock count has already been reconciled');
    }

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Lock affected inventory rows and re-read
          const inventories = await tx.inventory.findMany({
            where: {
              warehouseId: reconciliation.warehouseId,
              productId: { in: reconciliation.items.map((i) => i.productId) },
            },
          });

          // Validate current inventory state
          for (const item of reconciliation.items) {
            const inventory = inventories.find((inv) => inv.productId === item.productId);
            if (!inventory) {
              throw new BadRequestException(
                `Inventory record not found for product ${item.productId}`,
              );
            }

            // Verify adjustment won't create negative inventory
            const newQuantity = inventory.quantityOnHand + item.adjustmentQuantity;
            if (newQuantity < 0) {
              throw new ConflictException(
                `Cannot reconcile: adjustment would create negative inventory for product ${item.product.sku}`,
              );
            }

            // Check if adjustment would violate reserved stock
            if (newQuantity < inventory.quantityReserved) {
              throw new ConflictException(
                `Cannot reconcile: insufficient inventory for reserved stock on product ${item.product.sku}. ` +
                  `Reserved: ${inventory.quantityReserved}, After adjustment: ${newQuantity}`,
              );
            }
          }

          // Apply adjustments
          for (const item of reconciliation.items) {
            if (item.adjustmentQuantity !== 0) {
              const inventory = inventories.find((inv) => inv.productId === item.productId)!;
              const quantityBefore = inventory.quantityOnHand;
              const quantityAfter = quantityBefore + item.adjustmentQuantity;

              // Update inventory
              await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                  quantityOnHand: { increment: item.adjustmentQuantity },
                },
              });

              // Create stock transaction
              const transactionType =
                item.adjustmentQuantity > 0 ? 'STOCK_COUNT_ADJUSTMENT_IN' : 'STOCK_COUNT_ADJUSTMENT_OUT';

              await tx.stockTransaction.create({
                data: {
                  inventoryId: inventory.id,
                  warehouseId: reconciliation.warehouseId,
                  productId: item.productId,
                  quantity: Math.abs(item.adjustmentQuantity),
                  quantityBefore,
                  quantityAfter,
                  transactionType,
                  referenceType: 'INVENTORY_RECONCILIATION',
                  referenceId: id,
                  performedBy: userId,
                  reason: 'Stock reconciliation',
                  notes: item.reason,
                },
              });
            }

            // Create audit log for each adjustment
            await tx.auditLog.create({
              data: {
                userId,
                action: 'INVENTORY_RECONCILIATION_ADJUSTMENT',
                entity: 'INVENTORY_RECONCILIATION_ITEM',
                entityId: item.id,
                details: {
                  reconciliationId: id,
                  productId: item.productId,
                  adjustmentQuantity: item.adjustmentQuantity,
                  adjustmentType: item.adjustmentType,
                  reason: item.reason,
                },
              },
            });
          }

          // Update reconciliation status
          const updated = await tx.inventoryReconciliation.update({
            where: { id },
            data: {
              status: RECONCILIATION_STATUSES.EXECUTED,
              executedById: userId,
              executedAt: new Date(),
            },
            include: {
              stockCount: true,
              warehouse: true,
              items: { include: { product: true } },
            },
          });

          // Mark stock count as completed
          await tx.stockCount.update({
            where: { id: reconciliation.stockCountId },
            data: {
              status: STOCK_COUNT_STATUSES.COMPLETED,
              completedAt: new Date(),
            },
          });

          // Create audit log for reconciliation execution
          await tx.auditLog.create({
            data: {
              userId,
              action: 'INVENTORY_RECONCILIATION_EXECUTED',
              entity: 'INVENTORY_RECONCILIATION',
              entityId: id,
              details: {
                reconciliationNumber: updated.reconciliationNumber,
                stockCountId: reconciliation.stockCountId,
                totalIncrease: reconciliation.totalIncrease,
                totalDecrease: reconciliation.totalDecrease,
                totalVariance: reconciliation.totalVariance,
              },
            },
          });

          return updated;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return this.mapReconciliationToResponse(result);
    } catch (error: unknown) {
      // If any error occurs, reconciliation fails
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      // Mark as failed
      await this.prisma.inventoryReconciliation.update({
        where: { id },
        data: { status: RECONCILIATION_STATUSES.FAILED },
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Reconciliation failed: ${errorMessage}`);
    }
  }

  /**
   * List reconciliations
   */
  async listReconciliations(
    warehouseId?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ data: ReconciliationResponseDto[]; total: number; page: number; pageSize: number }> {
    const where: Prisma.InventoryReconciliationWhereInput = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const [reconciliations, total] = await Promise.all([
      this.prisma.inventoryReconciliation.findMany({
        where,
        include: {
          stockCount: true,
          warehouse: true,
          approvedBy: true,
          executedBy: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.inventoryReconciliation.count({ where }),
    ]);

    return {
      data: reconciliations.map((rec) => this.mapReconciliationToResponse(rec)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get reconciliation by ID
   */
  async getReconciliation(id: string): Promise<ReconciliationResponseDto> {
    const reconciliation = await this.prisma.inventoryReconciliation.findUnique({
      where: { id },
      include: {
        stockCount: true,
        warehouse: true,
        approvedBy: true,
        executedBy: true,
        items: { include: { product: true } },
      },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    return this.mapReconciliationToResponse(reconciliation);
  }

  // Helper mapping function
  private mapReconciliationToResponse(reconciliation: any): ReconciliationResponseDto {
    return {
      id: reconciliation.id,
      reconciliationNumber: reconciliation.reconciliationNumber,
      stockCountId: reconciliation.stockCountId,
      countNumber: reconciliation.stockCount?.countNumber || '',
      warehouseId: reconciliation.warehouseId,
      warehouseName: reconciliation.warehouse?.name || '',
      status: reconciliation.status,
      totalIncrease: reconciliation.totalIncrease,
      totalDecrease: reconciliation.totalDecrease,
      totalVariance: reconciliation.totalVariance,
      approvedById: reconciliation.approvedById,
      approvedByName: reconciliation.approvedBy?.name,
      approvedAt: reconciliation.approvedAt,
      executedById: reconciliation.executedById,
      executedByName: reconciliation.executedBy?.name,
      executedAt: reconciliation.executedAt,
      notes: reconciliation.notes,
      items: (reconciliation.items || []).map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name || '',
        productSku: item.product?.sku || '',
        systemQuantity: item.systemQuantity,
        countedQuantity: item.countedQuantity,
        adjustmentQuantity: item.adjustmentQuantity,
        adjustmentType: item.adjustmentType,
        reason: item.reason,
      })),
      createdAt: reconciliation.createdAt,
      updatedAt: reconciliation.updatedAt,
    };
  }
}
