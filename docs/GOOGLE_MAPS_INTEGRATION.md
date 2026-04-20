# Google Maps Integration

## Purpose

CRAVAB uses Google Maps APIs for distance, geocoding, and ETA-related features.

## Required environment variable

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

## Integration points

- Map rendering and location input
- Service area distance/ETA computations
- Optional address normalization flows

## Operational notes

- Restrict API key by domain and API scope.
- Monitor quota and set billing alerts.
- Gracefully handle missing/invalid coordinates in client and appointment flows.
