
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBudget() {
    console.log('--- Debugging Budget ---')

    // 1. Fetch Warrants
    console.log('\n1. Fetching Warrants (990102, 27499)...')
    const { data: warrants, error: wError } = await supabase
        .from('pharmacy_warrants')
        .select('*')
        .eq('vote_code', '990102')
        .eq('vote_activity', '27499')

    if (wError) console.error('Error fetching warrants:', wError)
    else {
        console.log(`Found ${warrants?.length} warrants:`)
        warrants?.forEach(w => console.log(` - ID: ${w.id}, Amount: ${w.amount}, Date: ${w.warrant_date}`))
        const totalAlloc = warrants?.reduce((sum, w) => sum + Number(w.amount), 0) || 0
        console.log(`Total Allocation: ${totalAlloc}`)
    }

    // 2. Fetch Expenses
    console.log('\n2. Fetching APPL Expenses (990102, 27499)...')
    // Note: pharmacy_appl_expenses might not have vote_code explicitly if it relies on join, 
    // currently the table has vote_activity?
    // Let's check all expenses with vote_activity 27499
    const { data: expenses, error: eError } = await supabase
        .from('pharmacy_appl_expenses')
        .select('*')
        .eq('vote_activity', '27499')

    if (eError) console.error('Error fetching expenses:', eError)
    else {
        console.log(`Found ${expenses?.length} expenses:`)
        expenses?.forEach(e => console.log(` - PO: ${e.po_number}, Amount: ${e.amount}, Status: ${e.status}, Date: ${e.expense_date}`))
        const totalExp = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
        console.log(`Total Expenses: ${totalExp}`)
    }

    // 3. Fetch Purchase Orders (to check for any not synced)
    console.log('\n3. Fetching Purchase Orders (990102, 27499)...')
    const { data: pos, error: pError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('*')
        .eq('vote_code', '990102')
        .eq('vote_activity', '27499')

    if (pError) console.error('Error fetching POs:', pError)
    else {
        console.log(`Found ${pos?.length} POs:`)
        pos?.forEach(p => console.log(` - PO: ${p.po_number}, Amount: ${p.total_amount}, Status: ${p.status}`))
    }
}

debugBudget()
