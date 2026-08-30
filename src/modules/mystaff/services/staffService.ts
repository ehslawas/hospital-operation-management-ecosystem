// src/modules/mystaff/services/staffService.ts
// Enterprise Staff Movement, Leave Management, and Reminder Service

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type {
  StaffLeaveType,
  StaffLeaveQuota,
  StaffLeaveApplication,
  StaffMovement,
  StaffReminder,
  StaffDeadline,
  StaffDashboardStats,
  StaffAuditLog,
  AuditModuleType,
  AuditActionType,
  LeaveStatus,
  MovementStatus,
  DeadlineStatus,
  MovementType
} from '@/shared/types/mystaff'

const STORAGE_PREFIX = 'mystaff_mock_'

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
    console.error('Failed to set mock data for mystaff', err)
  }
}

// Initial Mock Seed Data
const initMockData = () => {
  if (!localStorage.getItem(STORAGE_PREFIX + 'leave_types')) {
    const defaultLeaveTypes: StaffLeaveType[] = [
      {
        id: 'lt-1',
        hospital_id: 'default-hosp',
        kod_cuti: 'CR',
        nama_cuti: 'Cuti Rehat',
        nama_cuti_en: 'Annual Leave',
        max_hari_setahun: 25,
        require_sijil: false,
        require_approval: true,
        kategori: 'biasa',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'lt-2',
        hospital_id: 'default-hosp',
        kod_cuti: 'CS',
        nama_cuti: 'Cuti Sakit',
        nama_cuti_en: 'Medical Leave',
        max_hari_setahun: 90,
        require_sijil: true,
        require_approval: true,
        kategori: 'perubatan',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'lt-3',
        hospital_id: 'default-hosp',
        kod_cuti: 'CK',
        nama_cuti: 'Cuti Khas Kematian',
        nama_cuti_en: 'Compassionate Leave',
        max_hari_setahun: 3,
        require_sijil: false,
        require_approval: true,
        kategori: 'khas',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'lt-4',
        hospital_id: 'default-hosp',
        kod_cuti: 'CG',
        nama_cuti: 'Cuti Gantian',
        nama_cuti_en: 'Replacement Leave',
        max_hari_setahun: 14,
        require_sijil: false,
        require_approval: true,
        kategori: 'gantian',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'lt-5',
        hospital_id: 'default-hosp',
        kod_cuti: 'CTR',
        nama_cuti: 'Cuti Tanpa Rekod',
        nama_cuti_en: 'Unrecorded Leave',
        max_hari_setahun: 3,
        require_sijil: false,
        require_approval: true,
        kategori: 'biasa',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
    setMockData('leave_types', defaultLeaveTypes)
  }

  if (!localStorage.getItem(STORAGE_PREFIX + 'leave_quotas')) {
    const defaultQuotas: StaffLeaveQuota[] = [
      {
        id: 'lq-1',
        user_id: 'default-user',
        hospital_id: 'default-hosp',
        leave_type_id: 'lt-1',
        tahun: new Date().getFullYear(),
        hak_hari: 25,
        digunakan_hari: 11,
        baki_hari: 14,
        created_at: new Date().toISOString(),
        leave_type: {
          id: 'lt-1',
          hospital_id: 'default-hosp',
          kod_cuti: 'CR',
          nama_cuti: 'Cuti Rehat',
          nama_cuti_en: 'Annual Leave',
          max_hari_setahun: 25,
          require_sijil: false,
          require_approval: true,
          kategori: 'biasa',
          is_active: true,
          created_at: new Date().toISOString()
        }
      },
      {
        id: 'lq-2',
        user_id: 'default-user',
        hospital_id: 'default-hosp',
        leave_type_id: 'lt-2',
        tahun: new Date().getFullYear(),
        hak_hari: 90,
        digunakan_hari: 2,
        baki_hari: 88,
        created_at: new Date().toISOString(),
        leave_type: {
          id: 'lt-2',
          hospital_id: 'default-hosp',
          kod_cuti: 'CS',
          nama_cuti: 'Cuti Sakit',
          nama_cuti_en: 'Medical Leave',
          max_hari_setahun: 90,
          require_sijil: true,
          require_approval: true,
          kategori: 'perubatan',
          is_active: true,
          created_at: new Date().toISOString()
        }
      },
      {
        id: 'lq-3',
        user_id: 'default-user',
        hospital_id: 'default-hosp',
        leave_type_id: 'lt-4',
        tahun: new Date().getFullYear(),
        hak_hari: 5,
        digunakan_hari: 1,
        baki_hari: 4,
        created_at: new Date().toISOString(),
        leave_type: {
          id: 'lt-4',
          hospital_id: 'default-hosp',
          kod_cuti: 'CG',
          nama_cuti: 'Cuti Gantian',
          nama_cuti_en: 'Replacement Leave',
          max_hari_setahun: 14,
          require_sijil: false,
          require_approval: true,
          kategori: 'gantian',
          is_active: true,
          created_at: new Date().toISOString()
        }
      }
    ]
    setMockData('leave_quotas', defaultQuotas)
  }

  if (!localStorage.getItem(STORAGE_PREFIX + 'movements')) {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]

    const defaultMovements: StaffMovement[] = [
      {
        id: 'mov-1',
        user_id: 'default-user',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        jenis_pergerakan: 'MEETING',
        tajuk: 'Mesyuarat Jawatankuasa Ubat & Terapeutik (MTC)',
        destination: 'Bilik Mesyuarat Utama, Aras 3',
        tarikh_mula: today,
        masa_keluar: '09:00',
        tarikh_tamat: today,
        masa_balik: '12:00',
        tujuan: 'Membentangkan senarai permohonan ubat bukan formulari (Khas)',
        status: 'confirmed',
        catatan: 'Bersama Timbalan Pengarah Hospital',
        attachment_name: 'Surat_Panggilan_MTC_Bil3_2026.pdf',
        attachment_url: '#',
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mov-2',
        user_id: 'staff-2',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        jenis_pergerakan: 'COURSE',
        tajuk: 'Kursus Pengendalian Dadah Berbahaya & Bahan Psikotropik',
        destination: 'Institut Latihan KKM (ILKKM) Kuching',
        tarikh_mula: tomorrow,
        masa_keluar: '08:00',
        tarikh_tamat: nextWeek,
        masa_balik: '17:00',
        tujuan: 'Latihan pengauditan rekod buku daftar DDA & pelupusan',
        status: 'confirmed',
        catatan: 'Peserta terpilih mewakili fasiliti',
        attachment_name: 'Surat_Tawaran_Kursus_ILKKM.pdf',
        attachment_url: '#',
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mov-3',
        user_id: 'default-user',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        jenis_pergerakan: 'CME',
        tajuk: 'CME: Pharmacovigilance & Adverse Drug Reaction Reporting Update',
        destination: 'Auditorium Klinikal',
        tarikh_mula: tomorrow,
        masa_keluar: '14:30',
        tarikh_tamat: tomorrow,
        masa_balik: '16:30',
        tujuan: 'Mata CPD - 2 mata Kategori 1',
        status: 'confirmed',
        attachment_name: 'Slaid_ADR_Pharmacovigilance.pdf',
        attachment_url: '#',
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mov-4',
        user_id: 'staff-3',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        jenis_pergerakan: 'SITE_VISIT',
        tajuk: 'Lawatan Pemantauan Pembekalan Gas Perubatan & Oksigen',
        destination: 'Stor Utama Gas & Wad Isolasi',
        tarikh_mula: today,
        masa_keluar: '10:30',
        tarikh_tamat: today,
        masa_balik: '13:00',
        tujuan: 'Verifikasi baki silinder bersama vendor Linde',
        status: 'confirmed',
        attachment_name: 'Borang_Pemeriksaan_Silinder_Gas.pdf',
        attachment_url: '#',
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    setMockData('movements', defaultMovements)
  }

  if (!localStorage.getItem(STORAGE_PREFIX + 'leave_applications')) {
    const nextMonth = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    const nextMonthEnd = new Date(Date.now() + 16 * 86400000).toISOString().split('T')[0]

    const defaultLeaves: StaffLeaveApplication[] = [
      {
        id: 'la-1',
        user_id: 'default-user',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        leave_type_id: 'lt-1',
        tarikh_mula: nextMonth,
        tarikh_tamat: nextMonthEnd,
        jumlah_hari: 3,
        sesi: 'full',
        sebab: 'Urusan keluarga di kampung dan menghadiri kenduri.',
        status: 'pending',
        is_half_day: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        leave_type: {
          id: 'lt-1',
          hospital_id: 'default-hosp',
          kod_cuti: 'CR',
          nama_cuti: 'Cuti Rehat',
          nama_cuti_en: 'Annual Leave',
          max_hari_setahun: 25,
          require_sijil: false,
          require_approval: true,
          kategori: 'biasa',
          is_active: true,
          created_at: new Date().toISOString()
        }
      },
      {
        id: 'la-2',
        user_id: 'staff-4',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        leave_type_id: 'lt-1',
        tarikh_mula: new Date().toISOString().split('T')[0],
        tarikh_tamat: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        jumlah_hari: 2,
        sesi: 'full',
        sebab: 'Cuti Rehat Tahunan yang diluluskan',
        status: 'approved',
        approved_at: new Date().toISOString(),
        catatan_pelulus: 'Diluluskan. Tugas diserahkan kepada staf bertugas.',
        is_half_day: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        leave_type: {
          id: 'lt-1',
          hospital_id: 'default-hosp',
          kod_cuti: 'CR',
          nama_cuti: 'Cuti Rehat',
          nama_cuti_en: 'Annual Leave',
          max_hari_setahun: 25,
          require_sijil: false,
          require_approval: true,
          kategori: 'biasa',
          is_active: true,
          created_at: new Date().toISOString()
        }
      }
    ]
    setMockData('leave_applications', defaultLeaves)
  }

  if (!localStorage.getItem(STORAGE_PREFIX + 'reminders')) {
    const defaultReminders: StaffReminder[] = [
      {
        id: 'rem-1',
        user_id: 'default-user',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        tajuk: 'Peringatan CME: ADR Reporting & Nilai Kualiti 2026',
        penerangan: 'Sila teliti slaid pembentangan dan garis panduan pelaporan sebelum sesi bermula. Kehadiran memberi 1 CPD Point.',
        jenis_peringatan: 'cme',
        keutamaan: 'high',
        meeting_link: 'https://meet.google.com/abc-dept-cme',
        attachment_name: 'Garis_Panduan_Pelaporan_ADR_2026.pdf',
        attachment_url: 'https://www.pharmacy.gov.my/adr-guidelines-2026.pdf',
        tarikh_peringatan: new Date(Date.now() + 86400000).toISOString(),
        remind_before_minutes: 60,
        is_shared_dept: true,
        is_dismissed: false,
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'rem-2',
        user_id: 'default-user',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        tajuk: 'Mesyuarat Pengurusan Wad & Indent Farmasi Bulanan',
        penerangan: 'Semakan semula kuota stok kecemasan & bekalan hujung minggu bersama Ketua Jururawat.',
        jenis_peringatan: 'meeting',
        keutamaan: 'critical',
        meeting_link: 'https://meet.google.com/xyz-hosp-ward',
        attachment_name: 'Minit_Mesyuarat_Pengurusan_Wad_Bil_7.docx',
        attachment_url: '#',
        tarikh_peringatan: new Date(Date.now() + 3 * 86400000).toISOString(),
        remind_before_minutes: 120,
        is_shared_dept: true,
        is_dismissed: false,
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    setMockData('reminders', defaultReminders)
  }

  if (!localStorage.getItem(STORAGE_PREFIX + 'deadlines')) {
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const in14Days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

    const defaultDeadlines: StaffDeadline[] = [
      {
        id: 'dl-1',
        created_by: 'default-user',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        tajuk: 'Penghantaran Laporan Bulanan Penggunaan Ubat Psikotropik & DDA',
        penerangan: 'Format borang KKM terkini wajib dihantar ke Jabatan Kesihatan Negeri (JKN).',
        kategori: 'laporan',
        tarikh_akhir: in3Days,
        keutamaan: 'high',
        status: 'in_progress',
        is_shared_dept: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'dl-2',
        created_by: 'default-user',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        tajuk: 'Serahan Anggaran Bajet & Unjuran APPL Suku Tahun Ke-4',
        penerangan: 'Semak siling peruntukan vot belanja mengurus bersama Ketua Jabatan.',
        kategori: 'anggaran',
        tarikh_akhir: in7Days,
        keutamaan: 'critical',
        status: 'pending',
        is_shared_dept: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'dl-3',
        created_by: 'default-user',
        hospital_id: 'default-hosp',
        department_id: 'default-dept',
        tajuk: 'Laporan Audit Silinder Oksigen & Stok Penampan Terbuka',
        penerangan: 'Rekod fizikal verifikasi baki silinder di semua lokasi pemantauan.',
        kategori: 'audit',
        tarikh_akhir: in14Days,
        keutamaan: 'medium',
        status: 'pending',
        is_shared_dept: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    setMockData('deadlines', defaultDeadlines)
  }
}

// Run initial seed on load
initMockData()

// ====================================================================================
// LEAVE TYPES & QUOTAS SERVICE
// ====================================================================================

export const getLeaveTypes = async (hospitalId?: string): Promise<ApiResponse<StaffLeaveType[]>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffLeaveType[]>('leave_types', [])
    return { data: list, error: null }
  }
  try {
    let query = supabase.from('staff_leave_types').select('*').eq('is_active', true)
    if (hospitalId) query = query.eq('hospital_id', hospitalId)
    const { data, error } = await query.order('nama_cuti', { ascending: true })
    if (error) throw error
    return { data: data as StaffLeaveType[], error: null }
  } catch (error: any) {
    const list = getMockData<StaffLeaveType[]>('leave_types', [])
    return { data: list, error: null }
  }
}

export const getLeaveQuotas = async (userId: string, tahun?: number): Promise<ApiResponse<StaffLeaveQuota[]>> => {
  const currentYear = tahun || new Date().getFullYear()
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffLeaveQuota[]>('leave_quotas', [])
    return { data: list.filter(q => q.tahun === currentYear), error: null }
  }
  try {
    const { data, error } = await supabase
      .from('staff_leave_quotas')
      .select('*, leave_type:staff_leave_types(*)')
      .eq('user_id', userId)
      .eq('tahun', currentYear)

    if (error) throw error
    if (!data || data.length === 0) {
      const list = getMockData<StaffLeaveQuota[]>('leave_quotas', [])
      return { data: list, error: null }
    }
    return { data: data as StaffLeaveQuota[], error: null }
  } catch (error: any) {
    const list = getMockData<StaffLeaveQuota[]>('leave_quotas', [])
    return { data: list, error: null }
  }
}

// ====================================================================================
// LEAVE APPLICATIONS SERVICE
// ====================================================================================

export const getLeaveApplications = async (filters?: {
  userId?: string
  departmentId?: string
  hospitalId?: string
  status?: LeaveStatus
}): Promise<ApiResponse<StaffLeaveApplication[]>> => {
  if (!isSupabaseConfigured()) {
    let list = getMockData<StaffLeaveApplication[]>('leave_applications', [])
    if (filters?.userId) list = list.filter(l => l.user_id === filters.userId || l.user_id === 'default-user')
    if (filters?.status) list = list.filter(l => l.status === filters.status)
    return { data: list, error: null }
  }
  try {
    let query = supabase
      .from('staff_leave_applications')
      .select('*, user:users(*), leave_type:staff_leave_types(*), approver:users!approved_by(*)')

    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.departmentId) query = query.eq('department_id', filters.departmentId)
    if (filters?.hospitalId) query = query.eq('hospital_id', filters.hospitalId)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return { data: data as StaffLeaveApplication[], error: null }
  } catch (error: any) {
    let list = getMockData<StaffLeaveApplication[]>('leave_applications', [])
    if (filters?.userId) list = list.filter(l => l.user_id === filters.userId || l.user_id === 'default-user')
    if (filters?.status) list = list.filter(l => l.status === filters.status)
    return { data: list, error: null }
  }
}

export const submitLeaveApplication = async (
  payload: Omit<StaffLeaveApplication, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<StaffLeaveApplication>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffLeaveApplication[]>('leave_applications', [])
    const newLeave: StaffLeaveApplication = {
      ...payload,
      id: 'la-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.unshift(newLeave)
    setMockData('leave_applications', list)
    return { data: newLeave, error: null }
  }
  try {
    const { data, error } = await supabase
      .from('staff_leave_applications')
      .insert([payload])
      .select('*, leave_type:staff_leave_types(*)')
      .single()

    if (error) throw error
    return { data: data as StaffLeaveApplication, error: null }
  } catch (error: any) {
    const list = getMockData<StaffLeaveApplication[]>('leave_applications', [])
    const newLeave: StaffLeaveApplication = {
      ...payload,
      id: 'la-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.unshift(newLeave)
    setMockData('leave_applications', list)
    return { data: newLeave, error: null }
  }
}

export const updateLeaveStatus = async (
  id: string,
  status: LeaveStatus,
  approverId?: string,
  catatanPelulus?: string
): Promise<ApiResponse<void>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffLeaveApplication[]>('leave_applications', [])
    const idx = list.findIndex(l => l.id === id)
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        catatan_pelulus: catatanPelulus || list[idx].catatan_pelulus,
        updated_at: new Date().toISOString()
      }
      setMockData('leave_applications', list)
    }
    return { data: null, error: null }
  }
  try {
    const { error } = await supabase
      .from('staff_leave_applications')
      .update({
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        catatan_pelulus: catatanPelulus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null }
  } catch (error: any) {
    const list = getMockData<StaffLeaveApplication[]>('leave_applications', [])
    const idx = list.findIndex(l => l.id === id)
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        catatan_pelulus: catatanPelulus,
        updated_at: new Date().toISOString()
      }
      setMockData('leave_applications', list)
    }
    return { data: null, error: null }
  }
}

