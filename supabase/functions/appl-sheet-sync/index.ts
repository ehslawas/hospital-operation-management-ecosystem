// Supabase Edge Function: appl-sheet-sync
// Fetches APPL items from Google Sheets (Lampiran B) and syncs them to drugs, non_drugs, and approved suppliers tables

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
  const trimmed = val.trim();
  if (trimmed.startsWith('-')) return null;
  const clean = trimmed.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
}

function parseDate(val: string): string | null {
  if (!val || val === '-' || val.toLowerCase() === 'not applicable' || val.toLowerCase() === 'in progress') return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function cleanCode(code: string | undefined): string {
  if (!code) return '';
  const trimmed = code.trim();
  if (trimmed === '-' || trimmed === 'N/A' || trimmed.toLowerCase().startsWith('iklan') || trimmed.toLowerCase().startsWith('tiada')) {
    return '';
  }
  return trimmed;
}

function deriveApplStatus(
  newKod: string,
  priceVal: number | null,
  priceNextVal: number | null,
  notes: string | undefined
): 'active' | 'inactive' {
  const n = (notes || '').toLowerCase();

  // Explicit deactivation / suspension / termination keywords in KKM notes
  if (
    n.includes('dinyahaktif') ||
    n.includes('habis dibekalkan') ||
    n.includes('pembatalan') ||
    n.includes('digantung') ||
    n.includes('disekat') ||
    n.includes('tidak aktif')
  ) {
    return 'inactive';
  }

  // Active concession purchase indicators
  if (
    n.includes('boleh dibeli melalui konsesi') ||
    n.includes('boleh dibeli di bawah konsesi') ||
    n.includes('boleh dipesan')
  ) {
    return 'active';
  }

  // If new 2023-2026 contract code exists and price is valid
  if (newKod && (priceVal !== null || priceNextVal !== null)) {
    return 'active';
  }

  // If no new contract code and no valid 2023-2026 price
  if (!newKod && priceVal === null && priceNextVal === null) {
    return 'inactive';
  }

  return priceVal !== null || priceNextVal !== null ? 'active' : 'inactive';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const body = await req.json().catch(() => ({}));
    const { hospital_id } = body;

    if (!hospital_id) {
      return new Response(
        JSON.stringify({ error: 'hospital_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase Client using Service Role Key to bypass RLS policies for ingestion
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Google Sheets Lampiran B CSV export URL
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1ZbzRsdXs853IlC4wq72OuY0F4-_EVhpTht20DUVwUKw/export?format=csv&gid=1936850554';
    
    console.log(`Fetching APPL sheet from: ${sheetUrl}`);
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log(`Fetched CSV, size: ${csvText.length} bytes`);

    const rows = parseCSV(csvText);
    console.log(`Parsed CSV, total rows: ${rows.length}`);

    // Detect header row index
    let headerIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 25); i++) {
      if (rows[i] && (rows[i][0] === 'Bil.' || (rows[i][1] && rows[i][1].toLowerCase().includes('kod')))) {
        headerIdx = i;
        break;
      }
    }
    const startIdx = headerIdx >= 0 ? headerIdx + 1 : 2;

    // Filter valid data rows
    const dataRows = rows.slice(startIdx).filter(row => {
      if (!row || row.length < 5) return false;
      const rawKod = cleanCode(row[1]);
      const newKod = cleanCode(row[2]);
      const itemName = (row[4] || '').trim();
      if (!itemName || itemName.toLowerCase() === 'produk') return false;
      if (!rawKod && !newKod) return false;
      return true;
    });

    console.log(`Processing ${dataRows.length} valid rows (drugs + non-drugs)`);

    const drugRows: string[][] = [];
    const nonDrugRows: string[][] = [];

    for (const row of dataRows) {
      const rawKod = cleanCode(row[1]);
      const newKod = cleanCode(row[2]);
      const cat = (row[5] || '').trim().toLowerCase();

      const isDrug = cat === 'ubat' || (newKod.startsWith('D') && cat !== 'bukan ubat');
      const isNonDrug = cat === 'bukan ubat' || (newKod.startsWith('N') && cat !== 'ubat');

      if (isNonDrug) {
        nonDrugRows.push(row);
      } else if (isDrug) {
        drugRows.push(row);
      } else {
        if (newKod.startsWith('N') || rawKod.startsWith('09') || rawKod.startsWith('10') || rawKod.startsWith('12') || rawKod.startsWith('17') || rawKod.startsWith('20') || rawKod.startsWith('25') || rawKod.startsWith('46')) {
          nonDrugRows.push(row);
        } else {
          drugRows.push(row);
        }
      }
    }

    console.log(`Found ${drugRows.length} drug rows and ${nonDrugRows.length} non-drug rows`);

    // --- 1. DRUGS ---
    const groupedDrugs = new Map<string, any[]>();
    for (const row of drugRows) {
      const rawKod = cleanCode(row[1]);
      const newKod = cleanCode(row[2]);
      const drugCode = newKod || rawKod;
      if (!drugCode) continue;
      if (!groupedDrugs.has(drugCode)) {
        groupedDrugs.set(drugCode, []);
      }
      groupedDrugs.get(drugCode)!.push(row);
    }

    const drugUpserts: any[] = [];
    const suppliersByDrugCode = new Map<string, any[]>();

    for (const [drugCode, items] of groupedDrugs.entries()) {
      const primaryItem = items[0];
      const name = primaryItem[4];
      const rawKod = cleanCode(primaryItem[1]);
      const newKod = cleanCode(primaryItem[2]);
      const pkgDesc = primaryItem[6];
      const sku = primaryItem[7] || 'unit';
      const moq = primaryItem[8];
      const priceTrans = parsePrice(primaryItem[9]);
      const priceVal = parsePrice(primaryItem[10]);
      const priceNextVal = parsePrice(primaryItem[11]);
      const notes = primaryItem[17] || '';
      const itemStatus = deriveApplStatus(newKod, priceVal, priceNextVal, notes);
      const finalPrice = priceNextVal ?? priceVal ?? (itemStatus === 'active' ? priceTrans : null) ?? 0;
      const malNo = primaryItem[16];
      const effectiveDate = parseDate(primaryItem[18]);
      const originCountry = primaryItem[14];

      const dosageForm = deriveDosageForm(name, pkgDesc);

      drugUpserts.push({
        hospital_id,
        drug_code: drugCode,
        drug_name: name,
        generic_name: name,
        dosage_form: dosageForm,
        unit_of_measure: (sku || 'unit').toLowerCase(),
        min_stock_level: 0,
        status: itemStatus,
        procurement_vote: 'appl',
        appl_kod: rawKod || null,
        appl_code: drugCode,
        mal_mda_number: malNo || null,
        moq: moq || null,
        price_transition: priceTrans,
        price: finalPrice,
        price_next: priceNextVal,
        appl_effective_date: effectiveDate,
        country_of_origin: originCountry || null,
        packaging_description: pkgDesc || null,
        last_synced_from_sheet: new Date().toISOString(),
        sheet_source: 'Lampiran B',
      });

      const suppliersList: any[] = [];
      const seenSupplierNames = new Set<string>();
      for (const item of items) {
        const supplierName = item[12];
        if (!supplierName || supplierName === 'To Be Informed' || supplierName === 'In progress') continue;
        
        const suppKey = supplierName.trim().toLowerCase();
        if (seenSupplierNames.has(suppKey)) continue;
        seenSupplierNames.add(suppKey);
        
        suppliersList.push({
          hospital_id,
          drug_code: drugCode,
          supplier_name: supplierName,
          manufacturer_name: item[13] || null,
          country_of_origin: item[14] || null,
          brand_name: item[15] || null,
          mal_mda_number: item[16] || null,
          procurement_scheme: item[22] || null,
          appl_effective_date: parseDate(item[18]) || null,
          notes: item[17] || null,
        });
      }
      suppliersByDrugCode.set(drugCode, suppliersList);
    }

    // --- 2. NON-DRUGS ---
    const groupedNonDrugs = new Map<string, any[]>();
    for (const row of nonDrugRows) {
      const rawKod = cleanCode(row[1]);
      const newKod = cleanCode(row[2]);
      const itemCode = newKod || rawKod;
      if (!itemCode) continue;
      if (!groupedNonDrugs.has(itemCode)) {
        groupedNonDrugs.set(itemCode, []);
      }
      groupedNonDrugs.get(itemCode)!.push(row);
    }

    const nonDrugUpserts: any[] = [];
    for (const [itemCode, items] of groupedNonDrugs.entries()) {
      const primaryItem = items[0];
      const name = primaryItem[4];
      const rawKod = cleanCode(primaryItem[1]);
      const newKod = cleanCode(primaryItem[2]);
      const pkgDesc = primaryItem[6];
      const sku = primaryItem[7] || 'unit';
      const moq = primaryItem[8];
      const priceTrans = parsePrice(primaryItem[9]);
      const priceVal = parsePrice(primaryItem[10]);
      const priceNextVal = parsePrice(primaryItem[11]);
      const notes = primaryItem[17] || '';
      const itemStatus = deriveApplStatus(newKod, priceVal, priceNextVal, notes);
      const finalPrice = priceNextVal ?? priceVal ?? (itemStatus === 'active' ? priceTrans : null) ?? 0;
      const malNo = primaryItem[16];
      const effectiveDate = parseDate(primaryItem[18]);
      const originCountry = primaryItem[14];

      nonDrugUpserts.push({
        hospital_id,
        item_code: itemCode,
        item_name: name,
        unit_of_measure: (sku || 'unit').toLowerCase(),
        min_stock_level: 0,
        status: itemStatus,
        procurement_vote: 'appl',
        appl_kod: rawKod || null,
        appl_code: itemCode,
        mal_mda_number: malNo || null,
        moq: moq || null,
        price_transition: priceTrans,
        price: finalPrice,
        price_next: priceNextVal,
        appl_effective_date: effectiveDate,
        country_of_origin: originCountry || null,
        packaging_description: pkgDesc || null,
        cc_supplier_name: primaryItem[12] || null,
        cc_brand_name: primaryItem[15] || null,
        last_synced_from_sheet: new Date().toISOString(),
        sheet_source: 'Lampiran B',
      });
    }

    // --- 3. UPSERT DRUGS ---
    const CHUNK_SIZE = 100;
    let drugsUpsertedCount = 0;
    const drugIdMap = new Map<string, string>();

    for (let i = 0; i < drugUpserts.length; i += CHUNK_SIZE) {
      const chunk = drugUpserts.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from('drugs')
        .upsert(chunk, { onConflict: 'hospital_id, drug_code' })
        .select('id, drug_code');

      if (error) {
        console.error(`Error upserting drugs chunk:`, error);
        throw error;
      }

      if (data) {
        drugsUpsertedCount += data.length;
        for (const item of data) {
          drugIdMap.set(item.drug_code, item.id);
        }
      }
    }

    // --- 4. UPSERT NON-DRUGS ---
    let nonDrugsUpsertedCount = 0;
    for (let i = 0; i < nonDrugUpserts.length; i += CHUNK_SIZE) {
      const chunk = nonDrugUpserts.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from('non_drugs')
        .upsert(chunk, { onConflict: 'hospital_id, item_code' })
        .select('id, item_code');

      if (error) {
        console.error(`Error upserting non_drugs chunk:`, error);
        throw error;
      }
      if (data) {
        nonDrugsUpsertedCount += data.length;
      }
    }

    // --- 5. UPSERT APPROVED SUPPLIERS ---
    const supplierUpserts: any[] = [];
    for (const [drugCode, suppliers] of suppliersByDrugCode.entries()) {
      const drugId = drugIdMap.get(drugCode);
      if (!drugId) continue;

      for (const supplier of suppliers) {
        supplierUpserts.push({
          ...supplier,
          drug_id: drugId,
        });
      }
    }

    let suppliersUpsertedCount = 0;
    for (let i = 0; i < supplierUpserts.length; i += CHUNK_SIZE) {
      const chunk = supplierUpserts.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('appl_approved_suppliers')
        .upsert(chunk, { onConflict: 'hospital_id, drug_code, supplier_name' });

      if (error) {
        console.error(`Error upserting suppliers chunk:`, error);
        throw error;
      }
      suppliersUpsertedCount += chunk.length;
    }

    // Create sync log
    await supabase
      .from('appl_sync_logs')
      .insert({
        hospital_id,
        status: 'success',
        rows_fetched: dataRows.length,
        drugs_upserted: drugsUpsertedCount + nonDrugsUpsertedCount,
        suppliers_upserted: suppliersUpsertedCount,
        triggered_by: 'manual',
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'APPL sync completed successfully for drugs and non-drugs',
        rows_processed: dataRows.length,
        drugs_upserted: drugsUpsertedCount,
        non_drugs_upserted: nonDrugsUpsertedCount,
        suppliers_upserted: suppliersUpsertedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('APPL Sync Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error during APPL sync' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
