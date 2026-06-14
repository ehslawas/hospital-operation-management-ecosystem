import { supabase, isSupabaseConfigured } from '../supabase'

export interface FinancialReportData {
  metadata: {
    hospitalName: string
    dateFrom: string
    dateTo: string
    generatedAt: string
    generatedBy: string
  }
  
  executive: {
    totalAllocation: number
    totalExpenses: number
    remainingBalance: number
    usageRate: number // percentage
    totalWarrants: number
    activePOs: number
  }
  
  byVoteCode: {
    voteCode: string
    allocation: number
    expenses: number
    balance: number
    usageRate: number
    poCount: number
  }[]
  
  byCategory: {
    category: string
    allocation: number
    expenses: number
    balance: number
    usageRate: number
    poCount: number
  }[]
  
  byDepartment: {
    department: string
    allocation: number
    expenses: number
    balance: number
    usageRate: number
    poCount: number
  }[]
  
  byVoteActivity: {
    voteActivity: string
    allocation: number
    expenses: number
    balance: number
    usageRate: number
    poCount: number
  }[]
  
  monthlyTrend: {
    month: string // e.g. "01" (Jan), "02" (Feb)
    fullMonth: string // e.g. "2026-01"
    allocation: number
    expenses: number
  }[]
  
  quarterlyBreakdown: {
    quarter: string // Q1, Q2, Q3, Q4
    allocation: number
    expenses: number
    balance: number
  }[]
  
  transactions: {
    id: string
    poNumber: string
    date: string
    supplierName: string
    amount: number
    voteCode: string
    category: string
    department: string
    status: string
  }[]
  
  topItems: {
    itemName: string
    itemCode: string
    category: string
    department: string
    voteCode: string
    quantity: number
    totalSpent: number
  }[]
  
  forecast: {
    monthly: { month: string; projected: number; actual: number }[]
    quarterly: { quarter: string; projected: number; actual: number }[]
    annualProjection: number
    variance: number
    burnRate: number
  }
}

// Helper to normalize category labels (mirrors procurement service for seamless consistency)
const CATEGORY_LABELS: Record<string, string> = {
  drug: 'Drug',
  non_drug: 'Non Drug',
  non_standard: 'Non Standard',
  reagent: 'Reagent',
  vaccine: 'Vaccine',
  insulin: 'Insulin',
  hepc: 'HepC',
  medical_oxygen: 'Medical Oxygen',
  sglt2: 'SGLT-2',
  pathologist: 'Pathologist',
  medical_cylinder: 'Medical Cylinder',
  x_ray: 'X-Ray',
}

function normalizeCategory(cat: string | null): string {
  if (!cat) return 'non_drug'
  const normalized = cat.trim().toLowerCase()
  
  if (['drug', 'drugs'].includes(normalized)) return 'drug'
  if (['non_drug', 'non_drugs', 'non-drug', 'non-drugs'].includes(normalized)) return 'non_drug'
  if (['non_standard', 'non-standard', 'non standard'].includes(normalized)) return 'non_standard'
  if (['reagent', 'reagents'].includes(normalized)) return 'reagent'
  if (['vaccine', 'vaccines', 'vaksin'].includes(normalized)) return 'vaccine'
  if (['insulin'].includes(normalized)) return 'insulin'
  if (['hepc', 'hep-c', 'hep c'].includes(normalized)) return 'hepc'
  if (['medical_oxygen', 'oxygen', 'oksigen'].includes(normalized)) return 'medical_oxygen'
  if (['sglt2', 'sglt-2'].includes(normalized)) return 'sglt2'
  if (['pathologist', 'patologi'].includes(normalized)) return 'pathologist'
  if (['medical_cylinder', 'silinder'].includes(normalized)) return 'medical_cylinder'
  if (['x_ray', 'xray', 'x-ray'].includes(normalized)) return 'x_ray'
  
  const isStationery = /tulis|alat|pejabat|cetak|printing|stationery|paper|kertas/i.test(normalized)
  const isComputer = /komputer|computer|it|software|hardware/i.test(normalized)
  const isGeneral = /am|lain|general|others|unknown/i.test(normalized)
  const isFood = /makanan|minuman|food|beverage/i.test(normalized)
  const isScientific = /saintifik|penyelidikan|scientific|research/i.test(normalized)

  if (isStationery || isComputer || isGeneral || isFood) return 'non_drug'
  if (isScientific) return 'non_standard'

  return 'non_drug'
}

