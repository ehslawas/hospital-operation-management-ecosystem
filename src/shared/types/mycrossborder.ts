import { BaseEntity } from './base'
import { User } from './auth'

export type CrossborderStatus = 'draft' | 'submitted' | 'approved' | 'completed' | 'cancelled'
export type CrossborderJenisKenderaan = 'ambulance' | 'government_vehicle'
export type JenisDokumen = 'PASSPORT' | 'IC' | 'OTHERS'
export type JenisPengiring = 'patient_escort' | 'medical_escort'
export type Jantina = 'Lelaki' | 'Perempuan'

export interface CrossborderTransfer extends BaseEntity {
  linked_transport_request_id?: string
  no_rujukan: string
  hospital_id: string
  referring_hospital: string
  destination_hospital: string
  tarikh_perjalanan: string
  masa_berlepas: string
  tempat_berlepas: string
  status: CrossborderStatus
  
  // Vehicle Details
  jenis_kenderaan: CrossborderJenisKenderaan
  no_pendaftaran: string
  peralatan_lain?: string
  pemandu_nama?: string
  pemandu_passport?: string
  pemandu_passport_expiry?: string
  
  // Referring Doctor
  doktor_perujuk_nama: string
  doktor_perujuk_id?: string
  
  // Approval Details
  approved_by?: string
  approved_at?: string
  pengarah_nama?: string
  
  // Border Control
  border_control_post: string
  surat_kebenaran_ref?: string
  
  // Notes / Control
  catatan?: string
  created_by?: string

  // Relations (optional, populated by joins)
  creator?: User
  approver?: User
  doktor_perujuk?: User
  patients?: CrossborderPatient[]
  escorts?: CrossborderEscort[]
}

export interface CrossborderPatient extends BaseEntity {
  transfer_id: string
  urutan: number // 1, 2, or 3
  nama: string
  jantina: Jantina
  tarikh_lahir: string
  warganegara: string
  jenis_dokumen: JenisDokumen
  no_dokumen: string
  no_pengenalan?: string
  passport_expiry?: string
  hospital_id: string
}

export interface CrossborderEscort extends BaseEntity {
  transfer_id: string
  jenis_pengiring: JenisPengiring
  patient_urutan?: number // For waris: links to patient.urutan
  nama: string
  jenis_dokumen: JenisDokumen
  no_dokumen: string
  jawatan?: string // For KKM escort: nurse, MO, AMO, PPK
  hubungan?: string
  passport_expiry?: string
  hospital_id: string
}

export interface CreateCrossborderPayload {
  transfer: Omit<CrossborderTransfer, 'id' | 'created_at' | 'updated_at' | 'no_rujukan' | 'status' | 'hospital_id' | 'created_by'>
  patients: Omit<CrossborderPatient, 'id' | 'created_at' | 'updated_at' | 'transfer_id' | 'hospital_id'>[]
  escorts: Omit<CrossborderEscort, 'id' | 'created_at' | 'transfer_id' | 'hospital_id'>[]
}