// ====================================================================================
// STAFF MOVEMENTS SERVICE (Pergerakan Pegawai)
// ====================================================================================

export const getStaffMovements = async (filters?: {
  userId?: string
  departmentId?: string
  hospitalId?: string
  fromDate?: string
  toDate?: string
  status?: MovementStatus
  jenis?: MovementType
}): Promise<ApiResponse<StaffMovement[]>> => {
  if (!isSupabaseConfigured()) {
    let list = getMockData<StaffMovement[]>('movements', [])
    if (filters?.userId) list = list.filter(m => m.user_id === filters.userId || m.user_id === 'default-user')
    if (filters?.status) list = list.filter(m => m.status === filters.status)
    if (filters?.jenis) list = list.filter(m => m.jenis_pergerakan === filters.jenis)
    return { data: list, error: null }
  }
  try {
    let query = supabase
      .from('staff_movements')
      .select('*, user:users(*), approver:users!approved_by(*), department:departments(*)')

    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.departmentId) query = query.eq('department_id', filters.departmentId)
    if (filters?.hospitalId) query = query.eq('hospital_id', filters.hospitalId)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.jenis) query = query.eq('jenis_pergerakan', filters.jenis)
    if (filters?.fromDate) query = query.gte('tarikh_mula', filters.fromDate)
    if (filters?.toDate) query = query.lte('tarikh_tamat', filters.toDate)

    const { data, error } = await query.order('tarikh_mula', { ascending: false })
    if (error) throw error
    return { data: data as StaffMovement[], error: null }
  } catch (error: any) {
    let list = getMockData<StaffMovement[]>('movements', [])
    return { data: list, error: null }
  }
}

