import { BaseEntity } from './base'
import { User } from './auth'

export interface AuditLog extends BaseEntity {
  user_id: string
  action: string
  module: string
  entity_type?: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

export interface AuditLogWithRelations extends AuditLog {
  user?: User
}
