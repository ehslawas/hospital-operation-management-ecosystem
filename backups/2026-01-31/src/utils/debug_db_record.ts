
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnBqbWRmdXR4ZGlvdHJidHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU2NjI4MywiZXhwIjoyMDgzMTQyMjgzfQ.WzCSndV55vYwzFGBsWk0WARIjuNkuTIjaKhNeAZnzbo' // SERVICE ROLE KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugLPO() {
    const lpoNumber = 'PO-2026-0130'
    console.log(`Searching for LPO: ${lpoNumber}...`)

    // Search by confirmed LPO Number
    const targetLpo = 'CO260000000108813'
    const { data: lpoData, error: lpoError } = await supabase
        .from('pharmacy_lpo')
        .select('id, lpo_number')
        .eq('lpo_number', targetLpo)
        .single()

    if (lpoError) {
        console.log('Error finding LPO:', lpoError)
        return
    }

    console.log('Found LPO:', lpoData)

    // Now get tracking items
    const { data: trackingItems, error: trackError } = await supabase
        .from('pharmacy_order_tracking')
        .select('*')
        .eq('lpo_id', lpoData.id)

    if (trackError) {
        console.log('Error finding tracking items:', trackError)
        return
    }

    console.log('Tracking Items:', JSON.stringify(trackingItems, null, 2))
}

debugLPO()
