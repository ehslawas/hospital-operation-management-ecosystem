// src/modules/myporter/services/porterService.ts
// MyPorter integrated hospital logistics and dispatch management service

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type {
  PorterJobRequest,
  PorterProfile,
  PorterRosterShift,
  ShiftType,
  ShiftExchangeRequest,
  WeeklyWorkHourSummary,
  PorterActivityLog,
  PorterAggregateStats,
  PorterTaskCategory,
  PorterUrgency,
  PorterJobStatus,
  PorterStaffStatus,
  HandoverProof,
  PorterRating
} from '@/shared/types/myporter'

const STORAGE_PREFIX = 'myporter_mock_'
const CURRENT_VERSION_KEY = 'myporter_mock_data_v3'

const getMockData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

const setMockData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.error('Error saving to localStorage:', err)
  }
}

export const getShiftHours = (shift: ShiftType): number => {
  switch (shift) {
    case 'morning':
      return 8 // 07:00 - 15:00
    case 'evening':
      return 8 // 14:00 - 22:00
    case 'night':
      return 10 // 21:30 - 07:30 (next morning)
    case 'off':
    default:
      return 0 // Hari Rehat
  }
}
// ============================================
// INITIAL SEED DATA
// ============================================
const initMockData = () => {
  const isInitialized = localStorage.getItem(STORAGE_PREFIX + 'version') === CURRENT_VERSION_KEY
  if (isInitialized) return

  const initialProfiles: PorterProfile[] = [
    {
      id: 'ppk-1',
      user_id: 'user-ppk-1',
      staff_no: 'PPK-4091',
      full_name: 'Muhammad Farhan bin Razali',
      gred: 'U11',
      phone_number: '013-8891023 (Ext 4102)',
      assigned_zone: 'Zon A (Wad Kenanga / Mawar)',
      current_status: 'available',
      current_location: 'Lobi Aras 3 (Dekat Lif 2)',
      last_heartbeat_at: new Date().toISOString(),
      certifications: {
        bls_certified: true,
        cytotoxic_certified: false,
        dangerous_drug_authorized: true,
        mortuary_trained: true,
        heavy_equipment_trained: true
      },
      total_completed_today: 7,
      average_rating: 4.9,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'ppk-2',
      user_id: 'user-ppk-2',
      staff_no: 'PPK-3104',
      full_name: 'Zulkifli bin Hassan',
      gred: 'U11',
      phone_number: '019-7723145 (Ext 4105)',
      assigned_zone: 'Zon B (Dewan Bedah & ICU)',
      current_status: 'in_job',
      active_job_id: 'job-1',
      current_location: 'Aras 2 - Koridor Dewan Bedah',
      last_heartbeat_at: new Date().toISOString(),
      certifications: {
        bls_certified: true,
        cytotoxic_certified: true,
        dangerous_drug_authorized: true,
        mortuary_trained: true,
        heavy_equipment_trained: true
      },
      total_completed_today: 9,
      average_rating: 5.0,
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'ppk-3',
      user_id: 'user-ppk-3',
      staff_no: 'PPK-1092',
      full_name: 'Suresh Kumar a/l Raman',
      gred: 'U14 (Kanan)',
      phone_number: '012-9901234 (Ext 4100)',
      assigned_zone: 'Central Pool & Triage',
      current_status: 'available',
      current_location: 'Bilik Rehat PPK Aras 1',
      last_heartbeat_at: new Date().toISOString(),
      certifications: {
        bls_certified: true,
        cytotoxic_certified: true,
        dangerous_drug_authorized: true,
        mortuary_trained: true,
        heavy_equipment_trained: true
      },
      total_completed_today: 5,
      average_rating: 4.85,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'ppk-4',
      user_id: 'user-ppk-4',
      staff_no: 'PPK-5521',
      full_name: 'Nurul Izzati binti Roslan',
      gred: 'U11',
      phone_number: '017-6654321 (Ext 4108)',
      assigned_zone: 'Zon C (Makmal & Farmasi)',
      current_status: 'available',
      current_location: 'Kaunter Makmal Patologi Aras 1',
      last_heartbeat_at: new Date().toISOString(),
      certifications: {
        bls_certified: true,
        cytotoxic_certified: true,
        dangerous_drug_authorized: true,
        mortuary_trained: false,
        heavy_equipment_trained: false
      },
      total_completed_today: 6,
      average_rating: 4.95,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'ppk-5',
      user_id: 'user-ppk-5',
      staff_no: 'PPK-6012',
      full_name: 'Ahmad Khusairi bin Johari',
      gred: 'U11',
      phone_number: '011-2345678 (Ext 4109)',
      assigned_zone: 'Zon D (Kecemasan & Trauma)',
      current_status: 'on_break',
      current_location: 'Kafeteria Hospital Aras B1',
      last_heartbeat_at: new Date().toISOString(),
      certifications: {
        bls_certified: true,
        cytotoxic_certified: false,
        dangerous_drug_authorized: false,
        mortuary_trained: true,
        heavy_equipment_trained: true
      },
      total_completed_today: 4,
      average_rating: 4.7,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'ppk-6',
      user_id: 'user-ppk-6',
      staff_no: 'PPK-7719',
      full_name: 'Mohamad Norhafiz bin Idris',
      gred: 'U11',
      phone_number: '014-9988776 (Ext 4110)',
      assigned_zone: 'Central Pool',
      current_status: 'offline',
      current_location: 'Luar Talian (Tamat Syif)',
      last_heartbeat_at: new Date(Date.now() - 3600000).toISOString(),
      certifications: {
        bls_certified: true,
        cytotoxic_certified: false,
        dangerous_drug_authorized: false,
        mortuary_trained: true,
        heavy_equipment_trained: true
      },
      total_completed_today: 8,
      average_rating: 4.8,
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
    }
  ]
  const now = Date.now()
  const initialJobs: PorterJobRequest[] = [
    {
      id: 'job-1',
      no_rujukan: 'PTR-2026-000842',
      category: 'blood_bank',
      sub_category: 'Pek Darah PRBC (Transfusi STAT)',
      urgency: 'stat',
      status: 'in_transit',
      origin_department_id: 'dept-bb',
      origin_department_name: 'Tabung Darah (Blood Bank)',
      origin_location_details: 'Kaunter Pengeluaran Aras 2',
      destination_department_id: 'dept-ot',
      destination_department_name: 'Dewan Bedah (OT)',
      destination_location_details: 'Bilik Bedah OT 3 (Aras 4)',
      requester_id: 'user-doc-1',
      requester_name: 'Dr. Syarifah Aminah (Pakar Bius)',
      requester_role: 'doctor',
      requester_phone: 'Ext 5203',
      assigned_porter_id: 'ppk-2',
      assigned_porter_name: 'Zulkifli bin Hassan',
      assigned_porter_phone: '019-7723145 (Ext 4105)',
      assigned_porter_badge: 'PPK-3104 (Gred U11)',
      recipient_id: 'user-nurse-ot',
      recipient_name: 'JT Halimah binti Kassim',
      recipient_role: 'nurse',
      blood_data: {
        blood_group: 'B+',
        rhesus: 'Positif',
        unit_numbers: ['PRBC-99412A', 'PRBC-99412B'],
        product_type: 'PRBC',
        coolbox_temperature: 4.1,
        compatibility_slip_matched: true
      },
      notes: 'Pembedahan kecemasan sedang berlangsung. Bawa terus ke OT 3 dengan kotak sejuk bertutup.',
      special_precautions: ['Masa Transit < 10 Minit', 'Kotak Sejuk Validated (2-6°C)', 'Semak Borang Keserasian'],
      requested_at: new Date(now - 14 * 60000).toISOString(),
      assigned_at: new Date(now - 12 * 60000).toISOString(),
      pickup_started_at: new Date(now - 10 * 60000).toISOString(),
      arrived_at_pickup_at: new Date(now - 7 * 60000).toISOString(),
      in_transit_at: new Date(now - 4 * 60000).toISOString(),
      target_sla_minutes: 15,
      hospital_id: 'hosp-1',
      created_at: new Date(now - 14 * 60000).toISOString(),
      updated_at: new Date(now - 4 * 60000).toISOString()
    },
    {
      id: 'job-2',
      no_rujukan: 'PTR-2026-000843',
      category: 'patient_transfer',
      sub_category: 'Pemindahan Pesakit ke Radiologi (CT Scan)',
      urgency: 'urgent',
      status: 'broadcasting',
      origin_department_id: 'dept-w4a',
      origin_department_name: 'Wad Kenanga (Wad 4A)',
      origin_location_details: 'Katil 12B (Zon Perempuan)',
      destination_department_id: 'dept-rad',
      destination_department_name: 'Jabatan Radiologi',
      destination_location_details: 'Bilik CT Scan 1 (Aras 1)',
      requester_id: 'user-nurse-1',
      requester_name: 'SN Noraziah binti Mansor',
      requester_role: 'nurse',
      requester_phone: 'Ext 4401',
      patient_data: {
        patient_rn: 'RN-2026-99214',
        patient_name: 'Puan Lim Siew Mei',
        patient_gender: 'Perempuan',
        patient_age: 58,
        current_bed_no: 'Katil 12B',
        mobility_type: 'bed',
        o2_dependent: true,
        o2_flow_rate_lpm: 3,
        fall_risk: true,
        isolation_precautions: 'NONE',
        nurse_escort_required: true,
        diagnosis: 'Suspected Acute Intracranial Hemorrhage'
      },
      notes: 'Pesakit dengan katil wad. Memerlukan bantuan oksigen mudah alih 3L/min dan diiringi jururawat.',
      special_precautions: ['Bawa Katil Wad', 'Tangki Oksigen E-Cylinder', 'Diiringi Jururawat'],
      requested_at: new Date(now - 3 * 60000).toISOString(),
      target_sla_minutes: 25,
      hospital_id: 'hosp-1',
      created_at: new Date(now - 3 * 60000).toISOString(),
      updated_at: new Date(now - 3 * 60000).toISOString()
    }
  ]

  // Generate realistic 31-day shift calendar for all 6 porters
  const initialRoster: PorterRosterShift[] = []
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const shiftRotation: ShiftType[] = ['morning', 'morning', 'evening', 'evening', 'night', 'off', 'off']

  initialProfiles.forEach((porter, porterIdx) => {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const shiftIdx = (day + porterIdx * 2) % shiftRotation.length
      const assignedShift = shiftRotation[shiftIdx]
      const hours = getShiftHours(assignedShift)

      initialRoster.push({
        id: `rst-${porter.id}-${dateStr}`,
        porter_id: porter.id,
        porter_name: porter.full_name,
        date: dateStr,
        shift: assignedShift,
        zone: porter.assigned_zone,
        hours: hours,
        is_standby: assignedShift === 'off' ? false : (day % 7 === 0),
        status: day < currentDate.getDate() ? 'completed' : day === currentDate.getDate() ? 'on_duty' : 'scheduled'
      })
    }
  })

  const initialExchanges: ShiftExchangeRequest[] = [
    {
      id: 'exc-1',
      requester_porter_id: 'ppk-1',
      requester_porter_name: 'Muhammad Farhan bin Razali',
      requester_date: new Date(now + 2 * 86400000).toISOString().split('T')[0],
      requester_shift: 'evening',
      target_porter_id: 'ppk-4',
      target_porter_name: 'Nurul Izzati binti Roslan',
      target_date: new Date(now + 2 * 86400000).toISOString().split('T')[0],
      target_shift: 'morning',
      reason: 'Urusan keluarga kecemasan pada sebelah petang.',
      status: 'pending',
      requested_at: new Date(now - 120 * 60000).toISOString()
    }
  ]

  setMockData('profiles', initialProfiles)
  setMockData('jobs', initialJobs)
  setMockData('roster', initialRoster)
  setMockData('exchanges', initialExchanges)
  setMockData('roles', {
    'user-ppk-1': 'porter_driver',
    'user-ppk-2': 'porter_driver',
    'user-ppk-3': 'porter_supervisor',
    'user-ppk-4': 'porter_driver',
    'user-doc-1': 'ward_requester',
    'user-nurse-1': 'ward_requester'
  })
  localStorage.setItem(STORAGE_PREFIX + 'version', CURRENT_VERSION_KEY)
}

