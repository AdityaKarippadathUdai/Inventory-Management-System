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

## Future Authentication Strategy
- Endpoints will be protected via Authorization header: `Bearer <token>`
- NestJS guards will evaluate the token and attach the `User` object to the request context.
