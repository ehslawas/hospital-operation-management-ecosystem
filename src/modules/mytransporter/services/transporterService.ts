// src/modules/mytransporter/services/transporterService.ts
// MyTransporter integrated transport management service with Supabase and localStorage fallback

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { ApiResponse } from '@/types'
import type {
  TransportVehicle,
  TransportRequest,
  VehicleInspection,
  VehicleIssueReport,
  TransportRequestLog,
  JenisKenderaan,
  StatusKenderaan,
  StatusPermohonan,
  JenisPemeriksaan,
  KeputusanPemeriksaan,
  KeutamaanIsu,
  StatusIsu
} from '@/shared/types/mytransporter'
import type { User } from '@/shared/types/auth'

// ============================================
// LOCAL STORAGE MOCK DATA SYSTEM
// ============================================
const STORAGE_PREFIX = 'mytransporter_mock_'

const getMockData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(STORAGE_PREFIX + key)
  return data ? JSON.parse(data) : defaultValue
}

const setMockData = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
}

// Seed initial mock data if empty
const initMockData = () => {
  if (!localStorage.getItem(STORAGE_PREFIX + 'vehicles')) {
    const initialVehicles: TransportVehicle[] = [
      {
        id: 'vehicle-1',
        no_kenderaan: 'WXD 4291',
        no_chasis: 'CHS-AMB-01-KKM',
        jenis_kenderaan: 'ambulance',
        model: 'Toyota Hiace Ambulance Spec-B',
        tarikh_tamat_cukai_jalan: '2026-12-31',
        status: 'active',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'vehicle-2',
        no_kenderaan: 'QAA 8812 K',
        no_chasis: 'CHS-AMB-02-KKM',
        jenis_kenderaan: 'ambulance',
        model: 'Mercedes-Benz Sprinter ICU Transporter',
        tarikh_tamat_cukai_jalan: '2027-04-15',
        status: 'active',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'vehicle-3',
        no_kenderaan: 'VBY 331',
        no_chasis: 'CHS-SG-01-KKM',
        jenis_kenderaan: 'sg',
        model: 'Proton Persona 1.6 VVT (Kereta Jabatan)',
        tarikh_tamat_cukai_jalan: '2026-09-30',
        status: 'active',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'vehicle-4',
        no_kenderaan: 'JSU 5501',
        no_chasis: 'CHS-SG-02-KKM',
        jenis_kenderaan: 'sg',
        model: 'Toyota Innova 2.0G (Kereta Jabatan)',
        tarikh_tamat_cukai_jalan: '2026-11-20',
        status: 'maintenance',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    const initialRequests: TransportRequest[] = [
      {
        id: 'req-1',
        no_rujukan: 'TRN-2026-00001',
        jenis_permohonan: 'ambulance',
        tujuan_permohonan: 'Rujukan kes kecemasan kardiovaskular ke Hospital Umum Sarawak.',
        destinasi: 'Hospital Umum Sarawak (HUS)',
        tarikh_masa_diperlukan: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        unit_pemohon: 'Emergency Department',
        pengiring: 'medical_officer',
        bawa_pesakit: true,
        nama_pesakit: 'Ahmad bin Zulkifli',
        rn_pesakit: 'RN-99210-26',
        jantina_pesakit: 'Lelaki',
        diagnosis_pesakit: 'Acute Coronary Syndrome (ACS) / NSTEMI',
        telefon_pesakit: '012-3456789',
        catatan_khas: 'Perlu standby oksigen berterusan sepanjang perjalanan.',
        oksigen_diperlukan: true,
        status_semasa: 'completed',
        pemohon_id: 'user-1',
        pemandu_id: 'driver-1',
        pelulus_id: 'admin-1',
        kenderaan_id: 'vehicle-1',
        driver_accepted_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 30 * 60000).toISOString(),
        approved_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 20 * 60000).toISOString(),
        trip_started_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        trip_completed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString(),
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 60 * 60000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString()
      },
      {
        id: 'req-2',
        no_rujukan: 'TRN-2026-00002',
        jenis_permohonan: 'sg',
        tujuan_permohonan: 'Menghadiri mesyuarat rasmi KKM mengenai perolehan farmasi di JKN Sarawak.',
        destinasi: 'Jabatan Kesihatan Negeri (JKN) Sarawak',
        tarikh_masa_diperlukan: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
        unit_pemohon: 'Pharmacy Logistics Unit',
        pengiring: undefined,
        bawa_pesakit: false,
        status_semasa: 'submitted',
        pemohon_id: 'user-1',
        hospital_id: 'hosp-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'req-3',
        no_rujukan: 'TRN-2026-00003',
        jenis_permohonan: 'ambulance',
        tujuan_permohonan: 'Hantar pesakit untuk appointment CT Scan.',
        destinasi: 'Pusat Jantung Kota Samarahan',
        tarikh_masa_diperlukan: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        unit_pemohon: 'Wad Kenanga 2',
        pengiring: 'nurse',
        bawa_pesakit: true,
        nama_pesakit: 'Maimunah binti Kassim',
        rn_pesakit: 'RN-77319-25',
        jantina_pesakit: 'Perempuan',
        diagnosis_pesakit: 'Follow-up Cardiomegaly investigation',
        telefon_pesakit: '019-8765432',
        catatan_khas: 'Kerusi roda diperlukan semasa pemindahan.',
        oksigen_diperlukan: false,
        status_semasa: 'driver_accepted',
        pemohon_id: 'user-2',
        pemandu_id: 'driver-1',
        kenderaan_id: 'vehicle-2',
        driver_accepted_at: new Date().toISOString(),
        hospital_id: 'hosp-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'req-4',
        no_rujukan: 'TRN-2026-00004',
        jenis_permohonan: 'ambulance',
        tujuan_permohonan: 'Merentas sempadan untuk rujukan neurosurgery Hospital Queen Elizabeth I.',
        destinasi: 'Hospital Queen Elizabeth l (HQE l)',
        tarikh_masa_diperlukan: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
        unit_pemohon: 'Emergency Department',
        pengiring: 'medical_officer',
        bawa_pesakit: true,
        nama_pesakit: 'Jackson Wong',
        rn_pesakit: 'RN-88001-26',
        jantina_pesakit: 'Lelaki',
        diagnosis_pesakit: 'Intracerebral Hemorrhage',
        telefon_pesakit: '085-123456',
        catatan_khas: 'Perlu ventilator mudah alih.',
        oksigen_diperlukan: true,
        status_semasa: 'approved',
        pemohon_id: 'user-1',
        pemandu_id: 'driver-1',
        kenderaan_id: 'vehicle-1',
        approved_at: new Date().toISOString(),
        hospital_id: 'hosp-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_crossborder: true,
        crossborder_data: {
          border_control_post: 'Sindumin/Merapok Border Post',
          tempat_berlepas: 'Hospital Lawas',
          surat_kebenaran_ref: 'TF/HL/MW ( 4 ) 2026',
          pengarah_nama: 'DR DOUGLAS CHU KIN SOON (Pengarah Hospital Lawas)',
          doktor_perujuk_nama: 'Dr. Jason Ling',
          catatan: 'Pesakit dirujuk ke Hospital Queen Elizabeth I untuk rawatan pakar neurosurgeri.',
          patients: [
            {
              urutan: 1,
              nama: 'Jackson Wong',
              jantina: 'Lelaki',
              tarikh_lahir: '1985-05-12',
              warganegara: 'Warganegara Malaysia',
              jenis_dokumen: 'IC',
              no_dokumen: '850512-12-5431',
              no_pengenalan: '850512-12-5431'
            }
          ],
          kkm_escorts: [
            {
              nama: 'DR JASON',
              jenis_dokumen: 'IC',
              no_dokumen: '900812-12-3211',
              jawatan: 'medical_officer'
            },
            {
              nama: 'Koperal Ali',
              jenis_dokumen: 'IC',
              no_dokumen: '880102-12-5201',
              jawatan: 'nurse'
            }
          ],
          waris_escorts: [
            {
              nama: 'Jenny Wong',
              jenis_dokumen: 'IC',
              no_dokumen: '870412-12-9902',
              hubungan: 'Isteri'
            }
          ]
        }
      }
    ]

    const initialInspections: VehicleInspection[] = [
      {
        id: 'insp-1',
        request_id: 'req-1',
        kenderaan_id: 'vehicle-1',
        pemandu_id: 'driver-1',
        jenis_pemeriksaan: 'pre_trip',
        status_tayar: 'good',
        foto_tayar: 'mock_tyre_pre.jpg',
        status_minyak_gas: 'good',
        foto_minyak_gas: 'mock_gas_pre.jpg',
        status_minyak_hitam: 'good',
        foto_minyak_hitam: 'mock_oil_pre.jpg',
        bacaan_odometer: 145020,
        foto_odometer: 'mock_odo_pre.jpg',
        keputusan: 'cleared',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 30 * 60000).toISOString()
      },
      {
        id: 'insp-2',
        request_id: 'req-1',
        kenderaan_id: 'vehicle-1',
        pemandu_id: 'driver-1',
        jenis_pemeriksaan: 'post_trip',
        status_tayar: 'good',
        foto_tayar: 'mock_tyre_post.jpg',
        status_minyak_gas: 'good',
        foto_minyak_gas: 'mock_gas_post.jpg',
        status_minyak_hitam: 'good',
        foto_minyak_hitam: 'mock_oil_post.jpg',
        bacaan_odometer: 145180, // 160km driven
        foto_odometer: 'mock_odo_post.jpg',
        keputusan: 'cleared',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString()
      }
    ]

    const initialIssues: VehicleIssueReport[] = [
      {
        id: 'issue-1',
        kenderaan_id: 'vehicle-4',
        pemandu_id: 'driver-2',
        tajuk: 'Penunjuk Minyak Enjin Menyala',
        penerangan: 'Semasa memandu pulang kereta jabatan JSU 5501, lampu amaran minyak enjin (engine oil) menyala seketika. Perlu hantar servis tukar minyak hitam.',
        keutamaan: 'high',
        status: 'open',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      }
    ]

    const initialLogs: TransportRequestLog[] = [
      {
        id: 'log-1',
        request_id: 'req-1',
        tindakan: 'Permohonan Dihantar',
        status_sebelum: 'draft',
        status_selepas: 'submitted',
        catatan: 'Permohonan baru dihantar oleh Pemohon.',
        performed_by: 'user-1',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 60 * 60000).toISOString()
      },
      {
        id: 'log-2',
        request_id: 'req-1',
        tindakan: 'Pre-trip Inspection & Terima Tugasan',
        status_sebelum: 'submitted',
        status_selepas: 'driver_accepted',
        catatan: 'Diterima oleh Pemandu driver-1 selepas pemeriksaan kenderaan WXD 4291 selesai (Bersih/Good).',
        performed_by: 'driver-1',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 30 * 60000).toISOString()
      },
      {
        id: 'log-3',
        request_id: 'req-1',
        tindakan: 'Diluluskan Pentadbir',
        status_sebelum: 'driver_accepted',
        status_selepas: 'approved',
        catatan: 'Diluluskan untuk perjalanan oleh Admin Pentadbir.',
        performed_by: 'admin-1',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 20 * 60000).toISOString()
      },
      {
        id: 'log-4',
        request_id: 'req-1',
        tindakan: 'Memulakan Perjalanan',
        status_sebelum: 'approved',
        status_selepas: 'in_transit',
        catatan: 'Trip bermula dari hospital.',
        performed_by: 'driver-1',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-5',
        request_id: 'req-1',
        tindakan: 'Perjalanan Selesai & Post-trip Inspection',
        status_sebelum: 'in_transit',
        status_selepas: 'completed',
        catatan: 'Pesakit selamat dihantar. Odometer akhir 145180 km.',
        performed_by: 'driver-1',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString()
      }
    ]

    // Role assignment simulation mapping (user_id -> boolean representing has role)
    const initialTransporterRoles = {
      'driver-1': 'transport_driver',
      'driver-2': 'transport_driver',
      'admin-1': 'transport_admin'
    }

    setMockData('vehicles', initialVehicles)
    setMockData('requests', initialRequests)
    setMockData('inspections', initialInspections)
    setMockData('issues', initialIssues)
    setMockData('logs', initialLogs)
    setMockData('transporter_roles', initialTransporterRoles)
  }
}

