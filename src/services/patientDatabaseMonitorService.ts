// Patient Database Monitoring Service - Hospital Admin Module
import { supabase, isSupabaseConfigured } from './supabase'
import type {
  PatientDatabaseStats,
  PatientAccessLog,
  PatientAccessLogWithRelations,
  PaginatedResponse,
  SortConfig,
} from '@/types'
import { mockUsers } from './mockData'

// Mock Patient Access Logs
export const mockPatientAccessLogs: PatientAccessLog[] = [
  {
    id: 'pal-001',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    patient_id: 'patient-001',
    patient_name: 'Ahmad bin Hassan',
    accessed_by: 'user-003-pharmgr',
    access_type: 'view',
    data_section: 'Medication History',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
    created_at: '2026-01-05T10:30:00Z',
  },
  {
    id: 'pal-002',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    patient_id: 'patient-002',
    patient_name: 'Siti Aminah binti Yusof',
    accessed_by: 'user-003-pharmgr',
    access_type: 'view',
    data_section: 'Personal Information',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
    created_at: '2026-01-05T09:45:00Z',
  },
  {
    id: 'pal-003',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    patient_id: 'patient-003',
    patient_name: 'Tan Mei Ling',
    accessed_by: 'user-002-hospadmin',
    access_type: 'export',
    data_section: 'Full Medical Record',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
    created_at: '2026-01-05T08:15:00Z',
  },
  {
    id: 'pal-004',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    patient_id: 'patient-001',
    patient_name: 'Ahmad bin Hassan',
    accessed_by: 'user-003-pharmgr',
    access_type: 'edit',
    data_section: 'Allergy Information',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
    created_at: '2026-01-04T16:30:00Z',
  },
  {
    id: 'pal-005',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    patient_id: 'patient-004',
    patient_name: 'Muthu a/l Krishnan',
    accessed_by: 'user-003-pharmgr',
    access_type: 'view',
    data_section: 'Lab Results',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
    created_at: '2026-01-04T14:00:00Z',
  },
  {
    id: 'pal-006',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    patient_id: 'patient-005',
    patient_name: 'Noraini binti Abdullah',
    accessed_by: 'user-002-hospadmin',
    access_type: 'view',
    data_section: 'Emergency Contact',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
    created_at: '2026-01-04T11:00:00Z',
  },
  {
    id: 'pal-007',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    patient_id: 'patient-006',
    patient_name: 'Lee Chong Wei',
    accessed_by: 'user-003-pharmgr',
    access_type: 'create',
    data_section: 'New Patient Registration',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
    created_at: '2026-01-04T09:30:00Z',
  },
  {
    id: 'pal-008',
    hospital_id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    patient_id: 'patient-007',
    patient_name: 'Fatimah binti Omar',
    accessed_by: 'user-003-pharmgr',
    access_type: 'view',
    data_section: 'Diagnosis History',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
    created_at: '2026-01-03T15:45:00Z',
  },
]

// Helper to enrich log with relations
const enrichLogWithRelations = (log: PatientAccessLog): PatientAccessLogWithRelations => {
  const accessedByUser = mockUsers.find(u => u.id === log.accessed_by)
  return {
    ...log,
    accessed_by_user: accessedByUser,
  }
}

/**
 * Get patient database statistics
 */
export async function getPatientDatabaseStats(hospitalId: string): Promise<PatientDatabaseStats> {
  if (isSupabaseConfigured()) {
    // Would query actual patient database
    const { data, error } = await supabase
      .from('patients')
      .select('id, status, created_at', { count: 'exact' })
      .eq('hospital_id', hospitalId)

    if (error) throw error

    // Calculate stats from data
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      hospital_id: hospitalId,
      total_patients: data?.length || 0,
      active_patients: data?.filter(p => p.status === 'active').length || 0,
      new_patients_today: data?.filter(p => new Date(p.created_at) >= today).length || 0,
      new_patients_week: data?.filter(p => new Date(p.created_at) >= weekAgo).length || 0,
      new_patients_month: data?.filter(p => new Date(p.created_at) >= monthAgo).length || 0,
      incomplete_records: 0,
      duplicate_alerts: 0,
      last_verification: new Date().toISOString(),
      storage_used_mb: 0,
    }
  } else {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))

    return {
      hospital_id: hospitalId,
      total_patients: 15847,
      active_patients: 12456,
      new_patients_today: 23,
      new_patients_week: 156,
      new_patients_month: 612,
      incomplete_records: 89,
      duplicate_alerts: 12,
      last_verification: '2026-01-05T02:00:00Z',
      storage_used_mb: 2456.8,
    }
  }
}

export interface GetPatientAccessLogsParams {
  page?: number
  pageSize?: number
  hospitalId?: string
  patientId?: string
  accessedBy?: string
  accessType?: 'view' | 'edit' | 'create' | 'delete' | 'export' | 'all'
  search?: string
  startDate?: string
  endDate?: string
  sort?: SortConfig
}

