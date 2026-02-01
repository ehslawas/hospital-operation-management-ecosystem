
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU2NjI4MywiZXhwIjoyMDgzMTQyMjgzfQ.WzCSndV55vYwzFGBsWk0WARIjuNkuTIjaKhNeAZnzbo'

if (!supabaseUrl || !supabaseKey) { process.exit(1) }
const supabase = createClient(supabaseUrl, supabaseKey)
const HOSPITAL_ID = '85bb6adc-b868-428b-83f4-e5af2f5cf904'

async function fixHierarchy() {
    console.log('--- Fixing Hierarchy (Enhanced Logging) ---')

    const { data: locations, error: fetchError } = await supabase.from('pharmacy_stock_locations').select('*').eq('hospital_id', HOSPITAL_ID)
    if (fetchError) {
        console.error('Fetch error:', fetchError)
        return
    }
    if (!locations) {
        console.log('No locations found.')
        return
    }

    console.log(`Found ${locations.length} locations.`)

    // Find key items
    const pharmLog = locations.find(l => l.location_name === 'Pharmacy Logistic' && l.location_type === 'warehouse')
    const ambientRoot = locations.find(l => l.location_name === 'Ambient Locations' && l.location_type === 'store')
    const fridgeRoot = locations.find(l => l.location_name === 'Fridge Locations' && l.location_type === 'store')

    console.log('Found Pharmacy Logistic:', !!pharmLog)
    console.log('Found Ambient Root:', !!ambientRoot)
    console.log('Found Fridge Root:', !!fridgeRoot)

    if (!pharmLog) {
        console.error('Pharmacy Logistic not found! Cannot proceed with root fix.')
        return
    }

    // 1. Reset Pharmacy Logistic to Root
    if (pharmLog.parent_location_id) {
        console.log(`Restoring Pharmacy Logistic [${pharmLog.id}] to Root (removing parent ${pharmLog.parent_location_id})`)
        const { error: upError } = await supabase.from('pharmacy_stock_locations').update({ parent_location_id: null }).eq('id', pharmLog.id)
        if (upError) console.error('Error resetting pharmLog:', upError)
    } else {
        console.log('Pharmacy Logistic is already at root.')
    }

    // 2. Handle Ambient Root children
    if (ambientRoot) {
        const children = locations.filter(l => l.parent_location_id === ambientRoot.id && l.id !== pharmLog.id)
        console.log(`Ambient Root [${ambientRoot.id}] has ${children.length} non-pharmLog children.`)
        for (const child of children) {
            console.log(`Moving "${child.location_name}" to Pharmacy Logistic [${pharmLog.id}]`)
            const { error: moveError } = await supabase.from('pharmacy_stock_locations').update({ parent_location_id: pharmLog.id }).eq('id', child.id)
            if (moveError) console.error(`Error moving ${child.location_name}:`, moveError)
        }
        // Delete Ambient Root
        console.log('Deleting temporary Ambient Root...')
        const { error: delError } = await supabase.from('pharmacy_stock_locations').delete().eq('id', ambientRoot.id)
        if (delError) console.error('Error deleting ambientRoot:', delError)
    }

    // 3. Handle Fridge Root children
    if (fridgeRoot) {
        const children = locations.filter(l => l.parent_location_id === fridgeRoot.id)
        console.log(`Fridge Root [${fridgeRoot.id}] has ${children.length} children.`)
        for (const child of children) {
            console.log(`Moving "${child.location_name}" to Pharmacy Logistic [${pharmLog.id}]`)
            const { error: moveError } = await supabase.from('pharmacy_stock_locations').update({ parent_location_id: pharmLog.id }).eq('id', child.id)
            if (moveError) console.error(`Error moving ${child.location_name}:`, moveError)
        }
        // Delete Fridge Root
        console.log('Deleting temporary Fridge Root...')
        const { error: delError } = await supabase.from('pharmacy_stock_locations').delete().eq('id', fridgeRoot.id)
        if (delError) console.error('Error deleting fridgeRoot:', delError)
    }

    // 4. Final Sweep: Any item with NO parent (except Pharmacy Logistic) should be under Pharmacy Logistic
    // This handles cases like "Fridge Locations" itself if it's still there.
    const { data: finalSweep } = await supabase.from('pharmacy_stock_locations').select('*').eq('hospital_id', HOSPITAL_ID).is('parent_location_id', null)
    if (finalSweep) {
        for (const orphan of finalSweep) {
            if (orphan.id === pharmLog.id) continue
            console.log(`Final sweep: Moving orphan "${orphan.location_name}" to Pharmacy Logistic`)
            await supabase.from('pharmacy_stock_locations').update({ parent_location_id: pharmLog.id }).eq('id', orphan.id)
        }
    }

    console.log('--- Hierarchy fix process completed ---')
}

fixHierarchy()
