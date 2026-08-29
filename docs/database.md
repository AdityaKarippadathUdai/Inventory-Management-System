# Database Architecture

## Overview
The database uses PostgreSQL managed via Prisma ORM. It is designed for strong consistency and ACID transactional support, crucial for inventory and stock management.

## Entities and Relationships
- **User, Role, Permission**: Handles system access and RBAC. A User belongs to a Role, and `RolePermission` explicitly joins roles to permissions.
- **RefreshToken**: Stores only a hash of each revocable session token.
- **PasswordResetToken**: Stores a hashed, expiring, single-use reset token.
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

Phase 2 user passwords are stored only in `User.passwordHash` using Argon2. `User.isActive` provides soft deactivation, and user and token relations are indexed for authorization and cleanup queries.

Phase 3 extends master data with warehouse contact/location fields and an optional `User` manager relation, self-referencing `Category.parentId`, unique `Product.sku` and optional unique barcode, and a unique `Supplier.code`. Product pricing, dimensions, and reorder levels are configuration data; no warehouse quantities are stored on `Product`. Categories and all master data use status fields and mutation endpoints prefer deactivation over physical deletion.

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

## Phase 4 Inventory
`Inventory` represents one `Product` in one `Warehouse`, enforced by `UNIQUE (warehouseId, productId)`. It stores `quantityOnHand`, `quantityReserved`, `reorderLevel`, and `maximumStockLevel`; available stock is calculated as `quantityOnHand - quantityReserved`.

`StockTransaction` is append-only history with transaction type, quantity, before/after values, reason, actor, and timestamps. Inventory mutations run in a PostgreSQL serializable Prisma transaction and use a conditional update to detect concurrent changes. Corrections are compensating transactions, never edits to history. Transfer, reservation, and reconciliation transaction types are represented by the same future-ready table but are not implemented in Phase 4.

## Phase 5 Transfers
`StockTransfer` relates source and destination warehouses, requester/approver/receiver users, a unique backend-generated transfer number, lifecycle timestamps, and multiple `StockTransferItem` rows. Approval creates linked active `StockReservation` rows and increments source `quantityReserved`. Dispatch consumes those reservations and appends `TRANSFER_OUT`; receiving appends `TRANSFER_IN` at the destination. Transfer identifiers are stored in stock transaction references so inventory history remains navigable.

## Phase 6 Reservations
`Reservation` and `ReservationItem` are first-class allocation records. They track business type/reference, warehouse, requester, expiration, lifecycle status, and requested/reserved/consumed/released quantities. `Inventory.quantityReserved` remains a transactional denormalized total for fast reads; reservation lifecycle changes update it in the same PostgreSQL transaction. Reservations do not move physical stock until consumption.

Reservation item uniqueness is enforced by `(reservationId, productId)`. The reservation migration uses UUID-compatible text IDs, foreign keys, and indexes for warehouse, status, business references, expiration, and product lookups. Transfer reservations can use `referenceType = TRANSFER` and `referenceId = transfer.id`.

## Phase 7 Stock Counting & Reconciliation

### Core Tables

