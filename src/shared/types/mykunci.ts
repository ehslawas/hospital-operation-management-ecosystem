import { BaseEntity } from './base'
import { Department } from './organization'
import { User } from './auth'

export type KunciJenis = 'room' | 'cabinet' | 'cabinet_dda' | 'vehicle' | 'other'
export type KunciKawalan = 'normal' | 'high'
export type KunciStatus = 'available' | 'borrowed' | 'damaged' | 'lost'
export type SampulStatus = 'sealed' | 'broken' | 'not_applicable'

export type KeadaanKunci = 'good' | 'damaged'
export type KeadaanMangga = 'good' | 'damaged' | 'loose'
export type AuditFizikal = 'present' | 'missing' | 'damaged'

export interface KunciDaftar extends BaseEntity {
  kod_kunci: string
  nama_kunci: string
  department_id: string
  lokasi_fizikal: string
  jenis_kunci: KunciJenis
  tahap_kawalan: KunciKawalan
  status: KunciStatus
  nombor_peti?: string
  status_sampul: SampulStatus
  penjaga_id?: string
  hospital_id: string
  created_by?: string
  
  // Relations
  department?: Department
  penjaga?: User
  creator?: User
}

export interface KunciLog extends BaseEntity {
  kunci_id: string
  peminjam_id: string
  pegawai_penyerah_id: string
  pegawai_saksi_id?: string
  tarikh_masa_ambil: string
  jangka_masa_pulang: string
  tujuan: string
  tarikh_masa_pulang?: string
  pegawai_penerima_id?: string
  keadaan_kunci?: KeadaanKunci
  keadaan_mangga?: KeadaanMangga
  catatan_penggunaan?: string
  duration_seconds?: number
  is_overdue: boolean
  hospital_id: string
  
  // Relations
  kunci?: KunciDaftar
  peminjam?: User
  pegawai_penyerah?: User
  pegawai_saksi?: User
  pegawai_penerima?: User
}

export interface KunciAuditBulanan {
  id: string
  kunci_id: string
  tarikh_audit: string
  auditor_id: string
  status_fizikal: AuditFizikal
  sampul_bermeterai_utuh: boolean
  catatan?: string
  hospital_id: string
  created_at: string
  
  // Relations
  kunci?: KunciDaftar
  auditor?: User
}
