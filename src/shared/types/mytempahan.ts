// src/shared/types/mytempahan.ts
// Domain Types & Interfaces for MyTempahan (Hospital Operation Management Ecosystem)

import { BaseEntity } from './base'
import { Department } from './organization'
import { User } from './auth'

export type RoomCategory = 
  | 'meeting_room'       // Bilik Mesyuarat
  | 'conference_hall'    // Dewan Persidangan / Dewan Utama
  | 'training_room'      // Bilik Latihan / Bilik Seminar
  | 'auditorium'         // Auditorium / Dewan Kuliah Pakar
  | 'discussion_room'    // Bilik Perbincangan Klinikal
  | 'command_center'     // Bilik Gerakan Bencana / Krisis
  | 'computer_lab'       // Makmal Komputer & Latihan IT

export type RoomStatus = 'available' | 'maintenance' | 'occupied' | 'inactive'

export type BookingStatus = 
  | 'pending'            // Menunggu Kelulusan
  | 'approved'           // Diluluskan
  | 'rejected'           // Ditolak
  | 'in_use'             // Sedang Digunakan
  | 'completed'          // Selesai
  | 'cancelled'          // Dibatalkan
  | 'expired'            // Luput

export type BookingPriority = 'normal' | 'urgent' | 'vvip_event'

export type RoomAmenity = 
  | 'projector'
  | 'video_conferencing' // Zoom / MS Teams / Webex hardware
  | 'pa_sound_system'
  | 'smart_tv'
  | 'whiteboard'
  | 'wifi_kkm'
  | 'aircond'
  | 'catering_space'
  | 'recording_facility'
  | 'wireless_mic'
  | 'podium'
  | 'backup_generator'
  | 'document_camera'
  | 'vip_lounge'
  | 'flipchart'

export type RoomLayoutType = 
  | 'theatre'            // Teater / Susunan Baris
  | 'classroom'          // Bilik Darjah / Meja & Kerusi
  | 'u_shape'            // Bentuk 'U'
  | 'boardroom'          // Meja Mesyuarat Utama
  | 'banquet'            // Jamuan / Meja Bulat
  | 'hollow_square'      // Segi Empat Tepat Terbuka
  | 'round_table'        // Meja Bulat Diskusi
  | 'cluster'            // Kumpulan / Island

export interface OperatingHours {
  start: string          // HH:mm (e.g. "07:30")
  end: string            // HH:mm (e.g. "22:00")
  is24Hours?: boolean    // For Emergency Command Centers / Bilik Gerakan
  operatingDays: number[]// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface RoomLayoutConfig {
  layout: RoomLayoutType
  capacity: number
  imageUrl?: string
}

export interface FacilityPIC {
  name: string
  phone: string
  email: string
  jawatan: string
  department: string
}

export interface Room extends BaseEntity {
  room_code: string              // e.g. "BL-AR3-BMU01"
  name: string                   // e.g. "Bilik Mesyuarat Utama Kenyalang"
  category: RoomCategory
  capacity: number
  location: string               // e.g. "Aras 3, Blok Pentadbiran Hospital Lawas"
  floor_level: string            // "Aras G", "Aras 1", "Aras 2", "Aras 3"
  building_block: string         // "Blok Pentadbiran", "Blok Klinikal", "Blok Akademik"
  status: RoomStatus
  amenities: RoomAmenity[]
  layouts: RoomLayoutConfig[]
  operating_hours: OperatingHours
  min_notice_hours: number       // e.g. 2 (minimum 2 hours in advance)
  max_advance_days: number       // e.g. 180 (max 6 months in advance)
  setup_buffer_minutes: number   // Setup turnaround buffer (15 - 30 min)
  cleanup_buffer_minutes: number // Cleaning turnaround buffer (15 - 45 min)
  requires_approval: boolean     // Needs admin/PIC approval
  pic?: FacilityPIC
  pic_user_id?: string           // Pegawai Bertanggungjawab (Room Admin)
  image_url?: string
  color_code?: string            // Hex color for calendar display
  hospital_id: string
  house_rules?: string[]
  parent_room_id?: string        // For partitionable halls
  child_room_ids?: string[]
  is_active: boolean
  
