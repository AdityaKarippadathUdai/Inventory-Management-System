# API Documentation

## Conventions
- **Base URL**: `/api/v1`
- **Format**: JSON
- **Case**: camelCase for JSON keys.

## Standardized Response Format
Successful responses:
```json
{
  "data": { ... },
  "meta": { ... } // Optional metadata (e.g., pagination)
}
```

Error responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    }
  ],
  "timestamp": "2023-10-01T12:00:00Z",
  "path": "/api/v1/resource"
}
```

## Endpoints (Phase 1)
### Health Check
- **GET** `/api/v1/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "warehouse-management-api"
  }
  ```

## Swagger / OpenAPI
Full interactive documentation is available at `/api` when the backend is running in development mode.

## Phase 2 Authentication
Authentication uses a short-lived JWT in `Authorization: Bearer <token>`. Refresh tokens are random opaque values stored only as SHA-256 hashes and delivered in an HTTP-only, same-site cookie.

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/refresh` | Refresh cookie |
| POST | `/api/v1/auth/logout` | Refresh cookie |
| GET | `/api/v1/auth/me` | Authenticated |
| POST | `/api/v1/auth/change-password` | Authenticated |
| POST | `/api/v1/auth/forgot-password` | Public |
| POST | `/api/v1/auth/reset-password` | Reset token |
| GET/PATCH | `/api/v1/users/me` | Authenticated |
| GET/POST/PATCH/DELETE | `/api/v1/users` | `USER_VIEW` / management permissions |
| PATCH | `/api/v1/users/:id/status` | `USER_UPDATE` |

The user-management endpoints enforce permissions in NestJS guards. The initial roles and permissions are created by `npx prisma db seed`; set `SEED_ADMIN_PASSWORD` first. Reset requests deliberately return the same message for existing and unknown email addresses and do not expose reset tokens.

## Phase 3 Master Data
All master-data endpoints require a bearer access token and the matching `*_VIEW`, `*_CREATE`, `*_UPDATE`, or `*_DELETE` permission. `GET` list endpoints accept `page`, `limit`, `search`, `status`, `sortBy`, and `sortOrder`; products additionally accept `categoryId`, `brand`, `sku`, and `barcode`.

Resources are available at `/api/v1/warehouses`, `/api/v1/categories`, `/api/v1/products`, and `/api/v1/suppliers`. Mutations return `409` for duplicate codes/SKUs/barcodes and use soft deactivation for delete operations. Warehouse manager assignment uses `PATCH /warehouses/:id/manager`; category status and resource status use their respective `/status` endpoints.

## Phase 4 Inventory
Inventory is keyed by `productId + warehouseId` and requires `INVENTORY_VIEW`; receiving and adjustments additionally require `INVENTORY_MANAGE`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/inventory` | Search and paginate inventory |
| GET | `/api/v1/inventory/:id` | View one inventory record |
| GET | `/api/v1/inventory/:id/history` | Immutable stock history |
| GET | `/api/v1/inventory/warehouse/:warehouseId` | Warehouse inventory |
| GET | `/api/v1/inventory/product/:productId` | Product inventory by warehouse |
| GET | `/api/v1/inventory/low-stock` | Low-stock records |
| GET | `/api/v1/inventory/summary` | Inventory KPIs |
| POST | `/api/v1/inventory/receive` | Add stock atomically |
| POST | `/api/v1/inventory/adjust` | Adjust stock in or out atomically |

List filters include `warehouseId`, `productId`, `categoryId`, `stockStatus`, and `search` (product name, SKU, or barcode). A successful mutation creates one immutable `StockTransaction` and one audit event. Adjustment-out returns `409 Conflict` when it exceeds available stock.

## Phase 5 Transfers
Transfers require `TRANSFER_VIEW` for reads, `TRANSFER_CREATE` to create/submit, and lifecycle permissions for approval, dispatch, receiving, and cancellation. Endpoints are `GET/POST /api/v1/transfers`, `GET /api/v1/transfers/:id`, and `POST /api/v1/transfers/:id/{submit,approve,reject,dispatch,receive,cancel}`. The lifecycle is `DRAFT -> PENDING_APPROVAL -> APPROVED -> IN_TRANSIT -> RECEIVED`; rejection and cancellation are terminal. Approval reserves source availability, dispatch creates `TRANSFER_OUT`, and receiving creates `TRANSFER_IN`, all in PostgreSQL transactions.

## Phase 6 Reservations
Reservation endpoints are available at `GET/POST /api/v1/reservations`, `GET /api/v1/reservations/:id`, `GET /api/v1/reservations/{active,summary,warehouse/:warehouseId,product/:productId}`, and `POST /api/v1/reservations/:id/{activate,consume,release,cancel}`. Reads require `RESERVATION_VIEW`; mutations require matching reservation permissions. Activation changes reserved quantity only. Consumption decreases on-hand and reserved quantities; release decreases reserved quantity without changing on-hand. Quantity changes are transactional and audited.

Reservation statuses are `PENDING`, `ACTIVE`, `PARTIALLY_CONSUMED`, `CONSUMED`, `RELEASED`, `CANCELLED`, and `EXPIRED`. Expiration processing is exposed as a service method for a later cron/worker; it rechecks state inside a transaction, releases remaining reserved units, and is idempotent.
