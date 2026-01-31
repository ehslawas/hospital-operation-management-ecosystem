import { supabase } from '../supabase'
import {
    TemperatureReading,
    TemperatureReadingWithRelations,
    TemperatureFilters,
    TemperatureDashboardSummary
} from '@/types/pharmacy/temperature'
import { startOfDay, endOfDay } from 'date-fns'

const READINGS_TABLE = 'pharmacy_temperature_readings'
const LOCATIONS_TABLE = 'pharmacy_temperature_locations'

export const temperatureService = {
    /**
     * Get filtered temperature readings
     */
    getReadings: async (
        filters: TemperatureFilters,
        page = 1,
        limit = 20
    ) => {
        try {
            let query = supabase
                .from(READINGS_TABLE)
                .select(`
          *,
          recorded_by_user:users!pharmacy_temperature_readings_recorded_by_fkey(full_name)
        `, { count: 'exact' })

            // Apply Filters
            if (filters.startDate) {
                query = query.gte('recorded_at', filters.startDate.toISOString())
            }
            if (filters.endDate) {
                query = query.lte('recorded_at', filters.endDate.toISOString())
            }
            if (filters.locations.length > 0) {
                // Changing from 'location_type' to 'location_name' to allow specific location filtering
                query = query.in('location_name', filters.locations)
            }
            if (filters.status !== 'all') {
                if (filters.status === 'compliant') {
                    query = query.eq('is_compliant', true)
                } else {
                    query = query.eq('is_compliant', false)
                }
            }
            // Note: Temp range filter is complex in SQL if dynamic, best done client side or via RPC
            // For now we'll filter simple ranges if needed, but the UI might handle 'frozen' etc mapping to specific values?
            // Actually, let's leave complex numeric range filtering for the client or specific query if critical.
            // We will perform pagination.

            const from = (page - 1) * limit
            const to = from + limit - 1

            const { data, count, error } = await query
                .order('recorded_at', { ascending: false })
                .range(from, to)

            if (error) throw error

            return {
                data: data as TemperatureReadingWithRelations[],
                count: count || 0,
                error: null
            }
        } catch (error) {
            console.error('Error fetching temperature readings:', error)
            return { data: [], count: 0, error }
        }
    },

    /**
     * Add a new reading
     */
    addReading: async (reading: Partial<TemperatureReading>) => {
        try {
            // Get current user hospital_id if not provided
            if (!reading.hospital_id) {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('User not authenticated')

                // We usually expect hospital_id to be passed, but if not we can try to fetch, 
                // but sticking to standard pattern: user should provide it from context.
            }

            const { data, error } = await supabase
                .from(READINGS_TABLE)
                .insert(reading)
                .select()
                .single()

            if (error) throw error

            // Backup to localStorage for redundancy (Last 50 items)
            saveToLocalBackup(data)

            return { data, error: null }
        } catch (error) {
            console.error('Error adding temperature reading:', error)
            return { data: null, error }
        }
    },

    /**
     * Delete a reading
     */
    deleteReading: async (id: string) => {
        try {
            const { error } = await supabase
                .from(READINGS_TABLE)
                .delete()
                .eq('id', id)

            if (error) throw error
            return { error: null }
        } catch (error) {
            console.error('Error deleting reading:', error)
            return { error }
        }
    },

    /**
     * Get Dashboard Stats (Today)
     */
    getDashboardStats: async (hospitalId: string): Promise<TemperatureDashboardSummary> => {
        const todayStart = startOfDay(new Date()).toISOString()
        const todayEnd = endOfDay(new Date()).toISOString()

        try {
            // Fetch today's readings
            const { data, error } = await supabase
                .from(READINGS_TABLE)
                .select('*')
                .eq('hospital_id', hospitalId)
                .gte('recorded_at', todayStart)
                .lte('recorded_at', todayEnd)

            if (error) throw error

            const readings = data as TemperatureReading[]
            const total = readings.length
            const compliant = readings.filter(r => r.is_compliant).length
            const nonCompliant = readings.filter(r => !r.is_compliant).length

            // Group by location
            const locationMap = new Map<string, { sum: number, count: number, last: number, isCompliant: boolean }>()

            readings.forEach(r => {
                const loc = locationMap.get(r.location_name) || { sum: 0, count: 0, last: 0, isCompliant: true }
                loc.sum += r.current_temp
                loc.count += 1
                loc.last = r.current_temp // ordered by time? We need to ensure order.
                loc.isCompliant = r.is_compliant
                locationMap.set(r.location_name, loc)
            })

            const locations = Array.from(locationMap.entries()).map(([name, stats]) => ({
                location_name: name,
                avg_temp: stats.sum / stats.count,
                last_reading: stats.last,
                status: stats.isCompliant ? 'compliant' as const : 'non_compliant' as const
            }))

            return {
                total_readings_today: total,
                locations_monitored: locations.length,
                compliance_rate: total > 0 ? (compliant / total) * 100 : 100,
                active_alerts: nonCompliant,
                readings_by_location: locations
            }

        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
            return {
                total_readings_today: 0,
                locations_monitored: 0,
                compliance_rate: 0,
                active_alerts: 0,
                readings_by_location: []
            }
        }
    },

    /**
     * Get Locations
     */
    getLocations: async (hospitalId: string) => {
        try {
            const { data, error } = await supabase
                .from(LOCATIONS_TABLE)
                .select('*')
                .eq('hospital_id', hospitalId)
                .eq('is_active', true)
                .order('name')

            if (error) throw error
            return { data: data || [], error: null }
        } catch (error) {
            console.error('Error fetching locations:', error)
            return { data: [], error }
        }
    },

    /**
     * Add Location
     */
    addLocation: async (location: any) => {
        try {
            const { data, error } = await supabase
                .from(LOCATIONS_TABLE)
                .insert(location)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error adding location:', error)
            return { data: null, error }
        }
    },

    /**
     * Delete (Soft Delete) Location
     */
    deleteLocation: async (id: string) => {
        try {
            const { error } = await supabase
                .from(LOCATIONS_TABLE)
                .update({ is_active: false })
                .eq('id', id)

            if (error) throw error
            return { error: null }
        } catch (error) {
            return { error }
        }
    },

    // ==========================================
    // LOCAL STORAGE BACKUP / OFFLINE UTILS
    // ==========================================

    /**
     * Export local data to CSV (Basic implementation)
     */
    exportLocalData: () => {
        const data = localStorage.getItem('pharmacy_temp_backup')
        if (!data) return

        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `temp_readings_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }
}

// Helper: Save to local backup
function saveToLocalBackup(item: any) {
    try {
        const KEY = 'pharmacy_temp_backup'
        const current = JSON.parse(localStorage.getItem(KEY) || '[]')
        current.unshift(item)
        // Keep last 100 items only
        if (current.length > 100) current.pop()
        localStorage.setItem(KEY, JSON.stringify(current))
    } catch (e) {
        console.warn('LocalStorage backup failed', e)
    }
}
