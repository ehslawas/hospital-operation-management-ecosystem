import { supabase } from '../src/lib/supabase'

async function checkStats() {
  const hospitalId = '85bb6adc-b868-428b-83f4-e5af2f5cf904'
  
  const { data: items, error } = await supabase
    .from('pharmacy_order_tracking')
    .select(`
      lpo_id, 
      status, 
      expected_delivery_date,
      lpo:pharmacy_lpo!inner(
        po:pharmacy_purchase_orders!inner(status)
      )
    `)
    .eq('hospital_id', hospitalId)
    .eq('lpo.po.status', 'approved')

  if (error) {
    console.error('Error:', error)
    return
  }

  const distinctLPOs = new Set(items.map(i => i.lpo_id))
  console.log('Total tracked items:', items.length)
  console.log('Total distinct LPOs:', distinctLPOs.size)
}

checkStats()
