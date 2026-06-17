import { BaseEntity } from './base'
import { User } from './auth'

export type HospitalStatus = 'active' | 'inactive'

export interface Hospital extends BaseEntity {
  hospital_code: string
  hospital_name: string
  address?: string
  state?: string
  phone?: string
  email?: string
  logo_url?: string
  status: HospitalStatus
}

export type DepartmentStatus = 'active' | 'inactive'

export interface Department extends BaseEntity {
  hospital_id: string
  department_code: string
  department_name: string
  description?: string
  head_of_department_id?: string
  status: DepartmentStatus
}

export interface DepartmentWithRelations extends Department {
  hospital?: Hospital
  head_of_department?: User
}

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export interface AccessRequest extends BaseEntity {
  full_name: string
  email: string
  ic_number: string
  phone_number: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  address?: string
  profile_photo_url?: string
  hospital_id: string
  department_id: string
  jawatan: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  emergency_contact_address?: string
  password_hash?: string
  password_encrypted?: string
  status: AccessRequestStatus
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
}

export interface AccessRequestWithRelations extends AccessRequest {
  hospital?: Hospital
  department?: Department
  reviewed_by_user?: User
}
