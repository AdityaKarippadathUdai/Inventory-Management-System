import { IsUUID, IsString, IsArray, IsInt, Min, IsOptional, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';

export enum StockCountType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  CYCLE = 'CYCLE',
  SPOT_CHECK = 'SPOT_CHECK',
}

export enum VarianceSeverity {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Create Stock Count
export class CreateStockCountDto {
  @IsUUID()
  warehouseId: string;

  @IsEnum(StockCountType)
  countType: StockCountType;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  productIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

// Start Stock Count
export class StartStockCountDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

// Update Count Item
export class UpdateCountItemDto {
  @IsInt()
  @Min(0)
  countedQuantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Submit Stock Count
export class SubmitStockCountDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

// Review Stock Count
export class ReviewStockCountDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

// Approve Stock Count
export class ApproveStockCountDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

// Reject Stock Count
export class RejectStockCountDto {
  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Reopen Stock Count
export class ReopenStockCountDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

// Cancel Stock Count
export class CancelStockCountDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

// Reconcile Stock Count
export class ReconcileStockCountDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

// Response DTOs
export class StockCountItemResponseDto {
  id: string;
  stockCountId: string;
  productId: string;
  productName: string;
  productSku: string;
  systemQuantity: number;
  countedQuantity: number | null;
  varianceQuantity: number;
  variancePercentage: number;
  severity: VarianceSeverity;
  notes?: string;
  countedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class StockCountResponseDto {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  countType: StockCountType;
  status: string;
  startedAt?: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  completedAt?: Date;
  createdById: string;
  createdByName: string;
  reviewedById?: string;
  reviewedByName?: string;
  approvedById?: string;
  approvedByName?: string;
  rejectionReason?: string;
  notes?: string;
  itemCount: number;
  varianceItemCount: number;
  positiveVariance: number;
  negativeVariance: number;
  highSeverityCount: number;
  criticalSeverityCount: number;
  items?: StockCountItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class StockCountSummaryDto {
  totalCounts: number;
  draftCounts: number;
  inProgressCounts: number;
  submittedCounts: number;
  underReviewCounts: number;
  approvedCounts: number;
  completedCounts: number;
  rejectedCounts: number;
  cancelledCounts: number;
  staleCounts: number;
}

export class VarianceReportItemDto {
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  systemQuantity: number;
  countedQuantity: number;
  varianceQuantity: number;
  variancePercentage: number;
  severity: VarianceSeverity;
  countNumber: string;
  countStatus: string;
  countType: StockCountType;
  createdAt: Date;
}

export class VarianceSummaryDto {
  totalItemsCounted: number;
  itemsWithVariance: number;
  totalPositiveVariance: number;
  totalNegativeVariance: number;
  totalAbsoluteVariance: number;
  lowSeverityItems: number;
  mediumSeverityItems: number;
  highSeverityItems: number;
  criticalSeverityItems: number;
}

export class ReconciliationPreviewDto {
  product: {
    id: string;
    name: string;
    sku: string;
  };
  currentStock: number;
  reserved: number;
  available: number;
  countedQuantity: number;
  variance: number;
  adjustmentQuantity: number;
  adjustmentType: string;
  severity: VarianceSeverity;
  staleStatus: string;
}

export class ReconciliationResponseDto {
  id: string;
  reconciliationNumber: string;
  stockCountId: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: string;
  totalIncrease: number;
  totalDecrease: number;
  totalVariance: number;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: Date;
  executedById?: string;
  executedByName?: string;
  executedAt?: Date;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    productSku: string;
    systemQuantity: number;
    countedQuantity: number;
    adjustmentQuantity: number;
    adjustmentType: string;
    reason: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export class ListStockCountsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  countType?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}

export class ListVariancesDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  countType?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