export const submitStaffMovement = async (
  payload: Omit<StaffMovement, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<StaffMovement>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffMovement[]>('movements', [])
    const newMovement: StaffMovement = {
      ...payload,
      id: 'mov-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.unshift(newMovement)
    setMockData('movements', list)
    return { data: newMovement, error: null }
  }
  try {
    const { data, error } = await supabase
      .from('staff_movements')
      .insert([payload])
      .select('*')
      .single()

    if (error) throw error
    return { data: data as StaffMovement, error: null }
  } catch (error: any) {
    const list = getMockData<StaffMovement[]>('movements', [])
    const newMovement: StaffMovement = {
      ...payload,
      id: 'mov-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.unshift(newMovement)
    setMockData('movements', list)
    return { data: newMovement, error: null }
  }
}

export const updateMovementStatus = async (
  id: string,
  status: MovementStatus,
  approverId?: string,
  catatan?: string
): Promise<ApiResponse<void>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffMovement[]>('movements', [])
    const idx = list.findIndex(m => m.id === id)
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        catatan: catatan || list[idx].catatan,
        updated_at: new Date().toISOString()
      }
      setMockData('movements', list)
    }
    return { data: null, error: null }
  }
  try {
    const { error } = await supabase
      .from('staff_movements')
      .update({
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        catatan,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null }
  } catch (error: any) {
    const list = getMockData<StaffMovement[]>('movements', [])
    const idx = list.findIndex(m => m.id === id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], status, updated_at: new Date().toISOString() }
      setMockData('movements', list)
    }
    return { data: null, error: null }
  }
}

