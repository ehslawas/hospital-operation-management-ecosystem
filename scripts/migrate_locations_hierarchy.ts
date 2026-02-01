
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co'
// Service role key for admin access
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnBqbWRmdXR4ZGlvdHJidHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU2NjI4MywiZXhwIjoyMDgzMTQyMjgzfQ.WzCSndV55vYwzFGBsWk0WARIjuNkuTIjaKhNeAZnzbo'

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Hardcoded hospital ID from previous successful check
// Using the first one found or falling back to the one I saw in logs: 85bb6adc-b868-428b-83f4-e5af2f5cf904
const HOSPITAL_ID = '85bb6adc-b868-428b-83f4-e5af2f5cf904'

async function migrateLocations() {
    console.log('Starting location hierarchy migration...')

    // 1. Fetch all existing locations
    const { data: locations, error } = await supabase
        .from('pharmacy_stock_locations')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)

    if (error) {
        console.error('Error fetching locations:', error)
        return
    }

    if (!locations || locations.length === 0) {
        console.log('No locations found to migrate.')
        return
    }

    console.log(`Found ${locations.length} locations.`)

    // 2. Identify or Create Roles
    let ambientRoot = locations.find(l => l.location_name === 'Ambient Locations' && l.location_type === 'store' && !l.parent_location_id)
    let fridgeRoot = locations.find(l => l.location_name === 'Fridge Locations' && l.location_type === 'store' && !l.parent_location_id)

    // Helper to create root if missing
    const createRoot = async (name: string, type: string) => {
        const { data, error } = await supabase
            .from('pharmacy_stock_locations')
            .insert({
                hospital_id: HOSPITAL_ID,
                location_name: name,
                location_code: name.substring(0, 3).toUpperCase(),
                location_type: type,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error(`Error creating ${name}:`, error)
            throw error
        }
        console.log(`Created root location: ${name}`)
        return data
    }

    if (!ambientRoot) {
        try {
            ambientRoot = await createRoot('Ambient Locations', 'store')
        } catch (e) { return }
    }
    if (!fridgeRoot) {
        try {
            fridgeRoot = await createRoot('Fridge Locations', 'store')
        } catch (e) { return }
    }

    // 3. Move existing items
    for (const loc of locations) {
        // Skip the roots themselves
        if (loc.id === ambientRoot?.id || loc.id === fridgeRoot?.id) continue

        // If already has a parent, assume it's fine for now (or maybe we want to re-parent valid sub-items?)
        // The user request was "Currently seeing Shelf A, Shelf B, etc. at top level. Want to collapse them."
        // So we only target items with NO parent.
        if (loc.parent_location_id) continue

        let targetParentId = null

        // Logic: specific types go to fridge, others to ambient
        if (loc.location_type === 'fridge' || loc.location_type === 'cold_room') {
            targetParentId = fridgeRoot?.id
        } else {
            // Default to ambient for shelves, bins, cabinets, etc.
            targetParentId = ambientRoot?.id
        }

        if (targetParentId) {
            console.log(`Moving "${loc.location_name}" (${loc.location_type}) to parent ${targetParentId === fridgeRoot?.id ? 'Fridge Locations' : 'Ambient Locations'}`)

            const { error: updateError } = await supabase
                .from('pharmacy_stock_locations')
                .update({ parent_location_id: targetParentId })
                .eq('id', loc.id)

            if (updateError) {
                console.error(`Failed to move ${loc.location_name}:`, updateError)
            }
        }
    }

    console.log('Migration completed.')
}

migrateLocations()
