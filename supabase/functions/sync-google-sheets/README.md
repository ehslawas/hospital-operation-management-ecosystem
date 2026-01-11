# Sync Google Sheets Edge Function

This Supabase Edge Function acts as a proxy to fetch data from Google Sheets API, avoiding CORS issues when calling Google Sheets directly from the browser.

## Purpose

- Fetches data from Google Sheets API v4
- Handles authentication (JWT validation, API keys, OAuth tokens)
- Supports public sheets (via CSV export) and private sheets (via API key)
- Returns data as 2D array format for easy parsing

## Deployment

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy sync-google-sheets
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Click "Create a new function"
4. Name it `sync-google-sheets`
5. Copy the contents of `index.ts` into the function editor
6. Click "Deploy"

## Environment Variables

The function uses the following environment variables (set automatically by Supabase):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

## Request Format

```typescript
POST /functions/v1/sync-google-sheets
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheetName": "Sheet1",
  "range": "A1:Z1000",  // Optional
  "apiKey": "your-api-key",  // Optional
  "accessToken": "oauth-token"  // Optional
}
```

## Response Format

### Success Response

```typescript
{
  "data": [
    ["Header1", "Header2", "Header3"],
    ["Value1", "Value2", "Value3"],
    ["Value4", "Value5", "Value6"]
  ],
  "error": null
}
```

### Error Response

```typescript
{
  "data": null,
  "error": "Error message here"
}
```

## Authentication

### Public Sheets
- No API key required
- Sheet must be shared as "Anyone with the link can view"
- Uses CSV export format for simplicity

### Private Sheets
- Requires Google Sheets API key OR OAuth access token
- API key: Get from [Google Cloud Console](https://console.cloud.google.com/)
- OAuth token: Use Google OAuth 2.0 flow

## Error Handling

The function handles the following errors:

- **401 Unauthorized**: User not authenticated or invalid JWT
- **403 Forbidden**: Sheet not accessible (needs public sharing or API key)
- **404 Not Found**: Sheet ID is invalid or sheet was deleted
- **429 Too Many Requests**: Rate limited by Google Sheets API
- **500 Internal Server Error**: Unexpected error occurred

## Testing

### Test with cURL

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/sync-google-sheets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sheetId": "your-sheet-id",
    "sheetName": "Sheet1"
  }'
```

### Test with Public Sheet

Use a publicly shared Google Sheet:
1. Create or open a Google Sheet
2. Click "Share" → "Change" → "Anyone with the link" → "Viewer"
3. Copy the Sheet ID from the URL
4. Test the function with the Sheet ID

## Notes

- The function uses Deno runtime (Supabase Edge Functions standard)
- CSV parsing handles quoted values and escaped quotes
- For large sheets, consider using ranges to fetch data in chunks
- Rate limiting: Google Sheets API has quotas, be mindful of sync frequency
