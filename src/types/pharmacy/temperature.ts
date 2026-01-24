import { BaseEntity, User, Hospital } from '@/types'

// Location Types
export type TemperatureLocationType =
    | 'freezer' | 'chiller' | 'refrigerator' | 'room' | 'cold_room'

export interface TemperatureLocation extends BaseEntity {
    hospital_id: string
    name: string
    type: TemperatureLocationType
    min_limit: number
    max_limit: number
    is_active: boolean
}

// Temperature Data Interface
export interface TemperatureReading extends BaseEntity {
    hospital_id: string
    // Linked Location ID (Optional if we keep loose coupling, but better to link)
    // For now we keep location_name/type snapshots, but we can add location_id if needed.
    // The migration didn't add location_id FK to readings, so we stick to snapshots.
    location_type: string
    location_name: string

    // Limits (Snapshot)
    min_limit: number
    max_limit: number

    // Readings
    current_temp: number
    min_reading?: number
    max_reading?: number

    is_compliant: boolean
    notes?: string
    recorded_at: string
    recorded_by: string
}

// Relation Interface
export interface TemperatureReadingWithRelations extends TemperatureReading {
    hospital?: Hospital
    recorded_by_user?: User
}

// Summary for Dashboard
export interface TemperatureDashboardSummary {
    total_readings_today: number
    locations_monitored: number
    compliance_rate: number
    active_alerts: number
    readings_by_location: {
        location_name: string
        avg_temp: number
        last_reading: number
        status: 'compliant' | 'non_compliant'
    }[]
}

// Chart Data Point
export interface TemperatureChartData {
    time: string
    [key: string]: number | string // location_name: value
}

// Filter Props
export interface TemperatureFilters {
    startDate?: Date
    endDate?: Date
    locations: string[]
    status: 'all' | 'compliant' | 'non_compliant'
    tempRange: 'all' | 'frozen' | 'refrigerated' | 'room' | 'warning'
}
