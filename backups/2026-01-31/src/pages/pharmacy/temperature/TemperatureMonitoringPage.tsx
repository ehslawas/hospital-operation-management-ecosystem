import React, { useState, useEffect, useMemo } from 'react'
import {
    Thermometer, AlertTriangle, CheckCircle, FileText,
    Printer, Plus, Trash2, RefreshCw, Settings, X, Search, ChevronRight, ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { temperatureService } from '@/services/pharmacy/temperatureService'
import {
    TemperatureReadingWithRelations,
    TemperatureDashboardSummary,
    TemperatureLocation,
    TemperatureReading
} from '@/types/pharmacy/temperature'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useIsSessionReady } from '@/stores/authStore'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TemperatureLogReport } from './TemperatureLogReport'

export default function TemperatureMonitoringPage() {
    const { user } = useAuth()
    const isSessionReady = useIsSessionReady()
    const [readings, setReadings] = useState<TemperatureReadingWithRelations[]>([])
    const [stats, setStats] = useState<TemperatureDashboardSummary | null>(null)
    const [locations, setLocations] = useState<TemperatureLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [showLocationModal, setShowLocationModal] = useState(false)

    // Filters
    const [locationFilter, setLocationFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Form State
    const [formData, setFormData] = useState<{
        location_id: string
        location_name: string
        location_type: string
        min_limit: number
        max_limit: number
        current_temp: number
        min_reading: number
        max_reading: number
        notes: string
    }>({
        location_id: '',
        location_name: '',
        location_type: 'freezer',
        min_limit: -25,
        max_limit: -15,
        current_temp: 0,
        min_reading: 0,
        max_reading: 0,
        notes: ''
    })

    // Load data on mount and when filter changes
    useEffect(() => {
        if (!isSessionReady) return
        fetchData()
    }, [isSessionReady, locationFilter])

    const fetchData = async () => {
        setLoading(true)
        try {
            const hospitalId = user?.hospital_id
            if (!hospitalId) return

            const [readingsRes, statsRes, locationsRes] = await Promise.all([
                temperatureService.getReadings({
                    locations: locationFilter === 'all' ? [] : [locationFilter],
                    status: 'all',
                    startDate: startOfMonth(new Date()),
                    endDate: endOfMonth(new Date()),
                    tempRange: 'all'
                }, 1, 1000),
                temperatureService.getDashboardStats(hospitalId),
                temperatureService.getLocations(hospitalId)
            ])

            setReadings(readingsRes.data)
            setStats(statsRes)
            setLocations(locationsRes.data || [])
        } catch (error) {
            console.error('Fetch error', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLocationSelect = (locId: string) => {
        const loc = locations.find(l => l.id === locId)
        if (loc) {
            setFormData(prev => ({
                ...prev,
                location_id: loc.id,
                location_name: loc.name,
                location_type: loc.type,
                min_limit: loc.min_limit,
                max_limit: loc.max_limit,
                // Auto-fill defaults for convenience
                min_reading: loc.min_limit,
                max_reading: loc.max_limit,
                current_temp: parseFloat(((loc.min_limit + loc.max_limit) / 2).toFixed(1))
            }))
        } else {
            setFormData(prev => ({ ...prev, location_id: '' }))
        }
    }

    const handleAddReading = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.hospital_id || !user?.id) {
            alert('Session invalid. Please refresh.')
            return
        }
        if (!formData.location_name) {
            alert('Please select a location')
            return
        }

        if (isNaN(formData.current_temp)) {
            alert('Please enter a valid Current Temperature')
            return
        }
        if (isNaN(formData.min_reading)) {
            alert('Please enter a valid Min Reading')
            return
        }
        if (isNaN(formData.max_reading)) {
            alert('Please enter a valid Max Reading')
            return
        }

        const payload: Partial<TemperatureReading> = {
            hospital_id: user.hospital_id,
            recorded_by: user.id,
            location_type: formData.location_type,
            location_name: formData.location_name,
            min_limit: formData.min_limit,
            max_limit: formData.max_limit,
            current_temp: formData.current_temp,
            min_reading: formData.min_reading,
            max_reading: formData.max_reading,
            notes: formData.notes || '',
            recorded_at: new Date().toISOString()
        }

        console.log('Submitting payload:', payload)

        // Remove confirm dialog for speed as requested
        // if (!confirm('Are you sure you want to save this record?')) return

        const { error } = await temperatureService.addReading(payload)
        if (error) {
            alert('Failed to save reading: ' + (error as any).message)
        } else {
            setFormData(prev => ({
                ...prev,
                current_temp: 0,
                min_reading: 0,
                max_reading: 0,
                notes: ''
            }))
            fetchData()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this reading?')) return
        await temperatureService.deleteReading(id)
        fetchData()
    }

    const chartData = useMemo(() => {
        return [...readings].reverse().map(r => ({
            time: format(new Date(r.recorded_at), 'dd/MM HH:mm'),
            temp: r.current_temp,
            minRead: r.min_reading || r.current_temp, // Fallback if missing
            maxRead: r.max_reading || r.current_temp,
            location: r.location_name,
            min: r.min_limit,
            max: r.max_limit
        }))
    }, [readings])

    const filteredReadings = useMemo(() => {
        return readings.filter(r =>
            searchQuery ? r.location_name.toLowerCase().includes(searchQuery.toLowerCase()) : true
        )
    }, [readings, searchQuery])

    // Format currency mock (unused but consistent with template)


    return (
        <>
            {/* Print Report (Visible only on print) */}
            <TemperatureLogReport
                readings={readings} // Use full dataset for the report (already filtered by API)
                locationName={locationFilter === 'all' ? 'All Locations' : locationFilter}
                month={new Date()} // Current month context
                // Use selected location's limits if available, otherwise fallback to first reading or defaults
                minLimit={locations.find(l => l.name === locationFilter)?.min_limit || filteredReadings[0]?.min_limit}
                maxLimit={locations.find(l => l.name === locationFilter)?.max_limit || filteredReadings[0]?.max_limit}
            />

            <div className="min-h-screen bg-slate-50/50 print:hidden">
                <div className="p-6 space-y-6 max-w-[1600px] mx-auto relative z-10">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                <Thermometer className="w-8 h-8 text-blue-700" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-blue-700 uppercase mb-1">
                                    <span>Pharmacy Logistics</span>
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                    <span>Cold Chain</span>
                                </div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    Temperature Monitoring
                                </h1>
                                <p className="text-slate-500 mt-1">
                                    Real-time cold chain analytics & compliance tracking
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                disabled={locationFilter === 'all'}
                                className={cn(
                                    "bg-white border-slate-200 text-slate-700 shadow-sm",
                                    locationFilter === 'all'
                                        ? "opacity-50 cursor-not-allowed hover:bg-white"
                                        : "hover:bg-slate-50"
                                )}
                                title={locationFilter === 'all' ? "Please select a specific location to export report" : "Print Temperature Log"}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                {locationFilter === 'all' ? 'Select Location' : 'Export Report'}
                            </Button>
                            <Button
                                onClick={() => setShowLocationModal(true)}
                                className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                            >
                                <Settings className="w-4 h-4 mr-2" /> Configuration
                            </Button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center mb-6 pl-5">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Search records by location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-6 pr-4 py-2 bg-transparent text-sm focus:outline-none text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto p-2">
                            <select
                                className="h-9 px-4 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/10 min-w-[200px] text-slate-600 font-medium"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <option value="all">All Locations</option>
                                {locations.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                            </select>
                            <Button variant="ghost" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 h-9 w-9">
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid - Professional & Clean */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            {
                                label: "Readings Today",
                                value: stats?.total_readings_today || 0,
                                icon: FileText,
                                color: "text-emerald-600",
                                bg: "bg-emerald-50",
                                border: "border-t-emerald-500"
                            },
                            {
                                label: "Compliance Rate",
                                value: `${(stats?.compliance_rate || 0).toFixed(1)}%`,
                                icon: CheckCircle,
                                color: "text-blue-600",
                                bg: "bg-blue-50",
                                border: "border-t-blue-500"
                            },
                            {
                                label: "Active Alerts",
                                value: stats?.active_alerts || 0,
                                icon: AlertTriangle,
                                color: "text-rose-600",
                                bg: "bg-rose-50",
                                border: "border-t-rose-500"
                            },
                            {
                                label: "Locations Active",
                                value: stats?.locations_monitored || 0,
                                icon: Thermometer,
                                color: "text-violet-600",
                                bg: "bg-violet-50",
                                border: "border-t-violet-500"
                            }
                        ].map((item, idx) => (
                            <div key={idx} className={`relative bg-white rounded-xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 border-t-4 ${item.border} group hover:-translate-y-1 transition-all duration-300`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                                        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{item.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Add Reading Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 h-full">
                            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col bg-white">
                                <CardHeader className="bg-white border-b border-slate-100 py-4 px-5">
                                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        New Reading
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 flex-1 flex flex-col justify-center">
                                    <form onSubmit={handleAddReading} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Location</label>
                                            <select
                                                className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                                value={formData.location_id}
                                                onChange={(e) => handleLocationSelect(e.target.value)}
                                                required
                                            >
                                                <option value="">-- Choose Location --</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {formData.location_id && (
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${formData.location_type === 'freezer' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                                    <span className="font-semibold text-slate-700 capitalize">{formData.location_type.replace('_', ' ')}</span>
                                                </div>
                                                <span className="text-slate-500 font-mono text-xs bg-white px-2 py-1 rounded border border-slate-200">
                                                    Range: {formData.min_limit}° ~ {formData.max_limit}°
                                                </span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Min Reading</label>
                                                <Input type="number" step="0.1" value={formData.min_reading} onChange={e => setFormData({ ...formData, min_reading: parseFloat(e.target.value) })} className="bg-slate-50 h-10 font-mono text-center" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Max Reading</label>
                                                <Input type="number" step="0.1" value={formData.max_reading} onChange={e => setFormData({ ...formData, max_reading: parseFloat(e.target.value) })} className="bg-slate-50 h-10 font-mono text-center" />
                                            </div>
                                        </div>

                                        <div className="py-2">
                                            <div className="bg-slate-900 rounded-2xl p-6 text-center text-white shadow-xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/30 transition-all" />
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2">Current Temperature</label>
                                                <div className="relative inline-flex items-center justify-center">
                                                    <input
                                                        type="number" step="0.1"
                                                        className="text-5xl font-black text-center w-40 bg-transparent text-white focus:outline-none placeholder-slate-700"
                                                        value={formData.current_temp}
                                                        onChange={e => setFormData({ ...formData, current_temp: parseFloat(e.target.value) })}
                                                    />
                                                    <span className="text-2xl text-slate-400 font-light mb-auto mt-2">°C</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Remarks</label>
                                            <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-slate-50 h-10" placeholder="Optional notes..." />
                                        </div>

                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]" disabled={loading}>
                                            Save Record
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Chart Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
                            <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        Temperature Trend
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="h-8 px-2 pr-8 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 min-w-[140px] text-slate-600 font-medium cursor-pointer"
                                            value={locationFilter}
                                            onChange={(e) => setLocationFilter(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="all">All Locations</option>
                                            {locations.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                                        </select>
                                        <Badge variant="gray" className="bg-white border text-xs uppercase hidden sm:flex">
                                            {format(new Date(), 'MMMM yyyy')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="time" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                                                <YAxis unit="°C" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                                                {/* Lines */}
                                                <Line type="monotone" name="Max Reading" dataKey="maxRead" stroke="#F87171" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                <Line type="monotone" name="Current Temp" dataKey="temp" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                <Line type="monotone" name="Min Reading" dataKey="minRead" stroke="#34D399" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Table */}
                    <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-white border-b border-slate-100 py-5 px-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-base font-bold text-slate-800">Reading History</CardTitle>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Date & Time</th>
                                        <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Location</th>
                                        <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Min/Max</th>
                                        <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Current</th>
                                        <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredReadings.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                                                {format(new Date(r.recorded_at), 'dd MMM yyyy HH:mm')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">{r.location_name}</p>
                                                <p className="text-xs text-slate-400 capitalize">{r.location_type.replace('_', ' ')}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
                                                    <span>{r.min_reading}°</span>
                                                    <span className="mx-2 text-slate-300">|</span>
                                                    <span>{r.max_reading}°</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800 text-base">{r.current_temp}°</td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant={r.is_compliant ? "success" : "error"} className={cn("rounded-full px-3 py-1 font-medium border-0", r.is_compliant ? "text-emerald-700 bg-emerald-100" : "bg-rose-100 text-rose-700")}>
                                                    {r.is_compliant ? 'Compliant' : 'Alert'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="h-8 w-8 p-0 text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredReadings.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic bg-slate-50/30">
                                                No temperature readings found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* LOCATION CONFIG MODAL */}
                    {showLocationModal && (
                        <LocationManager
                            locations={locations}
                            onClose={() => setShowLocationModal(false)}
                            onUpdate={fetchData}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

function LocationManager({ locations, onClose, onUpdate }: { locations: TemperatureLocation[], onClose: () => void, onUpdate: () => void }) {
    const { user } = useAuth()
    const [newLoc, setNewLoc] = useState({ name: '', type: 'freezer', min: -25, max: -15 })

    const handleAdd = async () => {
        if (!user?.hospital_id) {
            alert('Error: You must be logged in to a hospital to perform this action.')
            return
        }
        if (!newLoc.name) {
            alert('Please enter a location name.')
            return
        }

        if (!confirm('Are you sure you want to add this new location?')) return

        try {
            const { error } = await temperatureService.addLocation({
                hospital_id: user.hospital_id,
                name: newLoc.name,
                type: newLoc.type,
                min_limit: newLoc.min,
                max_limit: newLoc.max,
                is_active: true
            })

            if (error) {
                console.error('Failed to add location:', error)
                alert(`Failed to add location: ${(error as any).message || 'Unknown error'}`)
                return
            }

            // Success
            alert(`✓ Location "${newLoc.name}" added successfully!`)
            setNewLoc({ name: '', type: 'freezer', min: -25, max: -15 })
            onUpdate()
        } catch (err) {
            console.error('Unexpected error adding location:', err)
            alert('An unexpected error occurred. Please check the console for details.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this location?')) return
        await temperatureService.deleteLocation(id)
        onUpdate()
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Manage Locations</h3>
                        <p className="text-sm text-slate-500 mt-1">Configure temperature monitoring points</p>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="rounded-full hover:bg-slate-200/50 p-2 h-9 w-9">
                        <X className="w-5 h-5 text-slate-500" />
                    </Button>
                </div>

                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-600" /> Add New Location
                    </h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Location Name</label>
                                <Input
                                    placeholder="e.g. Pharmacy Main Freezer"
                                    value={newLoc.name}
                                    onChange={e => setNewLoc({ ...newLoc, name: e.target.value })}
                                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                                <div className="relative">
                                    <select
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none cursor-pointer"
                                        value={newLoc.type}
                                        onChange={(e: any) => setNewLoc({ ...newLoc, type: e.target.value })}
                                    >
                                        <option value="freezer">Freezer</option>
                                        <option value="chiller">Chiller</option>
                                        <option value="refrigerator">Refrigerator</option>
                                        <option value="room">Room Temperature</option>
                                        <option value="cold_room">Cold Room</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Min Temp (°C)</label>
                                <Input
                                    type="number"
                                    value={newLoc.min}
                                    onChange={e => setNewLoc({ ...newLoc, min: parseFloat(e.target.value) })}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Max Temp (°C)</label>
                                <Input
                                    type="number"
                                    value={newLoc.max}
                                    onChange={e => setNewLoc({ ...newLoc, max: parseFloat(e.target.value) })}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleAdd}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 shadow-sm mt-2"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Add Location
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-xs text-slate-500 uppercase font-semibold tracking-wider">
                            <tr>
                                <th className="text-left px-6 py-3">Location Name</th>
                                <th className="text-left px-6 py-3">Type</th>
                                <th className="text-center px-6 py-3">Min Temp</th>
                                <th className="text-center px-6 py-3">Max Temp</th>
                                <th className="text-right px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {locations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                                        No locations configured yet.
                                    </td>
                                </tr>
                            ) : (
                                locations.map(loc => (
                                    <tr key={loc.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900 border-b border-slate-50/50">{loc.name}</td>
                                        <td className="px-6 py-4 capitalize text-slate-600 border-b border-slate-50/50">
                                            <Badge variant="gray" className="font-normal bg-slate-100 text-slate-600 border-slate-200">
                                                {loc.type.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-slate-600 border-b border-slate-50/50">{loc.min_limit}°</td>
                                        <td className="px-6 py-4 text-center font-mono text-slate-600 border-b border-slate-50/50">{loc.max_limit}°</td>
                                        <td className="px-6 py-4 text-right border-b border-slate-50/50">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(loc.id)}
                                                className="text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
