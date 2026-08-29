# Multi-Warehouse Management System

## Project Overview
A modern enterprise inventory and warehouse management platform supporting multiple warehouses, products, inventory, stock transfers, reservations, reconciliation, suppliers, purchasing, returns, reports, analytics, notifications, and audit logs.

## Planned Features (Future Phases)
- Secure JWT-based Authentication
- Real-time Multi-Warehouse Inventory Tracking
- Atomic Stock Transfers and Reservations
- Purchase Orders & Supplier Management
- Advanced Analytics and Reporting
- Automated Notifications & Alerts

## Technology Stack
**Frontend**:
- React, TypeScript, Vite
- Tailwind CSS, shadcn/ui, Lucide React
- React Router, TanStack Query, React Hook Form, Zod, Recharts

**Backend**:
- Node.js, TypeScript, NestJS
- PostgreSQL, Prisma ORM
- Swagger/OpenAPI

## Architecture & Structure
The frontend and backend are maintained as completely separate, independent applications. They do not share a build system or dependencies.

```text
multi-warehouse-management/
├── frontend/             # React SPA (Vite)
├── backend/              # NestJS REST API
├── docs/                 # System documentation
├── docker-compose.yml    # Database container
└── README.md
```
See the `docs/` folder for detailed architecture, database, and API documentation.

## Development Setup

### 1. Database Setup
Start the PostgreSQL database using Docker Compose:
```bash
docker compose up -d postgres
```
This starts PostgreSQL on port 5432 with default credentials (user: admin, password: password, db: warehouse_db).

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Ensure DATABASE_URL in .env matches the docker setup
npx prisma generate
npx prisma migrate deploy
SEED_ADMIN_PASSWORD='ChangeMe123!' npx prisma db seed
npm run start:dev
```
The API will run on `http://localhost:3000`. Swagger documentation is available at `http://localhost:3000/api`.

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
The frontend will run on `http://localhost:5173`.

### Phase 4 Inventory
Inventory is tracked per product and warehouse. Use the Inventory screen to review on-hand, reserved, available, low-stock, and out-of-stock positions, receive stock, and perform audited adjustments. Every quantity mutation is transactional and appends immutable stock history.

### Phase 5 Transfers
Transfers move stock between authorized warehouses through the lifecycle `DRAFT -> PENDING_APPROVAL -> APPROVED -> IN_TRANSIT -> RECEIVED`. Approval reserves source availability, dispatch consumes the reservation into `TRANSFER_OUT`, and receiving creates destination `TRANSFER_IN` history. Transfer, reservation, and reconciliation workflows remain separate concerns beyond this phase.

### Phase 6 Reservations
Reservations protect available stock for business references without changing physical on-hand quantity. They can be activated, partially or fully consumed, released, and cancelled through transactional APIs. Dedicated order and reconciliation workflows remain separate.

### Phase 7 Stock Counting & Reconciliation
Physical inventory counts compare system stock vs. physically counted quantities and generate reconciliation adjustments. The workflow enforces strict separation of duties:
1. **Counting** (INVENTORY_STAFF): Create counts, start them (snapshot system quantities), and enter physical counts item-by-item
2. **Review** (WAREHOUSE_MANAGER): Review submitted counts and optionally reject with reasons
3. **Approval** (WAREHOUSE_MANAGER/ADMIN): Approve reviewed counts for reconciliation
4. **Reconciliation** (ADMIN): Execute reconciliation in a serializable transaction, updating inventory atomically

**Key Features**:
- **Variance Severity Levels**: NONE, LOW, MEDIUM, HIGH, CRITICAL based on percentage discrepancies
- **Stale Count Detection**: Warns if inventory changed after count started
- **Variance Thresholds**: Configurable percentage boundaries for severity classification
- **Audit Trail**: Complete history of all count transitions and inventory adjustments
- **Reserved Stock Protection**: Prevents reconciliation from violating reserved stock commitments
- **Double Reconciliation Prevention**: Unique constraints ensure inventory is never partially updated
- **Count Lifecycle**: DRAFT → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED → COMPLETED (or REJECTED/CANCELLED)
- **Reconciliation Lifecycle**: PENDING → APPROVED → EXECUTED (or FAILED/CANCELLED)
- **Stale Count Warnings**: Highlights if inventory changed after count snapshot
- **Conflict Detection**: Reports reserved stock or negative inventory conflicts before execution
- **Icon + Label Variance Display**: Accessibility-first severity badges (not color-only)

**Frontend Workflows**:
- Stock Counts Dashboard: View all counts with KPI summary, filter by status/type, create new counts
- Count Entry: Item-by-item physical quantity entry with real-time variance calculation and progress tracking
- Reconciliation Preview: Review adjustments, stale warnings, reserved stock conflicts before execution
- Reconciliation History: View all executed reconciliations with full audit trails
