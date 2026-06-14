
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    console.log('Loading env from:', envPath)

    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath))

        // Populate process.env so createClient usually picks it up, but we pass explicitly too
        for (const k in envConfig) {
            process.env[k] = envConfig[k]
        }
    } else {
        console.warn('.env.local not found at', envPath)
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials. Checked VITE_SUPABASE_URL.')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    async function checkDiscrepancy() {
        console.log('--- Checking LPO Discrepancy ---')

        // 1. Get Approved LPOs (as per LPO Management Page logic)
        // Filter: document_url exists, NOT null
        const { data: approvedLPOs, error: lpoError } = await supabase
            .from('pharmacy_lpo')
            .select('id, lpo_number, status, document_url')
            .not('document_url', 'is', null)

        if (lpoError) {
            console.error('Error fetching LPOs:', lpoError)
            return
        }

        // 2. Get LPOs with Active Tracking (as per Order Tracking logic)
        const { data: trackingItems, error: trackError } = await supabase
            .from('pharmacy_order_tracking')
            .select('lpo_id, status')
            .in('status', ['pending', 'in_transit', 'overdue'])

        if (trackError) {
            console.error('Error fetching tracking:', trackError)
            return
        }

        // Distinct LPOs
        const lpoIdsWithActiveTracking = new Set(trackingItems.map(item => item.lpo_id))

        console.log(`Total Approved LPOs (with docs): ${approvedLPOs.length}`)
        console.log(`LPOs with Active Tracking Items: ${lpoIdsWithActiveTracking.size}`)

        // 3. Find the missing ones
        const missingLPOs = approvedLPOs.filter(lpo => !lpoIdsWithActiveTracking.has(lpo.id))

        console.log(`--- Missing LPOs (${missingLPOs.length}) ---`)
        for (const lpo of missingLPOs) {
            // Check specific tracking for these LPOs
            const { data: specificTracking } = await supabase
                .from('pharmacy_order_tracking')
                .select('*')
                .eq('lpo_id', lpo.id)

            console.log(`LPO: ${lpo.lpo_number} | ID: ${lpo.id} | Status: ${lpo.status}`)
            if (specificTracking && specificTracking.length > 0) {
                const statuses = specificTracking.map(t => t.status).join(', ')
                console.log(`   > Has Tracking Items? YES. Statuses: [${statuses}]`)
            } else {
                console.log(`   > Has Tracking Items? NO (Empty)`)
            }
        }
    }

    checkDiscrepancy()

} catch (err) {
    console.error('Script error:', err)
}
