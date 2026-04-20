# VAPI Tools Configuration

## Tool Implementation

**IMPORTANT: All tools must be implemented as async functions with strict mode enabled**

## VAPI Tools

### 1. getCurrentDate
```json
{
  "type": "object",
  "properties": {
    "tenant_id": {
      "description": "The tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id"
  ]
}
```

### 2. checkServiceArea
```json
{
  "type": "object",
  "properties": {
    "address": {
      "description": "The client's full address",
      "type": "string"
    },
    "zip_code": {
      "description": "Optional ZIP code if full address not available",
      "type": "string"
    },
    "tenant_id": {
      "description": "The tenant ID to check service area for",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "address",
    "tenant_id"
  ]
}
```

### 3. getPricingInfo
```json
{
  "type": "object",
  "properties": {
    "tenant_id": {
      "description": "The tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "client_request": {
      "description": "The client's description of their service issue or request",
      "type": "string"
    }
  },
  "required": [
    "client_request",
    "tenant_id"
  ]
}
```

### 4. findServiceForClient
```json
{
  "type": "object",
  "properties": {
    "tenant_id": {
      "description": "The tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "client_request": {
      "description": "The client's description of what they need help with",
      "type": "string"
    }
  },
  "required": [
    "client_request",
    "tenant_id"
  ]
}
```

### 5. createQuote
```json
{
  "type": "object",
  "properties": {
    "client_id": {
      "description": "Client ID for the quote",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "labor_rate": {
      "description": "Hourly labor rate (default: $75/hour)",
      "type": "number"
    },
    "service_id": {
      "description": "Service ID for the quote",
      "type": "string"
    },
    "description": {
      "description": "Description of the work to be quoted",
      "type": "string"
    },
    "materials_cost": {
      "description": "Cost of materials needed",
      "type": "number"
    },
    "estimated_hours": {
      "description": "Estimated hours for the work",
      "type": "number"
    }
  },
  "required": [
    "tenant_id",
    "client_id",
    "service_id"
  ]
}
```

### 6. rescheduleAppointment
```json
{
  "type": "object",
  "properties": {
    "reason": {
      "description": "Reason for rescheduling (optional)",
      "type": "string"
    },
    "new_date": {
      "description": "New appointment date (YYYY-MM-DD format)",
      "type": "string"
    },
    "new_time": {
      "description": "New appointment time (HH:MM format)",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "appointment_id": {
      "description": "ID of the appointment to reschedule",
      "type": "string"
    }
  },
  "required": [
    "tenant_id",
    "appointment_id",
    "new_date",
    "new_time"
  ]
}
```

### 7. getClientDetails
```json
{
  "type": "object",
  "properties": {
    "email": {
      "description": "Client's email address",
      "type": "string"
    },
    "phone": {
      "description": "Client's phone number",
      "type": "string"
    },
    "client_id": {
      "description": "Client ID to get details for",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id"
  ]
}
```

### 8. getBusinessHours
```json
{
  "type": "object",
  "properties": {
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id"
  ]
}
```

### 9. cancelAppointment
```json
{
  "type": "object",
  "properties": {
    "reason": {
      "description": "Reason for cancellation (optional)",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "appointment_id": {
      "description": "ID of the appointment to cancel",
      "type": "string"
    }
  },
  "required": [
    "tenant_id",
    "appointment_id"
  ]
}
```

### 10. updateAppointment
```json
{
  "type": "object",
  "properties": {
    "notes": {
      "description": "Additional notes for the appointment",
      "type": "string"
    },
    "status": {
      "description": "New status (scheduled, confirmed, completed, cancelled)",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "appointment_id": {
      "description": "ID of the appointment to update",
      "type": "string"
    },
    "scheduled_date": {
      "description": "New appointment date (YYYY-MM-DD format)",
      "type": "string"
    },
    "scheduled_time": {
      "description": "New appointment time (HH:MM format)",
      "type": "string"
    }
  },
  "required": [
    "tenant_id",
    "appointment_id"
  ]
}
```

### 11. createClient
```json
{
  "type": "object",
  "properties": {
    "name": {
      "description": "Client's full name",
      "type": "string"
    },
    "email": {
      "description": "Client's email address (optional)",
      "type": "string"
    },
    "phone": {
      "description": "Client's phone number",
      "type": "string"
    },
    "address": {
      "description": "Client's address (optional)",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id",
    "name",
    "phone"
  ]
}
```

