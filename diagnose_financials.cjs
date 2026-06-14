
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Env Validation
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        envConfig[key.trim()] = values.join('=').trim();
    }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- START DIAGNOSIS (JS) ---');
    // Known user ID from logs
    const userId = '88dc2fa7-e943-45ba-a889-8756c0265b48';

    const { data: userData, error: uError } = await supabase
        .from('users')
        .select('hospital_id')
        .eq('id', userId)
        .single();

    if (uError || !userData) {
        console.error('Could not find user/hospital:', uError);
        return;
    }

    const hospitalId = userData.hospital_id;
    console.log('Target Hospital ID:', hospitalId);

    // 1. Check Warrants for Pharmacy 080702
    console.log('\n1. Checking Warrants (080702, pharmacy)...');
    const { data: warrants, error: wError } = await supabase
        .from('pharmacy_warrants')
        .select('*')
        .eq('vote_code', '080702')
        //.eq('department', 'pharmacy') // Let's verify case sensitivity by NOT filtering first, then checking
        .eq('hospital_id', hospitalId);

    if (wError) console.error('Warrant Error:', wError);
    else {
        console.log(`Found ${warrants.length} warrants for 080702 (TOTAL)`);
        warrants.forEach(w => console.log(` - ID: ${w.id}, Amount: ${w.amount}, Dept: "${w.department}"`));

        const pharmacyWarrants = warrants.filter(w => w.department === 'pharmacy');
        console.log(`Phase 1 Check: Found ${pharmacyWarrants.length} strictly 'pharmacy' warrants.`);
    }

    // 2. Check Purchase Orders for 080702
    console.log('\n2. Checking Purchase Orders (080702)...');
    const { data: pos, error: pError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('id, po_number, total_amount, status, department, vote_code, vote_activity')
        .eq('vote_code', '080702')
        .eq('hospital_id', hospitalId)
        .neq('status', 'cancelled');

    if (pError) console.error('PO Error:', pError);
    else {
        console.log(`Found ${pos.length} active POs for 080702`);
        pos.forEach(p => console.log(` - PO: ${p.po_number}, Amt: ${p.total_amount}, Act: ${p.vote_activity}, Dept: "${p.department}"`));
    }

    // 3. Check Expenses Table Structure & Data
    console.log('\n3. Checking CC Expenses Table...');
    // First, check basic select without department column to see if it works
    const { data: expensesBasic, error: eErrorBasic } = await supabase
        .from('pharmacy_cc_expenses')
        .select('id, amount, po_number, po_id, warrant_id')
        .eq('hospital_id', hospitalId)
        .eq('fiscal_year', 2026);

    if (eErrorBasic) {
        console.error('Basic Expense Select Error:', eErrorBasic);
    } else {
        console.log(`Found ${expensesBasic.length} expense records (Basic Check)`);
        expensesBasic.forEach(e => {
            console.log(` - Exp: ${e.po_number}, Amt: ${e.amount}, WarrantID: ${e.warrant_id}`);
        });
    }

    // Now try to select 'department' column explicitely to confirm if it exists
    console.log('\n4. Probing "department" column on expenses...');
    const { error: colError } = await supabase
        .from('pharmacy_cc_expenses')
        .select('department')
        .limit(1);

    if (colError) {
        console.log('Confirmed: department column DOES NOT exist or error:', colError.message);
    } else {
        console.log('Confirmed: department column EXISTS.');
    }

    console.log('--- END DIAGNOSIS ---');
}

diagnose().catch(err => console.error('Fatal:', err));
