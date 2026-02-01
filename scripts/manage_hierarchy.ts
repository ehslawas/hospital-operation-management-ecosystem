
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnBqbWRmdXR4ZGlvdHJidHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU2NjI4MywiZXhwIjoyMDgzMTQyMjgzfQ.WzCSndV55vYwzFGBsWk0WARIjuNkuTIjaKhNeAZnzbo'
const HOSPITAL_ID = '85bb6adc-b868-428b-83f4-e5af2f5cf904'

const supabase = createClient(supabaseUrl, supabaseKey)

async function manageHierarchy() {
    console.log('--- Managing Hierarchy ---')

    // 1. Fetch current locations
    const { data: locations, error: fetchError } = await supabase
        .from('pharmacy_stock_locations')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)

    if (fetchError) {
        console.error('Fetch error:', fetchError)
        return
    }
    if (!locations) return

    console.log(`Found ${locations.length} locations.`)

    const pharmLog = locations.find(l => l.location_name === 'Pharmacy Logistic' && l.location_type === 'warehouse')
    const ambientRoot = locations.find(l => l.location_name === 'Ambient Locations' && l.location_type === 'store')
    const fridgeRoot = locations.find(l => l.location_name === 'Fridge Locations' && l.location_type === 'store')

    if (!pharmLog) {
        console.error('Pharmacy Logistic not found!')
        return
    }

    // 2. Perform Fixes
    // Reset pharmLog to root
    if (pharmLog.parent_location_id) {
        console.log('Moving Pharmacy Logistic to Root')
        await supabase.from('pharmacy_stock_locations').update({ parent_location_id: null }).eq('id', pharmLog.id)
    }

    // Move children from temp roots to pharmLog
    if (ambientRoot) {
        const children = locations.filter(l => l.parent_location_id === ambientRoot.id && l.id !== pharmLog.id)
        for (const child of children) {
            console.log(`Moving "${child.location_name}" to Pharmacy Logistic`)
            await supabase.from('pharmacy_stock_locations').update({ parent_location_id: pharmLog.id }).eq('id', child.id)
        }
        await supabase.from('pharmacy_stock_locations').delete().eq('id', ambientRoot.id)
    }

    if (fridgeRoot) {
        const children = locations.filter(l => l.parent_location_id === fridgeRoot.id)
        for (const child of children) {
            console.log(`Moving "${child.location_name}" to Pharmacy Logistic`)
            await supabase.from('pharmacy_stock_locations').update({ parent_location_id: pharmLog.id }).eq('id', child.id)
        }
        await supabase.from('pharmacy_stock_locations').delete().eq('id', fridgeRoot.id)
    }

    // Final sweep for orphans
    const { data: orphans } = await supabase.from('pharmacy_stock_locations').select('*').eq('hospital_id', HOSPITAL_ID).is('parent_location_id', null)
    if (orphans) {
        for (const orphan of orphans) {
            if (orphan.id === pharmLog.id) continue
            console.log(`Final sweep: Moving "${orphan.location_name}" to Pharmacy Logistic`)
            await supabase.from('pharmacy_stock_locations').update({ parent_location_id: pharmLog.id }).eq('id', orphan.id)
        }
    }

    // 3. Print Final Tree
    console.log('\n--- Final Hierarchy Tree ---')
    const { data: finalLocations } = await supabase.from('pharmacy_stock_locations').select('*').eq('hospital_id', HOSPITAL_ID)
    if (finalLocations) {
        const rootNodes: any[] = []
        const map: any = {}
        finalLocations.forEach((l: any) => { map[l.id] = { ...l, children: [] } })
        finalLocations.forEach((l: any) => {
            if (l.parent_location_id && map[l.parent_location_id]) {
                map[l.parent_location_id].children.push(map[l.id])
            } else {
                rootNodes.push(map[l.id])
            }
        })

        const printTree = (node: any, depth = 0) => {
            console.log(`${'  '.repeat(depth)}${node.location_name} (${node.location_type})`)
            node.children.sort((a: any, b: any) => a.location_name.localeCompare(b.location_name)).forEach((c: any) => printTree(c, depth + 1))
        }

        rootNodes.forEach(r => printTree(r))
    }
}

manageHierarchy()
