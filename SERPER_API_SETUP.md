# Serper API Setup Guide

## Quick Setup Steps

### 1. Get Your Serper API Key

1. Go to https://serper.dev
2. Sign up for a free account (no credit card required)
3. Free tier includes: **2,500 searches/month**
4. Copy your API key from the dashboard

### 2. Create `.env` File

Create a `.env` file in the root directory (`d:\MY HOME\.env`) with the following content:

```env
# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# App Configuration (if not already set)
VITE_APP_NAME=HOME
VITE_APP_VERSION=1.0.0

# Serper API - for real-time Google search
VITE_SERPER_API_KEY=your-serper-api-key-here
```

**Replace `your-serper-api-key-here` with your actual Serper API key.**

### 3. Restart Development Server

After adding the API key, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 4. Test the Integration

1. Go to System Admin → Hospitals → Add New Hospital
2. Click "AI Assistant" button
3. Enter a hospital name (e.g., "Hospital Lawas")
4. The system will:
   - Search Google via Serper API
   - Extract real phone, email, address
   - Show preview for review
   - Apply to form

## How It Works

```
User enters "Hospital Lawas"
    ↓
System searches Google (via Serper API)
    ↓
Gets real search results with contact info
    ↓
AI extracts and structures the data
    ↓
User reviews in preview modal
    ↓
Applies to form
```

## Current Configuration

✅ **Web Search**: Enabled (`USE_WEB_SEARCH = true`)
✅ **AI Extraction**: Enabled (`USE_PATTERN_MATCHING_ONLY = false`)
✅ **Serper Integration**: Ready (needs API key)

## Troubleshooting

### "No search results found"
- Check that `VITE_SERPER_API_KEY` is set in `.env`
- Verify API key is correct on Serper dashboard
- Check browser console for errors
- Ensure dev server was restarted after adding key

### "Rate limit exceeded"
- Free tier: 2,500 searches/month
- Check usage on Serper dashboard
- Wait for monthly reset or upgrade plan

### "API key not found"
- Make sure `.env` file is in root directory
- Check file name is exactly `.env` (not `.env.txt`)
- Restart dev server after creating/updating `.env`
- Check that key starts with your actual Serper key

## Alternative: Tavily API

If you prefer Tavily API instead:

1. Sign up at https://tavily.com
2. Get your API key
3. Add to `.env`:
   ```env
   VITE_TAVILY_API_KEY=your-tavily-key-here
   ```
4. The system will automatically use Tavily if Serper is not available

## Need Help?

- Serper Documentation: https://serper.dev/docs
- Serper Dashboard: https://serper.dev/dashboard
- Check `AI_INTEGRATION_GUIDE.md` for more details

