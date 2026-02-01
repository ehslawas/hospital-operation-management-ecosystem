
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnBqbWRmdXR4ZGlvdHJidHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU2NjI4MywiZXhwIjoyMDgzMTQyMjgzfQ.WzCSndV55vYwzFGBsWk0WARIjuNkuTIjaKhNeAZnzbo'

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLocations() {
    const { data: locations, error } = await supabase
        .from('pharmacy_stock_locations')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching locations:', error)
        return
    }

    console.log('--- Current Stock Locations ---')
    if (locations.length === 0) {
        console.log('No locations found.')
    } else {

        // Build tree
        const roots: any[] = []
        const map: any = {}
        locations.forEach((l: any) => { map[l.id] = { ...l, children: [] } })
        locations.forEach((l: any) => {
            if (l.parent_location_id && map[l.parent_location_id]) {
                map[l.parent_location_id].children.push(map[l.id])
            } else {
                roots.push(map[l.id])
            }
        })

        const printTree = (node: any, depth = 0) => {
            const indent = '  '.repeat(depth)
            console.log(`${indent}${node.location_name} (${node.location_type}) [${node.id}]`)
            node.children.forEach((c: any) => printTree(c, depth + 1))
        }

        roots.forEach(r => printTree(r))

    }
}

checkLocations()
