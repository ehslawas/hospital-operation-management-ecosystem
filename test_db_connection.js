
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnBqbWRmdXR4ZGlvdHJidHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjYyODMsImV4cCI6MjA4MzE0MjI4M30.RGttkvzgTuFSNPXsffaaOIszD6-mn2CCaEH6teeMbdQ';

console.log(`Connecting to ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    const start = Date.now();
    console.log('Testing public table access (hospitals)...');

    const { data, error } = await supabase
        .from('hospitals')
        .select('id, hospital_name')
        .limit(5);

    const duration = Date.now() - start;

    if (error) {
        console.error('Connection FAIL:', error);
    } else {
        console.log(`Connection SUCCESS in ${duration}ms! Found ${data.length} hospitals.`);
        console.log(data);
    }
}

testConnection();
