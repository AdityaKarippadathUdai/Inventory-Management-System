-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "height" DECIMAL(12,3),
ADD COLUMN     "length" DECIMAL(12,3),
ADD COLUMN     "maximumStockLevel" INTEGER,
ADD COLUMN     "reorderLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sellingPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'unit',
ADD COLUMN     "weight" DECIMAL(12,3),
ADD COLUMN     "width" DECIMAL(12,3),
ALTER COLUMN "price" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "city" TEXT,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "Warehouse_name_idx" ON "Warehouse"("name");

-- CreateIndex
CREATE INDEX "Warehouse_status_idx" ON "Warehouse"("status");

-- CreateIndex
CREATE INDEX "Warehouse_managerId_idx" ON "Warehouse"("managerId");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_status_idx" ON "Category"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_parentId_key" ON "Category"("name", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

