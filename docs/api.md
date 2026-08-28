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
