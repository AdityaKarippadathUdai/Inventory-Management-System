-- CreateEnum for StockCount types
CREATE TYPE "StockCountType" AS ENUM ('FULL', 'PARTIAL', 'CYCLE', 'SPOT_CHECK');
CREATE TYPE "StockCountStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VarianceSeverity" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'APPROVED', 'EXECUTED', 'FAILED', 'CANCELLED');
CREATE TYPE "AdjustmentType" AS ENUM ('INCREASE', 'DECREASE', 'NO_CHANGE');

-- CreateTable StockCount
CREATE TABLE "StockCount" (
    "id" TEXT NOT NULL,
    "countNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "countType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable StockCountItem
CREATE TABLE "StockCountItem" (
    "id" TEXT NOT NULL,
    "stockCountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "systemQuantity" INTEGER NOT NULL,
    "countedQuantity" INTEGER,
    "varianceQuantity" INTEGER NOT NULL DEFAULT 0,
    "variancePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "severity" TEXT NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "countedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCountItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable InventoryReconciliation
CREATE TABLE "InventoryReconciliation" (
    "id" TEXT NOT NULL,
    "reconciliationNumber" TEXT NOT NULL,
    "stockCountId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "executedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "totalIncrease" INTEGER NOT NULL DEFAULT 0,
    "totalDecrease" INTEGER NOT NULL DEFAULT 0,
    "totalVariance" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable InventoryReconciliationItem
CREATE TABLE "InventoryReconciliationItem" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "systemQuantity" INTEGER NOT NULL,
    "countedQuantity" INTEGER NOT NULL,
    "adjustmentQuantity" INTEGER NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockCount_countNumber_key" ON "StockCount"("countNumber");
CREATE INDEX "StockCount_warehouseId_status_idx" ON "StockCount"("warehouseId", "status");
CREATE INDEX "StockCount_status_idx" ON "StockCount"("status");
CREATE INDEX "StockCount_countType_idx" ON "StockCount"("countType");
CREATE INDEX "StockCount_createdAt_idx" ON "StockCount"("createdAt");
CREATE INDEX "StockCount_createdById_idx" ON "StockCount"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "StockCountItem_stockCountId_productId_key" ON "StockCountItem"("stockCountId", "productId");
CREATE INDEX "StockCountItem_stockCountId_idx" ON "StockCountItem"("stockCountId");
CREATE INDEX "StockCountItem_productId_idx" ON "StockCountItem"("productId");
CREATE INDEX "StockCountItem_severity_idx" ON "StockCountItem"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReconciliation_reconciliationNumber_key" ON "InventoryReconciliation"("reconciliationNumber");
CREATE UNIQUE INDEX "InventoryReconciliation_stockCountId_key" ON "InventoryReconciliation"("stockCountId");
CREATE INDEX "InventoryReconciliation_stockCountId_idx" ON "InventoryReconciliation"("stockCountId");
CREATE INDEX "InventoryReconciliation_warehouseId_idx" ON "InventoryReconciliation"("warehouseId");
CREATE INDEX "InventoryReconciliation_status_idx" ON "InventoryReconciliation"("status");

-- CreateIndex
CREATE INDEX "InventoryReconciliationItem_reconciliationId_idx" ON "InventoryReconciliationItem"("reconciliationId");
CREATE INDEX "InventoryReconciliationItem_productId_idx" ON "InventoryReconciliationItem"("productId");

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountItem" ADD CONSTRAINT "StockCountItem_stockCountId_fkey" FOREIGN KEY ("stockCountId") REFERENCES "StockCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockCountItem" ADD CONSTRAINT "StockCountItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReconciliation" ADD CONSTRAINT "InventoryReconciliation_stockCountId_fkey" FOREIGN KEY ("stockCountId") REFERENCES "StockCount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryReconciliation" ADD CONSTRAINT "InventoryReconciliation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryReconciliation" ADD CONSTRAINT "InventoryReconciliation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryReconciliation" ADD CONSTRAINT "InventoryReconciliation_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReconciliationItem" ADD CONSTRAINT "InventoryReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "InventoryReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryReconciliationItem" ADD CONSTRAINT "InventoryReconciliationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
