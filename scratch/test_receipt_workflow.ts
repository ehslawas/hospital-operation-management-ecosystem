
import { createGoodsReceipt } from '../src/services/pharmacy/receivingService';
import { supabase } from '../src/services/supabase';

async function testWorkflow() {
  const testData = {
    hospital_id: '85bb6adc-b868-428b-83f4-e5af2f5cf904',
    po_id: '5b8d0d79-35d6-4dd7-9539-bd5ee95ccad6',
    lpo_id: 'b5027b31-7f93-4214-a59a-93bc8578eddb',
    receipt_date: new Date().toISOString().split('T')[0],
    delivery_note_number: 'DN-TEST-001',
    invoice_number: 'INV-TEST-001',
    invoice_amount: 100.0,
    received_by: 'd92476aa-f753-4da1-ab8e-5e7bce53f5d3',
    notes: 'End-to-end automated test receipt',
    items: [
      {
        po_item_id: 'f4938a13-1a82-4590-9e88-c6504ebd9b86',
        item_id: '469c5ba3-6746-4729-a084-efb96db18284',
        quantity_ordered: 5,
        quantity_previously_received: 0,
        quantity_received: 5,
        quantity_accepted: 5,
        quantity_rejected: 0,
        disposition: 'accepted',
        batches: [
          {
            batch_number: 'BATCH-TEST-001',
            expiry_date: '2028-12-31',
            quantity: 5
          }
        ]
      }
    ]
  };

  console.log('Starting Goods Receipt creation...');
  const result = await createGoodsReceipt(testData as any);
  
  if (result.error) {
    console.error('Workflow Failed:', result.error);
    return;
  }

  console.log('Goods Receipt Created Successfully:', result.data.gr_number);
  
  // Verification
  console.log('Verifying PO status...');
  const { data: po } = await supabase
    .from('pharmacy_purchase_orders')
    .select('status')
    .eq('id', testData.po_id)
    .single();
  console.log('PO Status:', po?.status); // Should be 'completed'

  console.log('Verifying Order Tracking status...');
  const { data: ot } = await supabase
    .from('pharmacy_order_tracking')
    .select('status')
    .eq('lpo_id', testData.lpo_id)
    .eq('item_id', testData.items[0].item_id)
    .single();
  console.log('Tracking Status:', ot?.status); // Should be 'delivered'
}

testWorkflow().catch(console.error);
