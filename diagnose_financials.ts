
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load env vars
const envPath = path.resolve(process.cwd(), '.env')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
    console.log('--- START DIAGNOSIS ---')
    const hospitalId = '4fd96db0-8846-4cb2-bb8a-24db54cd2283' // Assuming from context or will find first
    console.log('Target Hospital ID:', hospitalId)

    // 1. Check Warrants for Pharmacy 080702
    console.log('\n1. Checking Warrants (080702, pharmacy)...')
    const { data: warrants, error: wError } = await supabase
        .from('pharmacy_warrants')
        .select('*')
        .eq('vote_code', '080702')
        .eq('department', 'pharmacy')
        .eq('hospital_id', hospitalId)

    if (wError) console.error('Warrant Error:', wError)
    else {
        console.log(`Found ${warrants.length} pharmacy warrants for 080702`)
        warrants.forEach(w => console.log(` - ID: ${w.id}, Amount: ${w.amount}, Dept: "${w.department}"`))
        const total = warrants.reduce((sum, w) => sum + Number(w.amount), 0)
        console.log(`Calculated Total: ${total}`)
    }

    // 2. Check All Warrants for 080702 (to see if filter fails)
    const { count: totalWarrantsCount, error: twError } = await supabase
        .from('pharmacy_warrants')
        .select('*', { count: 'exact', head: true })
        .eq('vote_code', '080702')
        .eq('hospital_id', hospitalId)

    if (twError) console.error('Total Warrant Error:', twError)
    else console.log(`Total Warrants for 080702 (all depts): ${totalWarrantsCount}`)


    // 3. Check Purchase Orders for 080702
    console.log('\n2. Checking Purchase Orders (080702)...')
    const { data: pos, error: pError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('id, po_number, total_amount, status, department, vote_code, vote_activity')
        .eq('vote_code', '080702')
        .eq('hospital_id', hospitalId)
        .neq('status', 'cancelled')

    if (pError) console.error('PO Error:', pError)
    else {
        console.log(`Found ${pos.length} active POs for 080702`)
        pos.forEach(p => console.log(` - PO: ${p.po_number}, Amt: ${p.total_amount}, Act: ${p.vote_activity}, Dept: "${p.department}"`))
        const totalPO = pos.reduce((sum, p) => sum + Number(p.total_amount), 0)
        console.log(`Total Active PO Amount: ${totalPO}`)
    }

    // 4. Check Expenses Table
    console.log('\n3. Checking CC Expenses Table...')
    const { data: expenses, error: eError } = await supabase
        .from('pharmacy_cc_expenses')
        .select('id, amount, po_number, department, warrant(department)')
        .eq('hospital_id', hospitalId)
        .eq('fiscal_year', 2026) // Assuming 2026

    if (eError) console.error('Expense Error:', eError)
    else {
        console.log(`Found ${expenses.length} expense records for 2026`)
        expenses.forEach(e => {
            // @ts-ignore
            const warrantDept = e.warrant?.department
            console.log(` - Exp: ${e.po_number}, Amt: ${e.amount}, Dept(col): "${e.department}", Dept(joined): "${warrantDept}"`)
        })
    }

    console.log('--- END DIAGNOSIS ---')
}

diagnose().catch(console.error)
