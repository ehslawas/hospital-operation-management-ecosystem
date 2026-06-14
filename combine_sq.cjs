require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const poNumbers = [
    'PO-2026-0458',
    'PO-2026-0459',
    'PO-2026-0460',
    'PO-2026-0461',
    'PO-2026-0462'
  ];

  console.log('Fetching POs...');
  const { data: pos, error } = await supabase
    .from('pharmacy_purchase_orders')
    .select(`
      id, 
      po_number, 
      po_type, 
      supplier_id, 
      sq_suppliers
    `)
    .in('po_number', poNumbers)
    .order('po_number', { ascending: true });

  if (error) {
    console.error('Error fetching POs:', error);
    return;
  }

  if (!pos || pos.length === 0) {
    console.log('No POs found.');
    return;
  }

  const supplierIds = [...new Set(pos.map(p => p.supplier_id).filter(Boolean))];
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, company_name')
    .in('id', supplierIds);

  const supplierMap = Object.fromEntries((suppliers || []).map(s => [s.id, s.company_name]));

  console.log('Found POs:', pos.length);
  pos.forEach(p => console.log(p.po_number, supplierMap[p.supplier_id]));

  // Base PO will be the first one
  const basePo = pos[0];
  const otherPos = pos.slice(1);

  // Gather supplier names
  const supplierNames = pos.map(p => supplierMap[p.supplier_id] || 'Unknown Supplier').filter(Boolean);

  console.log('Supplier names to combine:', supplierNames);

  const newPoNumber = basePo.po_number.replace('PO-', 'SQ-');

  console.log(`Updating base PO (${basePo.id}) to ${newPoNumber}...`);
  const { error: updateError } = await supabase
    .from('pharmacy_purchase_orders')
    .update({
      po_number: newPoNumber,
      po_type: 'sq',
      sq_suppliers: supplierNames,
      supplier_id: null
    })
    .eq('id', basePo.id);

  if (updateError) {
    console.error('Error updating base PO:', updateError);
    return;
  }

  console.log('Base PO updated successfully.');

  if (otherPos.length > 0) {
    const otherPoIds = otherPos.map(p => p.id);
    console.log('Deleting other POs:', otherPoIds);

    const { error: deleteError } = await supabase
      .from('pharmacy_purchase_orders')
      .delete()
      .in('id', otherPoIds);

    if (deleteError) {
      console.error('Error deleting other POs:', deleteError);
      return;
    }

    console.log('Other POs deleted successfully.');
  }

  console.log('Done!');
}

run();
