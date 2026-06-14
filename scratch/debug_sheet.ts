import { fetchGoogleSheetData } from './src/services/pharmacy/googleSheetsService';
import { supabase } from './src/services/supabase';

async function debugSheet() {
  const { data: config } = await supabase
    .from('google_sheets_sync_config')
    .select('*')
    .eq('sync_type', 'contracts')
    .limit(1)
    .single();

  if (!config) {
    console.error('No config found');
    return;
  }

  console.log('Fetching sheet:', config.sheet_id, config.sheet_name);
  const result = await fetchGoogleSheetData(config.sheet_id, config.sheet_name, config.range, config.api_key);
  
  if (result.error) {
    console.error('Fetch error:', result.error);
    return;
  }

  const rows = result.data;
  if (!rows || rows.length === 0) {
    console.error('No rows found');
    return;
  }

  console.log('Total rows:', rows.length);
  console.log('Header row (0):', rows[0]);
  console.log('First data row (1):', rows[1]);
  console.log('Second data row (2):', rows[2]);
}

debugSheet();
