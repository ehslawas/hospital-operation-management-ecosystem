
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually read .env to avoid package issues
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars: any = {}
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) envVars[key.trim()] = value.trim()
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runRepair() {
    const lpoNumbers = ['PO260000000038419', 'PO260000000038413']

    for (const num of lpoNumbers) {
        console.log(`\n--- Repairing LPO: ${num} ---`)
        const { data: lpo } = await supabase
            .from('pharmacy_lpo')
            .select('*, purchase_order:pharmacy_purchase_orders(*)')
            .eq('lpo_number', num)
            .single()

        if (!lpo) {
            console.log('LPO not found')
            continue
        }

        console.log(`LPO ID: ${lpo.id}, PO ID: ${lpo.po_id}`)

        // Fetch PO items
        const { data: poItems } = await supabase
            .from('pharmacy_purchase_order_items')
            .select('*')
            .eq('po_id', lpo.po_id)

        if (!poItems || poItems.length === 0) {
            console.log('No PO items found. Cannot repair.')
            continue
        }

        console.log(`Found ${poItems.length} PO items. Generating tracking records...`)

        const po = lpo.purchase_order || {}

        // Re-implement createTrackingRecords logic here for standalone run
        const trackingRecords = poItems
            .filter(item => item.item_id)
            .map(item => {
                const itemCode = item.item_code || 'UNKNOWN'
                const category = po.vote_code === '990102' ? 'APPL' : 'CC'

                // Simplified date logic for repair
                const expectedDate = new Date()
                expectedDate.setDate(expectedDate.getDate() + 10)

                return {
                    lpo_id: lpo.id,
                    item_id: item.item_id,
                    item_type: item.item_type || 'drug',
                    item_code: itemCode,
                    item_category: category,
                    expected_delivery_date: expectedDate.toISOString(),
                    order_placed_date: lpo.document_date || lpo.created_at,
                    status: 'pending',
                    is_overdue: false,
                    days_overdue: 0,
                    reminder_count: 0
                }
            })

        if (trackingRecords.length > 0) {
            const { error: insertError } = await supabase
                .from('pharmacy_order_tracking')
                .insert(trackingRecords)

            if (insertError) {
                console.error('Insert Error:', insertError)
            } else {
                console.log(`SUCCESS: Created ${trackingRecords.length} tracking records.`)
            }
        }
    }
}

runRepair()
