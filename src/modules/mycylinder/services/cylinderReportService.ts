// @ts-nocheck
/**
 * Cylinder Report Service
 * Aggregates cylinder lifecycle, warrant utilization, consumption trends, and forecasting.
 */

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'

export interface WarrantEntry {
  id: string
  warrant_no: string
  vote_code: string
  amount: number
  warrant_date: string
  category: string
}

export interface DeliveryEntry {
  id: string
  delivery_order_no: string
  reception_date: string
  total_amount: number
  status: string
  items_count: number
}

export interface CylinderDetailEntry {
  id: string
  serial_number: string
  size_code: string
  type_name: string
  status: string
  location_name: string
  department_name: string | null
  qr_code: string | null
  last_movement_date: string | null
}

export interface CylinderReportData {
  summary: {
    totalCylinders: number
    activeCylinders: number
    totalWarrants: number
    totalWarrantAmount: number
    totalExpenses: number
    budgetUtilization: number // percentage
    totalDeliveries: number
    avgMonthlyUsage: number
    currentBalance: number
    runwayMonths: number
  }
  warrants: {
    list: WarrantEntry[]
    monthlyTrend: { month: string; allocated: number; spent: number }[]
    utilizationByVoteCode: { voteCode: string; allocated: number; spent: number }[]
  }
  usage: {
    byType: { type: string; count: number; percentage: number }[]
    byDepartment: { department: string; count: number }[]
    monthlyTrend: { month: string; [sizeCode: string]: number }[]
    averageMonthly: { type: string; avgUsage: number }[]
    topConsumingDepartments: { department: string; usage: number; percentage: number }[]
  }
  deliveries: {
    total: number
    monthlyTrend: { month: string; count: number; amount: number }[]
    receivedMonthlyTrend: { month: string; [sizeCode: string]: number }[]
    byStatus: { status: string; count: number }[]
    recentDeliveries: DeliveryEntry[]
    avgDeliveryValue: number
  }
  inventory: {
    byStatus: { status: string; count: number; color: string }[]
    byType: { type: string; full: number; empty: number; inUse: number; maintenance: number }[]
    utilizationRate: number
    qrTaggedPercentage: number
    departmentDistribution: { department: string; count: number }[]
  }
  forecast: {
    nextMonth: { type: string; predicted: number; confidence: number }[]
    next3Months: { month: string; predicted: number; lower: number; upper: number }[]
    budgetRunway: { currentBalance: number; burnRate: number; monthsRemaining: number }
    seasonalPattern: { month: string; avgUsage: number }[]
  }
  detailed: CylinderDetailEntry[]
}

/**
 * Perform simple linear regression on a numeric series
 */
function calculateLinearRegression(y: number[]): { slope: number; intercept: number; r2: number } {
  const n = y.length
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 }
  if (n === 1) return { slope: 0, intercept: y[0], r2: 1 }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  let sumYY = 0

  for (let i = 0; i < n; i++) {
    const x = i
    sumX += x
    sumY += y[i]
    sumXY += x * y[i]
    sumXX += x * x
    sumYY += y[i] * y[i]
  }

  const meanX = sumX / n
  const meanY = sumY / n

  const num = n * sumXY - sumX * sumY
  const den = n * sumXX - sumX * sumX

  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanX

  // Calculate R-squared
  let numR = 0
  let denR = 0
  for (let i = 0; i < n; i++) {
    const pred = slope * i + intercept
    numR += Math.pow(y[i] - pred, 2)
    denR += Math.pow(y[i] - meanY, 2)
  }

  const r2 = denR === 0 ? 1 : 1 - numR / denR

  return {
    slope,
    intercept,
    r2: Math.max(0, Math.min(1, r2)),
  }
}

/**
 * Generate Cylinder Report Data
 */
