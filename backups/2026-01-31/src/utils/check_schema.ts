
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

async function checkColumns() {
    // Try to select one row from pharmacy_order_tracking and dump its keys
    const { data, error } = await supabase
        .from('pharmacy_order_tracking')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching row:', error)
        return
    }

    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
    } else {
        console.log('Table is empty or no columns returned.')

        // Alternative: try to insert a dummy and see error
        const { error: insertError } = await supabase
            .from('pharmacy_order_tracking')
            .insert({ lpo_id: '00000000-0000-0000-0000-000000000000' })

        console.log('Dummy insert error (will show missing required fields):', insertError?.message)
    }
}

checkColumns()
