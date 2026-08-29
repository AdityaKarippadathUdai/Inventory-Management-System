# System Architecture

## Overview
The Multi-Warehouse Management System is composed of two independent applications:
1. **Frontend**: A React SPA built with Vite, TypeScript, and Tailwind CSS.
2. **Backend**: A REST API built with NestJS, TypeScript, PostgreSQL, and Prisma.

## Frontend Architecture
- **Framework**: React 18+ via Vite.
- **State Management**: Local React state for UI components. TanStack Query for asynchronous state management and server state.
- **Routing**: React Router.
- **Styling**: Tailwind CSS with shadcn/ui components.
- **API Client**: Centralized Axios/Fetch wrapper managing base URLs via environment variables (`VITE_API_URL`), handling request/response interceptors.

## Backend Architecture
- **Framework**: NestJS.
- **Database ORM**: Prisma.
- **Structure**: Modular architecture dividing responsibilities by feature (e.g., `WarehousesModule`, `InventoryModule`).
- **Validation**: Global validation pipes using `class-validator` and `class-transformer`.
- **Error Handling**: Global exception filters returning standardized JSON responses.
- **Documentation**: Swagger/OpenAPI available at `/api`.

## Frontend/Backend Separation
The frontend and backend are completely separate projects. They do not share a `package.json`, dependencies, or build systems. They communicate exclusively over HTTP via versioned REST APIs (`/api/v1`).

## Phase 2 Authentication and RBAC
- `AuthService` hashes passwords with Argon2 and issues short-lived access JWTs.
- Refresh tokens are opaque, rotated on every refresh, hashed before persistence, expired, and revoked on logout/password changes.
- `JwtAuthGuard` verifies the access token and reloads active-user permissions from PostgreSQL on every protected request.
- `@RequirePermission(...)` plus `PermissionGuard` enforces permissions at the API boundary. Frontend permission checks only control visibility and never provide security.
- The frontend keeps the access token in memory and sends the refresh token as an HTTP-only cookie.

## Phase 3 Master Data
Warehouse, category, product, and supplier controllers are grouped in `MasterDataModule`; their services use Prisma and receive the authenticated actor for audit events. Product records contain catalog and reorder configuration only. Warehouse-specific stock remains in the existing `Inventory` relation and is intentionally reserved for Phase 4. Warehouse manager assignment is modeled now so later policies can scope operations by `managerId`.

## Phase 4 Inventory
`InventoryModule` owns warehouse-specific quantities and exposes read, receive, adjustment, summary, low-stock, and immutable-history endpoints. Receive and adjustment operations execute as one serializable PostgreSQL transaction: validate current state, update inventory conditionally, append stock history, and write an audit event. Warehouse managers are restricted by `managerId`; the database remains the source of truth for concurrent mutations.

## Phase 5 Transfers
`TransfersService` owns the centralized lifecycle transition map and is the only path for transfer state changes. Approval, dispatch, receive, and approved cancellation use serializable Prisma transactions, re-read current inventory state, and update reservations and immutable stock transactions atomically. Transfer-related reservations are deliberately represented through the existing reservation table as a foundation for Phase 6 without exposing a standalone reservation workflow.

## Phase 6 Reservations
`ReservationsService` is the centralized owner of reservation transitions and available-stock checks. It uses serializable Prisma transactions and conditional inventory updates to prevent concurrent reservations from making reserved stock exceed on-hand stock. The model supports orders, transfers, internal requests, production, and other references without implementing those future business modules.

Reservation expiration is implemented as an idempotent service operation suitable for a future cron invocation. The service rechecks active state and expiry in the transaction before releasing reserved units, so repeated or concurrent processing does not double-release stock.

## Phase 7 Stock Counting & Reconciliation
`StockCountsModule` owns the complete count and reconciliation lifecycle with strict RBAC separation of duties:
- **Counting**: INVENTORY_STAFF creates counts, starts them (snapshots system quantities), and enters physical quantities.
- **Review**: WAREHOUSE_MANAGER reviews submitted counts and may reject with reasons.
- **Approval**: WAREHOUSE_MANAGER (or ADMIN) approves counts for reconciliation.
- **Reconciliation Execution**: ADMIN only executes reconciliation, updating inventory via serializable transaction.

