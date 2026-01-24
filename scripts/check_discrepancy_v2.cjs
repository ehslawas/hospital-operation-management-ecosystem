
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manually parse .env.local since dotenv is not available
function getEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local')
        if (!fs.existsSync(envPath)) return {}

        const content = fs.readFileSync(envPath, 'utf8')
        const env = {}
        content.split('\n').forEach(line => {
            line = line.trim()
            if (!line || line.startsWith('#')) return
            const delimiterIndex = line.indexOf('=')
            if (delimiterIndex !== -1) {
                const key = line.substring(0, delimiterIndex)
                let val = line.substring(delimiterIndex + 1)
                // Remove quotes if present
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1)
                }
                env[key] = val
            }
        })
        return env
    } catch (e) {
        console.error('Error reading env:', e)
        return {}
    }
}

const env = getEnv()
const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']


if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
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
