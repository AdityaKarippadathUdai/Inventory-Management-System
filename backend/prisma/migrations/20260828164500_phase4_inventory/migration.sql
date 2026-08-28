-- Phase 4 inventory quantities and immutable transaction history.
ALTER TABLE "Inventory" RENAME COLUMN "quantity" TO "quantityOnHand";
ALTER TABLE "Inventory" ADD COLUMN "quantityReserved" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Inventory" ADD COLUMN "reorderLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Inventory" ADD COLUMN "maximumStockLevel" INTEGER;
CREATE INDEX "Inventory_warehouseId_idx" ON "Inventory"("warehouseId");
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

ALTER TABLE "StockTransaction" RENAME COLUMN "type" TO "transactionType";
ALTER TABLE "StockTransaction" ADD COLUMN "inventoryId" TEXT;
ALTER TABLE "StockTransaction" ADD COLUMN "quantityBefore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StockTransaction" ADD COLUMN "quantityAfter" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StockTransaction" ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'Legacy transaction';
ALTER TABLE "StockTransaction" ADD COLUMN "notes" TEXT;
ALTER TABLE "StockTransaction" ADD COLUMN "performedBy" TEXT;
UPDATE "StockTransaction" AS transaction SET "inventoryId" = inventory.id FROM "Inventory" AS inventory WHERE inventory."warehouseId" = transaction."warehouseId" AND inventory."productId" = transaction."productId";
UPDATE "StockTransaction" SET "performedBy" = (SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "performedBy" IS NULL;
DELETE FROM "StockTransaction" WHERE "inventoryId" IS NULL OR "performedBy" IS NULL;
ALTER TABLE "StockTransaction" ALTER COLUMN "inventoryId" SET NOT NULL;
ALTER TABLE "StockTransaction" ALTER COLUMN "performedBy" SET NOT NULL;
CREATE INDEX "StockTransaction_inventoryId_createdAt_idx" ON "StockTransaction"("inventoryId", "createdAt");
CREATE INDEX "StockTransaction_productId_warehouseId_idx" ON "StockTransaction"("productId", "warehouseId");
CREATE INDEX "StockTransaction_transactionType_idx" ON "StockTransaction"("transactionType");
CREATE INDEX "StockTransaction_createdAt_idx" ON "StockTransaction"("createdAt");
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryAdjustment" ADD COLUMN "notes" TEXT;
ALTER TABLE "InventoryAdjustment" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'ADJUSTMENT_IN';
ALTER TABLE "InventoryAdjustment" ADD COLUMN "performedBy" TEXT;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
