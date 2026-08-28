# Database Architecture

## Overview
The database uses PostgreSQL managed via Prisma ORM. It is designed for strong consistency and ACID transactional support, crucial for inventory and stock management.

## Entities and Relationships
- **User, Role, Permission**: Handles system access and RBAC. A User belongs to a Role, and a Role has many Permissions.
- **Warehouse**: Represents a physical or logical storage location.
- **Product & Category**: Products belong to Categories.
- **Inventory**: The central stock record linking `Warehouse` and `Product`.
- **StockTransaction**: Represents any movement of stock (in, out, adjustment).
- **StockTransfer & StockTransferItem**: Moving stock between two warehouses.
- **StockReservation**: Temporarily locking stock for an order or process.
- **InventoryAdjustment**: Manual corrections to stock levels.
- **Supplier & PurchaseOrder**: Managing inbound stock purchasing.
- **Return**: Processing returned items.
- **AuditLog**: Tracking critical system actions.
- **Notification**: User alerts for low stock, approvals, etc.

## Inventory Design & Constraints
The `Inventory` table maintains the current stock level. It enforces a unique constraint on:
```sql
UNIQUE (warehouseId, productId)
```
This ensures that there is exactly one record for a specific product in a specific warehouse, preventing race conditions that might create duplicate rows.

## Future Transaction Requirements
Inventory operations (transfers, reservations) require multi-step ACID transactions:
```sql
BEGIN;
-- Deduct from Source Warehouse
UPDATE "Inventory" SET quantity = quantity - X WHERE warehouseId = A AND productId = P;
-- Add to Destination Warehouse
UPDATE "Inventory" SET quantity = quantity + X WHERE warehouseId = B AND productId = P;
-- Record Transaction History
INSERT INTO "StockTransaction" ...
COMMIT;
```
Prisma's `$transaction` API will be used to enforce atomicity for these operations.
