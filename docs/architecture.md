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
