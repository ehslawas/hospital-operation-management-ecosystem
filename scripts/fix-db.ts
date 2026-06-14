import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixDatabase() {
    console.log('🚀 Starting database fix...');

    try {
        // We try to add the column. 
        // Since we can't run raw SQL directly via supabase-js without an RPC,
        // we'll check if there's a 'exec_sql' or similar RPC.
        // If not, we'll inform the user.

        console.log('Attempting to add kkm_contract_number column to pharmacy_purchase_orders...');

        // Note: This requires an RPC named 'exec_sql' to exist in Supabase.
        // If it doesn't exist, this will fail.
        const { error } = await supabase.rpc('exec_sql', {
            sql_query: 'ALTER TABLE pharmacy_purchase_orders ADD COLUMN IF NOT EXISTS kkm_contract_number TEXT;'
        });

        if (error) {
            if (error.message.includes('function "exec_sql" does not exist')) {
                console.error('❌ RPC "exec_sql" not found. Please run the following SQL manually in Supabase SQL Editor:');
                console.log('\nALTER TABLE pharmacy_purchase_orders ADD COLUMN IF NOT EXISTS kkm_contract_number TEXT;\n');
            } else {
                console.error('❌ Error executing SQL:', error.message);
            }
        } else {
            console.log('✅ Column kkm_contract_number added successfully!');
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

fixDatabase();
