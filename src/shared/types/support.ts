import { BaseEntity } from './base'

export type InquiryType = 'general' | 'technical' | 'access' | 'complaint'
export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed'

export interface Inquiry extends BaseEntity {
  name: string
  email: string
  subject: string
  message: string
  inquiry_type: InquiryType
  status: InquiryStatus
  assigned_to?: string
  resolved_at?: string
}

export type LoginStatus = 'success' | 'failed' | 'locked'

export interface LoginHistory extends BaseEntity {
  user_id: string
  login_time: string
  logout_time?: string
  ip_address?: string
  user_agent?: string
  status: LoginStatus
  failure_reason?: string
}

export interface SystemSetting extends BaseEntity {
  setting_key: string
  setting_value: Record<string, unknown>
  hospital_id?: string
  updated_by?: string
}
