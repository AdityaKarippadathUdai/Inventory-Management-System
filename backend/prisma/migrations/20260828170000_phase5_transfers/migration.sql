-- Phase 5 inter-warehouse transfer lifecycle.
ALTER TABLE "StockTransfer" ADD COLUMN "transferNumber" TEXT;
WITH numbered AS (SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS sequence FROM "StockTransfer")
UPDATE "StockTransfer" AS transfer SET "transferNumber" = 'TRF-' || LPAD(numbered.sequence::TEXT, 6, '0') FROM numbered WHERE transfer."id" = numbered."id";
ALTER TABLE "StockTransfer" ALTER COLUMN "transferNumber" SET NOT NULL;
ALTER TABLE "StockTransfer" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "StockTransfer" ADD COLUMN "requestedById" TEXT;
UPDATE "StockTransfer" SET "requestedById" = (SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
ALTER TABLE "StockTransfer" ALTER COLUMN "requestedById" SET NOT NULL;
ALTER TABLE "StockTransfer" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "receivedById" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "StockTransfer" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "StockTransfer" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "StockTransfer" ADD COLUMN "receivedAt" TIMESTAMP(3);
ALTER TABLE "StockTransfer" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "notes" TEXT;
CREATE UNIQUE INDEX "StockTransfer_transferNumber_key" ON "StockTransfer"("transferNumber");
CREATE INDEX "StockTransfer_status_idx" ON "StockTransfer"("status");
CREATE INDEX "StockTransfer_sourceWarehouseId_createdAt_idx" ON "StockTransfer"("sourceWarehouseId", "createdAt");
CREATE INDEX "StockTransfer_destinationWarehouseId_createdAt_idx" ON "StockTransfer"("destinationWarehouseId", "createdAt");
CREATE INDEX "StockTransfer_requestedById_idx" ON "StockTransfer"("requestedById");
CREATE INDEX "StockTransfer_createdAt_idx" ON "StockTransfer"("createdAt");
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockTransferItem" RENAME COLUMN "quantity" TO "requestedQuantity";
ALTER TABLE "StockTransferItem" ADD COLUMN "shippedQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StockTransferItem" ADD COLUMN "receivedQuantity" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "StockTransferItem_transferId_idx" ON "StockTransferItem"("transferId");
CREATE INDEX "StockTransferItem_productId_idx" ON "StockTransferItem"("productId");

ALTER TABLE "StockReservation" ADD COLUMN "userId" TEXT;
ALTER TABLE "StockReservation" ADD COLUMN "transferId" TEXT;
CREATE INDEX "StockReservation_transferId_status_idx" ON "StockReservation"("transferId", "status");
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