export const updateStaffMovement = async (
  id: string,
  payload: Partial<StaffMovement>,
  audit: { reason: string; actor_id: string; actor_name: string; actor_role?: string }
): Promise<ApiResponse<StaffMovement>> => {
  const now = new Date().toISOString()
  const updatedFields = {
    ...payload,
    last_edited_by_name: audit.actor_name,
    last_edited_at: now,
    last_edit_reason: audit.reason,
    updated_at: now
  }

  const list = getMockData<StaffMovement[]>('movements', [])
  const idx = list.findIndex(m => m.id === id)
  let updatedRecord: StaffMovement | null = null

  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields }
    updatedRecord = list[idx]
    setMockData('movements', list)
  }

  await recordStaffAuditLog({
    module: 'MOVEMENT',
    record_id: id,
    record_title: updatedRecord?.tajuk || payload.tajuk || 'Pergerakan Staf',
    action: 'EDIT',
    reason: audit.reason,
    actor_id: audit.actor_id,
    actor_name: audit.actor_name,
    actor_role: audit.actor_role,
    details: payload
  })

  if (!isSupabaseConfigured()) {
    return { data: updatedRecord, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('staff_movements')
      .update(updatedFields)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return { data: data as StaffMovement, error: null }
  } catch {
    return { data: updatedRecord, error: null }
  }
}

