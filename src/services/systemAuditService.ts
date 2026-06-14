import { supabase } from './supabase'
import type { SystemAdminAuditLog } from '@/types/systemAdmin.types'
import type { PaginatedResponse } from '@/types'

const TABLE_NAME = 'system_admin_audit_logs'

export const systemAuditService = {
    /**
     * Log an action performed by System Admin
     */
    async logAction(
        action: string,
        details: {
            actor_id: string
            actor_role?: string
            target_hospital_id?: string
            entity_type?: string
            entity_id?: string
            old_values?: any
            new_values?: any
        }
    ): Promise<void> {
        try {
            const { error } = await supabase.from(TABLE_NAME).insert({
                action,
                actor_id: details.actor_id,
                actor_role: details.actor_role || 'system_admin',
                target_hospital_id: details.target_hospital_id,
                entity_type: details.entity_type,
                entity_id: details.entity_id,
                old_values: details.old_values,
                new_values: details.new_values,
            })

            if (error) {
                console.error('[SystemAudit] Failed to log action:', error)
            }
        } catch (err) {
            console.error('[SystemAudit] Exception logging action:', err)
        }
    },

    /**
     * Get paginated audit logs for System Admin
     */
    async getAuditLogs(
        page = 1,
        pageSize = 20,
        filters?: {
            action?: string
            target_hospital_id?: string
            startDate?: string
            endDate?: string
            sortBy?: 'time' | 'hospital'
        }
    ): Promise<PaginatedResponse<SystemAdminAuditLog>> {
        try {
            let query = supabase
                .from(TABLE_NAME)
                .select(`
          *,
          actor:users!actor_id(full_name, email),
          hospital:hospitals!target_hospital_id(hospital_name)
        `, { count: 'exact' })

            // Default sort: Hospital -> Time
            if (filters?.sortBy === 'hospital') {
                // Supabase doesn't easily support sorting by joined column directly in one go without flattened view, 
                // but we can try ordering by target_hospital_id then created_at
                query = query.order('target_hospital_id', { ascending: true })
                    .order('created_at', { ascending: false })
            } else {
                query = query.order('created_at', { ascending: false })
            }

            if (filters?.action) {
                query = query.ilike('action', `%${filters.action}%`)
            }
            if (filters?.target_hospital_id) {
                query = query.eq('target_hospital_id', filters.target_hospital_id)
            }
            if (filters?.startDate) {
                query = query.gte('created_at', filters.startDate)
            }
            if (filters?.endDate) {
                query = query.lte('created_at', filters.endDate)
            }

            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            query = query.range(from, to)

            const { data, error, count } = await query

            if (error) throw error

            return {
                data: (data || []) as SystemAdminAuditLog[],
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize),
            }
        } catch (error) {
            console.error('[SystemAudit] Error fetching logs:', error)
            return {
                data: [],
                total: 0,
                page,
                pageSize,
                totalPages: 0,
            }
        }
    }
}
