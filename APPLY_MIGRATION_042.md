# How to Apply Migration 042: Create Hospital Facilities Table

## Quick Instructions

The `hospital_facilities` table needs to be created in your Supabase database. Follow these steps:

## Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/042_create_hospital_facilities_table.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

4. **Verify**
   - You should see a success message
   - The `hospital_facilities` table should now exist

## Method 2: Supabase CLI (If you have it installed)

```bash
# Make sure you're in the project root directory
cd "D:\MY HOME"

# Apply the migration
supabase db push

# Or if you need to link your project first:
supabase link --project-ref your-project-ref
supabase db push
```

## Migration File Location

The migration file is located at:
- `supabase/migrations/042_create_hospital_facilities_table.sql`

## What This Migration Creates

- ✅ `hospital_facilities` table
- ✅ All necessary indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Updated_at trigger

## After Applying

Once the migration is applied:
1. Refresh your browser
2. Go to **Pharmacy → Catalogs → Hospital Facilities**
3. Click **"Fetch from MOH"** to import hospitals from the MOH website

## Troubleshooting

If you get an error:
- Make sure you're connected to the correct Supabase project
- Check that the `hospitals` table already exists (this migration depends on it)
- Verify your database connection