initMockData()

// ============================================
// CORE VEHICLE REGISTRY FUNCTIONS
// ============================================

export const getVehicles = async (): Promise<ApiResponse<TransportVehicle[]>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportVehicle[]>('vehicles', [])
    return { data: list, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_vehicles')
      .select('*')
      .order('no_kenderaan', { ascending: true })
    
    if (error) throw error
    return { data: data as TransportVehicle[], error: null }
  } catch (error: any) {
    console.error('getVehicles error:', error)
    return { data: null, error: error.message || 'Failed to fetch vehicles' }
  }
}

export const getVehicleById = async (id: string): Promise<ApiResponse<TransportVehicle>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportVehicle[]>('vehicles', [])
    const vehicle = list.find(v => v.id === id)
    if (!vehicle) return { data: null, error: 'Vehicle not found' }
    return { data: vehicle, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as TransportVehicle, error: null }
  } catch (error: any) {
    console.error('getVehicleById error:', error)
    return { data: null, error: error.message || 'Failed to fetch vehicle' }
  }
}

export const registerVehicle = async (
  vehicle: Omit<TransportVehicle, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<TransportVehicle>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportVehicle[]>('vehicles', [])
    
    // Check duplicates
    if (list.some(v => v.no_kenderaan.toLowerCase() === vehicle.no_kenderaan.toLowerCase())) {
      return { data: null, error: `Vehicle number ${vehicle.no_kenderaan} is already registered.` }
    }

    const newVehicle: TransportVehicle = {
      ...vehicle,
      id: 'vehicle-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    list.push(newVehicle)
    setMockData('vehicles', list)
    return { data: newVehicle, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_vehicles')
      .insert(vehicle)
      .select()
      .single()

    if (error) throw error
    return { data: data as TransportVehicle, error: null }
  } catch (error: any) {
    console.error('registerVehicle error:', error)
    return { data: null, error: error.message || 'Failed to register vehicle' }
  }
}

export const updateVehicle = async (
  id: string,
  updates: Partial<Omit<TransportVehicle, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<TransportVehicle>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportVehicle[]>('vehicles', [])
    const index = list.findIndex(v => v.id === id)
    if (index === -1) return { data: null, error: 'Vehicle not found' }

    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    list[index] = updated
    setMockData('vehicles', list)
    return { data: updated, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: data as TransportVehicle, error: null }
  } catch (error: any) {
    console.error('updateVehicle error:', error)
    return { data: null, error: error.message || 'Failed to update vehicle' }
  }
}

// ============================================
// CORE TRANSPORT REQUEST FUNCTIONS
// ============================================

