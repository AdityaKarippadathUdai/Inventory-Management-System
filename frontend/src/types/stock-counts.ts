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

export interface StockCountItemResponseDto {
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
  countedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockCountResponseDto {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  countType: StockCountType;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  completedAt?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockCountDto {
  warehouseId: string;
  countType: StockCountType;
  productIds?: string[];
  notes?: string;
}

export interface UpdateCountItemDto {
  countedQuantity: number;
  notes?: string;
}

export interface SubmitStockCountDto {
  notes?: string;
}

export interface ApproveStockCountDto {
  notes?: string;
}

export interface RejectStockCountDto {
  reason: string;
  notes?: string;
}

export interface ReopenStockCountDto {
  notes?: string;
}

export interface CancelStockCountDto {
  reason?: string;
}

export interface VarianceReportItemDto {
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
  createdAt: string;
}

export interface VarianceSummaryDto {
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

export interface ReconciliationPreviewDto {
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

export interface ReconciliationItemDto {
  productId: string;
  productName: string;
  productSku: string;
  systemQuantity: number;
  countedQuantity: number;
  adjustmentQuantity: number;
  adjustmentType: string;
  reason: string;
}

export interface ReconciliationResponseDto {
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
  approvedAt?: string;
  executedById?: string;
  executedByName?: string;
  executedAt?: string;
  notes?: string;
  items: ReconciliationItemDto[];
  createdAt: string;
  updatedAt: string;
}