export const deleteStaffMovementWithAudit = async (
  id: string,
  audit: { reason: string; actor_id: string; actor_name: string; actor_role?: string; record_title: string }
): Promise<ApiResponse<void>> => {
  await recordStaffAuditLog({
    module: 'MOVEMENT',
    record_id: id,
    record_title: audit.record_title,
    action: 'DELETE',
    reason: audit.reason,
    actor_id: audit.actor_id,
    actor_name: audit.actor_name,
    actor_role: audit.actor_role
  })

  const list = getMockData<StaffMovement[]>('movements', [])
  const updated = list.filter(m => m.id !== id)
  setMockData('movements', updated)

  if (!isSupabaseConfigured()) {
    return { data: null, error: null }
  }

  try {
    const { error } = await supabase.from('staff_movements').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch {
    return { data: null, error: null }
  }
}

export const deleteStaffMovement = async (id: string): Promise<ApiResponse<void>> => {
  return deleteStaffMovementWithAudit(id, {
    reason: 'Pemadaman manual tanpa catatan audit',
    actor_id: 'system',
    actor_name: 'Pegawai Bertugas',
    record_title: 'Pergerakan Staf'
  })
}

// ====================================================================================
// REMINDERS SERVICE
// ====================================================================================

export const getStaffReminders = async (filters?: {
  userId?: string
  departmentId?: string
  hospitalId?: string
  includeDismissed?: boolean
}): Promise<ApiResponse<StaffReminder[]>> => {
  initMockData()
  if (!isSupabaseConfigured()) {
    let list = getMockData<StaffReminder[]>('reminders', [])
    if (list.length === 0) {
      localStorage.removeItem(STORAGE_PREFIX + 'reminders')
      initMockData()
      list = getMockData<StaffReminder[]>('reminders', [])
    }
    if (!filters?.includeDismissed) list = list.filter(r => !r.is_dismissed)
    return { data: list, error: null }
  }
  try {
    let query = supabase.from('staff_reminders').select('*')
    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.hospitalId) query = query.eq('hospital_id', filters.hospitalId)
    if (!filters?.includeDismissed) query = query.eq('is_dismissed', false)

    const { data, error } = await query.order('tarikh_peringatan', { ascending: true })
    if (error) throw error
    if (!data || data.length === 0) {
      let list = getMockData<StaffReminder[]>('reminders', [])
      if (!filters?.includeDismissed) list = list.filter(r => !r.is_dismissed)
      return { data: list, error: null }
    }
    return { data: data as StaffReminder[], error: null }
  } catch (error: any) {
    let list = getMockData<StaffReminder[]>('reminders', [])
    if (list.length === 0) {
      localStorage.removeItem(STORAGE_PREFIX + 'reminders')
      initMockData()
      list = getMockData<StaffReminder[]>('reminders', [])
    }
    if (!filters?.includeDismissed) list = list.filter(r => !r.is_dismissed)
    return { data: list, error: null }
  }
}