### 12. lookupClient
```json
{
  "type": "object",
  "properties": {
    "email": {
      "description": "Email address to search for existing client (optional if phone provided)",
      "type": "string"
    },
    "phone": {
      "description": "Phone number to search for existing client (optional if email provided)",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id"
  ]
}
```

### 13. bookAppointment
```json
{
  "type": "object",
  "properties": {
    "notes": {
      "description": "Additional notes or special requirements",
      "type": "string"
    },
    "starts_at": {
      "description": "Appointment start time in ISO format (YYYY-MM-DDTHH:mm:ssZ)",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "service_id": {
      "description": "ID of the service to book",
      "type": "string"
    },
    "client_name": {
      "description": "Customer's full name",
      "type": "string"
    },
    "client_email": {
      "description": "Customer's email address (optional)",
      "type": "string"
    },
    "client_phone": {
      "description": "Customer's phone number",
      "type": "string"
    },
    "client_address": {
      "description": "Service address where work will be performed",
      "type": "string"
    }
  },
  "required": [
    "tenant_id",
    "client_name",
    "client_phone",
    "client_address",
    "service_id",
    "starts_at"
  ]
}
```

### 14. getAvailability
```json
{
  "type": "object",
  "properties": {
    "date": {
      "description": "Date to check availability (YYYY-MM-DD format)",
      "type": "string"
    },
    "days": {
      "description": "Number of days to check availability (default: 7)",
      "type": "number"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id"
  ]
}
```

### 15. getServices
```json
{
  "type": "object",
  "properties": {
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id"
  ]
}
```

### 16. getPricing
```json
{
  "type": "object",
  "properties": {
    "service_id": {
      "description": "Service ID to get pricing for",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id",
    "service_id"
  ]
}
```

### 17. getServiceKeywords
```json
{
  "type": "object",
  "properties": {
    "tenant_id": {
      "description": "Tenant ID to get service keywords for",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id"
  ]
}
```

### 18. checkEmergencyRequest
```json
{
  "type": "object",
  "properties": {
    "client_request": {
      "description": "The client's description to check for emergency indicators",
      "type": "string"
    }
  },
  "required": [
    "client_request"
  ]
}
```

### 19. endCall
```json
{
  "type": "object",
  "properties": {
    "call_id": {
      "description": "ID of the call to end",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "summary": {
      "description": "Brief summary of the call outcome",
      "type": "string"
    }
  },
  "required": [
    "tenant_id",
    "call_id"
  ]
}
```

### 20. getAppointments
```json
{
  "type": "object",
  "properties": {
    "date": {
      "description": "Date to get appointments for (YYYY-MM-DD format)",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "status": {
      "description": "Filter by appointment status (optional)",
      "type": "string"
    }
  },
  "required": [
    "tenant_id"
  ]
}
```

### 21. getClientAppointments
```json
{
  "type": "object",
  "properties": {
    "client_id": {
      "description": "Client ID to get appointments for",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "status": {
      "description": "Filter by appointment status (optional)",
      "type": "string"
    }
  },
  "required": [
    "tenant_id",
    "client_id"
  ]
}
```

### 22. updateClient
```json
{
  "type": "object",
  "properties": {
    "client_id": {
      "description": "Client ID to update",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    },
    "name": {
      "description": "Updated client name (optional)",
      "type": "string"
    },
    "email": {
      "description": "Updated client email (optional)",
      "type": "string"
    },
    "phone": {
      "description": "Updated client phone (optional)",
      "type": "string"
    },
    "address": {
      "description": "Updated client address (optional)",
      "type": "string"
    }
  },
  "required": [
    "tenant_id",
    "client_id"
  ]
}
```

### 23. checkServiceAvailability
```json
{
  "type": "object",
  "properties": {
    "service_id": {
      "description": "Service ID to check availability for",
      "type": "string"
    },
    "tenant_id": {
      "description": "Tenant ID for the company",
      "type": "string",
      "default": "add-tenant-id-of-the-company"
    }
  },
  "required": [
    "tenant_id",
    "service_id"
  ]
}
```

## Implementation Notes

- **All tools must be implemented as async functions**
- **Strict mode must be enabled for all tool implementations**
- **Each tool should include proper error handling and validation**
- **Tools should return consistent response formats**
- **All database operations should use the tenant_id for proper data isolation**
- **Default tenant_id is set to "add-tenant-id-of-the-company" for all tools**
- **Multi-tenancy is enforced at the database level using tenant_id filtering**
- **When configuring in VAPI dashboard, use the default values provided in the JSON schemas**