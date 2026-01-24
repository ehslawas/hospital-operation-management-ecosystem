
const { createClient } = require('@supabase/supabase-js')

// Use process.env directly
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in process.env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findMissingPOs() {
    console.log('--- Checking PO vs LPO Discrepancy ---')

    // 1. Get All Active POs (Approved/Sent) - What the PO Page counts as 126
    // The PO page likely counts everything in 'approved' or 'sent'.
    const { data: allPOs, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('id, po_number, status, hospital_id')
        .in('status', ['approved', 'sent'])
    //.neq('po_number', 'SQ%') // The user claims 0 SQs, but let's check what the raw DB says

    if (poError) { console.error(poError); return }

    console.log(`Total Approved/Sent POs in DB: ${allPOs.length}`)

    // 2. Simulate LPO Management "Total Regular POs" Logic
    // It sums: Pending LPOs + Approved LPOs

    // A. Pending LPOs (POs waiting for assignment)
    // lpoService.getPendingLPOs logic:
    // status in ['approved', 'sent'], not SQ%, AND (no lpo OR lpo has no document)

    // B. Approved LPOs (LPOs with document)
    // lpoService.getApprovedLPOs logic:
    // has document_url

    // Let's check them all against the LPO table
    const { data: allLPOs, error: lpoError } = await supabase
        .from('pharmacy_lpo')
        .select('id, po_id, lpo_number, document_url, status')

    if (lpoError) { console.error(lpoError); return }

    const lpoMap = new Map() // po_id -> lpo record
    allLPOs.forEach(l => {
        if (l.po_id) lpoMap.set(l.po_id, l)
    })

    let countPending = 0
    let countApproved = 0
    let countExcludedSQ = 0
    let countMissing = 0
    let missingIDs = []

    console.log('\n--- Analyzing each PO ---')

    for (const po of allPOs) {
        const isSQ = po.po_number.toUpperCase().startsWith('SQ')
        const lpo = lpoMap.get(po.id)
        const hasDocument = lpo && lpo.document_url

        if (isSQ) {
            countExcludedSQ++
            // Note: If user says 0 SQ, this should be 0.
            // If we find any, that explains the discrepancy.
            console.log(`[SQ Excluded] ${po.po_number} | Status: ${po.status}`)
            continue
        }

        if (hasDocument) {
            // Counted as "Approved & Sent" (or Verified)
            countApproved++
        } else {
            // Should be counted as "Pending LPO"
            countPending++
        }
    }

    console.log(`\n--- Summary ---`)
    console.log(`Total POs: ${allPOs.length}`)
    console.log(`- SQs (Excluded): ${countExcludedSQ}`)
    console.log(`- Regular POs (Should be Total in LPO Page): ${allPOs.length - countExcludedSQ}`)
    console.log(`\nBreakdown of Regular POs:`)
    console.log(`- Has LPO Document (Approved Tab): ${countApproved}`)
    console.log(`- No Document (Pending Tab): ${countPending}`)
    console.log(`\nUser sees 123 Total, but we expect ${allPOs.length - countExcludedSQ}.`)
    console.log(`The difference is likely SQs?`)
}

findMissingPOs()
