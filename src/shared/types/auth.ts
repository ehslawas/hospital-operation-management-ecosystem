import { BaseEntity } from './base'
import { Department } from './organization'
import { Hospital } from './organization'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type Gender = 'male' | 'female'

export interface User extends BaseEntity {
  email: string
  employee_id: string
  full_name: string
  ic_number: string
  phone_number?: string
  profile_photo_url?: string
  date_of_birth?: string
  gender?: Gender
  address?: string
  role_id: string
  department_id: string
  hospital_id: string
  jawatan: string
  status: UserStatus
  failed_login_attempts: number
  last_failed_login?: string
  account_locked_until?: string
  last_login?: string
  created_by?: string
}

export interface UserWithRelations extends User {
  role?: Role
  department?: Department
  hospital?: Hospital
  emergency_contacts?: EmergencyContact[]
}

export interface EmergencyContact extends BaseEntity {
  user_id: string
  contact_name: string
  relationship: string
  phone_primary: string
  phone_secondary?: string
  address?: string
}

export interface Role extends BaseEntity {
  role_name: string
  role_code: string
  description?: string
  is_system_role: boolean
  hospital_id?: string
}

export interface Permission extends BaseEntity {
  permission_code: string
  permission_name: string
  module: string
  feature?: string
  description?: string
}

export interface RolePermission extends BaseEntity {
  role_id: string
  permission_id: string
  granted_by: string
  granted_at: string
}
