// src/shared/types/mystaff.ts
import type { BaseEntity, ApiResponse } from './base'
import type { User } from './auth'
import type { Department, Hospital } from './organization'

export type LeaveKategori = 'biasa' | 'perubatan' | 'khas' | 'gantian' | 'lain'

export interface StaffLeaveType extends BaseEntity {
  hospital_id: string
  kod_cuti: string
  nama_cuti: string
  nama_cuti_en: string
  max_hari_setahun: number | null
  require_sijil: boolean
  require_approval: boolean
  kategori: LeaveKategori
  is_active: boolean
}

export interface StaffLeaveQuota extends BaseEntity {
  user_id: string
  hospital_id: string
  leave_type_id: string
  tahun: number
  hak_hari: number
  digunakan_hari: number
  baki_hari: number
  leave_type?: StaffLeaveType
  user?: User
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type LeaveSession = 'full' | 'am' | 'pm'

export interface StaffLeaveApplication extends BaseEntity {
  user_id: string
  hospital_id: string
  department_id: string
  leave_type_id: string
  tarikh_mula: string
  tarikh_tamat: string
  jumlah_hari: number
  sesi: LeaveSession
  sebab: string
  status: LeaveStatus
  approved_by?: string | null
  approved_at?: string | null
  catatan_pelulus?: string | null
  attachment_url?: string | null
  is_half_day: boolean
  half_day_session?: 'am' | 'pm' | null
  replacement_user_id?: string | null
  // Joins
  user?: User
  leave_type?: StaffLeaveType
  approver?: User
  replacement_user?: User
  department?: Department
}

export type MovementType =
  | 'MEETING'
  | 'COURSE'
  | 'CME'
  | 'PRESENTATION'
  | 'SITE_VISIT'
  | 'OFFICIAL_DUTY'
  | 'ANNUAL_LEAVE'
  | 'TIME_OFF'
  | 'SPECIAL_DUTY'
  | 'FIELDWORK'
  | 'HOSPITAL_REP'
  | 'OTHER'

export type MovementStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'

export interface StaffMovement extends BaseEntity {
  user_id: string
  hospital_id: string
  department_id: string
  jenis_pergerakan: MovementType
  tajuk: string
  destination: string
  tarikh_mula: string
  masa_keluar?: string | null
  tarikh_tamat: string
  masa_balik?: string | null
  tujuan: string
  status: MovementStatus
  approved_by?: string | null
  approved_at?: string | null
  catatan?: string | null
  attachment_url?: string | null
  attachment_name?: string | null
  is_recurring: boolean
  recurrence_rule?: string | null
  logged_by_user_id?: string | null
  logged_by_name?: string | null
  logged_by_role?: string | null
  // Audit tracking
  last_edited_by_name?: string | null
  last_edited_at?: string | null
  last_edit_reason?: string | null
  // Joins
  user?: User
  approver?: User
  department?: Department
  logged_by_user?: User
}

export type ReminderType = 'meeting' | 'cme' | 'course' | 'deadline' | 'submission' | 'other'
export type ReminderPriority = 'low' | 'medium' | 'high' | 'critical'

export interface StaffReminder extends BaseEntity {
  user_id: string
  hospital_id: string
  department_id?: string | null
  tajuk: string
  penerangan?: string | null
  jenis_peringatan: ReminderType
  keutamaan?: ReminderPriority
  meeting_link?: string | null
  attachment_url?: string | null
  attachment_name?: string | null
  tarikh_peringatan: string // ISO timestamp
  remind_before_minutes: number
  is_shared_dept: boolean
  is_dismissed: boolean
  is_recurring: boolean
  recurrence_rule?: string | null
  // Audit tracking
  last_edited_by_name?: string | null
  last_edited_at?: string | null
  last_edit_reason?: string | null
  user?: User
  department?: Department
}

export type AuditActionType = 'CREATE' | 'EDIT' | 'DELETE' | 'STATUS_CHANGE'
export type AuditModuleType = 'MOVEMENT' | 'REMINDER' | 'DEADLINE'

export interface StaffAuditLog {
  id: string
  module: AuditModuleType
  record_id: string
  record_title: string
  action: AuditActionType
  reason: string
  actor_id: string
  actor_name: string
  actor_role?: string
  hospital_id?: string
  department_id?: string
  created_at: string
  details?: Record<string, any>
}

export type DeadlineCategory = 'laporan' | 'anggaran' | 'penyerahan' | 'audit' | 'lain'
export type DeadlinePriority = 'low' | 'medium' | 'high' | 'critical'
export type DeadlineStatus = 'pending' | 'in_progress' | 'submitted' | 'overdue'

export interface StaffDeadline extends BaseEntity {
  created_by: string
  hospital_id: string
  department_id: string
  tajuk: string
  penerangan?: string | null
  kategori: DeadlineCategory
  tarikh_akhir: string // YYYY-MM-DD
  keutamaan: DeadlinePriority
  status: DeadlineStatus
  is_shared_dept: boolean
  attachment_url?: string | null
  creator?: User
  department?: Department
}

export interface StaffDashboardStats {
  totalStaff: number
  presentToday: number
  onLeaveToday: number
  onCourseToday: number
  onMeetingToday: number
  onMovementToday: number
  pendingLeaveApprovals: number
  pendingMovementApprovals: number
  activeDeadlinesCount: number
  upcomingRemindersCount: number
}