  // Virtual / Populated Relations
  pic_user?: User
}

export interface TempahanMakananDetails {
  diperlukan: boolean
  jenis_hidangan?: 'sarapan' | 'makan_tengahari' | 'minum_petang' | 'makan_malam' | 'kudapan'
  pembekal_makanan?: string       // Nama katering hospital / luar
  anggaran_pax?: number
  lokasi_hidang?: string          // e.g. "Foyer Dewan Aras Bawah"
  catatan_dietary?: string        // e.g. "Vegetarian 2 pax, Halal Sahaja"
}

export interface TetamuVipDetails {
  ada_vip: boolean
  senarai_vip?: string[]          // e.g. ["YB Pengarah Kesihatan Negeri", "Pengarah Hospital"]
  memerlukan_holding_room?: boolean
  holding_room_id?: string
  susunan_protokol_khas?: string
}

export interface PeralatanTambahanRequest {
  equipment_name: string
  quantity: number
  catatan?: string
}

export interface Booking extends BaseEntity {
  booking_number: string         // e.g. "TMP-2026-00042"
  room_id: string
  user_id: string
  pemohon_name: string
  pemohon_jawatan: string
  pemohon_department: string
  pemohon_email: string
  pemohon_phone: string
  department_id?: string
  
  // Event Details
  purpose: string                // e.g. "Mesyuarat Jawatankuasa Kawalan Infeksi Bil. 3/2026"
  event_type: string             // "Mesyuarat Rasmi", "Kursus / Latihan", "CME / CPD Klinikal", "Taklimat / Briefing", "Lawatan VIP", "Audit Klinikal"
  date: string                   // YYYY-MM-DD
  end_date?: string              // YYYY-MM-DD (for multi-day events)
  start_time: string             // HH:mm (e.g. "09:00")
  end_time: string               // HH:mm (e.g. "11:30")
  duration_hours: number
  attendees_count: number
  layout_type: RoomLayoutType
  
  // Logistics & Requirements
  requested_amenities: RoomAmenity[]
  peralatan_tambahan?: PeralatanTambahanRequest[]
  tempahan_makanan?: TempahanMakananDetails
  tetamu_vip?: TetamuVipDetails
  special_requirements?: string  // e.g. "Perlu susun atur VVIP dan mikrofon tanpa wayar tambahan"
  
  // Recurrence
  corak_pengulangan?: 'none' | 'daily' | 'weekly' | 'custom_dates'
  parent_recurrence_id?: string

  // Status & Approvals
  status: BookingStatus
  priority: BookingPriority
  rejection_reason?: string
  cancellation_reason?: string
  approved_by?: string
  approved_by_name?: string
  approved_at?: string
  catatan_pelulus?: string
  
  // Check-In
  check_in_at?: string
  check_out_at?: string
  checkin_pin?: string
  checkin_qr_payload?: string
  hospital_id: string

  // Virtual / Populated Relations
  room?: Room
  user?: User
  department?: Department
  approver?: User
}

export interface BookingFilter {
  roomId?: string
  departmentId?: string
  userId?: string
  status?: BookingStatus | 'all'
  category?: RoomCategory | 'all'
  startDate?: string             // YYYY-MM-DD
  endDate?: string               // YYYY-MM-DD
  search?: string
  priority?: BookingPriority | 'all'
}

export interface RoomAvailabilityResult {
  isAvailable: boolean
  conflictingBookings: Booking[]
  reason?: string
  isBufferConflict?: boolean
  nextAvailableSlot?: {
    start: string
    end: string
  }
}

export interface BookingStats {
  totalBookings: number
  pendingApprovals: number
  approvedBookings: number
  inUseToday: number
  completedBookings: number
  cancelledBookings: number
  averageUtilizationRate: number // Percentage 0 - 100%
  busiestRoomName: string
  busiestRoomUtilization: number
  totalHoursBooked: number
  departmentUtilization: Array<{
    departmentName: string
    bookingCount: number
    hoursBooked: number
  }>
  monthlyTrends: Array<{
    month: string
    bookings: number
    hours: number
  }>
}
