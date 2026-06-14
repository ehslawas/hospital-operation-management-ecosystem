
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co'
// Service role key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnBqbWRmdXR4ZGlvdHJidHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU2NjI4MywiZXhwIjoyMDgzMTQyMjgzfQ.WzCSndV55vYwzFGBsWk0WARIjuNkuTIjaKhNeAZnzbo'

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    const testId = 'test-location-' + Date.now()
    console.log('Inserting test location:', testId)

    // We need a hospital_id. Previous tasks usually had one. 
    // I will cheat and fetch the first user and use their hospital_id, or just use a dummy UUID if referential integrity allows (probably not).
    // Let's try to fetch a user first.

    const { data: users } = await supabase.from('users').select('hospital_id').limit(1)
    const hospitalId = users?.[0]?.hospital_id

    if (!hospitalId) {
        console.error('No hospital_id found (no users?)')
        process.exit(1)
    }

    console.log('Using hospital_id:', hospitalId)

    const { data, error } = await supabase
        .from('pharmacy_stock_locations')
        .insert({
            id: testId, // UUID? if it is uuid type, this string will fail. 
            // schema said id is UUID.
            // I'll let supabase generate it or use a valid UUID.
            // Actually schema usually has default gen_random_uuid().
            location_name: 'Test Location From Script',
            location_type: 'store',
            hospital_id: hospitalId,
            is_active: true
        })
        .select()

    if (error) {
        console.error('Error inserting:', error)
    } else {
        console.log('Inserted:', data)
    }

    // Now verify
    const { data: check } = await supabase.from('pharmacy_stock_locations').select('*')
    console.log('Count after insert:', check?.length)
}

testInsert()