/**
 * Get patient access logs with filtering and pagination
 */
export async function getPatientAccessLogs(
  params: GetPatientAccessLogsParams = {}
): Promise<PaginatedResponse<PatientAccessLogWithRelations>> {
  const {
    page = 1,
    pageSize = 20,
    hospitalId,
    patientId,
    accessedBy,
    accessType,
    search,
    startDate,
    endDate,
    sort,
  } = params

  if (isSupabaseConfigured()) {
    let query = supabase
      .from('patient_access_logs')
      .select('*, accessed_by_user:users(*)', { count: 'exact' })

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }
    if (accessedBy) {
      query = query.eq('accessed_by', accessedBy)
    }
    if (accessType && accessType !== 'all') {
      query = query.eq('access_type', accessType)
    }
    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,data_section.ilike.%${search}%`)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (sort) {
      query = query.order(sort.key, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data as PatientAccessLogWithRelations[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } else {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))

    let filtered = [...mockPatientAccessLogs]

    if (hospitalId) {
      filtered = filtered.filter(l => l.hospital_id === hospitalId)
    }
    if (patientId) {
      filtered = filtered.filter(l => l.patient_id === patientId)
    }
    if (accessedBy) {
      filtered = filtered.filter(l => l.accessed_by === accessedBy)
    }
    if (accessType && accessType !== 'all') {
      filtered = filtered.filter(l => l.access_type === accessType)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(l =>
        l.patient_name.toLowerCase().includes(searchLower) ||
        l.data_section.toLowerCase().includes(searchLower)
      )
    }
    if (startDate) {
      filtered = filtered.filter(l => new Date(l.created_at) >= new Date(startDate))
    }
    if (endDate) {
      filtered = filtered.filter(l => new Date(l.created_at) <= new Date(endDate))
    }

    // Sort
    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort.key as keyof PatientAccessLog]
        const bVal = b[sort.key as keyof PatientAccessLog]
        if (aVal === undefined || bVal === undefined) return 0
        if (sort.direction === 'asc') {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paginatedData = filtered.slice(start, start + pageSize)

    return {
      data: paginatedData.map(enrichLogWithRelations),
      total,
      page,
      pageSize,
      totalPages,
    }
  }
}

/**
 * Get access statistics
 */
export interface AccessStatistics {
  total_accesses: number
  by_type: { type: string; count: number }[]
  by_user: { user: string; count: number }[]
  by_section: { section: string; count: number }[]
  timeline: { date: string; count: number }[]
}

export async function getAccessStatistics(hospitalId: string, days: number = 7): Promise<AccessStatistics> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  if (isSupabaseConfigured()) {
    // Would aggregate from database
  }

  await new Promise(resolve => setTimeout(resolve, 300))

  const logs = mockPatientAccessLogs.filter(
    l => l.hospital_id === hospitalId && new Date(l.created_at) >= startDate
  )

  const byType: Record<string, number> = {}
  const byUser: Record<string, number> = {}
  const bySection: Record<string, number> = {}
  const timelineMap: Record<string, number> = {}

  logs.forEach(log => {
    byType[log.access_type] = (byType[log.access_type] || 0) + 1
    
    const user = mockUsers.find(u => u.id === log.accessed_by)
    const userName = user?.full_name || 'Unknown'
    byUser[userName] = (byUser[userName] || 0) + 1
    
    bySection[log.data_section] = (bySection[log.data_section] || 0) + 1
    
    const date = new Date(log.created_at).toISOString().split('T')[0]
    timelineMap[date] = (timelineMap[date] || 0) + 1
  })

  return {
    total_accesses: logs.length,
    by_type: Object.entries(byType).map(([type, count]) => ({ type, count })),
    by_user: Object.entries(byUser)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    by_section: Object.entries(bySection)
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => b.count - a.count),
    timeline: Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

/**
 * Get data quality issues
 */
export interface DataQualityIssue {
  type: 'incomplete' | 'duplicate' | 'invalid' | 'outdated'
  count: number
  description: string
  severity: 'low' | 'medium' | 'high'
}

export async function getDataQualityIssues(hospitalId: string): Promise<DataQualityIssue[]> {
  if (isSupabaseConfigured()) {
    // Would run data quality checks
  }

  await new Promise(resolve => setTimeout(resolve, 200))

  return [
    {
      type: 'incomplete',
      count: 89,
      description: 'Patient records missing required fields (address, emergency contact)',
      severity: 'medium',
    },
    {
      type: 'duplicate',
      count: 12,
      description: 'Potential duplicate patient records detected',
      severity: 'high',
    },
    {
      type: 'invalid',
      count: 5,
      description: 'Records with invalid IC number format',
      severity: 'medium',
    },
    {
      type: 'outdated',
      count: 234,
      description: 'Patient records not updated in over 2 years',
      severity: 'low',
    },
  ]
}

