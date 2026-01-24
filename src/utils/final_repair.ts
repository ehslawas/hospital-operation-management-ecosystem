
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually read .env
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

async function runFinalRepair() {
    const targetLPOs = ['PO260000000038419', 'PO260000000038413']

    for (const num of targetLPOs) {
        console.log(`\nProcessing ${num}...`)

        const { data: lpo } = await supabase
            .from('pharmacy_lpo')
            .select('*, purchase_order:pharmacy_purchase_orders(*)')
            .eq('lpo_number', num)
            .single()

        if (!lpo) continue

        const { data: poItems } = await supabase
            .from('pharmacy_purchase_order_items')
            .select('*')
            .eq('po_id', lpo.po_id)

        if (!poItems) continue

        console.log(`Found ${poItems.length} items. Mapping with new ID fallback logic...`)

        const poRaw = lpo.purchase_order
        const po = Array.isArray(poRaw) ? poRaw[0] : (poRaw || {})

        const trackingRecords = poItems
            .filter(item => item.item_id || item.id) // THE FIX: Allow item.id if item_id is null
            .map(item => {
                const category = po.vote_code === '990102' ? 'APPL' : 'CC'
                // Simplified date for repair
                const baseDate = new Date(lpo.document_date || lpo.created_at)
                const expectedDate = new Date(baseDate)
                expectedDate.setDate(baseDate.getDate() + 10)

                return {
                    lpo_id: lpo.id,
                    item_id: item.item_id || item.id, // THE FIX
                    item_type: item.item_type || 'drug',
                    item_code: item.item_code || 'UNKNOWN',
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
            // Clear existing if any (likely 0 but for safety)
            await supabase.from('pharmacy_order_tracking').delete().eq('lpo_id', lpo.id)

            const { error: insertError } = await supabase
                .from('pharmacy_order_tracking')
                .insert(trackingRecords)

            if (insertError) {
                console.error('Insert error:', insertError)
            } else {
                console.log(`Successfully created ${trackingRecords.length} tracking items.`)
            }
        }
    }
}

runFinalRepair()