### Count Lifecycle State Machine
```
DRAFT ──[Start]──> IN_PROGRESS ──[Submit]──> SUBMITTED
                        │                          │
                        └──[Cancel]──> CANCELLED   └──[Review]──> UNDER_REVIEW
                                                        │              │
                                                        │         [Approve]
                                                        │              │
                                                   [Reject]      APPROVED ──[Reconcile]──> COMPLETED
                                                        │
                                                    REJECTED ──[Reopen]──> IN_PROGRESS
```

### Reconciliation Workflow
1. **Preview Phase**: System calculates adjustments, detects stale counts (inventory changed after snapshot), and checks reserved stock conflicts.
2. **Approval Phase**: Authorized user reviews adjustments and approves.
3. **Execution Phase** (Serializable Transaction):
   - Re-lock affected inventory rows
   - Validate no reserved stock conflicts
   - Create StockTransaction records for each adjustment
   - Update denormalized Inventory quantities
   - Mark StockCount as COMPLETED
   - Mark Reconciliation as EXECUTED
   - Emit audit log entries

### Frontend Pages
- **Stock Counts Dashboard** (`/stock-counts`): List all counts with KPI cards (total counted, with variance, high/critical items).
- **Create Count** (`/stock-counts/new`): Form to select warehouse, count type, and optional product filter.
- **Count Detail** (`/stock-counts/:id`): View count status, items, and perform permitted actions (start, submit, review, approve, reject, reopen, cancel).
- **Count Entry** (`/stock-counts/:id/count`): Interactive form for counting items with progress tracking, search, and variance visualization.
- **Reconciliation Preview** (`/stock-counts/:id/reconciliation`): View adjustment summary, stale count warnings, reserved stock conflicts, and execute reconciliation.
- **Reconciliations List** (`/reconciliations`): Historical view of all reconciliations with summary statistics.
- **Reconciliation Detail** (`/reconciliations/:id`): View executed reconciliation details and audit trail.

### Variance Severity Badges
All variance displays use icon + label + color coding (not color-only for accessibility):
- **NONE** (≤0.01%): Green checkmark - "No Variance"
- **LOW** (≤2%): Blue info - "Low"
- **MEDIUM** (≤5%): Yellow warning - "Medium"
- **HIGH** (≤10%): Orange alert - "High"
- **CRITICAL** (>10%): Red alert - "Critical"

### Stale Count Detection
When inventory changes after a count starts (between snapshot and reconciliation):
- System detects `currentStock ≠ systemQuantity` in reconciliation preview
- Displays prominent ⚠️ "Stale Count" warning with timestamp
- Explains why variance may have increased/decreased
- Allows user to reopen count if needed or proceed with awareness

### Double Reconciliation Protection
- Unique constraint on `InventoryReconciliation(stockCountId)`
- Status checks prevent re-execution
- Concurrent requests receive `409 Conflict` response
- Never allows partial inventory updates

### Audit Trail
- All transitions recorded with actor, timestamp, and optional notes
- StockTransaction records created for every inventory adjustment with:
  - Before/after quantities
  - Reference to reconciliation ID
  - Actor and timestamp
  - Reason/notes

## Redis Plan (Future)
- Redis will be introduced for:
  - Caching frequent queries (e.g., Dashboard KPIs).
  - Session management or token blacklisting.
  - Background job queues (BullMQ).

## Background Job Plan (Future)
- Used for heavy tasks such as:
  - Inventory reconciliation reports.
  - Bulk stock imports/exports.
  - Email notifications (low stock alerts).

## Deployment Architecture
- **Frontend**: Static file hosting (e.g., Vercel, Netlify, AWS S3 + CloudFront, Nginx).
- **Backend**: Containerized application deployed to a managed container service (e.g., AWS ECS, Google Cloud Run) or a VPS.
- **Database**: Managed PostgreSQL instance (e.g., AWS RDS).
