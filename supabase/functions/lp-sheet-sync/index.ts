// Supabase Edge Function: lp-sheet-sync
// Fetches LP items from Google Sheets tabs (LQ, CFLN, Non-Drug) and syncs them to drugs and non_drugs tables

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple state-machine CSV parser
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current.trim());
        current = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && next === '\n') {
          i++; // Skip \n
        }
        row.push(current.trim());
        result.push(row);
        row = [];
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  if (row.length > 0 || current !== '') {
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
}

// Helper to derive dosage form from name and packaging description
function deriveDosageForm(productName: string, pkgDesc: string): string {
  const text = `${productName} ${pkgDesc}`.toLowerCase();
  if (text.includes('tablet') || text.includes('tab')) return 'tablet';
  if (text.includes('capsule') || text.includes('cap')) return 'capsule';
  if (text.includes('injection') || text.includes('inj') || text.includes('vial') || text.includes('ampoule')) return 'injection';
  if (text.includes('syrup') || text.includes('syr')) return 'syrup';
  if (text.includes('suspension') || text.includes('susp')) return 'suspension';
  if (text.includes('ointment') || text.includes('oint')) return 'ointment';
  if (text.includes('cream')) return 'cream';
  if (text.includes('drop')) return 'drops';
  if (text.includes('inhaler') || text.includes('inhalation') || text.includes('puff')) return 'inhaler';
  if (text.includes('patch')) return 'patch';
  if (text.includes('suppository') || text.includes('supp')) return 'suppository';
  if (text.includes('powder')) return 'powder';
  if (text.includes('solution') || text.includes('soln')) return 'solution';
  if (text.includes('lotion')) return 'lotion';
  if (text.includes('liquid')) return 'liquid';
  if (text.includes('granules')) return 'granules';
  if (text.includes('spray')) return 'spray';
  if (text.includes('enema')) return 'enema';
  if (text.includes('gel')) return 'gel';
  if (text.includes('aerosol')) return 'aerosol';
  return 'other';
}

function parsePrice(val: string): number | null {
  if (!val) return null;
  const clean = val.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? null : parsed;
}

function parseInteger(val: string): number | null {
  if (!val) return null;
  const clean = val.replace(/[^0-9-]/g, ''); // Allow negative balance/quota adjustments
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? null : parsed;
}

