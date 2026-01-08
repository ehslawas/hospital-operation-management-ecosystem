# AI Integration Guide for Hospital Information

## Current Setup

The system uses **OpenRouter AI API** with the `google/gemini-2.0-flash-exp:free` model for extracting hospital information from user input.

## The Problem

**Free AI models cannot:**
- Search Google or access real-time web data
- Look up real hospital phone numbers, emails, or addresses
- Access information beyond their training data (which may be outdated)

## Solutions

### Option 1: Use Pattern Matching (Current Default)
- ✅ No API calls, no rate limits
- ✅ Fast and reliable
- ❌ Only extracts from user input text
- ❌ Cannot search Google for real information

**Status:** Currently enabled by default

### Option 2: Use AI API (OpenRouter)
- ✅ Better extraction from text
- ✅ Can infer information from context
- ❌ Free tier has strict rate limits (429 errors)
- ❌ Cannot search Google for real data
- ❌ May generate incorrect information if not in training data

**Configuration:**
```typescript
// In src/services/aiService.ts
const USE_PATTERN_MATCHING_ONLY = false // Enable AI API
```

**API Key Setup:**
1. Get your OpenRouter API key from https://openrouter.ai
2. Add to `.env` file:
   ```
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

### Option 3: Web Search + AI (Recommended for Real Data)

This combines web search (to get real information from Google) with AI (to extract and structure it).

#### Step 1: Choose a Web Search API

**Option A: Serper API** (Recommended - Easy setup, good free tier)
- Sign up: https://serper.dev
- Free tier: 2,500 searches/month
- Simple API, good results

**Option B: Tavily API** (AI-powered search)
- Sign up: https://tavily.com
- Free tier available
- Better for structured data extraction

**Option C: Google Custom Search API** (Official)
- More complex setup
- Requires Google Cloud account
- 100 free searches/day

#### Step 2: Integrate Web Search

1. **Add API key to `.env`:**
   ```env
   VITE_SERPER_API_KEY=your-serper-key-here
   # OR
   VITE_TAVILY_API_KEY=your-tavily-key-here
   ```

2. **Update `webSearchService.ts`:**

   For Serper API:
   ```typescript
   export async function searchHospitalInfo(hospitalName: string): Promise<HospitalSearchResult> {
     const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY
     if (!SERPER_API_KEY) {
       return { hospitalName, searchResults: [] }
     }

     const response = await fetch('https://google.serper.dev/search', {
       method: 'POST',
       headers: {
         'X-API-KEY': SERPER_API_KEY,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         q: `${hospitalName} Malaysia contact phone address email`,
         num: 5,
       }),
     })

     const data = await response.json()
     
     return {
       hospitalName,
       searchResults: (data.organic || []).map((item: any) => ({
         title: item.title,
         snippet: item.snippet,
         link: item.link,
       })),
     }
   }
   ```

3. **Enable web search in `aiService.ts`:**
   ```typescript
   const USE_WEB_SEARCH = true // Enable web search before AI extraction
   ```

#### Step 3: How It Works

1. User enters hospital name (e.g., "Hospital Lawas")
2. System searches Google via Serper API
3. Gets real search results with phone, address, email
4. Passes results to AI for extraction and structuring
5. AI extracts structured data from search results
6. User reviews and edits in preview modal
7. Data is applied to form

### Option 4: Use Paid AI Model with Web Search

Some AI models have built-in web search:
- **Perplexity API** - Has web search built-in
- **Claude with web access** - Anthropic's web-enabled models
- **OpenAI GPT-4 with browsing** - Web search capability

**Example with Perplexity:**
```typescript
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'pplx-70b-online', // Online model with web search
    messages: [{
      role: 'user',
      content: `Find contact information for ${hospitalName} in Malaysia. Return JSON with phone, email, address.`
    }],
  }),
})
```

## Recommended Setup

For **real hospital information** from Google:

1. **Sign up for Serper API** (free tier: 2,500 searches/month)
2. **Add API key** to `.env`:
   ```
   VITE_SERPER_API_KEY=your-key-here
   ```
3. **Update `webSearchService.ts`** with Serper integration (code provided above)
4. **Enable web search** in `aiService.ts`:
   ```typescript
   const USE_WEB_SEARCH = true
   ```
5. **Keep AI enabled** for extraction:
   ```typescript
   const USE_PATTERN_MATCHING_ONLY = false
   ```

## Current Configuration

- ✅ Pattern matching: **Enabled** (always works, no API needed)
- ❌ AI API: **Disabled** (to avoid rate limits)
- ❌ Web search: **Not integrated** (requires API key)

## Testing

1. **Pattern matching only:**
   - Enter: "Hospital Lawas, Jalan Trusan, 98850 Lawas, Sarawak. Phone: 085-211 122"
   - System extracts: name, address, phone, state

2. **With AI API:**
   - Set `USE_PATTERN_MATCHING_ONLY = false`
   - Enter hospital name
   - AI extracts and structures information

3. **With Web Search + AI:**
   - Set `USE_WEB_SEARCH = true`
   - Enter: "Hospital Lawas"
   - System searches Google → Gets real info → AI extracts → Preview → Apply

## Troubleshooting

**Rate Limit Errors (429):**
- Free tier has strict limits
- Solution: Use pattern matching or upgrade to paid tier

**No Real Information:**
- Free AI models can't search Google
- Solution: Integrate web search API (Serper, Tavily)

**API Key Issues:**
- Check `.env` file has correct key
- Restart dev server after adding env variables
- Check API key is valid on provider's dashboard

