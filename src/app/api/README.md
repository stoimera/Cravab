# API Routes

This directory contains all API routes for Cravab Service Business Platform.

## Authentication Routes

### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { ... },
  "session": { ... }
}
```

### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "user": { ... },
  "session": { ... }
}
```

### POST `/api/auth/logout`
Logout the current user.

**Response:**
```json
{
  "success": true
}
```

### GET `/api/auth/session`
Get current user session.

**Response:**
```json
{
  "user": { ... }
}
```

## Client Routes

### GET `/api/clients`
Get all clients for the current user's company.

**Response:**
```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-1234",
    "email": "john@example.com",
    "notes": "Regular customer",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST `/api/clients`
Create a new client.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-1234",
  "email": "john@example.com",
  "notes": "Regular customer"
}
```

### GET `/api/clients/[id]`
Get a specific client by ID.

### PUT `/api/clients/[id]`
Update a specific client.

### DELETE `/api/clients/[id]`
Delete a specific client.

## Call Routes

### GET `/api/calls`
Get all calls for the current user's company.

**Response:**
```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "client_id": "uuid",
    "timestamp": "2024-01-01T00:00:00Z",
    "status": "answered",
    "transcript": "Call transcript...",
    "clients": {
      "first_name": "John",
      "last_name": "Doe",
      "phone": "555-1234"
    }
  }
]
```

## Appointment Routes

### GET `/api/appointments`
Get all appointments for the current user's company.

**Query Parameters:**
- `startDate` (optional) - Filter appointments from this date
- `endDate` (optional) - Filter appointments to this date

### POST `/api/appointments`
Create a new appointment.

**Request Body:**
```json
{
  "client_id": "uuid",
  "title": "Service Repair",
  "description": "Fix leaky faucet",
  "starts_at": "2024-01-01T10:00:00Z",
  "ends_at": "2024-01-01T11:00:00Z",
  "address": "123 Main St, City, State",
  "travel_time_minutes": 15
}
```

## Vapi AI Routes

### POST `/api/vapi/create-call`
Create a new Vapi call for a tenant.

**Request Body:**
```json
{
  "tenant_id": "tenant_123",
  "to_phone": "+1234567890",
  "assistant_id": "assistant_456",
  "metadata": {
    "client_id": "client_789",
    "appointment_id": "apt_101"
  }
}
```

### POST `/api/vapi/webhook`
Receive webhook from Vapi AI.

**Request Body:**
```json
{
  "type": "call-ended",
  "call_id": "call_123",
  "status": "completed",
  "transcript": "Customer called about leaky faucet...",
  "analysis": {
    "summary": "Customer needs service repair",
    "sentiment": "positive",
    "intent": "schedule_appointment"
  }
}
```

## Error Handling

All API routes return consistent error responses:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

All routes (except auth routes) require authentication. The middleware automatically:
1. Checks for valid session
2. Extracts user information
3. Validates company access
4. Redirects to login if not authenticated

## Validation

All request bodies are validated using Zod schemas:
- Invalid data returns 400 with error message
- Type-safe request/response handling
- Automatic error messages for validation failures