export const createStaffReminder = async (
  payload: Omit<StaffReminder, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<StaffReminder>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffReminder[]>('reminders', [])
    const newRem: StaffReminder = {
      ...payload,
      id: 'rem-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.push(newRem)
    setMockData('reminders', list)
    return { data: newRem, error: null }
  }
  try {
    const { data, error } = await supabase.from('staff_reminders').insert([payload]).select('*').single()
    if (error) throw error
    return { data: data as StaffReminder, error: null }
  } catch (error: any) {
    const list = getMockData<StaffReminder[]>('reminders', [])
    const newRem: StaffReminder = {
      ...payload,
      id: 'rem-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.push(newRem)
    setMockData('reminders', list)
    return { data: newRem, error: null }
  }
}

export const updateStaffReminder = async (
  id: string,
  payload: Partial<StaffReminder>,
  audit: { reason: string; actor_id: string; actor_name: string; actor_role?: string }
): Promise<ApiResponse<StaffReminder>> => {
  const now = new Date().toISOString()
  const updatedFields = {
    ...payload,
    last_edited_by_name: audit.actor_name,
    last_edited_at: now,
    last_edit_reason: audit.reason,
    updated_at: now
  }

  const list = getMockData<StaffReminder[]>('reminders', [])
  const idx = list.findIndex(r => r.id === id)
  let updatedRecord: StaffReminder | null = null

  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields }
    updatedRecord = list[idx]
    setMockData('reminders', list)
  }

  await recordStaffAuditLog({
    module: 'REMINDER',
    record_id: id,
    record_title: updatedRecord?.tajuk || payload.tajuk || 'Peringatan / CME',
    action: 'EDIT',
    reason: audit.reason,
    actor_id: audit.actor_id,
    actor_name: audit.actor_name,
    actor_role: audit.actor_role,
    details: payload
  })

  if (!isSupabaseConfigured()) {
    return { data: updatedRecord, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('staff_reminders')
      .update(updatedFields)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return { data: data as StaffReminder, error: null }
  } catch {
    return { data: updatedRecord, error: null }
  }
}

export const toggleStaffReminderStatus = async (
  id: string,
  isDone: boolean
): Promise<ApiResponse<StaffReminder>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffReminder[]>('reminders', [])
    const idx = list.findIndex(r => r.id === id)
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        is_dismissed: isDone,
        updated_at: new Date().toISOString()
      }
      setMockData('reminders', list)
      return { data: list[idx], error: null }
    }
    return { data: null, error: 'Rekod tidak dijumpai' }
  }
  try {
    const { data, error } = await supabase
      .from('staff_reminders')
      .update({ is_dismissed: isDone, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return { data: data as StaffReminder, error: null }
  } catch (error: any) {
    const list = getMockData<StaffReminder[]>('reminders', [])
    const idx = list.findIndex(r => r.id === id)
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        is_dismissed: isDone,
        updated_at: new Date().toISOString()
      }
      setMockData('reminders', list)
      return { data: list[idx], error: null }
    }
    return { data: null, error: error.message }
  }
}

