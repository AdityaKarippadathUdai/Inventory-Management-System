-- Phase 6 first-class stock reservations.
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "reservationNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "reservationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "requestedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Reservation_reservationNumber_key" ON "Reservation"("reservationNumber");
CREATE INDEX "Reservation_warehouseId_status_idx" ON "Reservation"("warehouseId", "status");
CREATE INDEX "Reservation_reservationType_idx" ON "Reservation"("reservationType");
CREATE INDEX "Reservation_referenceType_referenceId_idx" ON "Reservation"("referenceType", "referenceId");
CREATE INDEX "Reservation_requestedById_idx" ON "Reservation"("requestedById");
CREATE INDEX "Reservation_expiresAt_idx" ON "Reservation"("expiresAt");
CREATE INDEX "Reservation_createdAt_idx" ON "Reservation"("createdAt");
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ReservationItem" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "consumedQuantity" INTEGER NOT NULL DEFAULT 0,
    "releasedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReservationItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReservationItem_reservationId_productId_key" ON "ReservationItem"("reservationId", "productId");
CREATE INDEX "ReservationItem_reservationId_idx" ON "ReservationItem"("reservationId");
CREATE INDEX "ReservationItem_productId_idx" ON "ReservationItem"("productId");
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
