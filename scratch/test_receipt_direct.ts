
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahnpjmdfutxdiotrbtzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnBqbWRmdXR4ZGlvdHJidHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjYyODMsImV4cCI6MjA4MzE0MjI4M30.RGttkvzgTuFSNPXsffaaOIszD6-mn2CCaEH6teeMbdQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateGRNumber(hospitalId: string) {
  const currentYear = new Date().getFullYear();
  const { data, error } = await supabase
    .from('pharmacy_goods_receipts')
    .select('gr_number')
    .eq('hospital_id', hospitalId)
    .like('gr_number', `GR-${currentYear}-%`)
    .order('gr_number', { ascending: false })
    .limit(1);
    
  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].gr_number;
    const match = lastNumber.match(/GR-\d{4}-(\d{4})/);
    if (match && match[1]) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }
  return `GR-${currentYear}-${sequence.toString().padStart(4, '0')}`;
}

async function testWorkflow() {
  const hospital_id = '85bb6adc-b868-428b-83f4-e5af2f5cf904';
  const po_id = '5b8d0d79-35d6-4dd7-9539-bd5ee95ccad6';
  const lpo_id = 'b5027b31-7f93-4214-a59a-93bc8578eddb';
  const item_id = '469c5ba3-6746-4729-a084-efb96db18284';
  const po_item_id = 'f4938a13-1a82-4590-9e88-c6504ebd9b86';
  const received_by = 'd92476aa-f753-4da1-ab8e-5e7bce53f5d3';

  console.log('--- STARTING WORKFLOW TEST ---');
  const gr_number = await generateGRNumber(hospital_id);
  console.log('Generated GR Number:', gr_number);

  // 1. Create the GR Header
  console.log('Creating GR Header...');
  const { data: grData, error: grError } = await supabase
    .from('pharmacy_goods_receipts')
    .insert({
      hospital_id,
      gr_number,
      po_id,
      lpo_id,
      receipt_date: new Date().toISOString().split('T')[0],
      delivery_note_number: 'DN-TEST-E2E',
      invoice_number: 'INV-TEST-E2E',
      invoice_amount: 100.0,
      status: 'accepted',
      received_by,
      notes: 'End-to-end automated test receipt (TS)'
    })
    .select()
    .single();

  if (grError) {
    console.error('GR Header Error:', grError);
    return;
  }
  const grId = grData.id;
  console.log('GR Header Created with ID:', grId);

  // 2. Create GR Item
  console.log('Creating GR Item...');
  const { error: itemError } = await supabase
    .from('pharmacy_goods_receipt_items')
    .insert({
      gr_id: grId,
      po_item_id,
      item_id,
      quantity_received: 5,
      quantity_accepted: 5,
      quantity_rejected: 0,
      batch_number: 'BATCH-E2E-TS',
      expiry_date: '2028-01-01',
      disposition: 'accepted',
      notes: 'Automated test'
    });

  if (itemError) {
    console.error('GR Item Error:', itemError);
    return;
  }
  console.log('GR Item Created.');

  // 3. Update PO Item
  console.log('Updating PO Item quantity_received...');
  const { error: poiError } = await supabase
    .from('pharmacy_purchase_order_items')
    .update({ quantity_received: 5 })
    .eq('id', po_item_id);

  if (poiError) {
    console.error('PO Item Update Error:', poiError);
  }

  // 4. Update Order Tracking
  console.log('Updating Order Tracking status to delivered...');
  const { error: otError } = await supabase
    .from('pharmacy_order_tracking')
    .update({ 
      status: 'delivered',
      actual_delivery_date: new Date().toISOString(),
      is_overdue: false
    })
    .eq('lpo_id', lpo_id)
    .eq('item_id', item_id);

  if (otError) {
    console.error('Order Tracking Update Error:', otError);
  }

  // 5. Update PO Status
  console.log('Updating PO status to completed...');
  const { error: poStatusError } = await supabase
    .from('pharmacy_purchase_orders')
    .update({ status: 'completed' })
    .eq('id', po_id);

  if (poStatusError) {
    console.error('PO Status Update Error:', poStatusError);
  }

  console.log('--- WORKFLOW TEST COMPLETED SUCCESSFULLY ---');
  
  // Final Verification Check
  console.log('Final Verification:');
  const { data: verifyPO } = await supabase.from('pharmacy_purchase_orders').select('status').eq('id', po_id).single();
  const { data: verifyOT } = await supabase.from('pharmacy_order_tracking').select('status').eq('lpo_id', lpo_id).eq('item_id', item_id).single();
  const { data: verifyGR } = await supabase.from('pharmacy_goods_receipts').select('gr_number').eq('id', grId).single();

  console.log('PO Status:', verifyPO?.status);
  console.log('Tracking Status:', verifyOT?.status);
  console.log('GR Number:', verifyGR?.gr_number);
}

testWorkflow().catch(console.error);
