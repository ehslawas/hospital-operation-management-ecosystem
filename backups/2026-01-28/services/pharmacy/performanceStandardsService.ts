/**
 * Performance Standards Service
 * 
 * Handles fetching and managing the 21 LAMPIRAN 9 performance standards
 */

import { supabase } from '@/lib/supabase'
import type { PerformanceStandard } from '@/types/pharmacy/procurementNew'

const TABLE_NAME = 'penalty_performance_standards'

export const performanceStandardsService = {
    /**
     * Get all active performance standards
     */
    async getAll(hospitalId?: string): Promise<PerformanceStandard[]> {
        let query = supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        // Include global (null hospital_id) and hospital-specific standards
        if (hospitalId) {
            query = query.or(`hospital_id.is.null,hospital_id.eq.${hospitalId}`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching performance standards:', error)
            throw error
        }

        return data || []
    },

    /**
     * Get a single performance standard by ID
     */
    async getById(id: string): Promise<PerformanceStandard | null> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null // Not found
            console.error('Error fetching performance standard:', error)
            throw error
        }

        return data
    },

    /**
     * Get multiple performance standards by IDs
     */
    async getByIds(ids: string[]): Promise<PerformanceStandard[]> {
        if (!ids.length) return []

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .in('id', ids)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Error fetching performance standards by IDs:', error)
            throw error
        }

        return data || []
    },

    /**
     * Get performance standards by codes (e.g., ['PS01', 'PS05'])
     */
    async getByCodes(codes: string[]): Promise<PerformanceStandard[]> {
        if (!codes.length) return []

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .in('code', codes)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Error fetching performance standards by codes:', error)
            throw error
        }

        return data || []
    },

    /**
     * Calculate penalty based on violated standards
     */
    calculatePenalty(
        violatedStandards: PerformanceStandard[],
        failedProductValue: number,
        daysLate: number
    ): { breakdown: { standard: PerformanceStandard; amount: number }[]; total: number } {
        const breakdown = violatedStandards.map(standard => {
            let amount = 0

            switch (standard.penalty_type) {
                case 'percentage':
                    // Formula: rate × failed value × days late
                    amount = (standard.penalty_rate || 0.015) * failedProductValue * daysLate
                    break
                case 'fixed':
                    // Fixed amount per incident
                    amount = standard.fixed_amount || 0
                    break
                case 'per_day':
                    // Amount per day late
                    amount = (standard.fixed_amount || 0) * daysLate
                    break
                case 'per_incident':
                    // Fixed amount per incident (similar to fixed)
                    amount = standard.fixed_amount || 0
                    break
                case 'custom':
                    // Custom calculation - requires external handling
                    amount = 0
                    break
            }

            return { standard, amount }
        })

        const total = breakdown.reduce((sum, item) => sum + item.amount, 0)

        return { breakdown, total }
    }
}

export default performanceStandardsService