// Unique reference generator: TRN-YYYY-XXXXX
const generateReferenceNumber = async (hospitalId: string): Promise<string> => {
  const year = new Date().getFullYear()
  
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequest[]>('requests', [])
    const prefix = `TRN-${year}-`
    const matches = list.filter(r => r.no_rujukan.startsWith(prefix))
    let nextSeq = 1
    if (matches.length > 0) {
      const seqs = matches.map(r => parseInt(r.no_rujukan.replace(prefix, ''), 10))
      nextSeq = Math.max(...seqs) + 1
    }
    return `${prefix}${String(nextSeq).padStart(5, '0')}`
  }

  try {
    const prefix = `TRN-${year}-`
    const { data, error } = await supabase
      .from('transport_requests')
      .select('no_rujukan')
      .eq('hospital_id', hospitalId)
      .like('no_rujukan', `${prefix}%`)
      .order('no_rujukan', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextSeq = 1
    if (data && data.length > 0) {
      const lastRef = data[0].no_rujukan
      const seq = parseInt(lastRef.replace(prefix, ''), 10)
      nextSeq = seq + 1
    }
    return `${prefix}${String(nextSeq).padStart(5, '0')}`
  } catch (err) {
    console.error('Error generating ref number:', err)
    return `TRN-${year}-${Math.floor(10000 + Math.random() * 90000)}`
  }
}

export const createRequest = async (
  request: Omit<TransportRequest, 'id' | 'no_rujukan' | 'status_semasa' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<TransportRequest>> => {
  const refNo = await generateReferenceNumber(request.hospital_id)

  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequest[]>('requests', [])
    const newRequest: TransportRequest = {
      ...request,
      id: 'req-' + Math.random().toString(36).substr(2, 9),
      no_rujukan: refNo,
      status_semasa: 'submitted', // In this hospital system, creating directly submits it
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.push(newRequest)
    setMockData('requests', list)

    // Log the action
    await logRequestTransition(newRequest.id, 'Permohonan Baru', 'draft', 'submitted', 'Permohonan pengangkutan dihantar.', request.pemohon_id, request.hospital_id)

    return { data: newRequest, error: null }
  }

  try {
    const newRequestData = {
      ...request,
      no_rujukan: refNo,
      status_semasa: 'submitted'
    }

    const { data, error } = await supabase
      .from('transport_requests')
      .insert(newRequestData)
      .select()
      .single()

    if (error) throw error

    // Log the transition
    await logRequestTransition(data.id, 'Permohonan Baru', 'draft', 'submitted', 'Permohonan pengangkutan dihantar.', request.pemohon_id, request.hospital_id)

    return { data: data as TransportRequest, error: null }
  } catch (error: any) {
    console.error('createRequest error:', error)
    return { data: null, error: error.message || 'Failed to create request' }
  }
}

export const updateRequest = async (
  id: string,
  request: Partial<Omit<TransportRequest, 'id' | 'no_rujukan' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequest[]>('requests', [])
    const index = list.findIndex(r => r.id === id)
    if (index === -1) return { data: null, error: 'Request not found' }
    
    const updatedRequest = {
      ...list[index],
      ...request,
      updated_at: new Date().toISOString()
    }
    list[index] = updatedRequest
    setMockData('requests', list)
    return { data: updatedRequest, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        ...request,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data: data as TransportRequest, error: null }
  } catch (error: any) {
    console.error('updateRequest error:', error)
    return { data: null, error: error.message || 'Failed to update request' }
  }
}


export const getRequests = async (): Promise<ApiResponse<TransportRequest[]>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequest[]>('requests', [])
    const vehicles = getMockData<TransportVehicle[]>('vehicles', [])
    
    // Resolve relation join simulation
    const resolved = list.map(req => ({
      ...req,
      kenderaan: vehicles.find(v => v.id === req.kenderaan_id)
    }))

    return { data: resolved, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .select(`
        *,
        pemohon:users!pemohon_id(*),
        pemandu:users!pemandu_id(*),
        pelulus:users!pelulus_id(*),
        kenderaan:transport_vehicles(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as TransportRequest[], error: null }
  } catch (error: any) {
    console.error('getRequests error:', error)
    return { data: null, error: error.message || 'Failed to fetch requests' }
  }
}

export const getRequestById = async (id: string): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequest[]>('requests', [])
    const vehicles = getMockData<TransportVehicle[]>('vehicles', [])
    const req = list.find(r => r.id === id)
    if (!req) return { data: null, error: 'Request not found' }
    
    const resolved = {
      ...req,
      kenderaan: vehicles.find(v => v.id === req.kenderaan_id)
    }
    return { data: resolved, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .select(`
        *,
        pemohon:users!pemohon_id(*),
        pemandu:users!pemandu_id(*),
        pelulus:users!pelulus_id(*),
        kenderaan:transport_vehicles(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as TransportRequest, error: null }
  } catch (error: any) {
    console.error('getRequestById error:', error)
    return { data: null, error: error.message || 'Failed to fetch request detail' }
  }
}

// Driver accepts a trip (must provide inspection result cleared or rejected)
export const driverAcceptRequest = async (
  requestId: string,
  driverId: string,
  vehicleId: string,
  inspection: Omit<VehicleInspection, 'id' | 'request_id' | 'kenderaan_id' | 'pemandu_id' | 'jenis_pemeriksaan' | 'created_at'>
): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const reqIndex = reqs.findIndex(r => r.id === requestId)
    if (reqIndex === -1) return { data: null, error: 'Request not found' }
    
    const oldStatus = reqs[reqIndex].status_semasa
    if (oldStatus !== 'submitted' && oldStatus !== 'driver_rejected') {
      return { data: null, error: 'Request is no longer available to accept.' }
    }

    const insps = getMockData<VehicleInspection[]>('inspections', [])
    
    const newInspection: VehicleInspection = {
      ...inspection,
      id: 'insp-' + Math.random().toString(36).substr(2, 9),
      request_id: requestId,
      kenderaan_id: vehicleId,
      pemandu_id: driverId,
      jenis_pemeriksaan: 'pre_trip',
      created_at: new Date().toISOString()
    }
    insps.push(newInspection)
    setMockData('inspections', insps)

    // Log inspection-driven state
    if (inspection.keputusan === 'rejected') {
      // Driver rejects request due to vehicle condition
      reqs[reqIndex].status_semasa = 'driver_rejected'
      reqs[reqIndex].pemandu_id = driverId
      reqs[reqIndex].kenderaan_id = vehicleId
      reqs[reqIndex].sebab_tolak = inspection.catatan || 'Kerosakan/masalah kenderaan dikesan semasa pre-trip.'
      reqs[reqIndex].updated_at = new Date().toISOString()
      
      setMockData('requests', reqs)

      // Report an issue automatically
      await reportVehicleIssue({
        kenderaan_id: vehicleId,
        pemandu_id: driverId,
        inspection_id: newInspection.id,
        tajuk: `Masalah Pre-Trip: ${reqs[reqIndex].no_rujukan}`,
        penerangan: inspection.catatan || 'Kerosakan dikesan semasa pemeriksaan pre-trip.',
        keutamaan: 'high',
        status: 'open',
        hospital_id: reqs[reqIndex].hospital_id
      })

      await logRequestTransition(requestId, 'Pemandu Tolak (Isu Kenderaan)', oldStatus, 'driver_rejected', `Ditolak oleh pemandu kerana masalah kenderaan: ${inspection.catatan}`, driverId, reqs[reqIndex].hospital_id)
      
      return { data: reqs[reqIndex], error: null }
    } else {
      // Clear to go, Driver accepts request
      reqs[reqIndex].status_semasa = 'driver_accepted'
      reqs[reqIndex].pemandu_id = driverId
      reqs[reqIndex].kenderaan_id = vehicleId
      reqs[reqIndex].driver_accepted_at = new Date().toISOString()
      reqs[reqIndex].updated_at = new Date().toISOString()
      
      setMockData('requests', reqs)

      await logRequestTransition(requestId, 'Pemandu Terima Tugasan', oldStatus, 'driver_accepted', 'Tugasan diterima dan kenderaan disahkan sedia.', driverId, reqs[reqIndex].hospital_id)
      
      return { data: reqs[reqIndex], error: null }
    }
  }

  try {
    // Supabase transaction simulation (since we do multi inserts)
    // 1. Insert inspection
    const newInspectionData = {
      ...inspection,
      request_id: requestId,
      kenderaan_id: vehicleId,
      pemandu_id: driverId,
      jenis_pemeriksaan: 'pre_trip'
    }

    const { data: inspData, error: inspError } = await supabase
      .from('vehicle_inspections')
      .insert(newInspectionData)
      .select()
      .single()

    if (inspError) throw inspError

    const isRejected = inspection.keputusan === 'rejected'
    const newStatus: StatusPermohonan = isRejected ? 'driver_rejected' : 'driver_accepted'
    
    // Update request
    const updates: Partial<TransportRequest> = {
      status_semasa: newStatus,
      pemandu_id: driverId,
      kenderaan_id: vehicleId,
      updated_at: new Date().toISOString()
    }

    if (isRejected) {
      updates.sebab_tolak = inspection.catatan || 'Kerosakan dikesan semasa pre-trip.'
      
      // Auto issue report
      await supabase.from('vehicle_issue_reports').insert({
        kenderaan_id: vehicleId,
        pemandu_id: driverId,
        inspection_id: inspData.id,
        tajuk: `Masalah Pre-Trip: Tugasan Kenderaan`,
        penerangan: inspection.catatan || 'Kerosakan dikesan semasa pemeriksaan pre-trip.',
        keutamaan: 'high',
        status: 'open',
        hospital_id: inspection.hospital_id
      })
    } else {
      updates.driver_accepted_at = new Date().toISOString()
    }

    const { data: updatedReq, error: reqError } = await supabase
      .from('transport_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single()

    if (reqError) throw reqError

    // Log the transition
    await logRequestTransition(
      requestId,
      isRejected ? 'Pemandu Tolak (Isu Kenderaan)' : 'Pemandu Terima Tugasan',
      isRejected ? 'submitted' : 'submitted',
      newStatus,
      isRejected ? `Ditolak oleh pemandu kerana masalah kenderaan: ${inspection.catatan}` : 'Tugasan diterima dan kenderaan disahkan sedia.',
      driverId,
      inspection.hospital_id
    )

    return { data: updatedReq as TransportRequest, error: null }
  } catch (error: any) {
    console.error('driverAcceptRequest error:', error)
    return { data: null, error: error.message || 'Failed to process driver acceptance' }
  }
}