function parseDate(val: string): string | null {
  if (!val || val.toLowerCase() === 'not applicable' || val.toLowerCase() === 'in progress') return null;
  
  // Clean value
  const cleanVal = val.trim();

  // Handle DD/MM/YYYY
  if (cleanVal.includes('/')) {
    const slashes = cleanVal.split('/');
    if (slashes.length === 3) {
      const day = parseInt(slashes[0], 10);
      const month = parseInt(slashes[1], 10);
      let year = parseInt(slashes[2], 10);
      if (year < 100) {
        year += year > 50 ? 1900 : 2000;
      }
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Handle DD.MM.YY or DD.MM.YYYY
  if (cleanVal.includes('.')) {
    const dots = cleanVal.split('.');
    if (dots.length === 3) {
      const day = parseInt(dots[0], 10);
      const month = parseInt(dots[1], 10);
      let year = parseInt(dots[2], 10);
      if (year < 100) {
        year += year > 50 ? 1900 : 2000;
      }
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  try {
    const d = new Date(cleanVal);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { hospital_id } = body;

    if (!hospital_id) {
      return new Response(
        JSON.stringify({ error: 'hospital_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sheetId = '1wZ51z75XwDOS3sWgp_N-4-Jv_m9LRjH1OHDzFzPKm4Q';
    
    // Define tab GIDs
    const tabs = [
      { name: 'PFB: Ubat Sebut Harga (LQ)', gid: '1798977390', type: 'lq' },
      { name: 'PFB: Ubat CFLN', gid: '1387022075', type: 'cfln' },
      { name: 'PFB: Non Drug', gid: '2121929903', type: 'non_drug' },
    ];

    let totalFetched = 0;
    let drugsUpsertedTotal = 0;
    let nonDrugsUpsertedTotal = 0;

    for (const tab of tabs) {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${tab.gid}`;
      console.log(`Fetching tab "${tab.name}" from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch tab "${tab.name}": ${response.statusText}`);
      }

      const csvText = await response.text();
      const rows = parseCSV(csvText);
      console.log(`Parsed ${rows.length} rows for tab "${tab.name}"`);

      // Filter rows that have a valid PHIS Code/Code
      const dataRows = rows.slice(2).filter(row => {
        // Row 0 is title, Row 1 is header, data starts at Row 2.
        // Code is in column index 2 (LQ), 1 (CFLN), 1 (Non Drug)
        const codeIndex = tab.type === 'lq' ? 2 : 1;
        return row.length > 5 && row[codeIndex] && row[codeIndex].trim() !== '' && !row[codeIndex].includes('Code') && !row[codeIndex].includes('CODE');
      });

      totalFetched += dataRows.length;
      console.log(`Found ${dataRows.length} valid data rows for type ${tab.type}`);

      if (tab.type === 'lq') {
        const drugUpserts = dataRows.map(row => {
          const startDate = parseDate(row[0]);
          const endDate = parseDate(row[1]);
          const drugCode = row[2].trim();
          const name = row[3].trim();
          const pkgDesc = row[4].trim();
          const price = parsePrice(row[5]);
          const remarks = row[6].trim();
          const rxCategory = row[7].trim();
          const quota = parseInteger(row[8]);
          const balance = parseInteger(row[9]);
          const dosageForm = deriveDosageForm(name, pkgDesc);

          return {
            hospital_id,
            drug_code: drugCode,
            drug_name: name,
            generic_name: name,
            dosage_form: dosageForm,
            unit_of_measure: 'unit', // default fallback
            status: 'active',
            procurement_vote: 'lp',
            price,
            packaging_description: pkgDesc,
            lp_start_date: startDate,
            lp_end_date: endDate,
            lp_remarks: remarks,
            lp_rx_category: rxCategory,
            lp_quota: quota,
            lp_balance: balance,
            lp_type: 'sebut_harga_lq',
            last_synced_from_sheet: new Date().toISOString(),
            sheet_source: `Google Sheet LP - ${tab.name}`,
          };
        });

        // Upsert in chunks
        const CHUNK_SIZE = 100;
        for (let i = 0; i < drugUpserts.length; i += CHUNK_SIZE) {
          const chunk = drugUpserts.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase
            .from('drugs')
            .upsert(chunk, { onConflict: 'hospital_id, drug_code' });
          if (error) {
            console.error('Error upserting LQ drugs chunk:', error);
            throw error;
          }
        }
        drugsUpsertedTotal += drugUpserts.length;

      } else if (tab.type === 'cfln') {
        const drugUpserts = dataRows.map(row => {
          const subclass = row[0].trim();
          const drugCode = row[1].trim();
          const name = row[2].trim();
          const sku = row[3].trim().toLowerCase();
          const pkgDesc = row[4].trim();
          const remarks = row[5].trim();
          const rxCategory = row[6].trim();
          const balance = parseInteger(row[7]);
          const dosageForm = deriveDosageForm(name, pkgDesc);

          return {
            hospital_id,
            drug_code: drugCode,
            drug_name: name,
            generic_name: name,
            dosage_form: dosageForm,
            unit_of_measure: sku || 'unit',
            status: 'active',
            procurement_vote: 'lp',
            price: null,
            packaging_description: pkgDesc,
            lp_remarks: remarks,
            lp_rx_category: rxCategory,
            lp_quota: null,
            lp_balance: balance,
            lp_type: 'cfln',
            item_sub_class: subclass,
            last_synced_from_sheet: new Date().toISOString(),
            sheet_source: `Google Sheet LP - ${tab.name}`,
          };
        });

        const CHUNK_SIZE = 100;
        for (let i = 0; i < drugUpserts.length; i += CHUNK_SIZE) {
          const chunk = drugUpserts.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase
            .from('drugs')
            .upsert(chunk, { onConflict: 'hospital_id, drug_code' });
          if (error) {
            console.error('Error upserting CFLN drugs chunk:', error);
            throw error;
          }
        }
        drugsUpsertedTotal += drugUpserts.length;

      } else if (tab.type === 'non_drug') {
        const nonDrugUpserts = dataRows.map(row => {
          const contract = row[0].trim();
          let startDate: string | null = null;
          let endDate: string | null = null;
          
          if (contract.includes('-')) {
            const parts = contract.split('-');
            if (parts[0]) startDate = parseDate(parts[0].trim());
            if (parts[1]) endDate = parseDate(parts[1].trim());
          } else {
            startDate = parseDate(contract);
          }

          const itemCode = row[1].trim();
          const name = row[2].trim();
          const pku = row[3].trim();
          const remarks = row[4].trim();
          const price = parsePrice(row[5]);
          const quota = parseInteger(row[6]);
          const balance = parseInteger(row[7]);

          return {
            hospital_id,
            item_code: itemCode,
            item_name: name,
            unit_of_measure: pku || 'unit',
            status: 'active',
            procurement_vote: 'lp',
            price,
            packaging_description: remarks,
            lp_start_date: startDate,
            lp_end_date: endDate,
            lp_quota: quota,
            lp_balance: balance,
            lp_type: 'non_drug',
            lp_remarks: remarks,
            last_synced_from_sheet: new Date().toISOString(),
            sheet_source: `Google Sheet LP - ${tab.name}`,
          };
        });

        const CHUNK_SIZE = 100;
        for (let i = 0; i < nonDrugUpserts.length; i += CHUNK_SIZE) {
          const chunk = nonDrugUpserts.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase
            .from('non_drugs')
            .upsert(chunk, { onConflict: 'hospital_id, item_code' });
          if (error) {
            console.error('Error upserting LP non_drugs chunk:', error);
            throw error;
          }
        }
        nonDrugsUpsertedTotal += nonDrugUpserts.length;
      }

      // Record detailed logs per tab
      await supabase
        .from('lp_sync_logs')
        .insert({
          hospital_id,
          status: 'success',
          sheet_tab: tab.name,
          rows_fetched: dataRows.length,
          drugs_upserted: tab.type === 'non_drug' ? 0 : dataRows.length,
          non_drugs_upserted: tab.type === 'non_drug' ? dataRows.length : 0,
          triggered_by: 'manual',
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'LP allocation catalog sync completed successfully',
        total_rows_processed: totalFetched,
        drugs_upserted: drugsUpsertedTotal,
        non_drugs_upserted: nonDrugsUpsertedTotal,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('LP Sync Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error during LP sync' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
