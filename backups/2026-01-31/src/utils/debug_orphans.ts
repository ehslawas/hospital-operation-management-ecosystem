
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnBqbWRmdXR4ZGlvdHJidHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjYyODMsImV4cCI6MjA4MzE0MjI4M30.RGttkvzgTuFSNPXsffaaOIszD6-mn2CCaEH6teeMbdQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugOrphans() {
    const { data: lpos, error } = await supabase
        .from('pharmacy_lpo')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error fetching LPOs:', error)
        return
    }

    if (!lpos || lpos.length === 0) {
        console.log('No LPOs found with these numbers.')
        return
    }

    for (const lpo of lpos) {
        console.log('---')
        console.log(`LPO: ${lpo.lpo_number}`)
        console.log(`ID: ${lpo.id}`)
        console.log(`Status: ${lpo.status}`)

        // Fetch Tracking Items
        const { data: trackingItems } = await supabase
            .from('pharmacy_order_tracking')
            .select('*')
            .eq('lpo_id', lpo.id)

        console.log(`Tracking Items Count: ${trackingItems?.length || 0}`)

        // Fetch PO
        if (lpo.po_id) {
            const { data: po } = await supabase
                .from('pharmacy_purchase_orders')
                .select('*')
                .eq('id', lpo.po_id)
                .single()

            if (po) {
                console.log(`PO Number: ${po.po_number}`)
                console.log(`Vote Code: ${po.vote_code}`)
                console.log(`Contract: ${po.kkm_contract_number}`)

                // Fetch PO Items
                const { count } = await supabase
                    .from('pharmacy_po_items')
                    .select('id', { count: 'exact', head: true })
                    .eq('po_id', lpo.po_id)

                console.log(`PO Items Count: ${count}`)
            }
        } else {
            console.log('No linked Purchase Order found.')
        }
    }
}

debugOrphans()