// Driver rejects directly without inspection (e.g. unavailable, busy)
export const driverRejectRequestDirect = async (
  requestId: string,
  driverId: string,
  reason: string,
  hospitalId: string
): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const reqIndex = reqs.findIndex(r => r.id === requestId)
    if (reqIndex === -1) return { data: null, error: 'Request not found' }

    const oldStatus = reqs[reqIndex].status_semasa
    reqs[reqIndex].status_semasa = 'submitted' // Return back to open queue
    reqs[reqIndex].pemandu_id = undefined
    reqs[reqIndex].kenderaan_id = undefined
    reqs[reqIndex].updated_at = new Date().toISOString()
    setMockData('requests', reqs)

    await logRequestTransition(requestId, 'Pemandu Tolak Tugasan', oldStatus, 'submitted', `Ditolak pemandu: ${reason}. Tugasan dikembalikan ke senarai.`, driverId, hospitalId)
    return { data: reqs[reqIndex], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        pemandu_id: null,
        kenderaan_id: null,
        status_semasa: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    await logRequestTransition(requestId, 'Pemandu Tolak Tugasan', 'submitted', 'submitted', `Ditolak pemandu: ${reason}. Tugasan dikembalikan ke senarai.`, driverId, hospitalId)
    return { data: data as TransportRequest, error: null }
  } catch (error: any) {
    console.error('driverRejectRequestDirect error:', error)
    return { data: null, error: error.message || 'Failed to reject request' }
  }
}

// Admin approves request
export const adminApproveRequest = async (
  requestId: string,
  adminId: string,
  hospitalId: string
): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const reqIndex = reqs.findIndex(r => r.id === requestId)
    if (reqIndex === -1) return { data: null, error: 'Request not found' }

    const oldStatus = reqs[reqIndex].status_semasa
    reqs[reqIndex].status_semasa = 'approved'
    reqs[reqIndex].pelulus_id = adminId
    reqs[reqIndex].approved_at = new Date().toISOString()
    reqs[reqIndex].updated_at = new Date().toISOString()
    setMockData('requests', reqs)

    await logRequestTransition(requestId, 'Kelulusan Pentadbir', oldStatus, 'approved', 'Permohonan diluluskan oleh Pentadbir.', adminId, hospitalId)
    return { data: reqs[reqIndex], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        status_semasa: 'approved',
        pelulus_id: adminId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    await logRequestTransition(requestId, 'Kelulusan Pentadbir', 'driver_accepted', 'approved', 'Permohonan diluluskan oleh Pentadbir.', adminId, hospitalId)
    return { data: data as TransportRequest, error: null }
  } catch (error: any) {
    console.error('adminApproveRequest error:', error)
    return { data: null, error: error.message || 'Failed to approve request' }
  }
}

// Admin rejects request with reason
export const adminRejectRequest = async (
  requestId: string,
  adminId: string,
  reason: string,
  hospitalId: string
): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const reqIndex = reqs.findIndex(r => r.id === requestId)
    if (reqIndex === -1) return { data: null, error: 'Request not found' }

    const oldStatus = reqs[reqIndex].status_semasa
    reqs[reqIndex].status_semasa = 'rejected'
    reqs[reqIndex].pelulus_id = adminId
    reqs[reqIndex].sebab_tolak = reason
    reqs[reqIndex].updated_at = new Date().toISOString()
    setMockData('requests', reqs)

    await logRequestTransition(requestId, 'Ditolak Pentadbir', oldStatus, 'rejected', `Ditolak oleh Pentadbir: ${reason}`, adminId, hospitalId)
    return { data: reqs[reqIndex], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        status_semasa: 'rejected',
        pelulus_id: adminId,
        sebab_tolak: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    await logRequestTransition(requestId, 'Ditolak Pentadbir', 'driver_accepted', 'rejected', `Ditolak oleh Pentadbir: ${reason}`, adminId, hospitalId)
    return { data: data as TransportRequest, error: null }
  } catch (error: any) {
    console.error('adminRejectRequest error:', error)
    return { data: null, error: error.message || 'Failed to reject request' }
  }
}

// Admin/User cancels request
export const cancelRequest = async (
  requestId: string,
  userId: string,
  reason: string,
  hospitalId: string
): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const reqIndex = reqs.findIndex(r => r.id === requestId)
    if (reqIndex === -1) return { data: null, error: 'Request not found' }

    const oldStatus = reqs[reqIndex].status_semasa
    reqs[reqIndex].status_semasa = 'cancelled'
    reqs[reqIndex].sebab_tolak = reason
    reqs[reqIndex].cancelled_at = new Date().toISOString()
    reqs[reqIndex].updated_at = new Date().toISOString()
    setMockData('requests', reqs)

    await logRequestTransition(requestId, 'Dibatalkan', oldStatus, 'cancelled', `Dibatalkan oleh Pengguna/Admin: ${reason}`, userId, hospitalId)
    return { data: reqs[reqIndex], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        status_semasa: 'cancelled',
        sebab_tolak: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    await logRequestTransition(requestId, 'Dibatalkan', 'submitted', 'cancelled', `Dibatalkan: ${reason}`, userId, hospitalId)
    return { data: data as TransportRequest, error: null }
  } catch (error: any) {
    console.error('cancelRequest error:', error)
    return { data: null, error: error.message || 'Failed to cancel request' }
  }
}

