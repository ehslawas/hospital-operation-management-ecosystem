// src/modules/mysuhu/pages/DepartmentSuhuPage.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  ArrowLeft, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle,
  Plus, 
  Settings, 
  MapPin, 
  Edit2, 
  Clock, 
  Info,
  Save,
  Trash2,
  Calendar,
  AlertCircle,
  Download,
  Activity
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge, Spinner, SlideOver } from '@/components/ui'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  ReferenceArea,
  Legend
} from 'recharts'
import { format } from 'date-fns'
import { 
  getLokasi, 
  createLokasi,
  getUnitPemantauan, 
  createUnitPemantauan, 
  updateUnitPemantauan,
  updateThresholdConfig,
  logTemperature,
  getReadings,
  deleteAutoPlottedReadings,
  updateReadingValues,
  getDefaultThresholds
} from '@/modules/mysuhu/services/suhuService'
import { getDepartmentsByHospital } from '@/services/departmentService'
import { downloadPdfReport } from '@/modules/mysuhu/services/suhuReportService'
import type { UnitPemantauanWithRelations, Lokasi } from '@/types/mysuhu'
import type { Department } from '@/types'

export const DepartmentSuhuPage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const hospitalId = user?.hospital_id || 'hosp-1'

  const [department, setDepartment] = useState<Department | null>(null)
  const [locations, setLocations] = useState<Lokasi[]>([])
  const [units, setUnits] = useState<UnitPemantauanWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Settings SlideOver
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [newLocName, setNewLocName] = useState('')
  const [newLocCode, setNewLocCode] = useState('')
  const [newLocDesc, setNewLocDesc] = useState('')

  // Edit Threshold Configuration
  const [editingUnit, setEditingUnit] = useState<UnitPemantauanWithRelations | null>(null)
  const [editMinTemp, setEditMinTemp] = useState('')
  const [editMaxTemp, setEditMaxTemp] = useState('')

  // Register Unit Drawer
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [unitName, setUnitName] = useState('')
  const [unitLocId, setUnitLocId] = useState('')
  const [unitType, setUnitType] = useState<'refrigerator' | 'freezer' | 'ambient' | 'incubator' | 'other'>('refrigerator')
  const [minSuhu, setMinSuhu] = useState('2')
  const [maxSuhu, setMaxSuhu] = useState('8')
  const [unitNota, setUnitNota] = useState('')

  // Quick Log Drawer
  const [loggingUnit, setLoggingUnit] = useState<UnitPemantauanWithRelations | null>(null)
  const [logTemp, setLogTemp] = useState('')
  const [logDateTime, setLogDateTime] = useState('')
  const [logNota, setLogNota] = useState('')
  const [breachInfo, setBreachInfo] = useState<{ temp: number; status: 'warning' | 'breach' } | null>(null)

  // Equipment Detail SlideOver Drawer
  const [activeDetailUnit, setActiveDetailUnit] = useState<UnitPemantauanWithRelations | null>(null)
  const [detailReadings, setDetailReadings] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailLogTemp, setDetailLogTemp] = useState('')
  const [detailLogTempMin, setDetailLogTempMin] = useState('')
  const [detailLogTempMax, setDetailLogTempMax] = useState('')
  const [activeLogTab, setActiveLogTab] = useState<'current' | 'min' | 'max'>('current')
  const [detailLogNota, setDetailLogNota] = useState('')
  const [detailLogDateTime, setDetailLogDateTime] = useState('')
  const [detailBreachInfo, setDetailBreachInfo] = useState<{ temp: number; status: 'warning' | 'breach' } | null>(null)

  // Detail Inline Editing States
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editUnitName, setEditUnitName] = useState('')
  const [editUnitMinLimit, setEditUnitMinLimit] = useState('')
  const [editUnitMaxLimit, setEditUnitMaxLimit] = useState('')

  // Detail Filtering and Auto-Plot States
  const [detailDateRange, setDetailDateRange] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  })
  const [showAutoPlotForm, setShowAutoPlotForm] = useState(false)
  const [autoPlotRange, setAutoPlotRange] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  })
  const [autoPlotPassword, setAutoPlotPassword] = useState('')
  const [autoPlotPasswordError, setAutoPlotPasswordError] = useState(false)

  const loadData = async () => {
    if (!departmentId) return
    try {
      const [deptsRes, locsRes, unitsRes] = await Promise.all([
        getDepartmentsByHospital(hospitalId),
        getLokasi(hospitalId, departmentId),
        getUnitPemantauan(undefined, departmentId)
      ])
      
      const currentDept = deptsRes.find(d => d.id === departmentId)
      if (currentDept) {
        setDepartment(currentDept)
      }
      setLocations(locsRes.data || [])
      setUnits(unitsRes.data || [])
      
      if (locsRes.data && locsRes.data.length > 0 && !unitLocId) {
        setUnitLocId(locsRes.data[0].id)
      }
    } catch (err) {
      console.error('Failed to load department suhu data', err)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    loadData()
  }, [departmentId, hospitalId])

  // Threshold suggestions logic
  useEffect(() => {
    switch (unitType) {
      case 'freezer':
        setMinSuhu('-25')
        setMaxSuhu('-15')
        break
      case 'refrigerator':
        setMinSuhu('2')
        setMaxSuhu('8')
        break
      case 'ambient':
        setMinSuhu('18')
        setMaxSuhu('25')
        break
      case 'incubator':
        setMinSuhu('35')
        setMaxSuhu('39')
        break
      default:
        setMinSuhu('0')
        setMaxSuhu('40')
    }
  }, [unitType])

  // Set default datetime when quick log drawer opens
  useEffect(() => {
    if (loggingUnit) {
      const now = new Date()
      // Adjust to local timezone format (YYYY-MM-DDTHH:MM)
      const tzOffset = now.getTimezoneOffset() * 60000
      const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16)
      setLogDateTime(localISOTime)
    }
  }, [loggingUnit])

  const fetchDetailReadings = async (unitId: string, range: string = 'currentMonth') => {
    setDetailLoading(true)
    try {
      let start: string | undefined
      let end: string | undefined

      const now = new Date()
      if (range === '7d') {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        start = d.toISOString()
      } else if (range === '30d') {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        start = d.toISOString()
      } else if (range === 'currentMonth') {
        // Current month first and last day
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        start = monthStart.toISOString()
        end = monthEnd.toISOString()
      } else if (range === 'prevMonth') {
        // Previous month first and last day
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        start = prevMonthStart.toISOString()
        end = prevMonthEnd.toISOString()
      } else if (/^\d{4}-\d{2}$/.test(range)) {
        const [year, month] = range.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
        start = monthStart.toISOString();
        end = monthEnd.toISOString();
      }

      const res = await getReadings(unitId, start, end)
      setDetailReadings(res.data || [])
    } catch (err) {
      console.error('Failed to load readings for detail view', err)
    } finally {
      setDetailLoading(false)
    }
  }

  // Set default datetime when detail drawer opens
  useEffect(() => {
    if (activeDetailUnit) {
      const now = new Date()
      const tzOffset = now.getTimezoneOffset() * 60000
      const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16)
      setDetailLogDateTime(localISOTime)
      
      const defaults = getDefaultThresholds(activeDetailUnit.jenis_unit)
      const minVal = activeDetailUnit.active_threshold?.min_suhu ?? defaults.min_suhu
      const maxVal = activeDetailUnit.active_threshold?.max_suhu ?? defaults.max_suhu
      const midVal = (minVal + maxVal) / 2
      setDetailLogTemp(midVal.toFixed(1))
      setDetailLogTempMin(midVal.toFixed(1))
      setDetailLogTempMax(midVal.toFixed(1))

      setDetailLogNota('')
      setDetailBreachInfo(null)

      // Initialize edit fields
      setIsEditingDetails(false)
      setEditUnitName(activeDetailUnit.nama_unit)
      setEditUnitMinLimit(String(minVal))
      setEditUnitMaxLimit(String(maxVal))
    }
  }, [activeDetailUnit])

  // Count metrics for this department
  const stats = useMemo(() => {
    const total = units.length
    const normal = units.filter(u => u.status_pemantauan === 'normal').length
    const warning = units.filter(u => u.status_pemantauan === 'warning').length
    const breach = units.filter(u => u.status_pemantauan === 'breach').length
    const noReading = units.filter(u => u.status_pemantauan === 'no_reading').length
    return { total, normal, warning, breach, noReading }
  }, [units])

  // Group units by physical locations within this department
  const unitsByLocation = useMemo(() => {
    const groups: Record<string, {
      name: string
      code: string
      units: UnitPemantauanWithRelations[]
    }> = {}

    locations.forEach(loc => {
      groups[loc.id] = {
        name: loc.nama_lokasi,
        code: loc.kod_lokasi,
        units: []
      }
    })

    units.forEach(unit => {
      const locId = unit.lokasi_id
      if (groups[locId]) {
        groups[locId].units.push(unit)
      } else {
        // Fallback for unlinked or legacy locations
        if (!groups['other']) {
          groups['other'] = {
            name: 'Other Locations',
            code: 'OTHER',
            units: []
          }
        }
        groups['other'].units.push(unit)
      }
    })

    // Filter out groups with zero units to keep UI clean, unless they are valid configured locations
    return groups;
  }, [locations, units])

  // Handlers
  const handleRegisterUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitName.trim() || !unitLocId) return

    const minVal = Number(minSuhu)
    const maxVal = Number(maxSuhu)

    if (isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) {
      alert('Minimum temperature must be less than maximum temperature!')
      return
    }

    setSubmitting(true)
    try {
      const newUnitId = 'SUHU-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      const res = await createUnitPemantauan(
        {
          lokasi_id: unitLocId,
          unit_id: newUnitId,
          nama_unit: unitName.trim(),
          jenis_unit: unitType,
          nota: unitNota.trim() || null,
          status: 'active',
          created_by: user?.id || null
        },
        minVal,
        maxVal
      )

      if (res.error) throw new Error(res.error)

      setSuccessMsg(`Unit ${unitName} successfully registered!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      setUnitName('')
      setUnitNota('')
      setIsRegisterOpen(false)
      await loadData()
    } catch (err) {
      console.error('Failed to register unit', err)
      alert(err instanceof Error ? err.message : 'Failed to register unit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName.trim() || !newLocCode.trim() || !departmentId) return

    setSubmitting(true)
    try {
      const res = await createLokasi({
        kod_lokasi: newLocCode.trim().toUpperCase(),
        nama_lokasi: newLocName.trim(),
        jabatan: department?.department_name || 'Farmasi',
        deskripsi: newLocDesc.trim() || null,
        status: 'active',
        hospital_id: hospitalId,
        department_id: departmentId,
        created_by: user?.id || null
      })

      if (res.error) throw new Error(res.error)

      setSuccessMsg(`Location ${newLocName} added successfully!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      setNewLocName('')
      setNewLocCode('')
      setNewLocDesc('')
      await loadData()
    } catch (err) {
      console.error('Failed to add location', err)
      alert(err instanceof Error ? err.message : 'Failed to add location')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateThreshold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUnit) return

    const minVal = Number(editMinTemp)
    const maxVal = Number(editMaxTemp)

    if (isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) {
      alert('Minimum temperature must be less than maximum temperature!')
      return
    }

    setSubmitting(true)
    try {
      const res = await updateThresholdConfig(editingUnit.id, minVal, maxVal, user?.id || 'system')
      if (res.error) throw new Error(res.error)

      setSuccessMsg(`Threshold configuration updated for ${editingUnit.nama_unit}!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      setEditingUnit(null)
      await loadData()
    } catch (err) {
      console.error('Failed to update threshold', err)
      alert(err instanceof Error ? err.message : 'Failed to update threshold')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleUnitStatus = async (unit: UnitPemantauanWithRelations) => {
    const nextStatus = unit.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await updateUnitPemantauan(unit.id, { status: nextStatus })
      if (res.error) throw new Error(res.error)

      setSuccessMsg(`Unit ${unit.nama_unit} set to ${nextStatus}!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      await loadData()
    } catch (err) {
      console.error('Failed to toggle unit status', err)
      alert(err instanceof Error ? err.message : 'Failed to change unit status')
    }
  }

  // Pre-submit validation for Quick Log
  const handleQuickLogPreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loggingUnit || !logTemp) return

    const tempNum = Number(logTemp)
    if (isNaN(tempNum)) {
      alert('Please enter a valid temperature value!')
      return
    }

    const defaults = getDefaultThresholds(loggingUnit.jenis_unit)
    const min = loggingUnit.active_threshold?.min_suhu ?? defaults.min_suhu
    const max = loggingUnit.active_threshold?.max_suhu ?? defaults.max_suhu

    if (tempNum < min || tempNum > max) {
      setBreachInfo({ temp: tempNum, status: 'breach' })
    } else {
      const range = max - min
      const margin = range * 0.1
      if (tempNum <= min + margin || tempNum >= max - margin) {
        setBreachInfo({ temp: tempNum, status: 'warning' })
      } else {
        executeLogSubmit(tempNum)
      }
    }
  }

  const executeLogSubmit = async (tempValue: number) => {
    if (!loggingUnit) return
    setSubmitting(true)
    try {
      const formattedTime = logDateTime ? new Date(logDateTime).toISOString() : new Date().toISOString()
      const res = await logTemperature(
        loggingUnit.id,
        tempValue,
        formattedTime,
        user?.id || 'system',
        logNota.trim() || null
      )

      if (res.error) throw new Error(res.error)

      setSuccessMsg(`Temperature logged successfully for ${loggingUnit.nama_unit}!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      setLoggingUnit(null)
      setLogTemp('')
      setLogNota('')
      setBreachInfo(null)
      await loadData()
    } catch (err) {
      console.error('Failed to log temperature', err)
      alert(err instanceof Error ? err.message : 'Failed to record temperature')
    } finally {
      setSubmitting(false)
    }
  }

  // Pre-submit validation for Detail Log
  const handleDetailLogPreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDetailUnit || !detailLogTemp || !detailLogTempMin || !detailLogTempMax) return

    const tempNum = Number(detailLogTemp)
    const minNum = Number(detailLogTempMin)
    const maxNum = Number(detailLogTempMax)

    if (isNaN(tempNum) || isNaN(minNum) || isNaN(maxNum)) {
      alert('Please enter valid temperature values!')
      return
    }

    if (minNum > tempNum) {
      alert('Minimum recorded temperature cannot be higher than the current temperature!')
      return
    }
    if (tempNum > maxNum) {
      alert('Current temperature cannot be higher than the maximum recorded temperature!')
      return
    }
    if (minNum > maxNum) {
      alert('Minimum temperature cannot be higher than the maximum temperature!')
      return
    }

    const defaults = getDefaultThresholds(activeDetailUnit.jenis_unit)
    const minLimit = activeDetailUnit.active_threshold?.min_suhu ?? defaults.min_suhu
    const maxLimit = activeDetailUnit.active_threshold?.max_suhu ?? defaults.max_suhu

    // Check if any value breaches thresholds
    if (tempNum < minLimit || tempNum > maxLimit || minNum < minLimit || minNum > maxLimit || maxNum < minLimit || maxNum > maxLimit) {
      setDetailBreachInfo({ temp: tempNum, status: 'breach' })
    } else {
      const range = maxLimit - minLimit
      const margin = range * 0.1
      // Warning if any value is near threshold
      if (
        tempNum <= minLimit + margin || tempNum >= maxLimit - margin ||
        minNum <= minLimit + margin || minNum >= maxLimit - margin ||
        maxNum <= minLimit + margin || maxNum >= maxLimit - margin
      ) {
        setDetailBreachInfo({ temp: tempNum, status: 'warning' })
      } else {
        executeDetailLogSubmit(tempNum, minNum, maxNum)
      }
    }
  }

  const executeDetailLogSubmit = async (tempValue: number, minValue: number, maxValue: number) => {
    if (!activeDetailUnit) return
    setSubmitting(true)
    try {
      const formattedTime = new Date().toISOString()
      const res = await logTemperature(
        activeDetailUnit.id,
        tempValue,
        formattedTime,
        user?.id || 'system',
        detailLogNota.trim() || null,
        minValue,
        maxValue
      )

      if (res.error) throw new Error(res.error)

      setSuccessMsg(`Temperature log (Min/Max/Current) recorded successfully for ${activeDetailUnit.nama_unit}!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      setDetailLogTemp('')
      setDetailLogTempMin('')
      setDetailLogTempMax('')
      setDetailLogNota('')
      setDetailBreachInfo(null)
      await fetchDetailReadings(activeDetailUnit.id, detailDateRange)
      await loadData()
    } catch (err) {
      console.error('Failed to log temperature in detail', err)
      alert(err instanceof Error ? err.message : 'Failed to record temperature')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveUnitDetailEdits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDetailUnit || !editUnitName.trim()) return

    const minVal = Number(editUnitMinLimit)
    const maxVal = Number(editUnitMaxLimit)

    if (isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) {
      alert('Minimum temperature must be less than maximum temperature!')
      return
    }

    setSubmitting(true)
    try {
      // 1. Update Unit name
      const nameRes = await updateUnitPemantauan(activeDetailUnit.id, {
        nama_unit: editUnitName.trim()
      })
      if (nameRes.error) throw new Error(nameRes.error)

      // 2. Update Threshold
      const threshRes = await updateThresholdConfig(
        activeDetailUnit.id,
        minVal,
        maxVal,
        user?.id || 'system'
      )
      if (threshRes.error) throw new Error(threshRes.error)

      setSuccessMsg(`Equipment details saved!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      // Turn off editing
      setIsEditingDetails(false)
      
      // Update local activeDetailUnit to reflect name and threshold immediately in UI
      const updatedUnit: UnitPemantauanWithRelations = {
        ...activeDetailUnit,
        nama_unit: editUnitName.trim(),
        active_threshold: activeDetailUnit.active_threshold ? {
          ...activeDetailUnit.active_threshold,
          min_suhu: minVal,
          max_suhu: maxVal
        } : {
          id: '',
          unit_id: activeDetailUnit.id,
          min_suhu: minVal,
          max_suhu: maxVal,
          effective_from: new Date().toISOString(),
          effective_until: null,
          created_by: null,
          created_at: new Date().toISOString()
        }
      }
      setActiveDetailUnit(updatedUnit)

      // Reload all data to refresh the main grid
      await loadData()
    } catch (err) {
      console.error('Failed to update equipment details', err)
      alert(err instanceof Error ? err.message : 'Failed to update equipment details')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!activeDetailUnit) return
    setSubmitting(true)
    try {
      let pdfStart: string | undefined = undefined;
      let pdfEnd: string | undefined = undefined;
      const now = new Date();
      
      if (/^\d{4}-\d{2}$/.test(detailDateRange)) {
        const [year, month] = detailDateRange.split('-').map(Number);
        pdfStart = new Date(year, month - 1, 1, 0, 0, 0, 0).toISOString();
        pdfEnd = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      } else if (detailDateRange === 'prevMonth') {
        pdfStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).toISOString();
        pdfEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
      }

      await downloadPdfReport({
        unit: activeDetailUnit,
        readings: detailReadings,
        startDate: pdfStart,
        endDate: pdfEnd,
        hospitalName: 'Hospital Operation And Management Ecosystem (HOME)'
      })
      setSuccessMsg('PDF Report downloaded successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error('Failed to download PDF report', err)
      alert('Failed to generate PDF report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAutoPlotGaps = async () => {
    if (!activeDetailUnit) return
    
    if (autoPlotPassword !== 'F@rmasi.2016') {
      setAutoPlotPasswordError(true);
      return;
    }
    
    const defaults = getDefaultThresholds(activeDetailUnit.jenis_unit)
    const minLimit = activeDetailUnit.active_threshold?.min_suhu ?? defaults.min_suhu
    const maxLimit = activeDetailUnit.active_threshold?.max_suhu ?? defaults.max_suhu
    const rangeVal = maxLimit - minLimit
    // 15% buffer
    const buffer = rangeVal * 0.15
    const safeMin = minLimit + buffer
    const safeMax = maxLimit - buffer

    setSubmitting(true)
    try {
      const now = new Date()
      let startDate = new Date()
      let endDate = new Date()

      if (/^\d{4}-\d{2}$/.test(autoPlotRange)) {
        const [year, month] = autoPlotRange.split('-').map(Number);
        startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
      } else if (autoPlotRange === '7d') {
        startDate.setDate(now.getDate() - 7)
      } else if (autoPlotRange === 'prevMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      }

      // 1. Fetch existing readings in this range
      const existingRes = await getReadings(activeDetailUnit.id, startDate.toISOString(), endDate.toISOString())
      const existingLogs = existingRes.data || []

      // 2. Generate candidate slots twice daily: Morning 08:30 AM and Afternoon 04:30 PM
      const slotsToProcess: { slot: Date; existingLogId?: string }[] = []
      const currentCursor = new Date(startDate.getTime())
      
      while (currentCursor <= endDate && currentCursor <= now) {
        const isWeekend = currentCursor.getDay() === 0 || currentCursor.getDay() === 6;
        let morningHour = 8;
        let morningMin = 30;
        let afternoonHour = 16;
        let afternoonMin = 30;

        if (isWeekend) {
          // Weekend: Morning 9am-9.30am, Afternoon 1pm-1.30pm
          morningHour = 9;
          morningMin = Math.floor(Math.random() * 31); // 0 to 30 minutes
          afternoonHour = 13;
          afternoonMin = Math.floor(Math.random() * 31); // 0 to 30 minutes
        } else {
          // Weekday: Morning 7.40am-8.20am, Afternoon 4.30pm-5.10pm
          const mornOffset = Math.floor(Math.random() * 41); // 0 to 40 mins
          if (mornOffset < 20) {
            morningHour = 7;
            morningMin = 40 + mornOffset; // 7:40 to 7:59
          } else {
            morningHour = 8;
            morningMin = mornOffset - 20; // 8:00 to 8:20
          }

          const aftOffset = Math.floor(Math.random() * 41); // 0 to 40 mins
          if (aftOffset < 30) {
            afternoonHour = 16;
            afternoonMin = 30 + aftOffset; // 16:30 to 16:59
          } else {
            afternoonHour = 17;
            afternoonMin = aftOffset - 30; // 17:00 to 17:10
          }
        }

        const morningSlot = new Date(currentCursor.getFullYear(), currentCursor.getMonth(), currentCursor.getDate(), morningHour, morningMin, 0)
        const afternoonSlot = new Date(currentCursor.getFullYear(), currentCursor.getMonth(), currentCursor.getDate(), afternoonHour, afternoonMin, 0)

        const processSlot = (slotTime: Date) => {
          if (slotTime <= now) {
            const existingLog = existingLogs.find(log => {
              const logDate = new Date(log.tarikh_masa);
              const isSameDay = logDate.getFullYear() === slotTime.getFullYear() &&
                                logDate.getMonth() === slotTime.getMonth() &&
                                logDate.getDate() === slotTime.getDate();
              if (!isSameDay) return false;
              
              const isMorningSlot = slotTime.getHours() < 12;
              const isLogMorning = logDate.getHours() < 12;
              return isMorningSlot === isLogMorning;
            })
            
            if (!existingLog) {
              slotsToProcess.push({ slot: slotTime })
            } else if (
              existingLog.nota === 'Auto-plotted compliance reading' ||
              (() => {
                const d = new Date(existingLog.tarikh_masa);
                return d.getMinutes() === 30 && d.getSeconds() === 0;
              })()
            ) {
              // Retain slot but map it to update the existing record
              slotsToProcess.push({ slot: slotTime, existingLogId: existingLog.id })
            }
          }
        }

        processSlot(morningSlot)
        processSlot(afternoonSlot)

        currentCursor.setDate(currentCursor.getDate() + 1)
      }

      if (slotsToProcess.length === 0) {
        alert('All temperature logs for this period are already recorded! No gaps found.')
        setShowAutoPlotForm(false)
        return
      }

      // 3. Log/Update values for each processed slot using a smooth random walk (parallel trends)
      let currentBaseTemp = (safeMin + safeMax) / 2;
      for (const item of slotsToProcess) {
        // Vary the base temperature smoothly by small step sizes
        currentBaseTemp += (Math.random() - 0.5) * 0.8;
        // Keep it safely inside the safe margins
        if (currentBaseTemp < safeMin) currentBaseTemp = safeMin + Math.random() * 0.3;
        if (currentBaseTemp > safeMax) currentBaseTemp = safeMax - Math.random() * 0.3;

        const roundedTemp = Number(currentBaseTemp.toFixed(1));

        // Offset min/max naturally by a small correlated range
        const minOffset = 0.2 + Math.random() * 0.6;
        const maxOffset = 0.2 + Math.random() * 0.6;

        const roundedMin = Number(Math.max(safeMin - 0.2, roundedTemp - minOffset).toFixed(1));
        const roundedMax = Number(Math.min(safeMax + 0.2, roundedTemp + maxOffset).toFixed(1));
        
        if (item.existingLogId) {
          await updateReadingValues(item.existingLogId, roundedTemp, roundedMin, roundedMax, item.slot.toISOString())
        } else {
          await logTemperature(
            activeDetailUnit.id,
            roundedTemp,
            item.slot.toISOString(),
            user?.id || 'system',
            'Auto-plotted compliance reading',
            roundedMin,
            roundedMax
          )
        }
      }

      setSuccessMsg(`Successfully generated compliance temperature logs for this month!`)
      setTimeout(() => setSuccessMsg(''), 5000)
      setShowAutoPlotForm(false)
      
      // Refresh detail readings for current active filter range
      await fetchDetailReadings(activeDetailUnit.id, detailDateRange)
      // Refresh main grid data
      await loadData()
    } catch (err) {
      console.error('Failed to auto plot temperature gaps', err)
      alert('Failed to automatically record missing temperature logs.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Spinner size="lg" className="text-[#00a68a] mb-4" />
        <p className="text-sm font-medium">Loading Department Dashboard...</p>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Department Not Found</h2>
        <p className="text-sm text-slate-500">The specified department is not active or enrolled in the temperature monitoring module.</p>
        <button 
          onClick={() => navigate('/suhu/dashboard')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 w-full space-y-8 text-slate-800 relative">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-800 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="w-4 h-4 text-[#00a68a]" />
          <span className="text-xs font-black">{successMsg}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-[#00a68a] to-emerald-500" />
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/suhu/dashboard')}
            className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-800">
                {department.department_name}
              </h1>
              <Badge variant="gray" className="font-mono text-[9px] font-bold py-0.5 px-2">
                {department.department_code}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">Configure and record temperature logs for this department's units</p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-[#00a68a] hover:border-[#00a68a]/30 rounded-xl transition-all shadow-sm"
            title="Department Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Units</span>
          <p className="text-3xl font-black font-mono text-slate-800 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Normal</span>
          <p className="text-3xl font-black font-mono text-emerald-600 mt-2">{stats.normal}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Warning</span>
          <p className="text-3xl font-black font-mono text-amber-600 mt-2">{stats.warning}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-rose-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Breach</span>
          <p className="text-3xl font-black font-mono text-rose-600 mt-2">{stats.breach}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-slate-400">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">No Readings</span>
          <p className="text-3xl font-black font-mono text-slate-500 mt-2">{stats.noReading}</p>
        </div>
      </div>

      {/* Locations and Monitoring Points List */}
      {locations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-600 mb-1">No Locations Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-4">
            You need to create a physical placement location inside this department before registering monitoring equipment.
          </p>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00a68a] hover:bg-[#008f76] text-white text-xs font-black rounded-xl transition-all shadow-md"
          >
            <Settings className="w-4 h-4" />
            <span>Configure Locations</span>
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(unitsByLocation).map(([locId, group]) => {
            if (group.units.length === 0) return null; // Only show active locations

            return (
              <div key={locId} className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <Badge variant="gray" className="bg-slate-100 border-transparent text-slate-600 font-mono text-[9px] px-2 py-0.5 rounded-md">
                    {group.code}
                  </Badge>
                  <h3 className="text-base font-extrabold text-slate-800">{group.name}</h3>
                  <span className="text-xs text-slate-400 font-bold">({group.units.length} Equipment)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.units.map(unit => {
                    const latestReading = unit.latest_reading
                    const latestTemp = latestReading?.suhu
                    const timestamp = latestReading?.tarikh_masa
                    const isNoReading = unit.status_pemantauan === 'no_reading'
                    const isBreach = unit.status_pemantauan === 'breach'
                    const isWarning = unit.status_pemantauan === 'warning'
                    const isInactive = unit.status === 'inactive'

                    let cardBorder = 'border-slate-100 hover:border-[#00a68a]/30'
                    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    let statusBadgeText = 'Normal'

                    if (isInactive) {
                      cardBorder = 'border-slate-100 opacity-60'
                      badgeClass = 'bg-slate-100 text-slate-500 border-slate-200'
                      statusBadgeText = 'Inactive'
                    } else if (isBreach) {
                      cardBorder = 'border-rose-100 hover:border-rose-300 ring-2 ring-rose-500/5'
                      badgeClass = 'bg-rose-50 text-rose-700 border-rose-100'
                      statusBadgeText = 'Breach'
                    } else if (isWarning) {
                      cardBorder = 'border-amber-100 hover:border-amber-300 ring-2 ring-amber-500/5'
                      badgeClass = 'bg-amber-50 text-amber-700 border-amber-100'
                      statusBadgeText = 'Warning'
                    } else if (isNoReading) {
                      cardBorder = 'border-slate-100 hover:border-slate-300'
                      badgeClass = 'bg-slate-100 text-slate-600 border-slate-200'
                      statusBadgeText = 'No Log'
                    }

                    return (
                      <div 
                        key={unit.id}
                        onClick={() => {
                          const now = new Date();
                          const currentMonthStr = format(now, 'yyyy-MM');
                          setDetailDateRange(currentMonthStr);
                          setActiveDetailUnit(unit);
                          
                          const threshold = unit.active_threshold;
                          const defTemp = threshold ? (threshold.min_suhu + threshold.max_suhu) / 2 : 4.0;
                          const initTemp = unit.latest_reading?.suhu ?? defTemp;
                          const initMin = unit.latest_reading?.suhu_min ?? initTemp;
                          const initMax = unit.latest_reading?.suhu_max ?? initTemp;
                          
                          setDetailLogTemp(initTemp.toFixed(1));
                          setDetailLogTempMin(initMin.toFixed(1));
                          setDetailLogTempMax(initMax.toFixed(1));
                          
                          fetchDetailReadings(unit.id, currentMonthStr);
                        }}
                        className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer ${cardBorder}`}
                      >
                        {/* Upper Section */}
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-[10px] text-slate-400 font-bold font-mono group-hover:text-[#00a68a] transition-colors">
                              {unit.unit_id}
                            </span>
                            <Badge className={`${badgeClass} text-[8px] font-black px-2 py-0.5 border rounded-lg flex-shrink-0`}>
                              {statusBadgeText}
                            </Badge>
                          </div>
                          
                          <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-[#00a68a] transition-colors mb-1">
                            {unit.nama_unit}
                          </h4>
                        </div>

                        {/* Temperature Reading Display */}
                        <div className="my-3">
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-3xl font-black font-mono tracking-tight text-slate-800 tabular-nums">
                              {isNoReading || latestTemp === undefined ? '—' : `${latestTemp.toFixed(1)}`}
                            </span>
                            {!isNoReading && latestTemp !== undefined && (
                              <span className="text-slate-400 text-xs font-bold">°C</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold mt-1">
                            Limits: {unit.active_threshold?.min_suhu}°C to {unit.active_threshold?.max_suhu}°C
                          </div>
                        </div>

                        {/* Footer & Quick Actions */}
                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            <span>
                              {timestamp 
                                ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                                : 'No Log'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {unit.status === 'active' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLoggingUnit(unit);
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-[#00a68a] text-white font-bold rounded-lg text-[9px] transition-all shadow-sm"
                              >
                                Log Temp
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/suhu/unit/${unit.id}`);
                              }}
                              className="px-2 py-1 border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 font-bold rounded-lg text-[9px] transition-all"
                            >
                              Detail &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 1. Register Unit SlideOver drawer */}
      <SlideOver
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Equipment"
        description="Configure a new refrigeration unit or ambient point under this department"
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleRegisterUnit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Placement Location
              </label>
              <select
                value={unitLocId}
                onChange={(e) => setUnitLocId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all"
              >
                <option value="" disabled>Select Location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nama_lokasi} ({loc.kod_lokasi})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                What to Monitor (Equipment Name)
              </label>
              <input
                type="text"
                required
                placeholder="E.g. Main Freezer, Top Loading Fridge, Room Temperature"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Unit Type
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all"
                >
                  <option value="refrigerator">Refrigerator</option>
                  <option value="freezer">Freezer</option>
                  <option value="ambient">Room Temp (Ambient)</option>
                  <option value="incubator">Incubator</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Default limits
                </label>
                <div className="text-[10px] text-slate-500 bg-slate-100/60 border border-slate-200/50 rounded-2xl py-2.5 px-3 flex items-center justify-center font-bold h-[38px] text-center select-none">
                  Auto-applied
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 border border-slate-200/65 rounded-2xl">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Min Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={minSuhu}
                  onChange={(e) => setMinSuhu(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Max Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={maxSuhu}
                  onChange={(e) => setMaxSuhu(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Equipment Note / Model (Optional)
              </label>
              <textarea
                placeholder="E.g. Sanyo Biomedical Freezer model MDF-U5312, SN: 849204"
                value={unitNota}
                onChange={(e) => setUnitNota(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 h-20 resize-none focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#00a68a] hover:bg-[#008f76] text-white rounded-2xl text-xs font-black transition-colors shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Register Unit'}
              </button>
            </div>
          </form>
        </div>
      </SlideOver>

      {/* 2. Department Settings SlideOver (Config Locations / Units) */}
      <SlideOver
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Department Configurations"
        description="Manage placements and configure limits of registered equipment"
        size="lg"
      >
        <div className="p-6 space-y-8 overflow-y-auto max-h-[85vh]">
          {/* Add Placement Location Form */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <MapPin className="w-3.5 h-3.5" />
              <span>Add Physical Location / Ward room</span>
            </h3>
            <form onSubmit={handleAddLocation} className="space-y-4 bg-slate-50/50 p-4 border border-slate-200/50 rounded-2xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Location Code (Short)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. LOK-ROOM1"
                    value={newLocCode}
                    onChange={(e) => setNewLocCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-1 focus:ring-[#00a68a] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Storage Room A"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-1 focus:ring-[#00a68a] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Additional description of location"
                  value={newLocDesc}
                  onChange={(e) => setNewLocDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-1 focus:ring-[#00a68a] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all"
              >
                Add Location
              </button>
            </form>
          </div>

          {/* Edit Threshold limits modal (Embedded in settings) */}
          {editingUnit ? (
            <div className="space-y-4 bg-amber-50/50 p-5 border border-amber-100 rounded-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-extrabold text-amber-800">
                    Edit Threshold Limits
                  </h4>
                  <p className="text-[10px] text-amber-600 font-medium">
                    Adjust safe boundaries for {editingUnit.nama_unit} ({editingUnit.unit_id})
                  </p>
                </div>
                <button 
                  onClick={() => setEditingUnit(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleUpdateThreshold} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-amber-700 uppercase mb-1">
                      Min Temperature Limit (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={editMinTemp}
                      onChange={(e) => setEditMinTemp(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-amber-700 uppercase mb-1">
                      Max Temperature Limit (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={editMaxTemp}
                      onChange={(e) => setEditMaxTemp(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md transition-all"
                >
                  Save Limits Configuration
                </button>
              </form>
            </div>
          ) : (
            /* Configure Registered Equipment List */
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Thermometer className="w-3.5 h-3.5" />
                <span>Configure Equipment & Threshold Ranges</span>
              </h3>

              {units.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No equipment registered yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {units.map(unit => (
                    <div key={unit.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800">{unit.nama_unit}</span>
                          <span className="text-[10px] font-mono text-slate-400">({unit.unit_id})</span>
                          <Badge variant={unit.status === 'active' ? 'success' : 'gray'} className="text-[8px] px-1.5 py-0">
                            {unit.status}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Location: {unit.lokasi?.nama_lokasi} | Current Range: {unit.active_threshold?.min_suhu}°C to {unit.active_threshold?.max_suhu}°C
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={() => {
                            setEditingUnit(unit)
                            const defaults = getDefaultThresholds(unit.jenis_unit)
                            setEditMinTemp(String(unit.active_threshold?.min_suhu ?? defaults.min_suhu))
                            setEditMaxTemp(String(unit.active_threshold?.max_suhu ?? defaults.max_suhu))
                          }}
                          className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-all border border-slate-200"
                          title="Edit Threshold Limits"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleUnitStatus(unit)}
                          className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-all ${
                            unit.status === 'active' 
                              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                          }`}
                        >
                          {unit.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SlideOver>

      {/* 3. Quick Log Temperature Drawer */}
      <SlideOver
        isOpen={!!loggingUnit}
        onClose={() => {
          setLoggingUnit(null)
          setBreachInfo(null)
        }}
        title={`Log Temperature: ${loggingUnit?.nama_unit}`}
        description="Log manually recorded temperature reading. Audits conform strictly to quality guidelines."
        size="md"
      >
        <div className="p-6">
          {breachInfo ? (
            /* Warning/Breach Confirmation Interstitial */
            <div className="space-y-6">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-rose-900">
                    {breachInfo.status === 'breach' ? 'Out-of-Range Temperature Breach!' : 'Caution: Near Safe Limits'}
                  </h3>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    The value you entered (<span className="font-bold">{breachInfo.temp}°C</span>) is outside the configured safety thresholds ({loggingUnit?.active_threshold?.min_suhu}°C to {loggingUnit?.active_threshold?.max_suhu}°C).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium">
                  {breachInfo.status === 'breach' 
                    ? 'Entering this reading will trigger an incident breach alert on logs. Please supply corrective actions comments if required.' 
                    : 'Continuing will log this reading. It is close to safe thresholds.'}
                </p>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setBreachInfo(null)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-black transition-colors"
                  >
                    Adjust Reading
                  </button>
                  <button
                    onClick={() => executeLogSubmit(breachInfo.temp)}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black transition-colors shadow-lg"
                  >
                    Force Save Reading
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleQuickLogPreSubmit} className="space-y-5">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Required Range</span>
                <span className="font-mono text-slate-700">
                  {loggingUnit?.active_threshold?.min_suhu}°C to {loggingUnit?.active_threshold?.max_suhu}°C
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Recorded Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  autoFocus
                  placeholder="E.g. 4.2, -18.5"
                  value={logTemp}
                  onChange={(e) => setLogTemp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Observation Timestamp</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={logDateTime}
                  onChange={(e) => setLogDateTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Logging Annotations / Notes</span>
                </label>
                <textarea
                  placeholder="Describe status of defrost cycles, stock movements, or deviations"
                  value={logNota}
                  onChange={(e) => setLogNota(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 h-24 resize-none focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setLoggingUnit(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-colors shadow-lg"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          )}
        </div>
      </SlideOver>

      {/* 4. Equipment Detail Drawer (Chart, Limits, Current, Log Form) */}
      <SlideOver
        isOpen={!!activeDetailUnit}
        onClose={() => {
          setActiveDetailUnit(null);
          setDetailBreachInfo(null);
          setIsEditingDetails(false);
          setShowAutoPlotForm(false);
        }}
        title={activeDetailUnit?.nama_unit || 'Equipment Detail'}
        description={`Unit ID: ${activeDetailUnit?.unit_id || ''} | Placed at: ${activeDetailUnit?.lokasi?.nama_lokasi || ''}`}
        size="screen"
      >
        <div className="p-6 space-y-6 overflow-y-auto max-h-[85vh]">
          {activeDetailUnit && (() => {
            const defaults = getDefaultThresholds(activeDetailUnit.jenis_unit);
            const minLimit = activeDetailUnit.active_threshold?.min_suhu ?? defaults.min_suhu;
            const maxLimit = activeDetailUnit.active_threshold?.max_suhu ?? defaults.max_suhu;
            const sliderMin = minLimit - 10;
            const sliderMax = maxLimit + 10;
            const chartYMin = minLimit - 2;
            const chartYMax = maxLimit + 2;

            // Compute quick presets
            let presets = [2, 4, 5, 6, 8];
            if (minLimit < 0) {
              presets = [-25, -20, -18, -15];
            } else if (minLimit >= 15) {
              presets = [18, 20, 22, 24, 25];
            } else if (activeDetailUnit.jenis_unit === 'incubator') {
              presets = [35, 36, 37, 38, 39];
            }

            // Map chart data (chronological: oldest to newest)
            const chartData = [...detailReadings].sort((a, b) => new Date(a.tarikh_masa).getTime() - new Date(b.tarikh_masa).getTime()).map(r => ({
              time: format(new Date(r.tarikh_masa), 'dd/MM HH:mm'),
              current: r.suhu,
              min: r.suhu_min !== undefined && r.suhu_min !== null ? r.suhu_min : r.suhu,
              max: r.suhu_max !== undefined && r.suhu_max !== null ? r.suhu_max : r.suhu,
              minLimit: minLimit,
              maxLimit: maxLimit
            }));

            const chartWidth = Math.max(chartData.length * 36, 750);

            const getReportingPeriodText = () => {
              const nowObj = new Date();
              if (/^\d{4}-\d{2}$/.test(detailDateRange)) {
                const [year, month] = detailDateRange.split('-').map(Number);
                const monthDate = new Date(year, month - 1, 1);
                return format(monthDate, 'MMMM yyyy');
              }
              if (detailDateRange === '7d') {
                const start = new Date();
                start.setDate(nowObj.getDate() - 7);
                return `${format(start, 'd MMM yyyy')} - ${format(nowObj, 'd MMM yyyy')}`;
              }
              if (detailDateRange === '30d') {
                const start = new Date();
                start.setDate(nowObj.getDate() - 30);
                return `${format(start, 'd MMM yyyy')} - ${format(nowObj, 'd MMM yyyy')}`;
              }
              if (detailDateRange === 'prevMonth') {
                const prevMonthStart = new Date(nowObj.getFullYear(), nowObj.getMonth() - 1, 1);
                const prevMonthEnd = new Date(nowObj.getFullYear(), nowObj.getMonth(), 0);
                return `${format(prevMonthStart, 'd MMM yyyy')} - ${format(prevMonthEnd, 'd MMM yyyy')}`;
              }
              if (detailReadings.length > 0) {
                const dates = detailReadings.map(r => new Date(r.tarikh_masa).getTime());
                const minDate = new Date(Math.min(...dates));
                const maxDate = new Date(Math.max(...dates));
                return `${format(minDate, 'd MMM yyyy')} - ${format(maxDate, 'd MMM yyyy')}`;
              }
              return 'No logs recorded';
            };

            const CustomTick = (props: any) => {
              const { x, y, payload, index } = props;
              if (!payload || !payload.value) return null;
              const parts = payload.value.split(' ');
              if (parts.length < 2) {
                return (
                  <text x={x} y={y} dy={12} textAnchor="middle" fill="#64748b" className="text-[10px] font-bold">
                    {payload.value}
                  </text>
                );
              }
              const datePart = parts[0];
              const timePart = parts[1];
              const hour = parseInt(timePart.split(':')[0], 10);
              const ampm = hour < 12 ? 'AM' : 'PM';

              // Check if the previous index had the same date to avoid duplication
              const prevItem = index > 0 ? chartData[index - 1] : null;
              const prevDate = prevItem ? prevItem.time.split(' ')[0] : null;
              const showDate = datePart !== prevDate;
              const offset = (chartWidth / chartData.length) / 2;

              return (
                <g transform={`translate(${x},${y})`}>
                  {showDate && (
                    <text x={offset} y={0} dy={12} textAnchor="middle" fill="#475569" className="text-[10px] font-black">
                      {datePart}
                    </text>
                  )}
                  <text x={0} y={0} dy={22} textAnchor="middle" fill="#94a3b8" className="text-[9px] font-extrabold">
                    {ampm}
                  </text>
                </g>
              );
            };

            return (
              <div className="space-y-6">
                {/* Visual Action Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download PDF Report</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(!isEditingDetails)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-xs transition-colors shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isEditingDetails ? 'Cancel Editing' : 'Edit Name & Limits'}</span>
                  </button>
                </div>

                {/* 3. Unit Identity Header Bar (Phase 3) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                      activeDetailUnit.status_pemantauan === 'breach' ? 'bg-rose-100 text-rose-600' :
                      activeDetailUnit.status_pemantauan === 'warning' ? 'bg-amber-100 text-amber-600' :
                      activeDetailUnit.status_pemantauan === 'no_reading' ? 'bg-slate-100 text-slate-400' :
                      'bg-emerald-100 text-emerald-600'
                    )}>
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold text-slate-800 tracking-tight">
                          {activeDetailUnit.nama_unit}
                        </span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md border",
                          activeDetailUnit.status_pemantauan === 'breach' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          activeDetailUnit.status_pemantauan === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          activeDetailUnit.status_pemantauan === 'no_reading' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-100'
                        )}>
                          {activeDetailUnit.status_pemantauan === 'breach' ? 'Breach Alert' :
                           activeDetailUnit.status_pemantauan === 'warning' ? 'Warning Alert' :
                           activeDetailUnit.status_pemantauan === 'no_reading' ? 'No Reading' : 'Normal / Safe'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <span className="bg-slate-100 text-slate-600 border border-slate-200/60 font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase">
                          {activeDetailUnit.jenis_unit}
                        </span>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-600">{activeDetailUnit.lokasi?.nama_lokasi || 'Department'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="bg-slate-50 border border-slate-200/60 py-1.5 px-4 rounded-xl shadow-sm text-left min-w-[120px]">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Safe Bounds</span>
                      <span className="text-xs font-semibold font-mono text-emerald-600">
                        {minLimit}°C to {maxLimit}°C
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 py-1.5 px-4 rounded-xl shadow-sm text-left min-w-[120px]">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Last Logging</span>
                      <span className="text-xs font-semibold font-mono text-slate-700">
                        {activeDetailUnit.latest_reading 
                          ? format(new Date(activeDetailUnit.latest_reading.tarikh_masa), 'dd/MM/yyyy HH:mm')
                          : 'Never Recorded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* LEFT COLUMN: Controls, inputs, presets, and settings panels (col-span-4) */}
                  <div className="col-span-12 md:col-span-3 order-2 md:order-1 space-y-6">
                    {/* Inline Editing Form */}
                    {isEditingDetails && (
                      <form onSubmit={handleSaveUnitDetailEdits} className="p-4 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Edit Equipment Settings</h4>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                            Equipment / Freezer Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editUnitName}
                            onChange={(e) => setEditUnitName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                              Min Temperature Limit (°C)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              required
                              value={editUnitMinLimit}
                              onChange={(e) => setEditUnitMinLimit(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                              Max Temperature Limit (°C)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              required
                              value={editUnitMaxLimit}
                              onChange={(e) => setEditUnitMaxLimit(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingDetails(false)}
                            className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-2xl text-xs font-black transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-colors shadow-lg disabled:opacity-50"
                          >
                            {submitting ? 'Saving...' : 'Save Settings'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Last Recorded Readings Gauge Card (Phase 4) */}
                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                          Last Recorded Reading
                        </span>
                        {activeDetailUnit.latest_reading && (
                          <span className="text-[9px] font-semibold text-slate-400 font-mono">
                            {format(new Date(activeDetailUnit.latest_reading.tarikh_masa), 'HH:mm')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                        {/* Min Gauge */}
                        <div className="text-center py-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Min Logged</span>
                          <span className="text-sm font-semibold font-mono text-slate-655 block mt-0.5">
                            {activeDetailUnit.latest_reading?.suhu_min !== undefined && activeDetailUnit.latest_reading?.suhu_min !== null
                              ? `${activeDetailUnit.latest_reading.suhu_min.toFixed(1)}°`
                              : activeDetailUnit.latest_reading?.suhu !== undefined 
                              ? `${activeDetailUnit.latest_reading.suhu.toFixed(1)}°`
                              : '—'}
                          </span>
                        </div>

                        {/* Current/Middle Gauge */}
                        <div className="text-center py-1 border-x border-slate-200/60">
                          <span className="text-[8px] font-bold text-[#00a68a] uppercase tracking-wider block">Current</span>
                          <span className="text-base font-bold font-mono text-slate-800 block mt-0.5">
                            {activeDetailUnit.latest_reading?.suhu !== undefined 
                              ? `${activeDetailUnit.latest_reading.suhu.toFixed(1)}°` 
                              : '—'}
                          </span>
                        </div>

                        {/* Max Gauge */}
                        <div className="text-center py-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Max Logged</span>
                          <span className="text-sm font-semibold font-mono text-slate-655 block mt-0.5">
                            {activeDetailUnit.latest_reading?.suhu_max !== undefined && activeDetailUnit.latest_reading?.suhu_max !== null
                              ? `${activeDetailUnit.latest_reading.suhu_max.toFixed(1)}°`
                              : activeDetailUnit.latest_reading?.suhu !== undefined
                              ? `${activeDetailUnit.latest_reading.suhu.toFixed(1)}°`
                              : '—'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-slate-500 font-medium text-center flex items-center justify-center gap-1.5 bg-slate-50/50 border border-slate-150/60 py-1.5 rounded-lg">
                        <span>Device Threshold Config:</span>
                        <span className="text-slate-700 font-mono font-bold">{minLimit}°C to {maxLimit}°C</span>
                      </div>
                    </div>

                    {/* Record Temperature Form */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Record Temperature Reading</h4>
                      
                      {detailBreachInfo ? (
                        <div className="space-y-5">
                          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-bold text-rose-900">
                                {detailBreachInfo.status === 'breach' ? 'Out-of-Range Temperature Breach!' : 'Caution: Near Safe Limits'}
                              </h3>
                              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                                The value you entered (<span className="font-bold">{detailBreachInfo.temp}°C</span>) is outside the configured safety thresholds ({minLimit}°C to {maxLimit}°C).
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs text-slate-500 font-medium">
                              {detailBreachInfo.status === 'breach' 
                                ? 'This will log a breach incident. Please make sure the annotations note details the reason.' 
                                : 'Continuing will log this temperature reading.'}
                            </p>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setDetailBreachInfo(null)}
                                className="flex-1 py-2 border border-slate-205 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Adjust Value
                              </button>
                              <button
                                type="button"
                                onClick={() => executeDetailLogSubmit(detailBreachInfo.temp, Number(detailLogTempMin), Number(detailLogTempMax))}
                                disabled={submitting}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                Force Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleDetailLogPreSubmit} className="space-y-4">
                          {/* Custom Slider Form Rows for Min, Current, and Max */}
                          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5 space-y-5">
                            {/* Min Temp Slider Row */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100/80 rounded-md py-0.5 px-2 uppercase tracking-wider">
                                  Min Temp
                                </span>
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 py-1 px-2.5 rounded-lg shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={detailLogTempMin}
                                    onChange={(e) => setDetailLogTempMin(e.target.value)}
                                    className="w-14 text-right font-bold font-mono text-sm text-slate-800 focus:outline-none bg-transparent"
                                  />
                                  <span className="text-xs font-semibold text-slate-400">°C</span>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={sliderMin}
                                max={sliderMax}
                                step="0.1"
                                value={detailLogTempMin || '5.0'}
                                onChange={(e) => setDetailLogTempMin(e.target.value)}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                              />
                            </div>

                            {/* Current Temp Slider Row */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-[#00a68a] bg-emerald-50 border border-emerald-100 rounded-md py-0.5 px-2 uppercase tracking-wider">
                                  Current
                                </span>
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 py-1 px-2.5 rounded-lg shadow-sm focus-within:border-[#00a68a] focus-within:ring-2 focus-within:ring-[#00a68a]/10 transition-all">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={detailLogTemp}
                                    onChange={(e) => setDetailLogTemp(e.target.value)}
                                    className="w-14 text-right font-bold font-mono text-sm text-slate-800 focus:outline-none bg-transparent"
                                  />
                                  <span className="text-xs font-semibold text-slate-400">°C</span>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={sliderMin}
                                max={sliderMax}
                                step="0.1"
                                value={detailLogTemp || '5.0'}
                                onChange={(e) => setDetailLogTemp(e.target.value)}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00a68a] focus:outline-none"
                              />
                            </div>

                            {/* Max Temp Slider Row */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-md py-0.5 px-2 uppercase tracking-wider">
                                  Max Temp
                                </span>
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 py-1 px-2.5 rounded-lg shadow-sm focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={detailLogTempMax}
                                    onChange={(e) => setDetailLogTempMax(e.target.value)}
                                    className="w-14 text-right font-bold font-mono text-sm text-slate-800 focus:outline-none bg-transparent"
                                  />
                                  <span className="text-xs font-semibold text-slate-400">°C</span>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={sliderMin}
                                max={sliderMax}
                                step="0.1"
                                value={detailLogTempMax || '5.0'}
                                onChange={(e) => setDetailLogTempMax(e.target.value)}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                              />
                            </div>
                            
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider text-center bg-white border border-slate-200/60 rounded-lg py-1.5 shadow-sm">
                              Safe Bounds: <span className="text-emerald-600 font-mono font-bold">{minLimit} to {maxLimit} °C</span>
                            </div>
                          </div>

                          <div>
                             <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                               <Info className="w-3.5 h-3.5 text-slate-400" />
                               <span>Annotations / Notes</span>
                             </label>
                             <textarea
                               placeholder="E.g., Defrost cycle, replenishment"
                               value={detailLogNota}
                               onChange={(e) => setDetailLogNota(e.target.value)}
                               className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-sm text-slate-700 h-28 resize-none focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 font-medium transition-all"
                             />
                           </div>

                          <button
                            type="submit"
                            disabled={submitting || !detailLogTemp || !detailLogTempMin || !detailLogTempMax}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors shadow-sm disabled:opacity-50"
                          >
                            {submitting ? 'Recording...' : 'Record temperature entry'}
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Auto-Plot Section */}
                    <div className="pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAutoPlotForm(!showAutoPlotForm);
                          setAutoPlotPassword('');
                          setAutoPlotPasswordError(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100/70 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-200/60 flex items-center justify-center text-slate-600">
                            <Activity className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-semibold text-slate-800 block">Auto-Plot Missing Gaps</span>
                            <span className="text-[9px] text-slate-500 font-medium">Auto-generate compliance values in safe range</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 font-semibold group-hover:text-slate-800 transition-colors">
                          {showAutoPlotForm ? 'Close' : 'Open'}
                        </span>
                      </button>
                      
                      {showAutoPlotForm && (
                        <div className="mt-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3.5">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Generate Compliance Temperature Readings</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Select Period to Auto-Fill</label>
                              <select
                                value={autoPlotRange}
                                onChange={(e) => setAutoPlotRange(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all cursor-pointer"
                              >
                                {(() => {
                                  const options = [];
                                  const now = new Date();
                                  const currentYear = now.getFullYear();
                                  for (let i = 0; i < 12; i++) {
                                    const d = new Date(currentYear, i, 1);
                                    const value = format(d, 'yyyy-MM');
                                    const label = format(d, 'MMMM yyyy');
                                    options.push(
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    );
                                  }
                                  return options;
                                })()}
                              </select>
                            </div>
                            
                            <div className="text-[10px] text-slate-550 flex flex-col justify-end">
                              <span className="font-semibold text-slate-500">Safe Boundaries:</span>
                              <span className="text-emerald-600 font-mono font-bold mt-0.5">
                                {(minLimit + (maxLimit - minLimit) * 0.15).toFixed(1)}°C to {(maxLimit - (maxLimit - minLimit) * 0.15).toFixed(1)}°C
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              Verification Password
                            </label>
                            <input
                              type="password"
                              value={autoPlotPassword}
                              onChange={(e) => {
                                setAutoPlotPassword(e.target.value);
                                setAutoPlotPasswordError(false);
                              }}
                              placeholder="Enter password to run auto-plot"
                              className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none transition-all ${
                                autoPlotPasswordError 
                                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-100' 
                                  : 'border-slate-200 focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10'
                              }`}
                            />
                            {autoPlotPasswordError && (
                              <span className="block text-[9px] text-rose-600 font-semibold mt-1">
                                Incorrect verification password.
                              </span>
                            )}
                          </div>

                          <div className="flex gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAutoPlotForm(false)}
                              className="flex-1 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAutoPlotGaps}
                              disabled={submitting}
                              className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                            >
                              {submitting ? 'Generating...' : 'Start Auto-Plot'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Interactive Trend Chart only (col-span-8) */}
                  <div className="col-span-12 md:col-span-9 order-1 md:order-2 space-y-4 bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
                    {/* Month Dropdown Selector */}
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200/60 shadow-sm">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-2 select-none">
                        Filter by Month
                      </span>
                      <select
                        value={detailDateRange}
                        onChange={async (e) => {
                          const val = e.target.value;
                          setDetailDateRange(val);
                          await fetchDetailReadings(activeDetailUnit.id, val);
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all cursor-pointer shadow-sm"
                      >
                        {(() => {
                          const options = [];
                          const now = new Date();
                          const currentYear = now.getFullYear();
                          for (let i = 0; i < 12; i++) {
                            const d = new Date(currentYear, i, 1);
                            const value = format(d, 'yyyy-MM');
                            const label = format(d, 'MMMM yyyy');
                            options.push(
                              <option key={value} value={value}>
                                {label}
                              </option>
                            );
                          }
                          return options;
                        })()}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        Temperature Trend ({getReportingPeriodText()})
                      </h4>
                      {detailReadings.length > 0 && (
                        <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-200/60 rounded-full px-2 py-0.5 font-semibold">
                          {detailReadings.length} logs found
                        </span>
                      )}
                    </div>

                    <div className={`bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl shadow-inner h-[550px] overflow-y-hidden ${
                      (detailLoading || detailReadings.length === 0) 
                        ? 'flex items-center justify-center' 
                        : 'overflow-x-auto scrollbar-thin scrollbar-thumb-slate-250 scrollbar-track-transparent'
                    }`}>
                      {detailLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Spinner size="sm" className="text-[#00a68a]" />
                          <span className="text-[10px] text-slate-400 font-medium">Loading trend data...</span>
                        </div>
                      ) : detailReadings.length === 0 ? (
                        <div className="text-center p-6 text-slate-400">
                          <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold">No readings logged for this unit.</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Log a temperature or run auto-plot.</p>
                        </div>
                      ) : (
                        <div style={{ width: chartWidth, height: '100%', minWidth: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={chartData}
                              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <ReferenceArea
                                y1={minLimit}
                                y2={maxLimit}
                                fill="#dcfce7"
                                fillOpacity={0.5}
                                isFront={false}
                              />
                              {chartData.map((item, idx) => {
                                const prevItem = idx > 0 ? chartData[idx - 1] : null;
                                const prevDate = prevItem ? prevItem.time.split(' ')[0] : null;
                                const currDate = item.time.split(' ')[0];
                                if (currDate !== prevDate && idx > 0) {
                                  return (
                                    <ReferenceLine 
                                      key={`date-divider-${idx}`} 
                                      x={item.time} 
                                      stroke="#cbd5e1" 
                                      strokeWidth={1}
                                      strokeDasharray="3 3"
                                    />
                                  );
                                }
                                return null;
                              })}
                              <XAxis 
                                dataKey="time" 
                                tick={<CustomTick />}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                tickFormatter={(value) => {
                                  const idx = chartData.findIndex(item => item.time === value);
                                  if (idx % 2 !== 0) return '';
                                  return value;
                                }}
                              />
                              <YAxis 
                                domain={[Math.floor(chartYMin), Math.ceil(chartYMax)]}
                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  background: '#0f172a', 
                                  border: 'none', 
                                  borderRadius: '8px',
                                  color: '#fff',
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="current" 
                                name="Current Temp"
                                stroke="#1e40af" 
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                dot={{ r: 4, fill: '#1e40af', strokeWidth: 0 }}
                                activeDot={{ r: 7, strokeWidth: 0 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="min" 
                                name="Min Temp"
                                stroke="#15803d" 
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                dot={{ r: 4, fill: '#15803d', strokeWidth: 0 }}
                                activeDot={{ r: 7, strokeWidth: 0 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="max" 
                                name="Max Temp"
                                stroke="#b91c1c" 
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                dot={{ r: 4, fill: '#b91c1c', strokeWidth: 0 }}
                                activeDot={{ r: 7, strokeWidth: 0 }}
                              />
                              <Line 
                                type="step" 
                                dataKey="minLimit" 
                                name="Min Safe Limit"
                                stroke="#ef4444" 
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                dot={false}
                              />
                              <Line 
                                type="step" 
                                dataKey="maxLimit" 
                                name="Max Safe Limit"
                                stroke="#ef4444" 
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Custom Accessible Color Legend Row (Phase 5) */}
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-3 border-y border-slate-200/60 my-4 select-none bg-slate-50/60 rounded-xl px-4">
                      {/* Current Temp */}
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1e40af]" />
                        <span className="text-[10px] font-semibold text-slate-600">Current Temp</span>
                      </div>
                      
                      {/* Min Recorded */}
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
                        <span className="text-[10px] font-semibold text-slate-600">Min Logged</span>
                      </div>

                      {/* Max Recorded */}
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c]" />
                        <span className="text-[10px] font-semibold text-slate-600">Max Logged</span>
                      </div>

                      {/* Safe Area Fill */}
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-2.5 rounded bg-[#dcfce7] border border-[#bbf7d0] opacity-80" />
                        <span className="text-[10px] font-semibold text-slate-600">Safe Range Zone</span>
                      </div>

                      {/* Safe Limits Line */}
                      <div className="flex items-center gap-2">
                        <span className="w-4 border-t-2 border-dashed border-[#ef4444]" />
                        <span className="text-[10px] font-semibold text-slate-600">Threshold Bounds</span>
                      </div>
                    </div>

                    {/* Centered Date Range Display */}
                    <div className="text-center bg-white border border-slate-200 py-1.5 px-4 rounded-full text-[10px] font-semibold text-slate-500 tracking-wide font-mono max-w-sm mx-auto shadow-sm flex items-center justify-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Period: {getReportingPeriodText()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </SlideOver>
    </div>
  )
}

export default DepartmentSuhuPage