export async function generateCylinderReport(
  hospitalId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<ApiResponse<CylinderReportData>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Fetch Warrants
      const { data: warrantsRaw, error: wErr } = await supabase
        .from('pharmacy_warrants')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('category', 'medical_oxygen')

      if (wErr) throw wErr

      // 2. Fetch Receptions
      const { data: receptionsRaw, error: rErr } = await supabase
        .from('pharmacy_oxygen_reception_records')
        .select(`
          *,
          items:pharmacy_oxygen_reception_items(
            *,
            size_info:pharmacy_oxygen_cylinder_sizes(*)
          )
        `)
        .eq('hospital_id', hospitalId)

      if (rErr) throw rErr

      // 3. Fetch Inventory
      const { data: inventoryRaw, error: iErr } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select(`
          *,
          size_info:pharmacy_oxygen_cylinder_sizes(*),
          type_info:pharmacy_oxygen_cylinder_types(*),
          department:departments(*)
        `)
        .eq('hospital_id', hospitalId)

      if (iErr) throw iErr

      // 4. Fetch Consumption (from live dept requests, as consumption table is empty)
      const { data: deptRequestsRaw, error: cErr } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .select(`
          *,
          department:departments(*),
          items:pharmacy_oxygen_dept_request_items(
            *,
            size_info:pharmacy_oxygen_cylinder_sizes(*)
          )
        `)
        .eq('hospital_id', hospitalId)
        .eq('status', 'completed')

      if (cErr) throw cErr

      // Determine the active Fiscal Year based on the end of the reporting period
      const fiscalYear = dateRange.endDate.getFullYear()
      const fiscalYearStart = new Date(fiscalYear, 0, 1)
      const fiscalYearEnd = new Date(fiscalYear, 11, 31)

      // 6. Aggregate Warrants & Budgets (filtered to active Fiscal Year)
      const warrantsList: WarrantEntry[] = (warrantsRaw || [])
        .map(w => ({
          id: w.id,
          warrant_no: w.warrant_no || w.document_no || 'W-UNKNOWN',
          vote_code: w.vote_code || '080702',
          amount: Number(w.amount || 0),
          warrant_date: w.warrant_date || w.created_at?.split('T')[0] || '2026-01-01',
          category: w.category || 'medical_oxygen',
        }))
        .filter(w => {
          const wDate = new Date(w.warrant_date)
          return wDate >= fiscalYearStart && wDate <= fiscalYearEnd
        })

      const totalWarrantAmount = warrantsList.reduce((sum, w) => sum + w.amount, 0)

      // Total Expenses from completed receptions (filtered to active Fiscal Year)
      const completedReceptions = (receptionsRaw || [])
        .filter(r => r.status === 'completed')
        .filter(r => {
          const rDate = new Date(r.reception_date)
          return rDate >= fiscalYearStart && rDate <= fiscalYearEnd
        })

      const totalExpenses = completedReceptions.reduce((sum, r) => sum + Number(r.total_amount || 0), 0)
      const currentBalance = totalWarrantAmount - totalExpenses
      const budgetUtilization = totalWarrantAmount > 0 ? (totalExpenses / totalWarrantAmount) * 100 : 0

      // Group warrants & spend by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const warrantTrendMap: Record<string, { allocated: number; spent: number }> = {}
      
      // Initialize recent 6 months
      const startMonthIndex = dateRange.startDate.getMonth()
      const endMonthIndex = dateRange.endDate.getMonth()
      const targetMonths: string[] = []
      
      let tempDate = new Date(dateRange.startDate)
      while (tempDate <= dateRange.endDate) {
        const mLabel = months[tempDate.getMonth()] + ' ' + String(tempDate.getFullYear()).slice(-2)
        warrantTrendMap[mLabel] = { allocated: 0, spent: 0 }
        targetMonths.push(mLabel)
        tempDate.setMonth(tempDate.getMonth() + 1)
      }

      warrantsList.forEach(w => {
        const wDate = new Date(w.warrant_date)
        const mLabel = months[wDate.getMonth()] + ' ' + String(wDate.getFullYear()).slice(-2)
        if (warrantTrendMap[mLabel]) {
          warrantTrendMap[mLabel].allocated += w.amount
        }
      })

      completedReceptions.forEach(r => {
        const rDate = new Date(r.reception_date)
        const mLabel = months[rDate.getMonth()] + ' ' + String(rDate.getFullYear()).slice(-2)
        if (warrantTrendMap[mLabel]) {
          warrantTrendMap[mLabel].spent += Number(r.total_amount || 0)
        }
      })

      const warrantsMonthlyTrend = targetMonths.map(m => ({
        month: m,
        allocated: warrantTrendMap[m].allocated,
        spent: warrantTrendMap[m].spent,
      }))

      // Utilization by Vote Code (strictly filtered to active Fiscal Year)
      const utilByVote: Record<string, { allocated: number; spent: number }> = {}
      warrantsList.forEach(w => {
        if (!utilByVote[w.vote_code]) utilByVote[w.vote_code] = { allocated: 0, spent: 0 }
        utilByVote[w.vote_code].allocated += w.amount
      })
      completedReceptions.forEach(r => {
        const vote = r.vote_code || '080702'
        if (!utilByVote[vote]) utilByVote[vote] = { allocated: 0, spent: 0 }
        utilByVote[vote].spent += Number(r.total_amount || 0)
      })
      const utilizationByVoteCode = Object.entries(utilByVote).map(([voteCode, val]) => ({
        voteCode,
        allocated: val.allocated,
        spent: val.spent,
      }))

      // 7. Aggregate Usage / Consumption (Derived from completed department requests)
      const targetConsumptions: any[] = []
      ;(deptRequestsRaw || []).forEach(req => {
        const reqDate = new Date(req.approved_at || req.created_at)
        if (reqDate >= dateRange.startDate && reqDate <= dateRange.endDate) {
          ;(req.items || []).forEach((item: any) => {
            const sizeCode = item.size_info?.code || 'Size D'
            targetConsumptions.push({
              consumption_date: (req.approved_at || req.created_at || '').split('T')[0],
              created_at: req.created_at,
              cylinder_size: sizeCode,
              quantity: Number(item.quantity_issued || item.quantity || 0),
              department: req.department
            })
          })
        }
      })

      const totalConsumptionQty = targetConsumptions.reduce((sum, c) => sum + Number(c.quantity || 0), 0)

      // Usage by type (e.g. size)
      const usageByTypeMap: Record<string, number> = {}
      targetConsumptions.forEach(c => {
        const type = c.cylinder_size || 'Size D'
        usageByTypeMap[type] = (usageByTypeMap[type] || 0) + Number(c.quantity || 0)
      })
      const usageByType = Object.entries(usageByTypeMap).map(([type, count]) => ({
        type,
        count,
        percentage: totalConsumptionQty > 0 ? (count / totalConsumptionQty) * 100 : 0,
      })).sort((a, b) => b.count - a.count)

      // Usage by Department
      const usageByDeptMap: Record<string, number> = {}
      targetConsumptions.forEach(c => {
        const dept = c.department?.department_name || c.department?.name || c.location || 'Unknown'
        usageByDeptMap[dept] = (usageByDeptMap[dept] || 0) + Number(c.quantity || 0)
      })
      const usageByDepartment = Object.entries(usageByDeptMap).map(([department, count]) => ({
        department,
        count,
      })).sort((a, b) => b.count - a.count)

      const topConsumingDepartments = usageByDepartment.map(d => ({
        department: d.department,
        usage: d.count,
        percentage: totalConsumptionQty > 0 ? (d.count / totalConsumptionQty) * 100 : 0,
      })).slice(0, 8)

      // Usage Monthly Trend
      const usageTrendMap: Record<string, Record<string, number>> = {}
      targetMonths.forEach(m => {
        usageTrendMap[m] = {}
      })

      targetConsumptions.forEach(c => {
        const cDate = new Date(c.consumption_date || c.created_at)
        const mLabel = months[cDate.getMonth()] + ' ' + String(cDate.getFullYear()).slice(-2)
        const type = c.cylinder_size || 'Size D'
        if (usageTrendMap[mLabel]) {
          usageTrendMap[mLabel][type] = (usageTrendMap[mLabel][type] || 0) + Number(c.quantity || 0)
        }
      })

      const usageMonthlyTrend = targetMonths.map(m => ({
        month: m,
        ...usageTrendMap[m],
      }))

      // Average monthly usage by type
      const activeMonthsCount = targetMonths.length || 1
      const averageMonthlyUsageByType = usageByType.map(t => ({
        type: t.type,
        avgUsage: t.count / activeMonthsCount,
      }))

      const avgMonthlyUsage = totalConsumptionQty / activeMonthsCount

      // 8. Deliveries & Receptions
      const deliveriesCount = (receptionsRaw || []).length
      const deliveryTrendMap: Record<string, { count: number; amount: number }> = {}
      const receivedTrendMap: Record<string, Record<string, number>> = {}
      targetMonths.forEach(m => {
        deliveryTrendMap[m] = { count: 0, amount: 0 }
        receivedTrendMap[m] = {}
      })
      ;(receptionsRaw || []).forEach(r => {
        const rDate = new Date(r.reception_date)
        const mLabel = months[rDate.getMonth()] + ' ' + String(rDate.getFullYear()).slice(-2)
        if (deliveryTrendMap[mLabel]) {
          deliveryTrendMap[mLabel].count += 1
          deliveryTrendMap[mLabel].amount += Number(r.total_amount || 0)
          
          ;(r.items || []).forEach((item: any) => {
            const sizeCode = item.size_info?.code || 'Size D'
            receivedTrendMap[mLabel][sizeCode] = (receivedTrendMap[mLabel][sizeCode] || 0) + 1
          })
        }
      })
      const deliveriesMonthlyTrend = targetMonths.map(m => ({
        month: m,
        count: deliveryTrendMap[m].count,
        amount: deliveryTrendMap[m].amount,
      }))
      const receivedMonthlyTrend = targetMonths.map(m => ({
        month: m,
        ...receivedTrendMap[m],
      }))

      const statusMap: Record<string, number> = {}
      ;(receptionsRaw || []).forEach(r => {
        statusMap[r.status] = (statusMap[r.status] || 0) + 1
      })
      const deliveriesByStatus = Object.entries(statusMap).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }))

      const recentDeliveriesList: DeliveryEntry[] = (receptionsRaw || [])
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          delivery_order_no: r.delivery_order_no || 'DO-UNKNOWN',
          reception_date: r.reception_date || '2026-01-01',
          total_amount: Number(r.total_amount || 0),
          status: r.status || 'completed',
          items_count: r.items?.length || 0,
        }))

      const avgDeliveryValue = deliveriesCount > 0 ? totalExpenses / deliveriesCount : 0

      // 9. Inventory Status
      const totalCylinders = (inventoryRaw || []).length
      // Map DB statuses to UI statuses: available -> full/available, issued -> in_use/issued
      const activeCylinders = (inventoryRaw || []).filter(c => 
        c.status === 'in_use' || c.status === 'issued' || c.status === 'full' || c.status === 'available'
      ).length
      
      const invStatusMap: Record<string, { count: number; color: string }> = {
        full: { count: 0, color: '#10b981' }, // available
        empty: { count: 0, color: '#ef4444' }, // empty
        in_use: { count: 0, color: '#6366f1' }, // issued
        maintenance: { count: 0, color: '#f59e0b' },
        returned_to_supplier: { count: 0, color: '#64748b' }, // returned
        disposed: { count: 0, color: '#475569' },
      }
      
      ;(inventoryRaw || []).forEach(c => {
        let stat = c.status || 'full'
        if (stat === 'available') stat = 'full'
        if (stat === 'issued') stat = 'in_use'
        
        if (invStatusMap[stat]) {
          invStatusMap[stat].count += 1
        } else {
          invStatusMap[stat] = { count: 1, color: '#94a3b8' }
        }
      })
      const inventoryByStatus = Object.entries(invStatusMap)
        .filter(([_, val]) => val.count > 0) // Only show statuses that have cylinders
        .map(([status, val]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
          count: val.count,
          color: val.color,
        }))

      // Inventory by Type & Status
      const invTypeMap: Record<string, { full: number; empty: number; inUse: number; maintenance: number }> = {}
      ;(inventoryRaw || []).forEach(c => {
        const type = c.size_info?.code || 'Size D'
        if (!invTypeMap[type]) {
          invTypeMap[type] = { full: 0, empty: 0, inUse: 0, maintenance: 0 }
        }
        let stat = c.status
        if (stat === 'available') stat = 'full'
        if (stat === 'issued') stat = 'in_use'

        if (stat === 'full') invTypeMap[type].full++
        else if (stat === 'empty' || stat === 'returned_to_supplier') invTypeMap[type].empty++
        else if (stat === 'in_use') invTypeMap[type].inUse++
        else if (stat === 'maintenance') invTypeMap[type].maintenance++
      })
      const inventoryByType = Object.entries(invTypeMap).map(([type, stats]) => ({
        type,
        ...stats,
      }))

      const qrTaggedCount = (inventoryRaw || []).filter(c => !!c.qr_code).length
      const qrTaggedPercentage = totalCylinders > 0 ? (qrTaggedCount / totalCylinders) * 100 : 0
      const utilizationRate = totalCylinders > 0 ? (invStatusMap.in_use.count / totalCylinders) * 100 : 0

      // Department Distribution
      const invDeptMap: Record<string, number> = {}
      ;(inventoryRaw || []).forEach(c => {
        const dept = c.department?.department_name || c.department?.name || 'Central Store'
        invDeptMap[dept] = (invDeptMap[dept] || 0) + 1
      })
      const inventoryDeptDistribution = Object.entries(invDeptMap).map(([department, count]) => ({
        department,
        count,
      })).sort((a, b) => b.count - a.count)

      // Detailed Inventory
      const detailedList: CylinderDetailEntry[] = (inventoryRaw || []).map(c => ({
        id: c.id,
        serial_number: c.serial_number || 'S-UNKNOWN',
        size_code: c.size_info?.code || 'Size D',
        type_name: c.size_info ? `Standard ${c.size_info.code} (${c.size_info.capacity}M³)` : 'Standard Cylinder',
        status: c.status || 'full',
        location_name: c.current_location || 'Central Store',
        department_name: c.department?.department_name || c.department?.name || null,
        qr_code: c.qr_code || null,
        last_movement_date: c.updated_at || null,
      }))

      // 10. Forecasting Calculations
      const forecastNextMonth: { type: string; predicted: number; confidence: number }[] = []
      
      // Separate monthly totals by type to run regression
      const typesList = usageByType.map(t => t.type)
      typesList.forEach(t => {
        // Collect points
        const points: number[] = []
        targetMonths.forEach(m => {
          points.push(usageTrendMap[m][t] || 0)
        })
        const reg = calculateLinearRegression(points)
        const nextX = points.length
        const predicted = Math.max(0, Math.round(reg.slope * nextX + reg.intercept))
        forecastNextMonth.push({
          type: t,
          predicted,
          confidence: Math.round(reg.r2 * 100),
        })
      })

      // Aggregate overall monthly totals for 3-month forecast
      const overallMonthlyTotals = targetMonths.map(m => {
        return Object.values(usageTrendMap[m]).reduce((sum, v) => sum + v, 0)
      })
      const overallReg = calculateLinearRegression(overallMonthlyTotals)
      
      const forecastNext3Months: { month: string; predicted: number; lower: number; upper: number }[] = []
      const currentYear = dateRange.endDate.getFullYear()
      const currentMonth = dateRange.endDate.getMonth()

      for (let i = 1; i <= 3; i++) {
        const fDate = new Date(currentYear, currentMonth + i, 1)
        const mName = months[fDate.getMonth()] + ' ' + String(fDate.getFullYear()).slice(-2)
        const step = overallMonthlyTotals.length + i - 1
        const pred = Math.max(0, Math.round(overallReg.slope * step + overallReg.intercept))
        // 15% confidence interval bounds
        const lower = Math.max(0, Math.round(pred * 0.85))
        const upper = Math.round(pred * 1.15)
        forecastNext3Months.push({
          month: mName,
          predicted: pred,
          lower,
          upper,
        })
      }

      // Runway Months
      const avgMonthlyCost = completedReceptions.length > 0 ? (totalExpenses / activeMonthsCount) : 1000
      const runwayMonths = avgMonthlyCost > 0 ? currentBalance / avgMonthlyCost : 12

      // Seasonal Pattern
      const seasonalPattern = months.map(mName => {
        // compute average of this month over past years
        const matched = targetConsumptions.filter(c => {
          const cDate = new Date(c.consumption_date || c.created_at)
          return months[cDate.getMonth()] === mName
        })
        const total = matched.reduce((sum, c) => sum + Number(c.quantity || 0), 0)
        return {
          month: mName,
          avgUsage: matched.length > 0 ? total / (matched.length / 30 || 1) : 0,
        }
      })

      return {
        data: {
          summary: {
            totalCylinders,
            activeCylinders,
            totalWarrants: warrantsList.length,
            totalWarrantAmount,
            totalExpenses,
            budgetUtilization,
            totalDeliveries: deliveriesCount,
            avgMonthlyUsage,
            currentBalance,
            runwayMonths: Math.max(0, parseFloat(runwayMonths.toFixed(1))),
          },
          warrants: {
            list: warrantsList,
            monthlyTrend: warrantsMonthlyTrend,
            utilizationByVoteCode,
          },
          usage: {
            byType: usageByType,
            byDepartment: usageByDepartment,
            monthlyTrend: usageMonthlyTrend,
            averageMonthly: averageMonthlyUsageByType,
            topConsumingDepartments,
          },
          deliveries: {
            total: deliveriesCount,
            monthlyTrend: deliveriesMonthlyTrend,
            receivedMonthlyTrend,
            byStatus: deliveriesByStatus,
            recentDeliveries: recentDeliveriesList,
            avgDeliveryValue,
          },
          inventory: {
            byStatus: inventoryByStatus,
            byType: inventoryByType,
            utilizationRate,
            qrTaggedPercentage,
            departmentDistribution: inventoryDeptDistribution,
          },
          forecast: {
            nextMonth: forecastNextMonth,
            next3Months: forecastNext3Months,
            budgetRunway: {
              currentBalance,
              burnRate: avgMonthlyCost,
              monthsRemaining: Math.max(0, parseFloat(runwayMonths.toFixed(1))),
            },
            seasonalPattern,
          },
          detailed: detailedList,
        },
        error: null,
      }
    }

    // SUPABASE NOT CONFIGURED: Return mock Cylinder Report
    return generateMockReport(hospitalId, dateRange)
  } catch (error) {
    console.error('Error generating cylinder report:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to generate report data',
    }
  }
}

