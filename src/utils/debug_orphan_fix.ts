
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

async function debugOrphans() {
    const lpoNumbers = ['PO260000000038419', 'PO260000000038413']

    for (const num of lpoNumbers) {
        console.log(`\n--- Inspecting LPO: ${num} ---`)
        const { data: lpo } = await supabase
            .from('pharmacy_lpo')
            .select('*')
            .eq('lpo_number', num)
            .single()

        if (!lpo) {
            console.log('LPO not found')
            continue
        }

        console.log(`LPO ID: ${lpo.id}`)
        console.log(`Status: ${lpo.status}`)
        console.log(`PO ID: ${lpo.po_id}`)

        const { data: items } = await supabase
            .from('pharmacy_purchase_order_items')
            .select('*')
            .eq('po_id', lpo.po_id)

        console.log(`PO Items Count: ${items?.length || 0}`)
        if (items && items.length > 0) {
            console.log('Items:', JSON.stringify(items, null, 2))
        }

        const { data: tracking } = await supabase
            .from('pharmacy_order_tracking')
            .select('*')
            .eq('lpo_id', lpo.id)

        console.log(`Tracking Items Count: ${tracking?.length || 0}`)
    }
}

debugOrphans()
