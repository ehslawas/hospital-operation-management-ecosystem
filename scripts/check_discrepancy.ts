
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Convert .env.local to object
const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDiscrepancy() {
    console.log('--- Checking LPO Discrepancy ---')

    // 1. Get Approved LPOs (as per LPO Management Page logic)
    // Filter: document_url exists, status in ['sent', 'verified'] (User says all are verified)
    // Actually LPO Management "Approved & Sent" usually implies they have a document active.
    // Let's get ALL LPOs that *should* be tracked.
    const { data: approvedLPOs, error: lpoError } = await supabase
        .from('pharmacy_lpo')
        .select('id, lpo_number, status, document_url')
        .not('document_url', 'is', null)

    if (lpoError) {
        console.error('Error fetching LPOs:', lpoError)
        return
    }

    // 2. Get LPOs with Active Tracking (as per Order Tracking logic)
    // Filter: has tracking_items with status pending/in_transit/overdue
    const { data: trackingItems, error: trackError } = await supabase
        .from('pharmacy_order_tracking')
        .select('lpo_id, status')
        .in('status', ['pending', 'in_transit', 'overdue'])

    if (trackError) {
        console.error('Error fetching tracking:', trackError)
        return
    }

    const lpoIdsWithActiveTracking = new Set(trackingItems.map(item => item.lpo_id))

    console.log(`Total LPOs with documents: ${approvedLPOs.length}`)
    console.log(`LPOs with Active Tracking Items: ${lpoIdsWithActiveTracking.size}`)

    // 3. Find the missing ones
    const missingLPOs = approvedLPOs.filter(lpo => !lpoIdsWithActiveTracking.has(lpo.id))

    console.log(`--- Missing LPOs (${missingLPOs.length}) ---`)
    for (const lpo of missingLPOs) {
        console.log(`LPO: ${lpo.lpo_number} | ID: ${lpo.id} | Status: ${lpo.status}`)

        // Check if it has tracking items at all (maybe delivered? maybe empty?)
        const { data: specificTracking } = await supabase
            .from('pharmacy_order_tracking')
            .select('*')
            .eq('lpo_id', lpo.id)

        console.log(`   > Tracking Items Value: ${specificTracking?.length}`)
        if (specificTracking?.length > 0) {
            console.log(`   > Statuses: ${specificTracking.map(t => t.status).join(', ')}`)
        } else {
            console.log(`   > NO TRACKING ITEMS FOUND`)
        }
    }
}

checkDiscrepancy()