/**
 * Generate full mock data report for local dev
 */
function generateMockReport(
  hospitalId: string,
  dateRange: { startDate: Date; endDate: Date }
): ApiResponse<CylinderReportData> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const targetMonths: string[] = []
  
  let tempDate = new Date(dateRange.startDate)
  while (tempDate <= dateRange.endDate) {
    const mLabel = months[tempDate.getMonth()] + ' ' + String(tempDate.getFullYear()).slice(-2)
    targetMonths.push(mLabel)
    tempDate.setMonth(tempDate.getMonth() + 1)
  }

  // Warrants Mock
  const warrantsList: WarrantEntry[] = [
    { id: 'w1', warrant_no: 'W2026-M091', vote_code: '080702', amount: 350000.0, warrant_date: '2026-01-10', category: 'medical_oxygen' },
    { id: 'w2', warrant_no: 'W2026-M112', vote_code: '080702', amount: 250000.0, warrant_date: '2026-03-05', category: 'medical_oxygen' },
    { id: 'w3', warrant_no: 'W2026-M203', vote_code: '080705', amount: 240000.0, warrant_date: '2026-05-12', category: 'medical_oxygen' },
  ]
  const totalWarrantAmount = warrantsList.reduce((sum, w) => sum + w.amount, 0)
  
  // Expenses Mock
  const totalExpenses = 730800.0
  const currentBalance = totalWarrantAmount - totalExpenses
  const budgetUtilization = (totalExpenses / totalWarrantAmount) * 100

  // Trend allocations and expenditures
  const warrantsMonthlyTrend = targetMonths.map((m, idx) => {
    const allocation = idx === 0 ? 350000 : idx === 2 ? 250000 : idx === 4 ? 240000 : 0
    const spends = [110000, 115000, 122000, 125000, 128800, 130000]
    return {
      month: m,
      allocated: allocation,
      spent: spends[idx % spends.length],
    }
  })

  const utilizationByVoteCode = [
    { voteCode: '080702', allocated: 600000.0, spent: 550800.0 },
    { voteCode: '080705', allocated: 240000.0, spent: 180000.0 },
  ]

  // Usage Mock
  const usageByType = [
    { type: 'Size D', count: 1840, percentage: 40.0 },
    { type: 'Size F', count: 1380, percentage: 30.0 },
    { type: 'Size G', count: 920, percentage: 20.0 },
    { type: 'Size K', count: 460, percentage: 10.0 },
  ]

  const usageByDepartment = [
    { department: 'Intensive Care Unit (ICU)', count: 1380 },
    { department: 'Emergency Department (ED)', count: 1104 },
    { department: 'General Ward 4A', count: 828 },
    { department: 'Operation Theatre (OT)', count: 644 },
    { department: 'Neonatal ICU (NICU)', count: 368 },
    { department: 'Paediatric Ward 2B', count: 184 },
    { department: 'Outpatient Clinic', count: 92 },
  ]

  const topConsumingDepartments = usageByDepartment.map(d => ({
    ...d,
    usage: d.count,
    percentage: (d.count / 4600) * 100,
  }))

  const usageMonthlyTrend = targetMonths.map((m, idx) => {
    // scale trend
    const base = 650 + Math.sin(idx) * 80
    return {
      month: m,
      'Size D': Math.round(base * 0.4),
      'Size F': Math.round(base * 0.3),
      'Size G': Math.round(base * 0.2),
      'Size K': Math.round(base * 0.1),
    }
  })

  const averageMonthlyUsageByType = [
    { type: 'Size D', avgUsage: 306.6 },
    { type: 'Size F', avgUsage: 230.0 },
    { type: 'Size G', avgUsage: 153.3 },
    { type: 'Size K', avgUsage: 76.6 },
  ]

  // Deliveries Mock
  const deliveriesMonthlyTrend = targetMonths.map((m, idx) => {
    const counts = [18, 20, 22, 21, 24, 23]
    const values = [110000, 115000, 122000, 125000, 128800, 130000]
    return {
      month: m,
      count: counts[idx % counts.length],
      amount: values[idx % values.length],
    }
  })

  // Mock received counts per size code that match usage with some delay/buffer
  const receivedMonthlyTrend = targetMonths.map((m, idx) => {
    const base = 700 + Math.cos(idx) * 90
    return {
      month: m,
      'Size D': Math.round(base * 0.38),
      'Size F': Math.round(base * 0.32),
      'Size G': Math.round(base * 0.22),
      'Size K': Math.round(base * 0.12),
    }
  })

  const deliveriesByStatus = [
    { status: 'Completed', count: 124 },
    { status: 'Pending Invoice', count: 4 },
    { status: 'In Transit', count: 2 },
  ]

  const recentDeliveries: DeliveryEntry[] = [
    { id: 'd1', delivery_order_no: 'DO-2026-98101', reception_date: '2026-06-18', total_amount: 14500.00, status: 'completed', items_count: 3 },
    { id: 'd2', delivery_order_no: 'DO-2026-98042', reception_date: '2026-06-12', total_amount: 18200.00, status: 'completed', items_count: 4 },
    { id: 'd3', delivery_order_no: 'DO-2026-97991', reception_date: '2026-06-05', total_amount: 12100.00, status: 'completed', items_count: 2 },
    { id: 'd4', delivery_order_no: 'DO-2026-97813', reception_date: '2026-05-28', total_amount: 16800.00, status: 'completed', items_count: 3 },
    { id: 'd5', delivery_order_no: 'DO-2026-97664', reception_date: '2026-05-20', total_amount: 22100.00, status: 'completed', items_count: 5 },
    { id: 'd6', delivery_order_no: 'DO-2026-97422', reception_date: '2026-05-11', total_amount: 9800.00, status: 'completed', items_count: 2 },
    { id: 'd7', delivery_order_no: 'DO-2026-97305', reception_date: '2026-04-28', total_amount: 15300.00, status: 'completed', items_count: 3 },
    { id: 'd8', delivery_order_no: 'DO-2026-97110', reception_date: '2026-04-19', total_amount: 14200.00, status: 'completed', items_count: 3 },
  ]

  // Inventory Mock
  const inventoryByStatus = [
    { status: 'Full', count: 185, color: '#10b981' },
    { status: 'In Use', count: 242, color: '#6366f1' },
    { status: 'Empty', count: 96, color: '#ef4444' },
    { status: 'Maintenance', count: 17, color: '#f59e0b' },
  ]
  const totalCylinders = 540

  const inventoryByType = [
    { type: 'Size D', full: 80, empty: 40, inUse: 100, maintenance: 8 },
    { type: 'Size F', full: 60, empty: 30, inUse: 80, maintenance: 4 },
    { type: 'Size G', full: 30, empty: 16, inUse: 42, maintenance: 3 },
    { type: 'Size K', full: 15, empty: 10, inUse: 20, maintenance: 2 },
  ]

  const inventoryDeptDistribution = [
    { department: 'Central Store', count: 202 },
    { department: 'Intensive Care Unit (ICU)', count: 98 },
    { department: 'Emergency Department (ED)', count: 85 },
    { department: 'General Ward 4A', count: 62 },
    { department: 'Operation Theatre (OT)', count: 53 },
    { department: 'Neonatal ICU (NICU)', count: 25 },
    { department: 'Paediatric Ward 2B', count: 15 },
  ]

  // Forecast Mock
  const forecastNextMonth = [
    { type: 'Size D', predicted: 312, confidence: 91 },
    { type: 'Size F', predicted: 242, confidence: 88 },
    { type: 'Size G', predicted: 162, confidence: 85 },
    { type: 'Size K', predicted: 81, confidence: 79 },
  ]

  const forecastNext3Months = [
    { month: 'Jul 26', predicted: 792, lower: 673, upper: 910 },
    { month: 'Aug 26', predicted: 815, lower: 692, upper: 937 },
    { month: 'Sep 26', predicted: 840, lower: 714, upper: 966 },
  ]

  const seasonalPattern = [
    { month: 'Jan', avgUsage: 710 },
    { month: 'Feb', avgUsage: 685 },
    { month: 'Mar', avgUsage: 740 },
    { month: 'Apr', avgUsage: 725 },
    { month: 'May', avgUsage: 780 },
    { month: 'Jun', avgUsage: 790 },
    { month: 'Jul', avgUsage: 815 },
    { month: 'Aug', avgUsage: 830 },
    { month: 'Sep', avgUsage: 850 },
    { month: 'Oct', avgUsage: 840 },
    { month: 'Nov', avgUsage: 865 },
    { month: 'Dec', avgUsage: 890 },
  ]

  // Detailed Inventory
  const detailed: CylinderDetailEntry[] = Array.from({ length: 45 }).map((_, idx) => {
    const statuses = ['full', 'in_use', 'empty', 'maintenance']
    const status = statuses[idx % statuses.length]
    const sizes = ['Size D', 'Size F', 'Size G', 'Size K']
    const size = sizes[idx % sizes.length]
    
    // Choose department based on status
    let deptName = null
    if (status === 'in_use') {
      const depts = ['Intensive Care Unit (ICU)', 'Emergency Department (ED)', 'General Ward 4A', 'Operation Theatre (OT)']
      deptName = depts[idx % depts.length]
    } else if (status === 'full' || status === 'empty') {
      deptName = idx % 3 === 0 ? 'Central Store' : null
    }

    const serials = ['CYL-08234', 'CYL-09123', 'CYL-11002', 'CYL-12891', 'CYL-07823', 'CYL-06443', 'CYL-10115']
    const serial = `${serials[idx % serials.length]}-${100 + idx}`

    return {
      id: `c-${idx}`,
      serial_number: serial,
      size_code: size,
      type_name: `Standard ${size} (${size === 'Size D' ? '1.4' : size === 'Size F' ? '3.4' : size === 'Size G' ? '5.0' : '7.5'}M³)`,
      status,
      location_name: deptName || (status === 'maintenance' ? 'Biomedical Workshop' : 'Central Store'),
      department_name: deptName,
      qr_code: idx % 6 !== 0 ? `O2-${size}-${serial}` : null,
      last_movement_date: new Date(2026, 5, 18 - (idx % 10)).toISOString().split('T')[0],
    }
  })

  return {
    data: {
      summary: {
        totalCylinders,
        activeCylinders: 427,
        totalWarrants: warrantsList.length,
        totalWarrantAmount,
        totalExpenses,
        budgetUtilization,
        totalDeliveries: 130,
        avgMonthlyUsage: 766,
        currentBalance,
        runwayMonths: 8.8,
      },
      warrants: {
        list: warrantsList,
        monthlyTrend: warrantsMonthlyTrend,
        utilizationByVoteCode,
      },
      usage: {
        byType: usageByType,
        byDepartment: usageByDepartment,
        monthlyTrend: usageMonthlyTrend,
        averageMonthly: averageMonthlyUsageByType,
        topConsumingDepartments,
      },
      deliveries: {
        total: 130,
        monthlyTrend: deliveriesMonthlyTrend,
        receivedMonthlyTrend,
        byStatus: deliveriesByStatus,
        recentDeliveries,
        avgDeliveryValue: 5621.53,
      },
      inventory: {
        byStatus: inventoryByStatus,
        byType: inventoryByType,
        utilizationRate: 44.8,
        qrTaggedPercentage: 83.3,
        departmentDistribution: inventoryDeptDistribution,
      },
      forecast: {
        nextMonth: forecastNextMonth,
        next3Months: forecastNext3Months,
        budgetRunway: {
          currentBalance,
          burnRate: 122600.0,
          monthsRemaining: 8.8,
        },
        seasonalPattern,
      },
      detailed,
    },
    error: null,
  }
}