initMockData()
// ============================================
// SERVICE API METHODS
// ============================================

export interface PorterFilter {
  status?: PorterJobStatus | 'all' | 'active'
  category?: PorterTaskCategory | 'all'
  urgency?: PorterUrgency | 'all'
  search?: string
  departmentId?: string
  porterId?: string
}

export const getPorterStats = async (): Promise<ApiResponse<PorterAggregateStats>> => {
  try {
    initMockData()
    const jobs = getMockData<PorterJobRequest[]>('jobs', [])
    const profiles = getMockData<PorterProfile[]>('profiles', [])

    const broadcasting = jobs.filter(j => j.status === 'broadcasting').length
    const accepted = jobs.filter(j => j.status === 'accepted' || j.status === 'at_pickup').length
    const inTransit = jobs.filter(j => j.status === 'in_transit' || j.status === 'at_destination').length
    const pendingReceiver = jobs.filter(j => j.status === 'pending_receiver_confirmation').length
    const completed = jobs.filter(j => j.status === 'completed').length
    const cancelled = jobs.filter(j => j.status === 'cancelled').length
    const statJobs = jobs.filter(j => j.urgency === 'stat' && j.status !== 'completed' && j.status !== 'cancelled').length

    const availablePorters = profiles.filter(p => p.current_status === 'available').length
    const onDutyPorters = profiles.filter(p => p.current_status !== 'offline').length

    const completedWithTat = jobs.filter(j => j.status === 'completed' && j.actual_tat_minutes)
    const avgTat = completedWithTat.length > 0
      ? Math.round(completedWithTat.reduce((acc, curr) => acc + (curr.actual_tat_minutes || 0), 0) / completedWithTat.length)
      : 14

    const stats: PorterAggregateStats = {
      totalJobsToday: jobs.length,
      activeBroadcasting: broadcasting,
      inProgress: accepted,
      inTransit,
      pendingReceiverConfirmation: pendingReceiver,
      completedToday: completed,
      cancelledToday: cancelled,
      statJobsCount: statJobs,
      averageTATMinutes: avgTat,
      slaCompliancePercentage: 96.8,
      availablePortersCount: availablePorters,
      totalPortersOnDuty: onDutyPorters
    }

    return { data: stats, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

export const getPorterJobs = async (filter?: PorterFilter): Promise<ApiResponse<PorterJobRequest[]>> => {
  try {
    initMockData()
    let jobs = getMockData<PorterJobRequest[]>('jobs', [])

    if (filter) {
      if (filter.status && filter.status !== 'all') {
        if (filter.status === 'active') {
          jobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled')
        } else {
          jobs = jobs.filter(j => j.status === filter.status)
        }
      }

      if (filter.category && filter.category !== 'all') {
        jobs = jobs.filter(j => j.category === filter.category)
      }

      if (filter.urgency && filter.urgency !== 'all') {
        jobs = jobs.filter(j => j.urgency === filter.urgency)
      }

      if (filter.porterId) {
        jobs = jobs.filter(j => j.assigned_porter_id === filter.porterId)
      }

      if (filter.departmentId) {
        jobs = jobs.filter(j => j.origin_department_id === filter.departmentId || j.destination_department_id === filter.departmentId)
      }

      if (filter.search) {
        const query = filter.search.toLowerCase()
        jobs = jobs.filter(j =>
          j.no_rujukan.toLowerCase().includes(query) ||
          j.origin_department_name.toLowerCase().includes(query) ||
          j.destination_department_name.toLowerCase().includes(query) ||
          j.requester_name.toLowerCase().includes(query) ||
          (j.patient_data?.patient_name && j.patient_data.patient_name.toLowerCase().includes(query)) ||
          (j.patient_data?.patient_rn && j.patient_data.patient_rn.toLowerCase().includes(query)) ||
          (j.assigned_porter_name && j.assigned_porter_name.toLowerCase().includes(query))
        )
      }
    }

    jobs.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())

    return { data: jobs, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

export const getPorterJobById = async (id: string): Promise<ApiResponse<PorterJobRequest | null>> => {
  try {
    initMockData()
    const jobs = getMockData<PorterJobRequest[]>('jobs', [])
    const found = jobs.find(j => j.id === id) || null
    return { data: found, error: found ? null : 'Not found' }
  } catch (err: any) {
    return { data: null, error: err.message }
  }
}

export const createPorterJob = async (payload: Partial<PorterJobRequest>): Promise<ApiResponse<PorterJobRequest>> => {
  try {
    initMockData()
    const jobs = getMockData<PorterJobRequest[]>('jobs', [])

    const newIndex = jobs.length + 1
    const refNumber = `PTR-2026-${String(newIndex).padStart(6, '0')}`

    const newJob: PorterJobRequest = {
      id: `job-${Date.now()}`,
      no_rujukan: refNumber,
      category: payload.category || 'patient_transfer',
      sub_category: payload.sub_category || 'Tugasan Am Porter',
      urgency: payload.urgency || 'routine',
      status: 'broadcasting',
      origin_department_id: payload.origin_department_id || 'dept-w4a',
      origin_department_name: payload.origin_department_name || 'Wad Kenanga (Wad 4A)',
      origin_location_details: payload.origin_location_details || 'Kaunter Utama Wad',
      destination_department_id: payload.destination_department_id || 'dept-rad',
      destination_department_name: payload.destination_department_name || 'Jabatan Radiologi',
      destination_location_details: payload.destination_location_details || 'Kaunter Utama',
      requester_id: payload.requester_id || 'user-current',
      requester_name: payload.requester_name || 'Kakitangan Hospital',
      requester_role: payload.requester_role || 'nurse',
      requester_phone: payload.requester_phone || 'Ext 4000',
      patient_data: payload.patient_data,
      specimen_data: payload.specimen_data,
      blood_data: payload.blood_data,
      pharmacy_data: payload.pharmacy_data,
      equipment_data: payload.equipment_data,
      mortuary_data: payload.mortuary_data,
      records_data: payload.records_data,
      notes: payload.notes || '',
      special_precautions: payload.special_precautions || [],
      requested_at: new Date().toISOString(),
      target_sla_minutes: payload.urgency === 'stat' ? 15 : payload.urgency === 'urgent' ? 30 : 60,
      hospital_id: payload.hospital_id || 'hosp-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    jobs.unshift(newJob)
    setMockData('jobs', jobs)

    return { data: newJob, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

export const porterAcceptJob = async (jobId: string, porterId: string): Promise<ApiResponse<PorterJobRequest>> => {
  try {
    initMockData()
    const jobs = getMockData<PorterJobRequest[]>('jobs', [])
    const profiles = getMockData<PorterProfile[]>('profiles', [])

    const jobIndex = jobs.findIndex(j => j.id === jobId)
    if (jobIndex === -1) throw new Error('Tugasan tidak dijumpai.')

    const porter = profiles.find(p => p.id === porterId)
    if (!porter) throw new Error('Profil PPK tidak sah.')

    const updatedJob: PorterJobRequest = {
      ...jobs[jobIndex],
      status: 'accepted',
      assigned_porter_id: porter.id,
      assigned_porter_name: porter.full_name,
      assigned_porter_phone: porter.phone_number,
      assigned_porter_badge: `${porter.staff_no} (${porter.gred})`,
      assigned_at: new Date().toISOString(),
      pickup_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    jobs[jobIndex] = updatedJob
    setMockData('jobs', jobs)

    const profileIndex = profiles.findIndex(p => p.id === porterId)
    if (profileIndex !== -1) {
      profiles[profileIndex].current_status = 'in_job'
      profiles[profileIndex].active_job_id = jobId
      setMockData('profiles', profiles)
    }

    return { data: updatedJob, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

export const porterUpdateStep = async (
  jobId: string,
  nextStep: 'at_pickup' | 'in_transit' | 'at_destination' | 'delivered',
  extraPayload?: any
): Promise<ApiResponse<PorterJobRequest>> => {
  try {
    initMockData()
    const jobs = getMockData<PorterJobRequest[]>('jobs', [])
    const jobIndex = jobs.findIndex(j => j.id === jobId)
    if (jobIndex === -1) throw new Error('Tugasan tidak dijumpai.')

    const currentJob = jobs[jobIndex]
    const now = new Date().toISOString()

    const stepStatusMap: Record<string, PorterJobStatus> = {
      at_pickup: 'at_pickup',
      in_transit: 'in_transit',
      at_destination: 'at_destination',
      delivered: 'pending_receiver_confirmation'
    }

    const newStatus = stepStatusMap[nextStep]

    const updatedJob: PorterJobRequest = {
      ...currentJob,
      status: newStatus,
      updated_at: now
    }

    if (nextStep === 'at_pickup') updatedJob.arrived_at_pickup_at = now
    if (nextStep === 'in_transit') updatedJob.in_transit_at = now
    if (nextStep === 'at_destination') updatedJob.arrived_at_destination_at = now
    if (nextStep === 'delivered') {
      updatedJob.delivered_at = now
      if (extraPayload?.handover_proof) {
        updatedJob.handover_proof = extraPayload.handover_proof
      }
    }

    jobs[jobIndex] = updatedJob
    setMockData('jobs', jobs)

    return { data: updatedJob, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

export const receiverVerifyAndComplete = async (
  jobId: string,
  proof: HandoverProof,
  rating?: PorterRating
): Promise<ApiResponse<PorterJobRequest>> => {
  try {
    initMockData()
    const jobs = getMockData<PorterJobRequest[]>('jobs', [])
    const profiles = getMockData<PorterProfile[]>('profiles', [])

    const jobIndex = jobs.findIndex(j => j.id === jobId)
    if (jobIndex === -1) throw new Error('Tugasan tidak dijumpai.')

    const currentJob = jobs[jobIndex]
    const now = new Date()

    const requestedTime = new Date(currentJob.requested_at).getTime()
    const actualTat = Math.max(1, Math.round((now.getTime() - requestedTime) / 60000))
    const isBreached = actualTat > currentJob.target_sla_minutes

    const updatedJob: PorterJobRequest = {
      ...currentJob,
      status: 'completed',
      completed_at: now.toISOString(),
      actual_tat_minutes: actualTat,
      is_sla_breached: isBreached,
      handover_proof: proof,
      rating: rating,
      updated_at: now.toISOString()
    }

    jobs[jobIndex] = updatedJob
    setMockData('jobs', jobs)

    if (currentJob.assigned_porter_id) {
      const pIdx = profiles.findIndex(p => p.id === currentJob.assigned_porter_id)
      if (pIdx !== -1) {
        profiles[pIdx].current_status = 'available'
        profiles[pIdx].active_job_id = undefined
        profiles[pIdx].total_completed_today += 1
        if (rating?.rating_stars) {
          const oldRating = profiles[pIdx].average_rating
          profiles[pIdx].average_rating = Number(((oldRating * 9 + rating.rating_stars) / 10).toFixed(2))
        }
        setMockData('profiles', profiles)
      }
    }

    return { data: updatedJob, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

export const managerAssignJob = async (jobId: string, porterId: string): Promise<ApiResponse<PorterJobRequest>> => {
  return porterAcceptJob(jobId, porterId)
}

export const cancelPorterJob = async (jobId: string, reason: string): Promise<ApiResponse<PorterJobRequest>> => {
  try {
    initMockData()
    const jobs = getMockData<PorterJobRequest[]>('jobs', [])
    const profiles = getMockData<PorterProfile[]>('profiles', [])

    const jobIndex = jobs.findIndex(j => j.id === jobId)
    if (jobIndex === -1) throw new Error('Tugasan tidak dijumpai.')

    const currentJob = jobs[jobIndex]
    const updatedJob: PorterJobRequest = {
      ...currentJob,
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    jobs[jobIndex] = updatedJob
    setMockData('jobs', jobs)

    if (currentJob.assigned_porter_id) {
      const pIdx = profiles.findIndex(p => p.id === currentJob.assigned_porter_id)
      if (pIdx !== -1) {
        profiles[pIdx].current_status = 'available'
        profiles[pIdx].active_job_id = undefined
        setMockData('profiles', profiles)
      }
    }

    return { data: updatedJob, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

export const getPorterProfiles = async (): Promise<ApiResponse<PorterProfile[]>> => {
  try {
    initMockData()
    const profiles = getMockData<PorterProfile[]>('profiles', [])
    return { data: profiles, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

export const updatePorterProfileStatus = async (
  porterId: string,
  status: PorterStaffStatus,
  location?: string
): Promise<ApiResponse<PorterProfile>> => {
  try {
    initMockData()
    const profiles = getMockData<PorterProfile[]>('profiles', [])
    const index = profiles.findIndex(p => p.id === porterId)
    if (index === -1) throw new Error('Profil PPK tidak dijumpai.')

    profiles[index].current_status = status
    if (location) profiles[index].current_location = location
    profiles[index].last_heartbeat_at = new Date().toISOString()

    setMockData('profiles', profiles)
    return { data: profiles[index], error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}
// ============================================
// ROSTER & SHIFT MANAGEMENT METHODS
// ============================================

export const getPorterRoster = async (): Promise<ApiResponse<PorterRosterShift[]>> => {
  try {
    initMockData()
    const roster = getMockData<PorterRosterShift[]>('roster', [])
    return { data: roster, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

export const saveRosterShift = async (shift: Partial<PorterRosterShift>): Promise<ApiResponse<PorterRosterShift>> => {
  try {
    initMockData()
    const roster = getMockData<PorterRosterShift[]>('roster', [])
    const assignedShift = shift.shift || 'morning'
    const hours = getShiftHours(assignedShift)

    const newShift: PorterRosterShift = {
      id: shift.id || `rst-${shift.porter_id}-${shift.date || Date.now()}`,
      porter_id: shift.porter_id || 'ppk-1',
      porter_name: shift.porter_name || 'PPK Staff',
      date: shift.date || new Date().toISOString().split('T')[0],
      shift: assignedShift,
      zone: shift.zone || 'Central Pool',
      hours: hours,
      is_standby: shift.is_standby || false,
      status: shift.status || 'scheduled'
    }

    const existingIdx = roster.findIndex(r => r.porter_id === newShift.porter_id && r.date === newShift.date)
    if (existingIdx !== -1) {
      roster[existingIdx] = { ...roster[existingIdx], ...newShift }
    } else {
      roster.push(newShift)
    }

    setMockData('roster', roster)
    return { data: newShift, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

export const deleteRosterShift = async (shiftId: string): Promise<ApiResponse<boolean>> => {
  try {
    initMockData()
    let roster = getMockData<PorterRosterShift[]>('roster', [])
    roster = roster.filter(r => r.id !== shiftId)
    setMockData('roster', roster)
    return { data: true, error: null }
  } catch (err: any) {
    return { data: false, error: err.message }
  }
}

export const moveOrUpdateRosterShift = async (
  porterId: string,
  date: string,
  newShift: ShiftType,
  zone?: string
): Promise<ApiResponse<PorterRosterShift>> => {
  try {
    initMockData()
    const roster = getMockData<PorterRosterShift[]>('roster', [])
    const profiles = getMockData<PorterProfile[]>('profiles', [])
    const porter = profiles.find(p => p.id === porterId)
    const porterName = porter?.full_name || 'PPK Staff'
    const defaultZone = zone || porter?.assigned_zone || 'Central Pool'
    const hours = getShiftHours(newShift)

    const existingIdx = roster.findIndex(r => r.porter_id === porterId && r.date === date)
    let updatedShift: PorterRosterShift

    if (existingIdx !== -1) {
      roster[existingIdx].shift = newShift
      roster[existingIdx].hours = hours
      if (zone) roster[existingIdx].zone = zone
      updatedShift = roster[existingIdx]
    } else {
      updatedShift = {
        id: `rst-${porterId}-${date}`,
        porter_id: porterId,
        porter_name: porterName,
        date: date,
        shift: newShift,
        zone: defaultZone,
        hours: hours,
        status: 'scheduled'
      }
      roster.push(updatedShift)
    }

    setMockData('roster', roster)
    return { data: updatedShift, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

/**
 * Calculate weekly work hours against the 43-hour maximum rule
 * @param porterId PPK ID
 * @param refDate Date within the target week (Monday-Sunday)
 */
export const calculateWeeklyWorkHours = (
  porterId: string,
  refDate: Date | string
): WeeklyWorkHourSummary => {
  initMockData()
  const roster = getMockData<PorterRosterShift[]>('roster', [])
  const profiles = getMockData<PorterProfile[]>('profiles', [])
  const porter = profiles.find(p => p.id === porterId)

  const d = new Date(refDate)
  const dayOfWeek = d.getDay() // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const diffToMonday = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  
  const monday = new Date(d.setDate(diffToMonday))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const monStr = monday.toISOString().split('T')[0]
  const sunStr = sunday.toISOString().split('T')[0]

  const weekShifts = roster.filter(r => {
    if (r.porter_id !== porterId) return false
    return r.date >= monStr && r.date <= sunStr
  })

  const totalHours = weekShifts.reduce((acc, curr) => acc + (curr.hours !== undefined ? curr.hours : getShiftHours(curr.shift)), 0)
  const maxAllowed = 43
  const diff = totalHours - maxAllowed
  const deficit = totalHours < maxAllowed ? maxAllowed - totalHours : 0

  let status: 'optimum_43h' | 'deficit_addon_required' | 'over_cap' = 'optimum_43h'
  if (totalHours < maxAllowed) status = 'deficit_addon_required'
  else if (totalHours > maxAllowed) status = 'over_cap'

  return {
    porter_id: porterId,
    porter_name: porter?.full_name || 'PPK Staff',
    week_start_date: monStr,
    week_end_date: sunStr,
    total_hours_scheduled: totalHours,
    max_allowed_hours: maxAllowed,
    hour_difference: diff,
    deficit_carried_forward: deficit,
    status
  }
}

// ============================================
// SHIFT EXCHANGE (TUKAR SYIF) METHODS
// ============================================

export const getShiftExchanges = async (): Promise<ApiResponse<ShiftExchangeRequest[]>> => {
  try {
    initMockData()
    const exchanges = getMockData<ShiftExchangeRequest[]>('exchanges', [])
    return { data: exchanges, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

export const createShiftExchangeRequest = async (
  req: Omit<ShiftExchangeRequest, 'id' | 'status' | 'requested_at'>
): Promise<ApiResponse<ShiftExchangeRequest>> => {
  try {
    initMockData()
    const exchanges = getMockData<ShiftExchangeRequest[]>('exchanges', [])
    const newReq: ShiftExchangeRequest = {
      id: `exc-${Date.now()}`,
      ...req,
      status: 'pending',
      requested_at: new Date().toISOString()
    }

    exchanges.unshift(newReq)
    setMockData('exchanges', exchanges)
    return { data: newReq, error: null }
  } catch (err: any) {
    return { data: null as any, error: err.message }
  }
}

export const approveShiftExchange = async (
  exchangeId: string,
  approverName: string = 'Penyelia PPK'
): Promise<ApiResponse<boolean>> => {
  try {
    initMockData()
    const exchanges = getMockData<ShiftExchangeRequest[]>('exchanges', [])
    const roster = getMockData<PorterRosterShift[]>('roster', [])

    const exIndex = exchanges.findIndex(e => e.id === exchangeId)
    if (exIndex === -1) throw new Error('Permohonan pertukaran tidak dijumpai.')

    const ex = exchanges[exIndex]

    const reqShiftIdx = roster.findIndex(r => r.porter_id === ex.requester_porter_id && r.date === ex.requester_date)
    const tgtShiftIdx = roster.findIndex(r => r.porter_id === ex.target_porter_id && r.date === ex.target_date)

    if (reqShiftIdx !== -1 && tgtShiftIdx !== -1) {
      const tempShift = roster[reqShiftIdx].shift
      const tempHours = roster[reqShiftIdx].hours
      
      roster[reqShiftIdx].shift = roster[tgtShiftIdx].shift
      roster[reqShiftIdx].hours = roster[tgtShiftIdx].hours

      roster[tgtShiftIdx].shift = tempShift
      roster[tgtShiftIdx].hours = tempHours
    }

    exchanges[exIndex].status = 'approved'
    exchanges[exIndex].approved_at = new Date().toISOString()
    exchanges[exIndex].approved_by = approverName

    setMockData('exchanges', exchanges)
    setMockData('roster', roster)

    return { data: true, error: null }
  } catch (err: any) {
    return { data: false, error: err.message }
  }
}

export const rejectShiftExchange = async (
  exchangeId: string,
  reason: string
): Promise<ApiResponse<boolean>> => {
  try {
    initMockData()
    const exchanges = getMockData<ShiftExchangeRequest[]>('exchanges', [])
    const exIndex = exchanges.findIndex(e => e.id === exchangeId)
    if (exIndex === -1) throw new Error('Permohonan tidak dijumpai.')

    exchanges[exIndex].status = 'rejected'
    setMockData('exchanges', exchanges)
    return { data: true, error: null }
  } catch (err: any) {
    return { data: false, error: err.message }
  }
}

export const getPorterLogs = async (jobId: string): Promise<ApiResponse<PorterActivityLog[]>> => {
  try {
    initMockData()
    const allLogs = getMockData<PorterActivityLog[]>('logs', [])
    const jobLogs = allLogs.filter(l => l.job_id === jobId)
    return { data: jobLogs, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

export const getPorterRoles = async (): Promise<ApiResponse<Record<string, string>>> => {
  try {
    initMockData()
    const roles = getMockData<Record<string, string>>('roles', {})
    return { data: roles, error: null }
  } catch (err: any) {
    return { data: {}, error: err.message }
  }
}

export const assignPorterRole = async (userId: string, role: string): Promise<ApiResponse<boolean>> => {
  try {
    initMockData()
    const roles = getMockData<Record<string, string>>('roles', {})
    roles[userId] = role
    setMockData('roles', roles)
    return { data: true, error: null }
  } catch (err: any) {
    return { data: false, error: err.message }
  }
}
