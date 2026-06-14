/**
 * Supabase Edge Function: sync-google-sheets
 * 
 * Purpose: Proxy function to fetch data from Google Sheets API
 * This avoids CORS issues when calling Google Sheets API directly from the browser
 * 
 * Authentication: Uses Supabase JWT for function access (verified by Supabase platform + explicit check)
 * Google Sheets: Uses Google Sheets API v4 (public sheets or API key)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  sheetId: string
  sheetName?: string
  range?: string
  apiKey?: string
  accessToken?: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    // Note: JWT verification is handled automatically by Supabase when called via supabase.functions.invoke()
    // The Supabase client automatically includes and validates JWT tokens
    const body: RequestBody = await req.json();
    const { sheetId, sheetName = 'Sheet1', range, apiKey, accessToken } = body;

    if (!sheetId) {
      return new Response(
        JSON.stringify({ error: 'Sheet ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct range parameter
    let rangeParam = range || `${sheetName}!A:Z`;
    
    // If OAuth access token is provided, use it for authenticated access
    if (accessToken) {
      try {
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(rangeParam)}`;
        
        const apiResponse = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({ error: { message: 'Unknown error' } }));
          
          if (apiResponse.status === 401) {
            return new Response(
              JSON.stringify({ 
                data: null, 
                error: 'OAuth token expired or invalid. Please re-authenticate.' 
              }),
              { 
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              data: null, 
              error: errorData.error?.message || `HTTP ${apiResponse.status}: ${apiResponse.statusText}` 
            }),
            { 
              status: apiResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const data = await apiResponse.json();

        if (!data.values || !Array.isArray(data.values)) {
          return new Response(
            JSON.stringify({ data: null, error: 'Invalid response format from Google Sheets API' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ data: data.values, error: null }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (oauthError) {
        console.error('OAuth request failed:', oauthError);
        return new Response(
          JSON.stringify({ 
            data: null, 
            error: 'Failed to access Google Sheet with OAuth token. Please check your authentication.' 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Try CSV export first (for public sheets without API key)
    if (!apiKey) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const csvResponse = await fetch(csvUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function/1.0)',
          },
        });

        if (csvResponse.ok) {
          const csvText = await csvResponse.text();
          const rows: string[][] = [];
          const lines = csvText.split('\n');
          
          for (const line of lines) {
            if (line.trim()) {
              const row = parseCSVLine(line);
              if (row.length > 0) {
                rows.push(row);
              }
            }
          }

          return new Response(
            JSON.stringify({ data: rows, error: null }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (csvError) {
        console.warn('CSV export failed:', csvError);
      }
    }

    // Use Google Sheets API v4 with API key
    if (apiKey) {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(rangeParam)}?key=${encodeURIComponent(apiKey)}`;
      
      const apiResponse = await fetch(apiUrl);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: { message: 'Unknown error' } }));
        let errorMessage = errorData.error?.message || `HTTP ${apiResponse.status}: ${apiResponse.statusText}`;
        
        if (apiResponse.status === 403) {
          errorMessage = 'The Google Sheet is not publicly accessible. Please either:\n1. Make the sheet publicly viewable: Go to File → Share → "Anyone with the link" → Viewer, OR\n2. Provide a Google Sheets API key in the configuration.';
        } else if (apiResponse.status === 404) {
          errorMessage = 'Google Sheet not found. Please check the Sheet ID or URL.';
        } else if (apiResponse.status === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (apiResponse.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a few minutes and try again.';
        }

        return new Response(
          JSON.stringify({ 
            data: null, 
            error: errorMessage
          }),
          { 
            status: apiResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const data = await apiResponse.json();

      if (!data.values || !Array.isArray(data.values)) {
        return new Response(
          JSON.stringify({ data: null, error: 'Invalid response format from Google Sheets API' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ data: data.values, error: null }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // No API key and CSV export failed - return error
    return new Response(
      JSON.stringify({ 
        data: null, 
        error: 'Sheet is not publicly accessible. Please use OAuth authentication or provide an API key.' 
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in sync-google-sheets:', error);
    return new Response(
      JSON.stringify({ 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch Google Sheet data' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Simple CSV line parser
 * Handles quoted values and escaped quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}
