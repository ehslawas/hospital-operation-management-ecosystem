import { BaseEntity } from './base'
import { Department } from './organization'
import { User } from './auth'
import { JenisDokumen, Jantina } from './mycrossborder'

export type JenisKenderaan = 'ambulance' | 'sg' | 'van_jenazah'
export type StatusKenderaan = 'active' | 'maintenance' | 'retired'
export type JenisPermohonan = 'ambulance' | 'sg' | 'van_jenazah'
export type PengiringType = 'nurse' | 'medical_officer' | 'assistant_medical_officer' | 'ppk'
export interface EscortStaff {
  job: PengiringType;
  name: string;
}
export interface MedicalOfficerReferring {
  name: string;
  department: string;
}

export interface CrossborderPatientEmbedded {
  id?: string
  urutan: number // 1, 2, or 3
  nama: string
  jantina: Jantina
  tarikh_lahir: string
  warganegara: string
  jenis_dokumen: JenisDokumen
  no_dokumen: string
  no_pengenalan?: string
}

export interface KkmEscortEmbedded {
  nama: string;
  jenis_dokumen: JenisDokumen;
  no_dokumen: string;
  jawatan: string;
}

export interface WarisEscortEmbedded {
  nama: string;
  jenis_dokumen: JenisDokumen;
  no_dokumen: string;
  hubungan: string;
}

export interface CrossborderData {
  border_control_post: string
  tempat_berlepas: string
  surat_kebenaran_ref?: string
  pengarah_nama?: string
  doktor_perujuk_nama: string
  catatan?: string
  pemandu_nama?: string
  pemandu_passport?: string
  patients: CrossborderPatientEmbedded[]
  kkm_escorts: KkmEscortEmbedded[]
  waris_escorts: WarisEscortEmbedded[]
}

export type StatusPermohonan =
  | 'draft'
  | 'submitted'
  | 'driver_accepted'
  | 'driver_rejected'
  | 'approved'
  | 'rejected'
  | 'in_transit'
  | 'completed'
  | 'cancelled'

export type JenisPemeriksaan = 'pre_trip' | 'post_trip'
export type StatusPemeriksaan = 'good' | 'issue'
export type KeputusanPemeriksaan = 'cleared' | 'rejected'
export type KeutamaanIsu = 'low' | 'medium' | 'high' | 'critical'
export type StatusIsu = 'open' | 'acknowledged' | 'resolved'

export interface TransportVehicle extends BaseEntity {
  no_kenderaan: string
  no_chasis: string
  jenis_kenderaan: JenisKenderaan
  model: string
  tarikh_tamat_cukai_jalan: string
  status: StatusKenderaan
  hospital_id: string
  foto_kenderaan?: string
}

export interface TransportRequest extends BaseEntity {
  linked_crossborder_id?: string
  is_crossborder?: boolean
  crossborder_data?: CrossborderData
  no_rujukan: string
  jenis_permohonan: JenisPermohonan
  tujuan_permohonan: string
  destinasi: string

  tarikh_masa_diperlukan: string
  tarikh_masa_sehingga?: string
  unit_pemohon: string
  nama_pemohon?: string
  pengiring?: PengiringType
  pengiring_list?: EscortStaff[]
  medical_officer_referring?: MedicalOfficerReferring
  bawa_pesakit?: boolean // For SG requests bringing patients
  pemandu_diperlukan?: boolean
  senarai_penumpang?: { name: string; department?: string }[]
  
  // Patient details (optional/conditional)
  nama_pesakit?: string
  rn_pesakit?: string
  jantina_pesakit?: string
  diagnosis_pesakit?: string
  telefon_pesakit?: string
  patient_mobility?: 'walking' | 'wheelchair' | 'stretcher'
  
  catatan_khas?: string
  oksigen_diperlukan?: boolean
  jenis_oksigen?: string
  mesin_diperlukan?: string[]
  status_semasa: StatusPermohonan
  sebab_tolak?: string
  
  pemohon_id: string
  pemandu_id?: string
  pelulus_id?: string
  kenderaan_id?: string
  
  driver_accepted_at?: string
  approved_at?: string
  trip_started_at?: string
  trip_completed_at?: string
  cancelled_at?: string
  hospital_id: string

  // Relations
  pemohon?: User
  pemandu?: User
  pelulus?: User
  kenderaan?: TransportVehicle
  department?: Department // Derived via pemohon
}

export interface VehicleInspection extends BaseEntity {
  request_id: string
  kenderaan_id: string
  pemandu_id: string
  jenis_pemeriksaan: JenisPemeriksaan
  status_tayar: StatusPemeriksaan
  foto_tayar?: string
  status_minyak_gas: StatusPemeriksaan
  foto_minyak_gas?: string
  status_minyak_hitam: StatusPemeriksaan
  foto_minyak_hitam?: string
  bacaan_odometer: number
  foto_odometer?: string
  keputusan: KeputusanPemeriksaan
  catatan?: string
  hospital_id: string

  // Relations
  request?: TransportRequest
  kenderaan?: TransportVehicle
  pemandu?: User
}

export interface VehicleIssueReport extends BaseEntity {
  kenderaan_id: string
  pemandu_id: string
  inspection_id?: string
  tajuk: string
  penerangan: string
  keutamaan: KeutamaanIsu
  status: StatusIsu
  foto_kerosakan?: string
  catatan_penyelesaian?: string
  resolved_by?: string
  resolved_at?: string
  hospital_id: string

  // Relations
  kenderaan?: TransportVehicle
  pemandu?: User
  resolver?: User
}

export interface TransportRequestLog extends BaseEntity {
  request_id: string
  tindakan: string
  status_sebelum: string
  status_selepas: string
  catatan?: string
  performed_by: string
  hospital_id: string

  // Relations
  request?: TransportRequest
  performer?: User
}