#### StockCount
Represents a physical inventory count operation with:
- `countNumber`: Auto-generated unique identifier (COUNT-#####)
- `warehouseId`: Warehouse being counted
- `countType`: FULL, PARTIAL, CYCLE, or SPOT_CHECK
- `status`: Lifecycle state (DRAFT → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED → COMPLETED or REJECTED/CANCELLED)
- `createdById`, `reviewedById`, `approvedById`: User references for RBAC separation of duties
- `rejectionReason`: Populated when status = REJECTED
- `notes`: Optional audit trail information
- Timestamps: `createdAt`, `startedAt`, `submittedAt`, `reviewedAt`, `approvedAt`, `completedAt`, `updatedAt`
- Denormalized counts: `itemCount`, `varianceItemCount`, `positiveVariance`, `negativeVariance`, `highSeverityCount`, `criticalSeverityCount`

**Constraints**:
- `UNIQUE (countNumber)`: Ensures unique count identifiers
- Indexes on `warehouseId`, `status`, `countType`, `createdAt`, `createdById` for fast queries

#### StockCountItem
Links a count to individual products with:
- `systemQuantity`: Snapshot of inventory quantity at count start
- `countedQuantity`: Physical count entered by staff (nullable until counted)
- `varianceQuantity`: Calculated as `countedQuantity - systemQuantity`
- `variancePercentage`: Calculated with safe division handling (0/0 = 0%, >0/0 = 100%)
- `severity`: Calculated based on variance percentage (NONE ≤ 0.01%, LOW ≤ 2%, MEDIUM ≤ 5%, HIGH ≤ 10%, CRITICAL > 10%)
- `notes`: Optional per-item notes

**Constraints**:
- `UNIQUE (stockCountId, productId)`: Prevents duplicate items per count
- Indexes on `productId`, `severity`, `stockCountId` for filtering and joins

#### InventoryReconciliation
Represents the reconciliation of a completed count with:
- `reconciliationNumber`: Auto-generated unique identifier (REC-#####)
- `stockCountId`: Reference to the approved count (foreign key with unique constraint)
- `status`: Lifecycle state (PENDING → APPROVED → EXECUTED or FAILED/CANCELLED)
- `totalIncrease`, `totalDecrease`, `totalVariance`: Aggregated adjustment summary
- `approvedById`, `executedById`: User references for approval tracking
- `approvedAt`, `executedAt`: Timestamps for auditing
- `notes`: Optional reconciliation notes

**Constraints**:
- `UNIQUE (stockCountId)`: Ensures only one active reconciliation per count (prevents double reconciliation)
- Indexes on `status`, `warehouseId`, `reconciliationNumber`, `stockCountId` for fast lookups

#### InventoryReconciliationItem
Represents individual adjustments to inventory:
- `adjustmentQuantity`: Signed integer (positive = increase, negative = decrease)
- `adjustmentType`: INCREASE, DECREASE, or NO_CHANGE
- `reason`: Why the adjustment was made (e.g., "Physical count vs system discrepancy")

### Reconciliation Workflow & Safety

#### Serializable Transaction Isolation
The `executeReconciliation()` method uses PostgreSQL Serializable isolation level to:
1. Re-lock affected inventory rows
2. Validate current stock levels match expected state
3. Protect against negative inventory: reject if `quantityOnHand + adjustment < 0`
4. Protect reserved stock: reject if `quantityOnHand - quantityReserved + adjustment < 0`
5. Create StockTransaction records for each adjustment with referenceType = INVENTORY_RECONCILIATION
6. Update denormalized Inventory fields atomically

#### Stale Count Detection
The reconciliation preview compares:
- `currentStock` (from latest Inventory query)
- `systemQuantity` (snapshot from count start)

If they differ, the count is marked STALE, warning users that inventory changed after the count began. The system still allows reconciliation but highlights the risk.

#### Double Reconciliation Prevention
The unique constraint on `(stockCountId)` in `InventoryReconciliation` combined with status checks ensures:
- Only one reconciliation record per count
- Concurrent execution attempts receive `409 Conflict` response
- No partial inventory updates can occur

#### Stock Transaction Records
Every reconciliation creates `StockTransaction` records for audit trail:
```
{
  transactionType: 'STOCK_COUNT_ADJUSTMENT_IN' or 'STOCK_COUNT_ADJUSTMENT_OUT',
  inventoryId: <inventory.id>,
  quantity: abs(adjustment),
  quantityBefore: <quantity before>,
  quantityAfter: <quantity after>,
  referenceType: 'INVENTORY_RECONCILIATION',
  referenceId: <reconciliation.id>,
  notes: <adjustment reason>,
  createdById: <user executing>,
  createdAt: <timestamp>
}
```

### Variance Calculation Algorithm
```typescript
if (systemQuantity === 0 && countedQuantity > 0) {
  variancePercentage = 100  // New stock counted
} else if (systemQuantity === 0 && countedQuantity === 0) {
  variancePercentage = 0    // Both zero
} else {
  variancePercentage = Math.abs((countedQuantity - systemQuantity) / systemQuantity) * 100
}
```

### Permissions & Separation of Duties
- **STOCK_COUNT_CREATE**: Create new counts (INVENTORY_STAFF)
- **STOCK_COUNT_EDIT**: Start count, enter quantities, submit (INVENTORY_STAFF)
- **STOCK_COUNT_REVIEW**: Review submitted counts (WAREHOUSE_MANAGER)
- **STOCK_COUNT_APPROVE**: Approve reviewed counts (WAREHOUSE_MANAGER or ADMIN)
- **STOCK_COUNT_RECONCILE**: Create and approve reconciliation (WAREHOUSE_MANAGER)
- **RECONCILIATION_EXECUTE**: Execute approved reconciliation (ADMIN only)

This ensures:
- Counters cannot review their own counts
- Reviewers cannot approve their own reviews
- Reconciliation execution requires admin-level oversight
