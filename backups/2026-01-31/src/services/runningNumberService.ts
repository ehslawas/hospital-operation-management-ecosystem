import { supabase } from '@/services/supabase'
import { DepartmentRunningNumber } from '@/types'

export const runningNumberService = {
    /**
     * Get all running numbers for a department
     */
    getByDepartment: async (departmentId: string): Promise<DepartmentRunningNumber[]> => {
        const { data, error } = await supabase
            .from('department_running_numbers')
            .select('*')
            .eq('department_id', departmentId)
            .order('type', { ascending: true })

        if (error) throw error
        return data || []
    },

    /**
     * Create or Update a running number configuration
     */
    upsert: async (config: Partial<DepartmentRunningNumber>): Promise<DepartmentRunningNumber> => {
        const { data, error } = await supabase
            .from('department_running_numbers')
            .upsert({
                ...config,
                year: config.year || new Date().getFullYear(),
                last_updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Generate and reserve the next reference number
     * e.g., "HLWS 600-15/1/2(01)"
     */
    generateNextRef: async (departmentId: string, type: 'memo' | 'letter'): Promise<string> => {
        const currentYear = new Date().getFullYear()

        // 1. Fetch current config
        const { data: config, error } = await supabase
            .from('department_running_numbers')
            .select('*')
            .eq('department_id', departmentId)
            .eq('type', type)
            .eq('year', currentYear)
            .maybeSingle()

        if (error) {
            console.error('Error fetching running number config', error)
            return `DRAFT-${Date.now()}` // Fallback
        }

        if (!config) {
            // No config found, return a placeholder or throw
            // For now, let's return a safe fallback that indicates setup is needed
            return `REF-${currentYear}-01`
        }

        // 2. Increment
        const nextSequence = (config.current_sequence || 0) + 1

        // 3. Update database (Optimistic locking or stored proc would be better, but simple update for now)
        const { error: updateError } = await supabase
            .from('department_running_numbers')
            .update({ current_sequence: nextSequence, last_updated_at: new Date().toISOString() })
            .eq('id', config.id)

        if (updateError) {
            console.error('Failed to increment sequence', updateError)
            return `ERR-${Date.now()}`
        }

        // 4. Format
        // Format: "PREFIX(SEQ)"
        // e.g. "HLWS 600-15/1/2(1)"
        return `${config.prefix}(${nextSequence})`
    }
}