// Driver starts trip
export const startTrip = async (
  requestId: string,
  driverId: string,
  hospitalId: string
): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const reqIndex = reqs.findIndex(r => r.id === requestId)
    if (reqIndex === -1) return { data: null, error: 'Request not found' }

    const oldStatus = reqs[reqIndex].status_semasa
    reqs[reqIndex].status_semasa = 'in_transit'
    reqs[reqIndex].trip_started_at = new Date().toISOString()
    reqs[reqIndex].updated_at = new Date().toISOString()
    setMockData('requests', reqs)

    await logRequestTransition(requestId, 'Mula Perjalanan', oldStatus, 'in_transit', 'Pemandu memulakan perjalanan trip.', driverId, hospitalId)
    return { data: reqs[reqIndex], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        status_semasa: 'in_transit',
        trip_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    await logRequestTransition(requestId, 'Mula Perjalanan', 'approved', 'in_transit', 'Pemandu memulakan perjalanan trip.', driverId, hospitalId)
    return { data: data as TransportRequest, error: null }
  } catch (error: any) {
    console.error('startTrip error:', error)
    return { data: null, error: error.message || 'Failed to start trip' }
  }
}

// Driver completes trip with post-trip inspection
export const completeTrip = async (
  requestId: string,
  driverId: string,
  vehicleId: string,
  inspection: Omit<VehicleInspection, 'id' | 'request_id' | 'kenderaan_id' | 'pemandu_id' | 'jenis_pemeriksaan' | 'created_at'>
): Promise<ApiResponse<TransportRequest>> => {
  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const reqIndex = reqs.findIndex(r => r.id === requestId)
    if (reqIndex === -1) return { data: null, error: 'Request not found' }

    const oldStatus = reqs[reqIndex].status_semasa
    const insps = getMockData<VehicleInspection[]>('inspections', [])

    const newInspection: VehicleInspection = {
      ...inspection,
      id: 'insp-' + Math.random().toString(36).substr(2, 9),
      request_id: requestId,
      kenderaan_id: vehicleId,
      pemandu_id: driverId,
      jenis_pemeriksaan: 'post_trip',
      created_at: new Date().toISOString()
    }
    insps.push(newInspection)
    setMockData('inspections', insps)

    // Complete request
    reqs[reqIndex].status_semasa = 'completed'
    reqs[reqIndex].trip_completed_at = new Date().toISOString()
    reqs[reqIndex].updated_at = new Date().toISOString()
    setMockData('requests', reqs)

    // If inspection post-trip had issues, log a vehicle issue automatically
    if (inspection.keputusan === 'rejected' || inspection.status_tayar === 'issue' || inspection.status_minyak_gas === 'issue' || inspection.status_minyak_hitam === 'issue') {
      await reportVehicleIssue({
        kenderaan_id: vehicleId,
        pemandu_id: driverId,
        inspection_id: newInspection.id,
        tajuk: `Isu dikesan Post-Trip: ${reqs[reqIndex].no_rujukan}`,
        penerangan: inspection.catatan || 'Kerosakan/masalah kenderaan dilaporkan semasa pemeriksaan selepas trip.',
        keutamaan: 'medium',
        status: 'open',
        hospital_id: reqs[reqIndex].hospital_id
      })
    }

    await logRequestTransition(requestId, 'Selesai Perjalanan', oldStatus, 'completed', `Trip selesai. Odometer akhir: ${inspection.bacaan_odometer} km.`, driverId, reqs[reqIndex].hospital_id)
    return { data: reqs[reqIndex], error: null }
  }

  try {
    // 1. Insert post-trip inspection
    const newInspectionData = {
      ...inspection,
      request_id: requestId,
      kenderaan_id: vehicleId,
      pemandu_id: driverId,
      jenis_pemeriksaan: 'post_trip'
    }

    const { data: inspData, error: inspError } = await supabase
      .from('vehicle_inspections')
      .insert(newInspectionData)
      .select()
      .single()

    if (inspError) throw inspError

    // 2. Update request
    const { data: updatedReq, error: reqError } = await supabase
      .from('transport_requests')
      .update({
        status_semasa: 'completed',
        trip_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (reqError) throw reqError

    // Auto issue report if any issues checked
    if (inspection.keputusan === 'rejected' || inspection.status_tayar === 'issue' || inspection.status_minyak_gas === 'issue' || inspection.status_minyak_hitam === 'issue') {
      await supabase.from('vehicle_issue_reports').insert({
        kenderaan_id: vehicleId,
        pemandu_id: driverId,
        inspection_id: inspData.id,
        tajuk: `Isu dikesan Post-Trip`,
        penerangan: inspection.catatan || 'Kerosakan/masalah kenderaan dilaporkan semasa pemeriksaan selepas trip.',
        keutamaan: 'medium',
        status: 'open',
        hospital_id: inspection.hospital_id
      })
    }

    await logRequestTransition(
      requestId,
      'Selesai Perjalanan',
      'in_transit',
      'completed',
      `Trip selesai. Odometer akhir: ${inspection.bacaan_odometer} km.`,
      driverId,
      inspection.hospital_id
    )

    return { data: updatedReq as TransportRequest, error: null }
  } catch (error: any) {
    console.error('completeTrip error:', error)
    return { data: null, error: error.message || 'Failed to complete trip' }
  }
}

// ============================================
// VEHICLE ISSUES REPORTS (DRIVER SUBMITTED)
// ============================================

export const getVehicleIssues = async (): Promise<ApiResponse<VehicleIssueReport[]>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<VehicleIssueReport[]>('issues', [])
    const vehicles = getMockData<TransportVehicle[]>('vehicles', [])
    
    const resolved = list.map(issue => ({
      ...issue,
      kenderaan: vehicles.find(v => v.id === issue.kenderaan_id)
    }))
    return { data: resolved, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_issue_reports')
      .select(`
        *,
        kenderaan:transport_vehicles(*),
        pemandu:users!pemandu_id(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as VehicleIssueReport[], error: null }
  } catch (error: any) {
    console.error('getVehicleIssues error:', error)
    return { data: null, error: error.message || 'Failed to fetch issue reports' }
  }
}

export const reportVehicleIssue = async (
  issue: Omit<VehicleIssueReport, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<VehicleIssueReport>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<VehicleIssueReport[]>('issues', [])
    const newIssue: VehicleIssueReport = {
      ...issue,
      id: 'issue-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list.push(newIssue)
    setMockData('issues', list)
    return { data: newIssue, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_issue_reports')
      .insert(issue)
      .select()
      .single()

    if (error) throw error
    return { data: data as VehicleIssueReport, error: null }
  } catch (error: any) {
    console.error('reportVehicleIssue error:', error)
    return { data: null, error: error.message || 'Failed to submit issue report' }
  }
}

export const resolveVehicleIssue = async (
  issueId: string,
  adminId: string,
  resolutionNotes: string
): Promise<ApiResponse<VehicleIssueReport>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<VehicleIssueReport[]>('issues', [])
    const idx = list.findIndex(i => i.id === issueId)
    if (idx === -1) return { data: null, error: 'Issue not found' }

    const updated = {
      ...list[idx],
      status: 'resolved' as StatusIsu,
      catatan_penyelesaian: resolutionNotes,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    list[idx] = updated
    setMockData('issues', list)
    return { data: updated, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_issue_reports')
      .update({
        status: 'resolved',
        catatan_penyelesaian: resolutionNotes,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', issueId)
      .select()
      .single()

    if (error) throw error
    return { data: data as VehicleIssueReport, error: null }
  } catch (error: any) {
    console.error('resolveVehicleIssue error:', error)
    return { data: null, error: error.message || 'Failed to resolve issue' }
  }
}

export const acknowledgeVehicleIssue = async (
  issueId: string
): Promise<ApiResponse<VehicleIssueReport>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<VehicleIssueReport[]>('issues', [])
    const idx = list.findIndex(i => i.id === issueId)
    if (idx === -1) return { data: null, error: 'Issue not found' }

    const updated = {
      ...list[idx],
      status: 'acknowledged' as StatusIsu,
      updated_at: new Date().toISOString()
    }
    list[idx] = updated
    setMockData('issues', list)
    return { data: updated, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_issue_reports')
      .update({
        status: 'acknowledged',
        updated_at: new Date().toISOString()
      })
      .eq('id', issueId)
      .select()
      .single()

    if (error) throw error
    return { data: data as VehicleIssueReport, error: null }
  } catch (error: any) {
    console.error('acknowledgeVehicleIssue error:', error)
    return { data: null, error: error.message || 'Failed to acknowledge issue' }
  }
}

// ============================================
// VEHICLE INSPECTION HISTORY
// ============================================

export const getInspections = async (): Promise<ApiResponse<VehicleInspection[]>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<VehicleInspection[]>('inspections', [])
    const vehicles = getMockData<TransportVehicle[]>('vehicles', [])
    const resolved = list.map(i => ({
      ...i,
      kenderaan: vehicles.find(v => v.id === i.kenderaan_id)
    }))
    return { data: resolved, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .select(`
        *,
        kenderaan:transport_vehicles(*),
        pemandu:users!pemandu_id(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as VehicleInspection[], error: null }
  } catch (error: any) {
    console.error('getInspections error:', error)
    return { data: null, error: error.message || 'Failed to fetch inspections' }
  }
}

// ============================================
// AUDIT LOGGING FOR REQUESTS
// ============================================

export const logRequestTransition = async (
  requestId: string,
  tindakan: string,
  statusSebelum: string,
  statusSelepas: string,
  catatan: string,
  performedBy: string,
  hospitalId: string
): Promise<void> => {
  const newLog = {
    request_id: requestId,
    tindakan,
    status_sebelum: statusSebelum,
    status_selepas: statusSelepas,
    catatan,
    performed_by: performedBy,
    hospital_id: hospitalId
  }

  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequestLog[]>('logs', [])
    list.push({
      ...newLog,
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    })
    setMockData('logs', list)
    return
  }

  try {
    await supabase.from('transport_request_logs').insert(newLog)
  } catch (error) {
    console.error('Failed to log request transition:', error)
  }
}

