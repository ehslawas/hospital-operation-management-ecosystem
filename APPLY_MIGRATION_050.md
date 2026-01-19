# How to Apply Migration 050: Oxygen Reception Items

## Quick Instructions

The `pharmacy_oxygen_reception_items` table needs to be created to link your reception records with specific cylinders for professional PDF reporting.

## Method: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `ahnpjmdfutxdiotrbtzc`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/050_oxygen_reception_items.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify**
   - You should see a success message
   - The error on the Oxygen Dashboard should disappear after refreshing the page.

## Migration File Location
`supabase/migrations/050_oxygen_reception_items.sql`

## What This Migration Creates
- ✅ `pharmacy_oxygen_reception_items` table
- ✅ Foreign keys linking to reception, inventory, size, and type tables
- ✅ Row Level Security (RLS) policies