export const dismissStaffReminder = async (id: string): Promise<ApiResponse<void>> => {
  return toggleStaffReminderStatus(id, true).then(res => ({ data: null, error: res.error }))
}

export const deleteStaffReminderWithAudit = async (
  id: string,
  audit: { reason: string; actor_id: string; actor_name: string; actor_role?: string; record_title: string }
): Promise<ApiResponse<void>> => {
  await recordStaffAuditLog({
    module: 'REMINDER',
    record_id: id,
    record_title: audit.record_title,
    action: 'DELETE',
    reason: audit.reason,
    actor_id: audit.actor_id,
    actor_name: audit.actor_name,
    actor_role: audit.actor_role
  })

  const list = getMockData<StaffReminder[]>('reminders', [])
  const updated = list.filter(r => r.id !== id)
  setMockData('reminders', updated)

  if (!isSupabaseConfigured()) {
    return { data: null, error: null }
  }

  try {
    const { error } = await supabase.from('staff_reminders').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (error: any) {
    return { data: null, error: null }
  }
}

export const deleteStaffReminder = async (id: string): Promise<ApiResponse<void>> => {
  return deleteStaffReminderWithAudit(id, {
    reason: 'Pemadaman manual tanpa catatan audit',
    actor_id: 'system',
    actor_name: 'Pegawai Bertugas',
    record_title: 'Peringatan / CME'
  })
}

// ====================================================================================
// AUDIT LOG SERVICE (Sejarah Pindaan & Pemadaman)
// ====================================================================================

export const recordStaffAuditLog = async (
  entry: Omit<StaffAuditLog, 'id' | 'created_at'>
): Promise<StaffAuditLog> => {
  const auditEntry: StaffAuditLog = {
    ...entry,
    id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString()
  }

  const logs = getMockData<StaffAuditLog[]>('audit_logs', [])
  logs.unshift(auditEntry)
  setMockData('audit_logs', logs)

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('staff_audit_logs').insert([auditEntry])
    } catch (e) {
      console.warn('Could not persist audit log to supabase, local copy saved', e)
    }
  }

  return auditEntry
}

export const getStaffAuditLogs = async (filters?: {
  module?: AuditModuleType
  recordId?: string
}): Promise<ApiResponse<StaffAuditLog[]>> => {
  if (!isSupabaseConfigured()) {
    let list = getMockData<StaffAuditLog[]>('audit_logs', [])
    if (filters?.module) list = list.filter(l => l.module === filters.module)
    if (filters?.recordId) list = list.filter(l => l.record_id === filters.recordId)
    return { data: list, error: null }
  }

  try {
    let query = supabase.from('staff_audit_logs').select('*')
    if (filters?.module) query = query.eq('module', filters.module)
    if (filters?.recordId) query = query.eq('record_id', filters.recordId)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    if (!data || data.length === 0) {
      let list = getMockData<StaffAuditLog[]>('audit_logs', [])
      if (filters?.module) list = list.filter(l => l.module === filters.module)
      if (filters?.recordId) list = list.filter(l => l.record_id === filters.recordId)
      return { data: list, error: null }
    }
    return { data: data as StaffAuditLog[], error: null }
  } catch {
    let list = getMockData<StaffAuditLog[]>('audit_logs', [])
    if (filters?.module) list = list.filter(l => l.module === filters.module)
    if (filters?.recordId) list = list.filter(l => l.record_id === filters.recordId)
    return { data: list, error: null }
  }
}

// ====================================================================================
// DEADLINES SERVICE (Tugasan, Laporan & Anggaran)
// ====================================================================================

export const getStaffDeadlines = async (filters?: {
  departmentId?: string
  hospitalId?: string
  status?: DeadlineStatus
}): Promise<ApiResponse<StaffDeadline[]>> => {
  if (!isSupabaseConfigured()) {
    let list = getMockData<StaffDeadline[]>('deadlines', [])
    if (filters?.status) list = list.filter(d => d.status === filters.status)
    return { data: list, error: null }
  }
  try {
    let query = supabase.from('staff_deadlines').select('*, creator:users(*), department:departments(*)')
    if (filters?.departmentId) query = query.eq('department_id', filters.departmentId)
    if (filters?.hospitalId) query = query.eq('hospital_id', filters.hospitalId)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query.order('tarikh_akhir', { ascending: true })
    if (error) throw error
    return { data: data as StaffDeadline[], error: null }
  } catch (error: any) {
    let list = getMockData<StaffDeadline[]>('deadlines', [])
    return { data: list, error: null }
  }
}

