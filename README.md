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
