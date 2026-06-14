# How to Apply Migration 045: INV SQ and Manual PO Updates

The `pharmacy_purchase_orders` and `pharmacy_purchase_order_items` tables need to be updated to support the new features.

## Step 1: Open Supabase SQL Editor

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project (**ahnpjmdfutxdiotrbtzc**)
3. Click on **SQL Editor** in the left sidebar
4. Click **"New query"**

## Step 2: Run the SQL

Copy and paste the following SQL block and click **Run**:

```sql
-- 1. Update pharmacy_purchase_orders table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'manual_supplier_name') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN manual_supplier_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'sq_suppliers') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN sq_suppliers JSONB;
  END IF;
END $$;

-- 2. Update pharmacy_purchase_order_items table
DO $$ 
BEGIN
  -- Make item_id nullable to support manual items
  ALTER TABLE pharmacy_purchase_order_items ALTER COLUMN item_id DROP NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_order_items' AND column_name = 'item_name') THEN
    ALTER TABLE pharmacy_purchase_order_items ADD COLUMN item_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_order_items' AND column_name = 'item_code') THEN
    ALTER TABLE pharmacy_purchase_order_items ADD COLUMN item_code TEXT;
  END IF;
END $$;
```

## Step 3: Refresh Schema Cache

After running the SQL, if you still see errors, you may need to reload the PostgREST cache. 
You can do this by running this command in the SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

## Why is this needed?
This update adds the following columns:
- `manual_supplier_name`: For items purchased from suppliers not in the system.
- `sq_suppliers`: To store multiple selected suppliers for Quotation requests.
- `item_name` & `item_code`: To store manual item details when they are not in the catalog.
- Sets `item_id` to nullable so manual items can be saved.
