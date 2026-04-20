# CRAVAB Vapi Tools Reference (24)

Use this as the quick copy/paste validation sheet after importing `vapi/tools/functions.json`.

Common response envelope from webhook tools:

```json
{
  "success": true,
  "data": {}
}
```

On failures, expect:

```json
{
  "success": false,
  "error": "message"
}
```

---

## 1) `getCurrentDate`
Example input:
```json
{}
```
Expected `data` keys: date/time context fields (used for relative-date math).

## 2) `checkServiceArea`
Example input:
```json
{
  "address": "123 Main St, Austin, TX",
  "zip_code": "78701"
}
```
Expected `data` keys: serviceability fields (including serviceable status, distance/eta when available).

## 3) `findServiceForClient`
Example input:
```json
{
  "client_request": "Leaking kitchen sink pipe"
}
```
Expected `data` keys: matched service and confidence/keyword metadata.

## 4) `getPricingInfo`
Example input:
```json
{
  "service_description": "Water heater issue",
  "is_emergency": false
}
```
Expected `data` keys: ballpark pricing range and follow-up/pricing context.

## 5) `getPricingDetails` (alias of `getPricingInfo`)
Example input:
```json
{
  "service_description": "Drain cleaning",
  "is_emergency": true
}
```
Expected behavior: routed to same handler/output shape as `getPricingInfo`.

## 6) `bookAppointment`
Example input:
```json
{
  "starts_at": "2026-04-21T14:00:00",
  "client_name": "Jane Doe",
  "client_phone": "+15125551234",
  "client_email": "jane@example.com",
  "client_address": "123 Main St, Austin, TX",
  "service_id": "service-uuid",
  "notes": "Call before arrival"
}
```
Expected `data` keys: created appointment identifiers/details.

## 7) `getServices`
Example input:
```json
{}
```
Expected `data` keys: list of active services.

## 8) `getAvailability`
Example input:
```json
{
  "date": "2026-04-22",
  "days": 3
}
```
Expected `data` keys: available slots/date window.

## 9) `getBusinessHours`
Example input:
```json
{}
```
Expected `data` keys: business hours and scheduling constraints.

## 10) `createClient`
Example input:
```json
{
  "name": "Jane Doe",
  "phone": "+15125551234",
  "email": "jane@example.com",
  "address": "123 Main St, Austin, TX"
}
```
Expected `data` keys: created client record/ID.

## 11) `lookupClient`
Example input:
```json
{
  "phone": "+15125551234",
  "email": "jane@example.com"
}
```
Expected `data` keys: existing client (or not-found status).

## 12) `getClientDetails`
Example input:
```json
{
  "client_id": "client-uuid"
}
```
Expected `data` keys: detailed client profile.

## 13) `getPricing`
Example input:
```json
{
  "service_id": "service-uuid",
  "service_name": "Drain cleaning"
}
```
Expected `data` keys: detailed pricing for a specific service.

## 14) `createQuote`
Example input:
```json
{
  "service_id": "service-uuid",
  "client_id": "client-uuid",
  "issue_description": "Kitchen sink leak and low pressure"
}
```
Expected `data` keys: quote payload/estimate details.

## 15) `rescheduleAppointment`
Example input:
```json
{
  "appointment_id": "appointment-uuid",
  "starts_at": "2026-04-23T10:30:00"
}
```
Expected `data` keys: updated appointment info.

## 16) `cancelAppointment`
Example input:
```json
{
  "appointment_id": "appointment-uuid",
  "reason": "Customer unavailable"
}
```
Expected `data` keys: cancellation confirmation/status.

## 17) `updateAppointment`
Example input:
```json
{
  "appointment_id": "appointment-uuid",
  "notes": "Gate code 1234",
  "status": "confirmed"
}
```
Expected `data` keys: updated appointment fields.

## 18) `getAppointments`
Example input:
```json
{
  "date": "2026-04-22",
  "status": "scheduled"
}
```
Expected `data` keys: appointments for the filter window.

## 19) `getClientAppointments`
Example input:
```json
{
  "client_id": "client-uuid"
}
```
Expected `data` keys: appointment list for that client.

## 20) `updateClient`
Example input:
```json
{
  "client_id": "client-uuid",
  "name": "Jane A. Doe",
  "phone": "+15125550000",
  "email": "jane.doe@example.com",
  "address": "456 Oak Ave, Austin, TX"
}
```
Expected `data` keys: updated client profile.

## 21) `getServiceKeywords`
Example input:
```json
{}
```
Expected `data` keys: keyword map used by service matching.

## 22) `checkEmergencyRequest`
Example input:
```json
{
  "request_text": "My basement is flooding right now"
}
```
Expected `data` keys: urgency classification/flags.

## 23) `checkServiceAvailability`
Example input:
```json
{
  "service_id": "service-uuid",
  "requested_date": "2026-04-23"
}
```
Expected `data` keys: service availability result for requested date.

## 24) `endCall`
Example input:
```json
{
  "call_id": "call-uuid",
  "summary": "Booked appointment for 2026-04-23 at 10:30 AM"
}
```
Expected `data` keys: call close acknowledgement/persist status.

---

## Quick completeness checks

- `functions.json` should contain 24 tool names.
- Webhook route should accept both `getPricingInfo` and `getPricingDetails`.
- Prompt should list the same 24-function set.