function normalizeDept(d: string | null): string {
  if (!d) return 'Pharmacy'
  const lower = d.trim().toLowerCase()
  if (lower === 'general ward' || lower === 'general_ward' || lower === 'wad general' || lower === 'general') return 'General Ward'
  if (lower === 'maternity ward' || lower === 'maternity_ward' || lower === 'wad maternity' || lower === 'wad bersalin' || lower === 'maternity') return 'Maternity Ward'
  if (lower === 'paediatric ward' || lower === 'paediatric_ward' || lower === 'wad pediatrik' || lower === 'paediatric' || lower === 'paed') return 'Paediatric Ward'
  if (lower === 'emergency' || lower === 'trauma' || lower === 'emergency_trauma' || lower === 'kecemasan') return 'Emergency & Trauma'
  if (lower === 'klinik pakar' || lower === 'klinik_pakar' || lower === 'specialist clinic' || lower === 'pakar') return 'Klinik Pakar'
  if (lower === 'nephrology' || lower === 'buah pinggang') return 'Nephrology'
  if (lower === 'radiology' || lower === 'x-ray' || lower === 'radiology_radiography') return 'Radiology & Radiography'
  if (lower === 'laboratory' || lower === 'pathology' || lower === 'laboratory_pathology') return 'Laboratory & Pathology'
  if (lower === 'operation_theater' || lower === 'ot' || lower === 'dewan bedah') return 'Operation Theater'
  if (lower === 'anaesthesiology' || lower === 'bius') return 'Anaesthesiology'
  if (lower === 'rehabilitation' || lower === 'fisioterapi') return 'Rehabilitation'
  if (lower === 'wound_care' || lower === 'wound') return 'Wound Care'
  if (lower === 'cssu_cssd' || lower === 'cssd') return 'CSSU & CSSD'
  if (lower === 'pharmacy' || lower === 'farmasi') return 'Pharmacy'
  
  // Title case the rest
  return d.trim().split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export async function generateFinancialReport(
  hospitalId: string,
  hospitalName: string,
  userName: string,
  dateFrom: string,
  dateTo: string
): Promise<{ data: FinancialReportData | null; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch pharmacy warrants (allocations)
      const warrantsPromise = supabase
        .from('pharmacy_warrants')
        .select('*')
        .eq('hospital_id', hospitalId)
        .gte('warrant_date', dateFrom)
        .lte('warrant_date', dateTo)

      // 2. Fetch purchase orders with items & supplier
      const poPromise = supabase
        .from('pharmacy_purchase_orders')
        .select(`
          id, po_number, po_type, order_date, total_amount, vote_code, category, department, status, manual_supplier_name,
          supplier:suppliers(company_name),
          items:pharmacy_purchase_order_items(item_name, item_code, quantity_ordered, unit_price)
        `)
        .eq('hospital_id', hospitalId)
        .gte('order_date', dateFrom)
        .lte('order_date', dateTo)

      const [warrantsRes, poRes] = await Promise.all([warrantsPromise, poPromise])

      if (warrantsRes.error) throw warrantsRes.error
      if (poRes.error) throw poRes.error

      const rawWarrants = (warrantsRes.data || []).filter(w => w.vote_code === '080702' || w.vote_code === '990102')
      const rawPOs = (poRes.data || []).filter(po => po.vote_code === '080702' || po.vote_code === '990102')

      // --- AGGREGATION ENGINE ---
      let totalAllocation = 0
      let totalExpenses = 0
      let activePOs = 0

      const voteCodeMap = new Map<string, { allocation: number; expenses: number; poCount: number }>()
      const categoryMap = new Map<string, { allocation: number; expenses: number; poCount: number }>()
      const departmentMap = new Map<string, { allocation: number; expenses: number; poCount: number }>()
      const voteActivityMap = new Map<string, { allocation: number; expenses: number; poCount: number }>()
      const monthlyTrendMap = new Map<string, { allocation: number; expenses: number }>()
      const itemsMap = new Map<string, { itemName: string; itemCode: string; category: string; department: string; voteCode: string; quantity: number; totalSpent: number }>()

      // 1. Process warrants
      rawWarrants.forEach(w => {
        const amt = Number(w.amount || 0)
        totalAllocation += amt

        const voteCode = w.vote_code || 'UNKNOWN'
        const rawCat = w.category || 'non_drug'
        const normCat = normalizeCategory(rawCat)
        const displayCat = CATEGORY_LABELS[normCat] || 'Non Drug'
        const displayDept = normalizeDept(w.department)
        const voteAct = w.vote_activity || 'UNKNOWN'

        // Aggregate by Vote Code
        const vcEntry = voteCodeMap.get(voteCode) || { allocation: 0, expenses: 0, poCount: 0 }
        vcEntry.allocation += amt
        voteCodeMap.set(voteCode, vcEntry)

        // Aggregate by Category
        const catEntry = categoryMap.get(displayCat) || { allocation: 0, expenses: 0, poCount: 0 }
        catEntry.allocation += amt
        categoryMap.set(displayCat, catEntry)

        // Aggregate by Department
        const deptEntry = departmentMap.get(displayDept) || { allocation: 0, expenses: 0, poCount: 0 }
        deptEntry.allocation += amt
        departmentMap.set(displayDept, deptEntry)

        // Aggregate by Vote Activity
        const actEntry = voteActivityMap.get(voteAct) || { allocation: 0, expenses: 0, poCount: 0 }
        actEntry.allocation += amt
        voteActivityMap.set(voteAct, actEntry)

        // Aggregate Monthly Trend
        if (w.warrant_date) {
          const monthStr = w.warrant_date.substring(0, 7) // YYYY-MM
          const trendEntry = monthlyTrendMap.get(monthStr) || { allocation: 0, expenses: 0 }
          trendEntry.allocation += amt
          monthlyTrendMap.set(monthStr, trendEntry)
        }
      })

      // 2. Process Purchase Orders
      rawPOs.forEach(po => {
        // Consider approved, sent, partial_received, completed status as actual or committed budget expenses
        const isExpense = ['approved', 'sent', 'partial_received', 'completed'].includes(po.status || '')
        const amt = Number(po.total_amount || 0)

        if (isExpense) {
          totalExpenses += amt
          if (po.status !== 'completed' && po.status !== 'cancelled') {
            activePOs++
          }

          const voteCode = po.vote_code || 'UNKNOWN'
          const rawCat = po.category || 'non_drug'
          const normCat = normalizeCategory(rawCat)
          const displayCat = CATEGORY_LABELS[normCat] || 'Non Drug'
          const displayDept = normalizeDept(po.department)

          // Aggregate by Vote Code
          const vcEntry = voteCodeMap.get(voteCode) || { allocation: 0, expenses: 0, poCount: 0 }
          vcEntry.expenses += amt
          vcEntry.poCount++
          voteCodeMap.set(voteCode, vcEntry)

          // Aggregate by Category
          const catEntry = categoryMap.get(displayCat) || { allocation: 0, expenses: 0, poCount: 0 }
          catEntry.expenses += amt
          catEntry.poCount++
          categoryMap.set(displayCat, catEntry)

          // Aggregate by Department
          const deptEntry = departmentMap.get(displayDept) || { allocation: 0, expenses: 0, poCount: 0 }
          deptEntry.expenses += amt
          deptEntry.poCount++
          departmentMap.set(displayDept, deptEntry)

          // Try to retrieve vote activity from items or standard naming
          const defaultVoteAct = voteCode === '080702' ? '27401' : '27499'
          const actEntry = voteActivityMap.get(defaultVoteAct) || { allocation: 0, expenses: 0, poCount: 0 }
          actEntry.expenses += amt
          actEntry.poCount++
          voteActivityMap.set(defaultVoteAct, actEntry)

          // Aggregate Monthly Trend
          if (po.order_date) {
            const monthStr = po.order_date.substring(0, 7) // YYYY-MM
            const trendEntry = monthlyTrendMap.get(monthStr) || { allocation: 0, expenses: 0 }
            trendEntry.expenses += amt
            monthlyTrendMap.set(monthStr, trendEntry)
          }

          // Process PO Items for Detailed Spend Breakdown
          const itemsList = po.items || []
          itemsList.forEach((item: any) => {
            const itemQty = Number(item.quantity_ordered || 0)
            const itemCost = Number(item.unit_price || 0) * itemQty
            const itemKey = `${item.item_code || item.item_name}:${voteCode}:${displayDept}`

            const existingItem = itemsMap.get(itemKey) || {
              itemName: item.item_name || 'Generic Item',
              itemCode: item.item_code || 'N/A',
              category: displayCat,
              department: displayDept,
              voteCode: voteCode,
              quantity: 0,
              totalSpent: 0
            }
            existingItem.quantity += itemQty
            existingItem.totalSpent += itemCost
            itemsMap.set(itemKey, existingItem)
          })
        }
      })

      // 3. Assemble Breakdown Arrays
      const byVoteCode = Array.from(voteCodeMap.entries()).map(([voteCode, s]) => ({
        voteCode,
        allocation: s.allocation,
        expenses: s.expenses,
        balance: s.allocation - s.expenses,
        usageRate: s.allocation > 0 ? (s.expenses / s.allocation) * 100 : 0,
        poCount: s.poCount
      })).sort((a, b) => b.expenses - a.expenses)

      const byCategory = Array.from(categoryMap.entries()).map(([category, s]) => ({
        category,
        allocation: s.allocation,
        expenses: s.expenses,
        balance: s.allocation - s.expenses,
        usageRate: s.allocation > 0 ? (s.expenses / s.allocation) * 100 : 0,
        poCount: s.poCount
      })).sort((a, b) => b.expenses - a.expenses)

      const byDepartment = Array.from(departmentMap.entries()).map(([department, s]) => ({
        department,
        allocation: s.allocation,
        expenses: s.expenses,
        balance: s.allocation - s.expenses,
        usageRate: s.allocation > 0 ? (s.expenses / s.allocation) * 100 : 0,
        poCount: s.poCount
      })).sort((a, b) => b.expenses - a.expenses)

      const byVoteActivity = Array.from(voteActivityMap.entries()).map(([voteActivity, s]) => ({
        voteActivity,
        allocation: s.allocation,
        expenses: s.expenses,
        balance: s.allocation - s.expenses,
        usageRate: s.allocation > 0 ? (s.expenses / s.allocation) * 100 : 0,
        poCount: s.poCount
      })).sort((a, b) => b.expenses - a.expenses)

      // Monthly Trend Sort and Aggregation
      const monthsSet = new Set<string>()
      // Ensure all months in range are covered or at least matching warrants + POs
      monthlyTrendMap.forEach((_, key) => monthsSet.add(key))
      const monthlyTrend = Array.from(monthsSet).sort().map(monthStr => {
        const trend = monthlyTrendMap.get(monthStr) || { allocation: 0, expenses: 0 }
        return {
          month: monthStr.substring(5), // "01", "02"
          fullMonth: monthStr, // "2026-01"
          allocation: trend.allocation,
          expenses: trend.expenses
        }
      })

      // Quarterly breakdown
      const quarters: Record<string, { allocation: number; expenses: number }> = {
        Q1: { allocation: 0, expenses: 0 },
        Q2: { allocation: 0, expenses: 0 },
        Q3: { allocation: 0, expenses: 0 },
        Q4: { allocation: 0, expenses: 0 }
      }
      monthlyTrend.forEach(t => {
        const m = parseInt(t.month, 10)
        let q = 'Q1'
        if (m >= 4 && m <= 6) q = 'Q2'
        else if (m >= 7 && m <= 9) q = 'Q3'
        else if (m >= 10 && m <= 12) q = 'Q4'

        quarters[q].allocation += t.allocation
        quarters[q].expenses += t.expenses
      })
      const quarterlyBreakdown = Object.entries(quarters).map(([quarter, val]) => ({
        quarter,
        allocation: val.allocation,
        expenses: val.expenses,
        balance: val.allocation - val.expenses
      }))

      // Transactions formatting
      const transactions = rawPOs.map(po => {
        const poAny = po as any
        const supName = poAny.manual_supplier_name || (Array.isArray(poAny.supplier) ? poAny.supplier[0]?.company_name : poAny.supplier?.company_name) || 'Direct Procurement'
        const rawCat = poAny.category || 'non_drug'
        const normCat = normalizeCategory(rawCat)
        const displayCat = CATEGORY_LABELS[normCat] || 'Non Drug'
        return {
          id: poAny.id,
          poNumber: poAny.po_number || 'N/A',
          date: poAny.order_date || '',
          supplierName: supName,
          amount: Number(poAny.total_amount || 0),
          voteCode: poAny.vote_code || 'UNKNOWN',
          category: displayCat,
          department: normalizeDept(poAny.department),
          status: poAny.status || 'draft'
        }
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Top Spending items
      const topItems = Array.from(itemsMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 15)

      // Forecast Aggregation
      const monthlyForecast = [
        { month: 'Jan', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-01`)?.expenses || 0 },
        { month: 'Feb', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-02`)?.expenses || 0 },
        { month: 'Mar', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-03`)?.expenses || 0 },
        { month: 'Apr', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-04`)?.expenses || 0 },
        { month: 'May', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-05`)?.expenses || 0 },
        { month: 'Jun', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-06`)?.expenses || 0 },
        { month: 'Jul', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-07`)?.expenses || 0 },
        { month: 'Aug', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-08`)?.expenses || 0 },
        { month: 'Sep', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-09`)?.expenses || 0 },
        { month: 'Oct', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-10`)?.expenses || 0 },
        { month: 'Nov', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-11`)?.expenses || 0 },
        { month: 'Dec', projected: totalAllocation / 12, actual: monthlyTrendMap.get(`${dateFrom.substring(0, 4)}-12`)?.expenses || 0 },
      ]

      const quarterlyForecast = [
        { quarter: 'Q1', projected: totalAllocation / 4, actual: quarterlyBreakdown.find(q => q.quarter === 'Q1')?.expenses || 0 },
        { quarter: 'Q2', projected: totalAllocation / 4, actual: quarterlyBreakdown.find(q => q.quarter === 'Q2')?.expenses || 0 },
        { quarter: 'Q3', projected: totalAllocation / 4, actual: quarterlyBreakdown.find(q => q.quarter === 'Q3')?.expenses || 0 },
        { quarter: 'Q4', projected: totalAllocation / 4, actual: quarterlyBreakdown.find(q => q.quarter === 'Q4')?.expenses || 0 },
      ]

      const completedMonths = monthlyForecast.filter(f => f.actual > 0).length || 1
      const avgSpentPerMonth = totalExpenses / completedMonths
      const annualProjection = avgSpentPerMonth * 12
      const variance = totalAllocation - annualProjection
      const burnRate = totalAllocation > 0 ? (totalExpenses / totalAllocation) * 100 : 0

      const data: FinancialReportData = {
        metadata: {
          hospitalName,
          dateFrom,
          dateTo,
          generatedAt: new Date().toISOString(),
          generatedBy: userName
        },
        executive: {
          totalAllocation,
          totalExpenses,
          remainingBalance: totalAllocation - totalExpenses,
          usageRate: totalAllocation > 0 ? (totalExpenses / totalAllocation) * 100 : 0,
          totalWarrants: rawWarrants.length,
          activePOs
        },
        byVoteCode,
        byCategory,
        byDepartment,
        byVoteActivity,
        monthlyTrend,
        quarterlyBreakdown,
        transactions,
        topItems,
        forecast: {
          monthly: monthlyForecast,
          quarterly: quarterlyForecast,
          annualProjection,
          variance,
          burnRate
        }
      }

      return { data, error: null }
    }

    // --- FALLBACK MOCK ENGINE ---
    // If Supabase isn't configured, compile a highly detailed, professional mock response
    await new Promise(resolve => setTimeout(resolve, 800)) // Artificial latency for premium feel

    const mockAlloc = 2850000
    const mockExp = 1984250
    const activePOs = 124
    const warrantsCount = 42

    const data: FinancialReportData = {
      metadata: {
        hospitalName,
        dateFrom,
        dateTo,
        generatedAt: new Date().toISOString(),
        generatedBy: userName
      },
      executive: {
        totalAllocation: mockAlloc,
        totalExpenses: mockExp,
        remainingBalance: mockAlloc - mockExp,
        usageRate: (mockExp / mockAlloc) * 100,
        totalWarrants: warrantsCount,
        activePOs
      },
      byVoteCode: [
        { voteCode: '080702', allocation: 1850000, expenses: 1354000, balance: 496000, usageRate: (1354000 / 1850000) * 100, poCount: 88 },
        { voteCode: '990102', allocation: 1000000, expenses: 630250, balance: 369750, usageRate: (630250 / 1000000) * 100, poCount: 36 }
      ],
      byCategory: [
        { category: 'Drug', allocation: 1500000, expenses: 1084250, balance: 415750, usageRate: (1084250 / 1500000) * 100, poCount: 52 },
        { category: 'Non Drug', allocation: 500000, expenses: 320000, balance: 180000, usageRate: (320000 / 500000) * 100, poCount: 30 },
        { category: 'Non Standard', allocation: 250000, expenses: 180000, balance: 70000, usageRate: (180000 / 250000) * 100, poCount: 12 },
        { category: 'Reagent', allocation: 300000, expenses: 220000, balance: 80000, usageRate: (220000 / 300000) * 100, poCount: 16 },
        { category: 'Vaccine', allocation: 200000, expenses: 135000, balance: 65000, usageRate: (135000 / 200000) * 100, poCount: 8 },
        { category: 'Medical Oxygen', allocation: 100000, expenses: 45000, balance: 55000, usageRate: (45000 / 100000) * 100, poCount: 6 }
      ],
      byDepartment: [
        { department: 'Pharmacy', allocation: 900000, expenses: 680000, balance: 220000, usageRate: (680000 / 900000) * 100, poCount: 34 },
        { department: 'Emergency & Trauma', allocation: 400000, expenses: 290000, balance: 110000, usageRate: (290000 / 400000) * 100, poCount: 22 },
        { department: 'General Ward', allocation: 350000, expenses: 255000, balance: 95000, usageRate: (255000 / 350000) * 100, poCount: 18 },
        { department: 'Laboratory & Pathology', allocation: 300000, expenses: 220000, balance: 80000, usageRate: (220000 / 300000) * 100, poCount: 15 },
        { department: 'Operation Theater', allocation: 400000, expenses: 280000, balance: 120000, usageRate: (280000 / 400000) * 100, poCount: 16 },
        { department: 'Maternity Ward', allocation: 200000, expenses: 110000, balance: 90000, usageRate: (110000 / 200000) * 100, poCount: 10 },
        { department: 'Nephrology', allocation: 150000, expenses: 84250, balance: 65750, usageRate: (84250 / 150000) * 100, poCount: 6 },
        { department: 'Radiology & Radiography', allocation: 150000, expenses: 65000, balance: 85000, usageRate: (65000 / 150000) * 100, poCount: 3 }
      ],
      byVoteActivity: [
        { voteActivity: '27401 (Drug Spend)', allocation: 1500000, expenses: 1084250, balance: 415750, usageRate: (1084250 / 1500000) * 100, poCount: 52 },
        { voteActivity: '27499 (Consumables)', allocation: 750000, expenses: 500000, balance: 250000, usageRate: (500000 / 750000) * 100, poCount: 42 },
        { voteActivity: '27404 (Oxygen Cyl)', allocation: 100000, expenses: 45000, balance: 55000, usageRate: (45000 / 100000) * 100, poCount: 6 },
        { voteActivity: '27403 (Special Reagents)', allocation: 300000, expenses: 220000, balance: 80000, usageRate: (220000 / 300000) * 100, poCount: 16 },
        { voteActivity: '27402 (Standard Vaccines)', allocation: 200000, expenses: 135000, balance: 65000, usageRate: (135000 / 200000) * 100, poCount: 8 }
      ],
      monthlyTrend: [
        { month: 'Jan', fullMonth: '2026-01', allocation: 237500, expenses: 180000 },
        { month: 'Feb', fullMonth: '2026-02', allocation: 237500, expenses: 220000 },
        { month: 'Mar', fullMonth: '2026-03', allocation: 237500, expenses: 285000 },
        { month: 'Apr', fullMonth: '2026-04', allocation: 237500, expenses: 210000 },
        { month: 'May', fullMonth: '2026-05', allocation: 237500, expenses: 245000 },
        { month: 'Jun', fullMonth: '2026-06', allocation: 237500, expenses: 190000 },
        { month: 'Jul', fullMonth: '2026-07', allocation: 237500, expenses: 155000 },
        { month: 'Aug', fullMonth: '2026-08', allocation: 237500, expenses: 165000 },
        { month: 'Sep', fullMonth: '2026-09', allocation: 237500, expenses: 140250 },
        { month: 'Oct', fullMonth: '2026-10', allocation: 237500, expenses: 94000 },
        { month: 'Nov', fullMonth: '2026-11', allocation: 237500, expenses: 60000 },
        { month: 'Dec', fullMonth: '2026-12', allocation: 237500, expenses: 40000 }
      ],
      quarterlyBreakdown: [
        { quarter: 'Q1', allocation: 712500, expenses: 685000, balance: 27500 },
        { quarter: 'Q2', allocation: 712500, expenses: 645000, balance: 67500 },
        { quarter: 'Q3', allocation: 712500, expenses: 460250, balance: 252250 },
        { quarter: 'Q4', allocation: 712500, expenses: 194000, balance: 518500 }
      ],
      transactions: [
        { id: 'po-1', poNumber: 'PO-2026-0042', date: '2026-05-24', supplierName: 'PharmaNiaga Logistics Sdn Bhd', amount: 84250, voteCode: '080702', category: 'Drug', department: 'Nephrology', status: 'completed' },
        { id: 'po-2', poNumber: 'PO-2026-0041', date: '2026-05-22', supplierName: 'Apex Pharmacy Marketing Sdn Bhd', amount: 125000, voteCode: '080702', category: 'Drug', department: 'Pharmacy', status: 'approved' },
        { id: 'po-3', poNumber: 'PO-2026-0040', date: '2026-05-20', supplierName: 'Zuellig Pharma Malaysia Sdn Bhd', amount: 56000, voteCode: '990102', category: 'Non Drug', department: 'Emergency & Trauma', status: 'partial_received' },
        { id: 'po-4', poNumber: 'PO-2026-0039', date: '2026-05-18', supplierName: 'B. Braun Medical Supplies Sdn Bhd', amount: 92000, voteCode: '080702', category: 'Reagent', department: 'Laboratory & Pathology', status: 'sent' },
        { id: 'po-5', poNumber: 'PO-2026-0038', date: '2026-05-15', supplierName: 'Duopharma Marketing Sdn Bhd', amount: 180000, voteCode: '990102', category: 'Non Standard', department: 'Operation Theater', status: 'completed' },
        { id: 'po-6', poNumber: 'PO-2026-0037', date: '2026-05-10', supplierName: 'Medi-Life (M) Sdn Bhd', amount: 35000, voteCode: '080702', category: 'Vaccine', department: 'Maternity Ward', status: 'approved' },
        { id: 'po-7', poNumber: 'PO-2026-0036', date: '2026-05-08', supplierName: 'PharmaNiaga Logistics Sdn Bhd', amount: 110000, voteCode: '080702', category: 'Drug', department: 'General Ward', status: 'completed' },
        { id: 'po-8', poNumber: 'PO-2026-0035', date: '2026-05-04', supplierName: 'Gas Malaysia Healthcare', amount: 45000, voteCode: '990102', category: 'Medical Oxygen', department: 'Emergency & Trauma', status: 'completed' },
        { id: 'po-9', poNumber: 'PO-2026-0034', date: '2026-04-28', supplierName: 'Komedic Sdn Bhd', amount: 28000, voteCode: '080702', category: 'Non Drug', department: 'Radiology & Radiography', status: 'completed' }
      ],
      topItems: [
        { itemName: 'Paracetamol 500mg Tablets (APPL)', itemCode: 'DRG-001', category: 'Drug', department: 'Pharmacy', voteCode: '080702', quantity: 250000, totalSpent: 125000 },
        { itemName: 'Amoxicillin 250mg Capsules', itemCode: 'DRG-002', category: 'Drug', department: 'General Ward', voteCode: '080702', quantity: 180000, totalSpent: 90000 },
        { itemName: 'Disposable Sterile Syringes 5ml', itemCode: 'NDG-102', category: 'Non Drug', department: 'Emergency & Trauma', voteCode: '990102', quantity: 120000, totalSpent: 60000 },
        { itemName: 'Renal Dialysis Solution B-1', itemCode: 'DRG-305', category: 'Drug', department: 'Nephrology', voteCode: '080702', quantity: 8000, totalSpent: 84250 },
        { itemName: 'Standard IV Infusion Sets', itemCode: 'NDG-110', category: 'Non Drug', department: 'General Ward', voteCode: '990102', quantity: 50000, totalSpent: 45000 },
        { itemName: 'Hepatitis B Recombinant Vaccine', itemCode: 'VAC-004', category: 'Vaccine', department: 'Maternity Ward', voteCode: '080702', quantity: 15000, totalSpent: 135000 },
        { itemName: 'Medical Grade Gaseous Oxygen Cylinder 10L', itemCode: 'OXY-001', category: 'Medical Oxygen', department: 'Emergency & Trauma', voteCode: '990102', quantity: 1200, totalSpent: 45000 },
        { itemName: 'Cardiac Biomarker Troponin-I Test Kit', itemCode: 'REA-204', category: 'Reagent', department: 'Laboratory & Pathology', voteCode: '080702', quantity: 2500, totalSpent: 92000 },
        { itemName: 'Sutures Vicryl 3-0 Absorption Braided', itemCode: 'NST-440', category: 'Non Standard', department: 'Operation Theater', voteCode: '990102', quantity: 3000, totalSpent: 180000 },
        { itemName: 'Insulin Glargine 100 U/ml Pen', itemCode: 'DRG-708', category: 'Drug', department: 'Pharmacy', voteCode: '080702', quantity: 1200, totalSpent: 65000 }
      ],
      forecast: {
        monthly: [
          { month: 'Jan', projected: 237500, actual: 180000 },
          { month: 'Feb', projected: 237500, actual: 220000 },
          { month: 'Mar', projected: 237500, actual: 285000 },
          { month: 'Apr', projected: 237500, actual: 210000 },
          { month: 'May', projected: 237500, actual: 245000 },
          { month: 'Jun', projected: 237500, actual: 0 },
          { month: 'Jul', projected: 237500, actual: 0 },
          { month: 'Aug', projected: 237500, actual: 0 },
          { month: 'Sep', projected: 237500, actual: 0 },
          { month: 'Oct', projected: 237500, actual: 0 },
          { month: 'Nov', projected: 237500, actual: 0 },
          { month: 'Dec', projected: 237500, actual: 0 }
        ],
        quarterly: [
          { quarter: 'Q1', projected: 712500, actual: 685000 },
          { quarter: 'Q2', projected: 712500, actual: 455000 },
          { quarter: 'Q3', projected: 712500, actual: 0 },
          { quarter: 'Q4', projected: 712500, actual: 0 }
        ],
        annualProjection: 2182000,
        variance: 668000,
        burnRate: (mockExp / mockAlloc) * 100
      }
    }

    return { data, error: null }
  } catch (err: any) {
    console.error('generateFinancialReport error', err)
    return { data: null, error: err.message || 'Failed to generate financial report' }
  }
}
