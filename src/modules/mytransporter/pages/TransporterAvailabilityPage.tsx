// src/modules/mytransporter/pages/TransporterAvailabilityPage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar as CalendarIcon, 
  Car, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  CheckCircle2, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle
} from 'lucide-react'
import { getVehicles, getRequests } from '../services/transporterService'
import type { TransportVehicle, TransportRequest } from '@/shared/types/mytransporter'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { useToast } from '@/stores/toastStore'

const MALAY_MONTH_NAMES = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
]

const WEEKDAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']

const TransporterAvailabilityPage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()) // 0-11
  const [selectedDate, setSelectedDate] = useState<{ day: number; month: number; year: number }>(() => {
    return { day: today.getDate(), month: today.getMonth(), year: today.getFullYear() }
  })
  
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([])
  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [vehiclesRes, requestsRes] = await Promise.all([
          getVehicles(),
          getRequests()
        ])
        
        if (vehiclesRes.data) {
          setVehicles(vehiclesRes.data.filter(v => v.jenis_kenderaan === 'sg' && v.status === 'active'))
        }
        if (requestsRes.data) {
          const activeStatuses = ['submitted', 'driver_accepted', 'approved', 'in_transit', 'completed']
          setRequests(requestsRes.data.filter(r => r.jenis_permohonan === 'sg' && activeStatuses.includes(r.status_semasa)))
        }
      } catch (err: any) {
        toast.error('Gagal Memuatkan Data', err.message || 'Sila cuba lagi.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Helper to generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1)
    const days = []
    const firstDayIndex = date.getDay()
    
    // Padding previous month
    const prevMonthDate = new Date(year, month, 0)
    const prevMonthDaysCount = prevMonthDate.getDate()
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDaysCount - i,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      })
    }
    
    // Current month days
    const currentMonthDaysCount = new Date(year, month + 1, 0).getDate()
    for (let i = 1; i <= currentMonthDaysCount; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true
      })
    }
    
    // Padding next month
    const remainingCells = 42 - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Get bookings for a specific grid day cell
  const getBookingsForDate = (day: number, month: number, year: number) => {
    const targetStart = new Date(year, month, day, 0, 0, 0, 0)
    const targetEnd = new Date(year, month, day, 23, 59, 59, 999)

    return requests.filter(r => {
      if (selectedVehicleFilter !== 'all' && r.kenderaan_id !== selectedVehicleFilter) return false
      
      const start = new Date(r.tarikh_masa_diperlukan)
      const end = r.tarikh_masa_sehingga 
        ? new Date(r.tarikh_masa_sehingga) 
        : new Date(start.getTime() + 2 * 3600 * 1000)

      return start <= targetEnd && end >= targetStart
    })
  }

  const formatTimeRange = (startStr: string, endStr?: string) => {
    const start = new Date(startStr)
    const startTime = start.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
    
    if (endStr) {
      const end = new Date(endStr)
      const endTime = end.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
      return `${startTime} - ${endTime}`
    }
    
    const end = new Date(start.getTime() + 2 * 3600 * 1000)
    const endTime = end.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${startTime} - ${endTime}`
  }

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150'
      case 'submitted':
        return 'bg-amber-50 text-amber-700 border-amber-150'
      case 'driver_accepted':
        return 'bg-blue-50 text-blue-700 border-blue-150'
      case 'in_transit':
        return 'bg-indigo-50 text-indigo-700 border-indigo-150'
      default:
        return 'bg-slate-50 text-slate-650 border-slate-150'
    }
  }

  const daysGrid = getDaysInMonth(currentYear, currentMonth)

  // Details for currently selected date
  const selectedDateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`
  const selectedDayBookings = getBookingsForDate(selectedDate.day, selectedDate.month, selectedDate.year)

  return (
    <div className="w-full p-6 md:p-8 space-y-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/transporter/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Papan Pemuka</span>
      </button>

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-blue-600 animate-pulse" />
            <span>Ketersediaan Kereta Jabatan (SG)</span>
          </h1>
          <p className="text-slate-500 text-sm">
            Semak slot kosong dan ketersediaan kereta jabatan untuk tempahan trip rasmi.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm rounded-xl w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-2">Tapis Kereta:</span>
          <select
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            className="bg-transparent text-xs font-extrabold text-slate-800 outline-none border-none cursor-pointer pr-3"
          >
            <option value="all">Semua Kereta SG</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.no_kenderaan} ({v.model})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Memuatkan kalendar ketersediaan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT/MID: CALENDAR MONTH GRID */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-800 tracking-tight font-mono">
                {MALAY_MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-650 transition-colors"
                  title="Bulan Lepas"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    const todayDate = new Date()
                    setCurrentYear(todayDate.getFullYear())
                    setCurrentMonth(todayDate.getMonth())
                    setSelectedDate({ day: todayDate.getDate(), month: todayDate.getMonth(), year: todayDate.getFullYear() })
                  }}
                  className="text-xxs font-extrabold px-2.5 py-1 text-blue-650 hover:bg-slate-50 rounded-md transition-colors"
                >
                  Hari Ini
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-650 transition-colors"
                  title="Bulan Depan"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/20 text-center py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-150/70 bg-slate-100/10">
              {daysGrid.map((cell, idx) => {
                const cellBookings = getBookingsForDate(cell.day, cell.month, cell.year)
                const isSelected = selectedDate.day === cell.day && selectedDate.month === cell.month && selectedDate.year === cell.year
                const isToday = today.getDate() === cell.day && today.getMonth() === cell.month && today.getFullYear() === cell.year

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate({ day: cell.day, month: cell.month, year: cell.year })}
                    className={`min-h-[105px] p-2 bg-white flex flex-col justify-between hover:bg-blue-50/20 cursor-pointer transition-all duration-150 relative ${
                      !cell.isCurrentMonth ? 'text-slate-300 bg-slate-50/10' : 'text-slate-800'
                    } ${
                      isSelected ? 'bg-blue-50/30 ring-2 ring-blue-500 ring-inset' : ''
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xxs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                        isToday 
                          ? 'bg-blue-600 text-white font-black shadow-sm' 
                          : isSelected 
                            ? 'bg-blue-105 text-blue-700' 
                            : 'text-slate-650'
                      }`}>
                        {cell.day}
                      </span>
                    </div>

                    {/* Booking Pill Previews */}
                    <div className="space-y-1 overflow-hidden mt-auto pt-1 select-none">
                      {cellBookings.slice(0, 2).map((booking) => {
                        const startDt = new Date(booking.tarikh_masa_diperlukan)
                        const plate = booking.kenderaan?.no_kenderaan || 'SG'
                        return (
                          <div 
                            key={booking.id}
                            className={`text-[9px] leading-normal font-bold p-1 px-1.5 rounded-lg border flex items-center gap-1 overflow-hidden whitespace-nowrap text-ellipsis ${getStatusColorClass(booking.status_semasa)}`}
                            title={`${plate}: ${formatTimeRange(booking.tarikh_masa_diperlukan, booking.tarikh_masa_sehingga)}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                            <span>{plate}</span>
                          </div>
                        )
                      })}
                      {cellBookings.length > 2 && (
                        <div className="text-[9px] text-slate-400 font-extrabold text-right pr-1">
                          + {cellBookings.length - 2} lagi
                        </div>
                      )}
                      
                      {/* Fully clean state - No text when available! */}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT: SELECTED DATE DETAIL PANEL */}
          <div className="space-y-4">
            <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Butiran Jadual</span>
                </CardTitle>
                <p className="text-xs font-bold text-slate-900 mt-1 font-sans">
                  {WEEKDAYS[new Date(selectedDate.year, selectedDate.month, selectedDate.day).getDay()]},{' '}
                  {selectedDate.day} {MALAY_MONTH_NAMES[selectedDate.month]} {selectedDate.year}
                </p>
              </CardHeader>
              
              <CardContent className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
                <div className="space-y-4">
                  {vehicles.map(vehicle => {
                    const vehicleBookings = selectedDayBookings.filter(b => b.kenderaan_id === vehicle.id)
                    
                    return (
                      <div key={vehicle.id} className="border border-slate-200/80 rounded-2xl p-4 space-y-3.5 bg-white shadow-xs">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                              <Car className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-mono font-bold text-sm text-slate-900 block leading-tight">{vehicle.no_kenderaan}</span>
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">{vehicle.model}</span>
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              navigate('/transporter/requests/new', {
                                state: {
                                  prefill: {
                                    jenisPermohonan: 'sg',
                                    tarikhDiperlukan: selectedDateStr
                                  }
                                }
                              })
                            }}
                            disabled={vehicleBookings.length > 0}
                            className={`text-xxs h-8 px-3 rounded-xl shadow-sm font-bold flex items-center gap-1 transition-all ${
                              vehicleBookings.length > 0
                                ? 'bg-slate-100 text-slate-450 border border-slate-200 cursor-not-allowed hover:bg-slate-100 shadow-none'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {vehicleBookings.length > 0 ? (
                              <span>Ditempah</span>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tempah</span>
                              </>
                            )}
                          </Button>
                        </div>

                        {/* List Bookings for this vehicle */}
                        {vehicleBookings.length === 0 ? (
                          <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>Sedia ditempah sepanjang hari</span>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {vehicleBookings.map(b => (
                              <div key={b.id} className="p-3 bg-slate-50/50 border border-slate-200/50 rounded-xl text-xxs font-medium text-slate-650 space-y-1.5">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100/60 pb-1.5">
                                  <span className="font-bold text-slate-900 font-mono text-xs">
                                    {formatTimeRange(b.tarikh_masa_diperlukan, b.tarikh_masa_sehingga)}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    b.status_semasa === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {b.status_semasa === 'approved' ? 'Dilulus' : 'Dalam Semakan'}
                                  </span>
                                </div>
                                
                                <div className="space-y-1 font-semibold">
                                  <div className="flex items-start gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-slate-800 line-clamp-1">{b.destinasi}</span>
                                  </div>
                                  
                                  <div className="flex items-start gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-slate-600 line-clamp-1 font-medium italic">"{b.tujuan_permohonan}"</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{b.nama_pemohon || 'Staf'} • {b.pemandu_diperlukan ? 'Pemandu & Kereta' : 'Kereta Sahaja'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  )
}

export default TransporterAvailabilityPage