export const getRequestLogs = async (requestId: string): Promise<ApiResponse<TransportRequestLog[]>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequestLog[]>('logs', [])
    const filtered = list.filter(l => l.request_id === requestId)
    // Sort descending by date
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return { data: filtered, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_request_logs')
      .select(`
        *,
        performer:users!performed_by(*)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as TransportRequestLog[], error: null }
  } catch (error: any) {
    console.error('getRequestLogs error:', error)
    return { data: null, error: error.message || 'Failed to fetch audit logs' }
  }
}

// ============================================
// ROLE MANAGEMENT (within module)
// ============================================

export const getTransporterRoles = async (): Promise<ApiResponse<Record<string, string>>> => {
  const defaultRoles: Record<string, string> = {
    'driver-1': 'transport_driver',
    'driver-2': 'transport_driver',
    '88dc2fa7-e943-45ba-a889-8756c0265b48': 'transport_driver' // AMRI AMIT
  }

  if (!isSupabaseConfigured()) {
    const roles = getMockData<Record<string, string>>('transporter_roles', defaultRoles)
    return { data: roles, error: null }
  }

  try {
    let roles = getMockData<Record<string, string>>('transporter_roles', null as any)
    if (!roles || Object.keys(roles).length === 0) {
      roles = { ...defaultRoles }
      setMockData('transporter_roles', roles)
    }

    // Also auto-assign active drivers who have role_code = 'hospital_driver' in Supabase
    const { data: users } = await supabase
      .from('users')
      .select('id, role_id, roles:roles(role_code)')

    if (users) {
      users.forEach((u: any) => {
        if (!roles[u.id]) {
          const sysRole = (u as any).roles?.role_code
          if (sysRole === 'hospital_driver') {
            roles[u.id] = 'transport_driver'
          } else if (sysRole === 'system_admin' || sysRole === 'hospital_admin' || sysRole === 'hospital_administrator') {
            roles[u.id] = 'transport_admin'
          }
        }
      })
    }

    return { data: roles, error: null }
  } catch (err: any) {
    console.error('getTransporterRoles error:', err)
    const roles = getMockData<Record<string, string>>('transporter_roles', defaultRoles)
    return { data: roles, error: null }
  }
}

export const assignTransporterRole = async (userId: string, roleCode: string | null): Promise<ApiResponse<boolean>> => {
  const roles = getMockData<Record<string, string>>('transporter_roles', {})
  if (roleCode) {
    roles[userId] = roleCode
  } else {
    delete roles[userId]
  }
  setMockData('transporter_roles', roles)
  return { data: true, error: null }
}

// ============================================
// AGGREGATION & REPORTING SERVICES
// ============================================

export interface VehicleMovementReportRow {
  date: string
  driverName: string
  destination: string
  purpose: string
  odometerStart: number
  odometerEnd: number
  distanceKm: number
  referenceNo: string
  durationHours?: number
}

export const getVehicleMovementReport = async (
  vehicleId: string,
  month: number, // 1-12
  year: number
): Promise<ApiResponse<{
  vehicle: TransportVehicle
  trips: VehicleMovementReportRow[]
  totalTrips: number
  totalKm: number
}>> => {
  const vRes = await getVehicleById(vehicleId)
  if (vRes.error || !vRes.data) return { data: null, error: vRes.error || 'Vehicle not found' }
  const vehicle = vRes.data

  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const insps = getMockData<VehicleInspection[]>('inspections', [])
    
    // Filter completed requests for this vehicle in this month/year
    const filteredRequests = reqs.filter(r => {
      if (r.kenderaan_id !== vehicleId || r.status_semasa !== 'completed' || !r.trip_completed_at) return false
      const date = new Date(r.trip_completed_at)
      return date.getMonth() + 1 === month && date.getFullYear() === year
    })

    const trips: VehicleMovementReportRow[] = []
    let totalKm = 0

    filteredRequests.forEach(req => {
      // Find inspections
      const preInsp = insps.find(i => i.request_id === req.id && i.jenis_pemeriksaan === 'pre_trip')
      const postInsp = insps.find(i => i.request_id === req.id && i.jenis_pemeriksaan === 'post_trip')

      const odoStart = preInsp ? preInsp.bacaan_odometer : 0
      const odoEnd = postInsp ? postInsp.bacaan_odometer : odoStart
      const distance = Math.max(0, odoEnd - odoStart)
      totalKm += distance

      trips.push({
        date: req.trip_completed_at ? req.trip_completed_at.split('T')[0] : '',
        driverName: req.pemandu_id === 'driver-1' ? 'Pemandu Ali' : 'Pemandu Abu',
        destination: req.destinasi,
        purpose: req.tujuan_permohonan,
        odometerStart: odoStart,
        odometerEnd: odoEnd,
        distanceKm: distance,
        referenceNo: req.no_rujukan
      })
    })

    return {
      data: {
        vehicle,
        trips,
        totalTrips: trips.length,
        totalKm
      },
      error: null
    }
  }

  // Supabase real queries
  try {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: reqs, error: reqsError } = await supabase
      .from('transport_requests')
      .select(`
        id, no_rujukan, destinasi, tujuan_permohonan, trip_completed_at, pemandu_id,
        pemandu:users!pemandu_id(full_name),
        inspections:vehicle_inspections(jenis_pemeriksaan, bacaan_odometer)
      `)
      .eq('kenderaan_id', vehicleId)
      .eq('status_semasa', 'completed')
      .gte('trip_completed_at', startDate)
      .lte('trip_completed_at', endDate)

    if (reqsError) throw reqsError

    const trips: VehicleMovementReportRow[] = []
    let totalKm = 0

    reqs.forEach((req: any) => {
      const preInsp = req.inspections?.find((i: any) => i.jenis_pemeriksaan === 'pre_trip')
      const postInsp = req.inspections?.find((i: any) => i.jenis_pemeriksaan === 'post_trip')

      const odoStart = preInsp ? preInsp.bacaan_odometer : 0
      const odoEnd = postInsp ? postInsp.bacaan_odometer : odoStart
      const distance = Math.max(0, odoEnd - odoStart)
      totalKm += distance

      trips.push({
        date: req.trip_completed_at ? req.trip_completed_at.split('T')[0] : '',
        driverName: req.pemandu?.full_name || 'Driver Not Set',
        destination: req.destinasi,
        purpose: req.tujuan_permohonan,
        odometerStart: odoStart,
        odometerEnd: odoEnd,
        distanceKm: distance,
        referenceNo: req.no_rujukan
      })
    })

    return {
      data: {
        vehicle,
        trips,
        totalTrips: trips.length,
        totalKm
      },
      error: null
    }
  } catch (error: any) {
    console.error('getVehicleMovementReport error:', error)
    return { data: null, error: error.message || 'Failed to compile vehicle movement report' }
  }
}

export const getDriverMovementReport = async (
  driverId: string,
  month: number, // 1-12
  year: number
): Promise<ApiResponse<{
  driver: any
  trips: VehicleMovementReportRow[]
  totalTrips: number
  totalKm: number
}>> => {
  let driver: any = { id: driverId, full_name: 'Driver' }
  
  if (isSupabaseConfigured()) {
    try {
      const { data: uData } = await supabase
        .from('users')
        .select('*')
        .eq('id', driverId)
        .single()
      if (uData) driver = uData
    } catch (e) {
      console.error(e)
    }
  }

  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const insps = getMockData<VehicleInspection[]>('inspections', [])
    const vehicles = getMockData<TransportVehicle[]>('vehicles', [])
    
    // Filter completed requests for this driver in this month/year
    const filteredRequests = reqs.filter(r => {
      if (r.pemandu_id !== driverId || r.status_semasa !== 'completed' || !r.trip_completed_at) return false
      const date = new Date(r.trip_completed_at)
      return date.getMonth() + 1 === month && date.getFullYear() === year
    })

    const trips: VehicleMovementReportRow[] = []
    let totalKm = 0

    filteredRequests.forEach(req => {
      // Filter inspections for this request and sort descending by created_at
      const reqInsps = insps
        .filter(i => i.request_id === req.id)
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())

      const preInsp = reqInsps.find(i => i.jenis_pemeriksaan === 'pre_trip')
      const postInsp = reqInsps.find(i => i.jenis_pemeriksaan === 'post_trip')

      const odoStart = preInsp ? preInsp.bacaan_odometer : 0
      const odoEnd = postInsp ? postInsp.bacaan_odometer : odoStart
      const distance = Math.max(0, odoEnd - odoStart)
      totalKm += distance

      const start = req.trip_started_at ? new Date(req.trip_started_at).getTime() : 0
      const end = req.trip_completed_at ? new Date(req.trip_completed_at).getTime() : 0
      const durationHours = start && end ? parseFloat(((end - start) / 3600000).toFixed(2)) : 0

      const vehicle = vehicles.find(v => v.id === req.kenderaan_id)

      trips.push({
        date: req.trip_completed_at ? req.trip_completed_at.split('T')[0] : '',
        driverName: vehicle ? `${vehicle.no_kenderaan} (${vehicle.model})` : 'Kenderaan',
        destination: req.destinasi,
        purpose: req.tujuan_permohonan,
        odometerStart: odoStart,
        odometerEnd: odoEnd,
        distanceKm: distance,
        referenceNo: req.no_rujukan,
        durationHours
      })
    })

    return {
      data: {
        driver,
        trips,
        totalTrips: trips.length,
        totalKm
      },
      error: null
    }
  }

  // Supabase real queries
  try {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: reqs, error: reqsError } = await supabase
      .from('transport_requests')
      .select(`
        id, no_rujukan, destinasi, tujuan_permohonan, trip_started_at, trip_completed_at, kenderaan_id,
        kenderaan:transport_vehicles(no_kenderaan, model),
        inspections:vehicle_inspections(jenis_pemeriksaan, bacaan_odometer, created_at)
      `)
      .eq('pemandu_id', driverId)
      .eq('status_semasa', 'completed')
      .gte('trip_completed_at', startDate)
      .lte('trip_completed_at', endDate)

    if (reqsError) throw reqsError

    const trips: VehicleMovementReportRow[] = []
    let totalKm = 0

    reqs.forEach((req: any) => {
      // Sort inspections descending by created_at so the latest is first
      const sortedInsps = req.inspections ? [...req.inspections].sort((a: any, b: any) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()) : []
      const preInsp = sortedInsps.find((i: any) => i.jenis_pemeriksaan === 'pre_trip')
      const postInsp = sortedInsps.find((i: any) => i.jenis_pemeriksaan === 'post_trip')

      const odoStart = preInsp ? preInsp.bacaan_odometer : 0
      const odoEnd = postInsp ? postInsp.bacaan_odometer : odoStart
      const distance = Math.max(0, odoEnd - odoStart)
      totalKm += distance

      const start = req.trip_started_at ? new Date(req.trip_started_at).getTime() : 0
      const end = req.trip_completed_at ? new Date(req.trip_completed_at).getTime() : 0
      const durationHours = start && end ? parseFloat(((end - start) / 3600000).toFixed(2)) : 0

      trips.push({
        date: req.trip_completed_at ? req.trip_completed_at.split('T')[0] : '',
        driverName: req.kenderaan ? `${req.kenderaan.no_kenderaan} - ${req.kenderaan.model}` : 'Unknown Vehicle',
        destination: req.destinasi,
        purpose: req.tujuan_permohonan,
        odometerStart: odoStart,
        odometerEnd: odoEnd,
        distanceKm: distance,
        referenceNo: req.no_rujukan,
        durationHours
      })
    })

    return {
      data: {
        driver,
        trips,
        totalTrips: trips.length,
        totalKm
      },
      error: null
    }
  } catch (error: any) {
    console.error('getDriverMovementReport error:', error)
    return { data: null, error: error.message || 'Failed to compile driver movement report' }
  }
}

export const getDriverActivityReport = async (
  driverId: string,
  month: number,
  year: number
): Promise<ApiResponse<{
  driverName: string
  trips: {
    date: string
    vehicleNo: string
    vehicleModel: string
    destination: string
    durationHours: number
    referenceNo: string
  }[]
  totalTrips: number
  totalDurationHours: number
}>> => {
  // Mock name resolver
  const driverName = driverId === 'driver-1' ? 'Pemandu Ali' : 'Pemandu Abu'

  if (!isSupabaseConfigured()) {
    const reqs = getMockData<TransportRequest[]>('requests', [])
    const vehicles = getMockData<TransportVehicle[]>('vehicles', [])

    const filtered = reqs.filter(r => {
      if (r.pemandu_id !== driverId || r.status_semasa !== 'completed' || !r.trip_completed_at) return false
      const date = new Date(r.trip_completed_at)
      return date.getMonth() + 1 === month && date.getFullYear() === year
    })

    let totalHours = 0
    const trips = filtered.map(r => {
      const start = r.trip_started_at ? new Date(r.trip_started_at).getTime() : 0
      const end = r.trip_completed_at ? new Date(r.trip_completed_at).getTime() : 0
      const duration = start && end ? (end - start) / 3600000 : 0
      totalHours += duration

      const vehicle = vehicles.find(v => v.id === r.kenderaan_id)

      return {
        date: r.trip_completed_at ? r.trip_completed_at.split('T')[0] : '',
        vehicleNo: vehicle ? vehicle.no_kenderaan : 'Unknown',
        vehicleModel: vehicle ? vehicle.model : 'Unknown',
        destination: r.destinasi,
        durationHours: parseFloat(duration.toFixed(2)),
        referenceNo: r.no_rujukan
      }
    })

    return {
      data: {
        driverName,
        trips,
        totalTrips: trips.length,
        totalDurationHours: parseFloat(totalHours.toFixed(2))
      },
      error: null
    }
  }

  try {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: driverData, error: driverErr } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', driverId)
      .single()

    if (driverErr) throw driverErr

    const { data: reqs, error: reqsError } = await supabase
      .from('transport_requests')
      .select(`
        id, no_rujukan, destinasi, trip_started_at, trip_completed_at,
        kenderaan:transport_vehicles(no_kenderaan, model)
      `)
      .eq('pemandu_id', driverId)
      .eq('status_semasa', 'completed')
      .gte('trip_completed_at', startDate)
      .lte('trip_completed_at', endDate)

    if (reqsError) throw reqsError

    let totalHours = 0
    const trips = reqs.map((r: any) => {
      const start = r.trip_started_at ? new Date(r.trip_started_at).getTime() : 0
      const end = r.trip_completed_at ? new Date(r.trip_completed_at).getTime() : 0
      const duration = start && end ? (end - start) / 3600000 : 0
      totalHours += duration

      return {
        date: r.trip_completed_at ? r.trip_completed_at.split('T')[0] : '',
        vehicleNo: r.kenderaan?.no_kenderaan || 'Unknown',
        vehicleModel: r.kenderaan?.model || 'Unknown',
        destination: r.destinasi,
        durationHours: parseFloat(duration.toFixed(2)),
        referenceNo: r.no_rujukan
      }
    })

    return {
      data: {
        driverName: driverData.full_name,
        trips,
        totalTrips: trips.length,
        totalDurationHours: parseFloat(totalHours.toFixed(2))
      },
      error: null
    }
  } catch (error: any) {
    console.error('getDriverActivityReport error:', error)
    return { data: null, error: error.message || 'Failed to compile driver activity report' }
  }
}

export const getTransporterAggregateStats = async (): Promise<ApiResponse<{
  totalRequests: number
  pendingApprovals: number
  activeTrips: number
  totalVehicles: number
  totalIssuesOpen: number
  byType: { ambulance: number; sg: number; van_jenazah: number }
}>> => {
  if (!isSupabaseConfigured()) {
    const requests = getMockData<TransportRequest[]>('requests', [])
    const vehicles = getMockData<TransportVehicle[]>('vehicles', [])
    const issues = getMockData<VehicleIssueReport[]>('issues', [])

    return {
      data: {
        totalRequests: requests.length,
        pendingApprovals: requests.filter(r => r.status_semasa === 'driver_accepted').length,
        activeTrips: requests.filter(r => r.status_semasa === 'in_transit').length,
        totalVehicles: vehicles.length,
        totalIssuesOpen: issues.filter(i => i.status === 'open').length,
        byType: {
          ambulance: requests.filter(r => r.jenis_permohonan === 'ambulance').length,
          sg: requests.filter(r => r.jenis_permohonan === 'sg').length,
          van_jenazah: requests.filter(r => r.jenis_permohonan === 'van_jenazah').length
        }
      },
      error: null
    }
  }

  try {
    // Perform multiple counts in parallel
    const [
      { count: totalReqs },
      { count: pendingApps },
      { count: activeTrips },
      { count: totalVehicles },
      { count: openIssues },
      { data: byTypeData }
    ] = await Promise.all([
      supabase.from('transport_requests').select('*', { count: 'exact', head: true }),
      supabase.from('transport_requests').select('*', { count: 'exact', head: true }).eq('status_semasa', 'driver_accepted'),
      supabase.from('transport_requests').select('*', { count: 'exact', head: true }).eq('status_semasa', 'in_transit'),
      supabase.from('transport_vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('vehicle_issue_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('transport_requests').select('jenis_permohonan')
    ])

    const ambCount = byTypeData?.filter((r: any) => r.jenis_permohonan === 'ambulance').length || 0
    const sgCount = byTypeData?.filter((r: any) => r.jenis_permohonan === 'sg').length || 0
    const vanCount = byTypeData?.filter((r: any) => r.jenis_permohonan === 'van_jenazah').length || 0

    return {
      data: {
        totalRequests: totalReqs || 0,
        pendingApprovals: pendingApps || 0,
        activeTrips: activeTrips || 0,
        totalVehicles: totalVehicles || 0,
        totalIssuesOpen: openIssues || 0,
        byType: {
          ambulance: ambCount,
          sg: sgCount,
          van_jenazah: vanCount
        }
      },
      error: null
    }
  } catch (error: any) {
    console.error('getTransporterAggregateStats error:', error)
    return { data: null, error: error.message || 'Failed to fetch aggregate stats' }
  }
}

export const getUnlinkedTransportRequests = async (): Promise<ApiResponse<TransportRequest[]>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequest[]>('requests', [])
    const vehicles = getMockData<TransportVehicle[]>('vehicles', [])
    
    // Filter for ambulance requests that are active (submitted, approved, driver_accepted) and not linked to crossborder
    const unlinked = list.filter(r => 
      r.jenis_permohonan === 'ambulance' && 
      !r.linked_crossborder_id &&
      ['submitted', 'approved', 'driver_accepted'].includes(r.status_semasa)
    )

    const resolved = unlinked.map(req => ({
      ...req,
      kenderaan: vehicles.find(v => v.id === req.kenderaan_id)
    }))

    return { data: resolved, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .select(`
        *,
        pemohon:users!pemohon_id(*),
        pemandu:users!pemandu_id(*),
        pelulus:users!pelulus_id(*),
        kenderaan:transport_vehicles(*)
      `)
      .eq('jenis_permohonan', 'ambulance')
      .or('linked_crossborder_id.is.null,linked_crossborder_id.eq.""')
      .in('status_semasa', ['submitted', 'approved', 'driver_accepted'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as TransportRequest[], error: null }
  } catch (error: any) {
    console.error('getUnlinkedTransportRequests error:', error)
    return { data: null, error: error.message || 'Failed to fetch unlinked transporter requests' }
  }
}

export const getCrossborderRequests = async (): Promise<ApiResponse<TransportRequest[]>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<TransportRequest[]>('requests', [])
    const filtered = list.filter(r => r.is_crossborder === true)
    return { data: filtered, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .select(`
        *,
        pemohon:users!pemohon_id(*),
        pemandu:users!pemandu_id(*),
        pelulus:users!pelulus_id(*),
        kenderaan:transport_vehicles(*)
      `)
      .eq('is_crossborder', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as TransportRequest[], error: null }
  } catch (error: any) {
    console.error('getCrossborderRequests error:', error)
    return { data: null, error: error.message || 'Failed to fetch crossborder requests' }
  }
}