export const createStaffDeadline = async (
  payload: Omit<StaffDeadline, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<StaffDeadline>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffDeadline[]>('deadlines', [])
    const newDl: StaffDeadline = {
      ...payload,
      id: 'dl-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.push(newDl)
    setMockData('deadlines', list)
    return { data: newDl, error: null }
  }
  try {
    const { data, error } = await supabase.from('staff_deadlines').insert([payload]).select('*').single()
    if (error) throw error
    return { data: data as StaffDeadline, error: null }
  } catch (error: any) {
    const list = getMockData<StaffDeadline[]>('deadlines', [])
    const newDl: StaffDeadline = {
      ...payload,
      id: 'dl-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.push(newDl)
    setMockData('deadlines', list)
    return { data: newDl, error: null }
  }
}

export const updateDeadlineStatus = async (id: string, status: DeadlineStatus): Promise<ApiResponse<void>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffDeadline[]>('deadlines', [])
    const idx = list.findIndex(d => d.id === id)
    if (idx !== -1) {
      list[idx].status = status
      list[idx].updated_at = new Date().toISOString()
      setMockData('deadlines', list)
    }
    return { data: null, error: null }
  }
  try {
    const { error } = await supabase
      .from('staff_deadlines')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (error: any) {
    const list = getMockData<StaffDeadline[]>('deadlines', [])
    const idx = list.findIndex(d => d.id === id)
    if (idx !== -1) {
      list[idx].status = status
      setMockData('deadlines', list)
    }
    return { data: null, error: null }
  }
}

export const deleteStaffDeadline = async (id: string): Promise<ApiResponse<void>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<StaffDeadline[]>('deadlines', [])
    const updated = list.filter(d => d.id !== id)
    setMockData('deadlines', updated)
    return { data: null, error: null }
  }
  try {
    const { error } = await supabase.from('staff_deadlines').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (error: any) {
    const list = getMockData<StaffDeadline[]>('deadlines', [])
    const updated = list.filter(d => d.id !== id)
    setMockData('deadlines', updated)
    return { data: null, error: null }
  }
}

// ====================================================================================
// DASHBOARD STATS AGGREGATOR
// ====================================================================================

export const getStaffDashboardStats = async (
  hospitalId?: string,
  departmentId?: string
): Promise<ApiResponse<StaffDashboardStats>> => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [{ data: movements }, { data: leaves }, { data: reminders }, { data: deadlines }] = await Promise.all([
      getStaffMovements({ hospitalId, departmentId }),
      getLeaveApplications({ hospitalId, departmentId }),
      getStaffReminders({ hospitalId, departmentId }),
      getStaffDeadlines({ hospitalId, departmentId })
    ])

    const activeMovements = movements || []
    const activeLeaves = leaves || []
    const activeReminders = reminders || []
    const activeDeadlines = deadlines || []

    const onLeaveToday = activeLeaves.filter(
      l => l.status === 'approved' && l.tarikh_mula <= today && l.tarikh_tamat >= today
    ).length

    const onCourseToday = activeMovements.filter(
      m => m.status === 'confirmed' && m.jenis_pergerakan === 'COURSE' && m.tarikh_mula <= today && m.tarikh_tamat >= today
    ).length

    const onMeetingToday = activeMovements.filter(
      m => m.status === 'confirmed' && m.jenis_pergerakan === 'MEETING' && m.tarikh_mula <= today && m.tarikh_tamat >= today
    ).length

    const onMovementToday = activeMovements.filter(
      m => m.status === 'confirmed' && m.tarikh_mula <= today && m.tarikh_tamat >= today
    ).length

    const pendingLeaveApprovals = activeLeaves.filter(l => l.status === 'pending').length
    const pendingMovementApprovals = activeMovements.filter(m => m.status === 'pending').length
    const activeDeadlinesCount = activeDeadlines.filter(d => d.status !== 'submitted').length
    const upcomingRemindersCount = activeReminders.filter(r => !r.is_dismissed).length

    const estimatedTotalStaff = 30
    const presentToday = Math.max(0, estimatedTotalStaff - onLeaveToday - onMovementToday)

    const stats: StaffDashboardStats = {
      totalStaff: estimatedTotalStaff,
      presentToday,
      onLeaveToday,
      onCourseToday,
      onMeetingToday,
      onMovementToday,
      pendingLeaveApprovals,
      pendingMovementApprovals,
      activeDeadlinesCount,
      upcomingRemindersCount
    }

    return { data: stats, error: null }
  } catch (err: any) {
    return {
      data: {
        totalStaff: 30,
        presentToday: 26,
        onLeaveToday: 2,
        onCourseToday: 1,
        onMeetingToday: 1,
        onMovementToday: 2,
        pendingLeaveApprovals: 1,
        pendingMovementApprovals: 0,
        activeDeadlinesCount: 3,
        upcomingRemindersCount: 2
      },
      error: null
    }
  }
}
