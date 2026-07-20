import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ExternalLink, 
  Database, 
  Clock, 
  Search, 
  Plus, 
  RefreshCw, 
  X, 
  Info, 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Check, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { 
  Button, 
  Badge, 
  Spinner, 
  Modal, 
  Input, 
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui'
import { isSupabaseConfigured } from '@/services/supabase'
import { 
  getDiskChangeLogs, 
  saveDiskChangeLog, 
  getNavigationLogs, 
  logExternalNavigation,
  type DiskChangeLog,
  type NavigationLog
} from '../services/myphisService'

export const MyPhisDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const hospitalId = user?.hospital_id || 'hosp-1'
  const petugasNama = user?.full_name || 'Muhammad Farhan'
  const userId = user?.id || 'user-1'


  // State variables
  const [diskChanges, setDiskChanges] = useState<DiskChangeLog[]>([])
  const [navLogs, setNavLogs] = useState<NavigationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<DiskChangeLog | null>(null)
  
  // Form State
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formDiskLabel, setFormDiskLabel] = useState('')
  const [formCustomLabel, setFormCustomLabel] = useState('')
  const [formStatus, setFormStatus] = useState<'completed' | 'failed' | 'pending'>('completed')
  const [formNota, setFormNota] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters State
  const [diskSearch, setDiskSearch] = useState('')
  const [navSearch, setNavSearch] = useState('')
  const [activeTab, setActiveTab] = useState('disk-logs')

  // Month selector state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()) // 0-11
  const [tableMonthFilter, setTableMonthFilter] = useState<string>('all')

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  // Get current date formatted in local time
  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])


  // Generate all days of the selected month
  const dateList = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const d = new Date(currentYear, currentMonth, 1 + i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const isFuture = dateStr > todayStr
      return {
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
        isFuture
      }
    })
  }, [currentYear, currentMonth, todayStr])

  // Get number of blank placeholders to prepend for Monday-start calendar
  const placeholders = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon, ...
    const count = firstDay === 0 ? 6 : firstDay - 1;
    return Array.from({ length: count });
  }, [currentYear, currentMonth])



  // Fetch all logs
  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    else setLoading(true)
    
    try {
      const [diskRes, navRes] = await Promise.all([
        getDiskChangeLogs(hospitalId),
        getNavigationLogs(hospitalId)
      ])

      if (diskRes.data) {
        setDiskChanges(diskRes.data)
      }
      if (navRes.data) {
        setNavLogs(navRes.data)
      }
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [hospitalId])

  // Check for missed disk changes in the selected month (excluding today and weekends)
  const missedDays = useMemo(() => {
    return dateList.filter(d => {
      if (d.isToday || d.isFuture) return false
      
      const parts = d.dateStr.split('-')
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
      if (isWeekend) return false

      const log = diskChanges.find(l => l.tarikh === d.dateStr)
      return !log || log.status !== 'completed'
    })
  }, [dateList, diskChanges])

  // Filtered lists
  const filteredDiskChanges = useMemo(() => {
    return diskChanges.filter(log => {
      const logDate = new Date(log.tarikh)
      const matchesMonth = tableMonthFilter === 'all' || logDate.getMonth() === parseInt(tableMonthFilter)
      
      const term = diskSearch.toLowerCase()
      const matchesSearch = (
        log.disk_label.toLowerCase().includes(term) ||
        log.petugas_nama.toLowerCase().includes(term) ||
        (log.nota && log.nota.toLowerCase().includes(term)) ||
        log.tarikh.includes(term)
      )
      return matchesMonth && matchesSearch
    })
  }, [diskChanges, diskSearch, tableMonthFilter])

  const filteredNavLogs = useMemo(() => {
    return navLogs.filter(log => {
      const logDate = new Date(log.tarikh_masa)
      const matchesMonth = tableMonthFilter === 'all' || logDate.getMonth() === parseInt(tableMonthFilter)
      
      const term = navSearch.toLowerCase()
      const matchesSearch = (
        log.destination_name.toLowerCase().includes(term) ||
        log.petugas_nama.toLowerCase().includes(term) ||
        log.destination_url.toLowerCase().includes(term)
      )
      return matchesMonth && matchesSearch
    })
  }, [navLogs, navSearch, tableMonthFilter])

  // Open modal for a specific day
  const handleOpenLogModal = (dateStr: string, existingLog?: DiskChangeLog) => {
    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
    
    // Determine default disk label based on day of week
    const d = new Date(dateStr)
    const labels = ['DISK-SUN', 'DISK-MON', 'DISK-TUE', 'DISK-WED', 'DISK-THU', 'DISK-FRI', 'DISK-SAT']
    const defaultLabel = labels[d.getDay()]

    if (existingLog) {
      setSelectedLog(existingLog)
      setFormDate(existingLog.tarikh)
      setFormTime(existingLog.waktu)
      
      const isPreset = labels.includes(existingLog.disk_label)
      if (isPreset) {
        setFormDiskLabel(existingLog.disk_label)
        setFormCustomLabel('')
      } else {
        setFormDiskLabel('custom')
        setFormCustomLabel(existingLog.disk_label)
      }
      setFormStatus(existingLog.status)
      setFormNota(existingLog.nota || '')
    } else {
      setSelectedLog(null)
      setFormDate(dateStr)
      setFormTime(timeStr)
      setFormDiskLabel(defaultLabel)
      setFormCustomLabel('')
      setFormStatus('completed')
      setFormNota('')
    }
    setFormError('')
    setIsModalOpen(true)
  }

  // Handle saving the disk change log
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    const label = formDiskLabel === 'custom' ? formCustomLabel.trim() : formDiskLabel
    
    if (!label) {
      setFormError('Disk label is required.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await saveDiskChangeLog({
        tarikh: formDate,
        waktu: formTime,
        disk_label: label,
        status: formStatus,
        petugas_nama: petugasNama,
        dicatat_oleh: userId,
        nota: formNota.trim() || null,
        hospital_id: hospitalId
      })

      if (res.error) {
        setFormError(res.error)
      } else {
        setIsModalOpen(false)
        await loadData(true)
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto plot missing logs for the selected month
  const handleAutoPlotLogs = async () => {
    const password = window.prompt("Enter password to use Auto Plot:")
    if (password === null) return // User cancelled prompt
    if (password !== ' F@rmasi.2016 ' && password.trim() !== 'F@rmasi.2016') {
      alert("Incorrect password!")
      return
    }

    const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Check if any days in this month already have completed records
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    let hasExisting = false
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (dateStr > todayStr) continue
      const existingLog = diskChanges.find(l => l.tarikh === dateStr)
      if (existingLog && existingLog.status === 'completed') {
        hasExisting = true
        break
      }
    }

    let overwrite = false
    if (hasExisting) {
      overwrite = window.confirm(`Some days in ${monthName} already have records. Do you want to overwrite all existing records to re-plot and randomize them? (Cancel will only plot completely missing days)`)
    } else {
      if (!window.confirm(`Auto-plot missing logs for ${monthName}?`)) {
        return
      }
    }

    const logsToSave = []
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      
      // Only plot logs for past days or today
      if (dateStr > todayStr) {
        continue;
      }
      
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      
      // Saturday and Sunday: no need to record
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      
      // Check if a completed log already exists for this date
      const existingLog = diskChanges.find(l => l.tarikh === dateStr);
      if (existingLog && existingLog.status === 'completed' && !overwrite) {
        continue;
      }
      
      const isHoliday = isWeekendOrPublicHoliday(d);
      
      // Determine time
      let waktu = '';
      if (isHoliday) {
        // Public holiday: 1:00 pm - 1:30 pm -> e.g. 13:15
        const randMin = Math.floor(Math.random() * 30);
        waktu = `13:${String(randMin).padStart(2, '0')}`;
      } else {
        // Weekday: 4:30 pm - 5:00 pm -> e.g. 16:45
        const randMin = 30 + Math.floor(Math.random() * 30);
        if (randMin === 60) {
          waktu = '17:00';
        } else {
          waktu = `16:${String(randMin).padStart(2, '0')}`;
        }
      }
      
      // Determine disk label based on day of week
      const labels = ['DISK-SUN', 'DISK-MON', 'DISK-TUE', 'DISK-WED', 'DISK-THU', 'DISK-FRI', 'DISK-SAT'];
      const diskLabel = labels[dayOfWeek];

      // Randomly select responsible officer
      const officers = ['Amri Amit', 'Kamriah bt Haji Mail', 'Mohamad Aiman', 'Nurul Asyiqin'];
      const randomOfficer = officers[Math.floor(Math.random() * officers.length)];
      
      logsToSave.push({
        tarikh: dateStr,
        waktu,
        disk_label: diskLabel,
        status: 'completed' as const,
        petugas_nama: randomOfficer,
        dicatat_oleh: userId,
        nota: null,
        hospital_id: hospitalId
      })
    }
    
    if (logsToSave.length === 0) {
      alert("All eligible days in this month already have records!");
      return;
    }
    
    try {
      setLoading(true)
      for (const log of logsToSave) {
        await saveDiskChangeLog(log)
      }
      await loadData(true)
    } catch (err: any) {
      console.error(err)
      alert("Error occurred while auto plotting logs: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Generate modern monthly backup rotation PDF report
  const handleGeneratePdfReport = async () => {
    try {
      setLoading(true)
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      // Helper to fetch and base64-encode image locally
      const getBase64ImageFromUrlLocal = async (imageUrl: string): Promise<string | null> => {
        try {
          const res = await fetch(imageUrl)
          const blob = await res.blob()
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
          })
        } catch (error) {
          console.error('Failed to load image:', error)
          return null
        }
      }

      const activeMonthIndex = tableMonthFilter === 'all' ? currentMonth : parseInt(tableMonthFilter)
      const monthName = new Date(currentYear, activeMonthIndex).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      })

      // Load Jata Negara logo
      const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png')

      // Draw Jata Negara if loaded
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 14, 11, 16, 13)
        } catch (e) {
          console.error('Failed to draw logo on pdf', e)
        }
      }

      // KKM Header Block
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42) // slate-900
      doc.text('KEMENTERIAN KESIHATAN MALAYSIA', 33, 15)

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(71, 85, 105) // slate-600
      doc.text('HOSPITAL OPERATION MANAGEMENT ECOSYSTEM (HOME)', 33, 19)
      doc.text('Unit Logistik Farmasi (Pharmacy Logistics Unit)', 33, 23)

      // Double line dividing header (Classic Malaysian Gov Style)
      doc.setDrawColor(15, 23, 42)
      doc.setLineWidth(0.8)
      doc.line(14, 27, 196, 27)
      doc.setLineWidth(0.2)
      doc.line(14, 28.5, 196, 28.5)

      // Document Title
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(12.5)
      doc.setTextColor(15, 23, 42)
      doc.text('DAILY BACKUP DISK ROTATION REPORT (PHiS Module)', 14, 37)

      // Metadata Info Blocks
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(71, 85, 105)
      doc.text('Report Month:', 14, 44)
      doc.setFont('Helvetica', 'normal')
      doc.text(monthName.toUpperCase(), 37, 44)

      doc.setFont('Helvetica', 'bold')
      doc.text('System Source:', 14, 49)
      doc.setFont('Helvetica', 'normal')
      doc.text('Generated from HOME System', 37, 49)

      doc.setFont('Helvetica', 'bold')
      doc.text('Date Generated:', 122, 44)
      doc.setFont('Helvetica', 'normal')
      doc.text(new Date().toLocaleString('en-GB'), 148, 44)

      doc.setFont('Helvetica', 'bold')
      doc.text('Status:', 122, 49)
      doc.setFont('Helvetica', 'normal')
      doc.text('COMPLIANCE SECURED', 148, 49)

      // Filter and sort the logs chronologically ascending (1st to end of month)
      const reportLogs = diskChanges.filter(log => {
        const logDate = new Date(log.tarikh)
        const matchesMonth = tableMonthFilter === 'all'
          ? logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
          : logDate.getMonth() === parseInt(tableMonthFilter) && logDate.getFullYear() === currentYear
        return matchesMonth
      }).sort((a, b) => a.tarikh.localeCompare(b.tarikh))

      const tableHeaders = [['No.', 'Date', 'Time', 'Disk Label', 'Responsible Officer', 'Status', 'Remarks']]
      const tableRows = reportLogs.map((log, index) => {
        const parts = log.tarikh.split('-')
        const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        const formattedDate = dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        
        return [
          index + 1,
          formattedDate,
          log.waktu,
          log.disk_label,
          log.petugas_nama,
          log.status.toUpperCase(),
          log.nota && !log.nota.startsWith('Auto-plotted') ? log.nota : '-'
        ]
      })

      autoTable(doc, {
        startY: 55,
        head: tableHeaders,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }, // slate-900
        styles: { fontSize: 8, font: 'Helvetica', cellPadding: 2 },
        margin: { left: 14, right: 14 }
      })

      let finalY = (doc as any).lastAutoTable.finalY + 22

      // Check if signature block fits, if not, add page
      if (finalY > 245) {
        doc.addPage()
        finalY = 25
      }

      doc.setDrawColor(203, 213, 225) // slate-300
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(71, 85, 105)

      // Prepared By Column
      doc.text('Prepared By:', 14, finalY)
      doc.setFont('Helvetica', 'normal')
      doc.text('................................................................', 14, finalY + 18)
      doc.text('Signature & Stamp', 14, finalY + 22)
      doc.text('Name: ....................................................', 14, finalY + 27)
      doc.text('Designation: Pharmacy Assistant', 14, finalY + 32)
      doc.text('Date: .....................................................', 14, finalY + 37)

      // Checked & Verified By Column
      doc.setFont('Helvetica', 'bold')
      doc.text('Checked & Verified By:', 120, finalY)
      doc.setFont('Helvetica', 'normal')
      doc.text('................................................................', 120, finalY + 18)
      doc.text('Signature & Stamp (Unit Head)', 120, finalY + 22)
      doc.text('Name: ....................................................', 120, finalY + 27)
      doc.text('Designation: Chief Pharmacist / Officer', 120, finalY + 32)
      doc.text('Date: .....................................................', 120, finalY + 37)

      const fileMonthLabel = monthName.replace(' ', '_')
      doc.save(`Backup_Rotation_Report_${fileMonthLabel}.pdf`)
    } catch (err: any) {
      console.error(err)
      alert("Failed to generate PDF report: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle external portal navigation and security audit logging
  const handleExternalLink = (name: string, url: string) => {
    // Open window synchronously to bypass mobile popup blockers
    window.open(url, '_blank', 'noopener,noreferrer')

    // Log in the background asynchronously
    logExternalNavigation(url, name, petugasNama, userId, hospitalId)
      .catch((err) => {
        console.error('Failed to log navigation', err)
      })
      .finally(() => {
        loadData(true) // Refresh logs list
      })
  }

  // Helper to check if a date is a weekend or a Malaysian public holiday
  const isWeekendOrPublicHoliday = (date: Date): boolean => {
    const day = date.getDay();
    if (day === 0 || day === 6) return true; // Sunday or Saturday
    
    const y = date.getFullYear();
    const m = date.getMonth(); // 0-indexed
    const d = date.getDate();

    // Support 2026 Malaysia national public holidays
    if (y === 2026) {
      // New Year's Day: Jan 1
      if (m === 0 && d === 1) return true;
      
      // Thaipusam: Feb 1, observed Feb 2 (Monday)
      if (m === 1 && (d === 1 || d === 2)) return true;
      
      // Chinese New Year: Feb 17 & Feb 18
      if (m === 1 && (d === 17 || d === 18)) return true;
      
      // Hari Raya Aidilfitri: March 21 & March 22, observed March 23 (Monday)
      if (m === 2 && (d === 21 || d === 22 || d === 23)) return true;
      
      // Labour Day: May 1
      if (m === 4 && d === 1) return true;
      
      // Hari Raya Haji: May 27
      if (m === 4 && d === 27) return true;
      
      // Wesak Day: May 31, observed June 1 (Monday)
      if (m === 4 && d === 31) return true;
      
      // Agong's Birthday: June 1, observed June 2 (Monday) due to Wesak
      if (m === 5 && (d === 1 || d === 2)) return true;
      
      // Awal Muharram: June 17
      if (m === 5 && d === 17) return true;
      
      // Prophet Muhammad's Birthday (Maulidur Rasul): August 25
      if (m === 7 && d === 25) return true;
      
      // National Day: August 31
      if (m === 7 && d === 31) return true;
      
      // Malaysia Day: September 16
      if (m === 8 && d === 16) return true;
      
      // Deepavali: November 8, observed November 9 (Monday)
      if (m === 10 && (d === 8 || d === 9)) return true;
      
      // Christmas Day: December 25
      if (m === 11 && d === 25) return true;
    } else {
      // Basic fixed date holiday check for other years
      if (m === 0 && d === 1) return true; // New Year
      if (m === 4 && d === 1) return true; // Labour Day
      if (m === 7 && d === 31) return true; // National Day
      if (m === 11 && d === 25) return true; // Christmas
    }
    return false;
  }

  // Render day color styling inside the visual calendar grid
  const getDayGridStyles = (dateStr: string) => {
    const log = diskChanges.find(l => l.tarikh === dateStr)
    const isToday = dateStr === todayStr
    const isPast = dateStr < todayStr
    
    const parts = dateStr.split('-')
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    const isHoliday = isWeekendOrPublicHoliday(dateObj)
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

    if (log) {
      if (log.status === 'completed') {
        return {
          bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800',
          badgeColor: 'success',
          statusText: 'Completed',
          icon: <Check className="w-5 h-5 text-emerald-600" />
        }
      }
      return {
        bgColor: 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800',
        badgeColor: 'error',
        statusText: 'Failed',
        icon: <AlertCircle className="w-5 h-5 text-rose-600" />
      }
    }

    // Weekend with NO log: always render neutral "Weekend" with no warning icon
    if (isWeekend) {
      return {
        bgColor: 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200/60 text-slate-400',
        badgeColor: 'gray',
        statusText: 'Weekend',
        icon: null
      }
    }

    if (isToday) {
      if (isHoliday) {
        return {
          bgColor: 'bg-indigo-50/40 hover:bg-indigo-100/50 border-indigo-150 text-indigo-700',
          badgeColor: 'indigo',
          statusText: 'Pending (Holiday)',
          icon: <AlertTriangle className="w-5 h-5 text-indigo-400 animate-pulse" />
        }
      }
      return {
        bgColor: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800',
        badgeColor: 'warning',
        statusText: 'Pending Today',
        icon: <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
      }
    }

    if (isPast) {
      if (isHoliday) {
        return {
          bgColor: 'bg-indigo-50/40 hover:bg-indigo-100/50 border-indigo-200 text-indigo-700',
          badgeColor: 'indigo',
          statusText: 'Missed (Holiday)',
          icon: <AlertTriangle className="w-5 h-5 text-indigo-400" />
        }
      }
      return {
        bgColor: 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800',
        badgeColor: 'error',
        statusText: 'Missed Log',
        icon: <AlertTriangle className="w-5 h-5 text-rose-500" />
      }
    }

    if (isHoliday) {
      return {
        bgColor: 'bg-indigo-50/20 border-indigo-100 text-indigo-400',
        badgeColor: 'indigo',
        statusText: 'Weekend / Holiday',
        icon: null
      }
    }

    return {
      bgColor: 'bg-slate-50/45 border-slate-100 text-slate-300',
      badgeColor: 'gray',
      statusText: 'Future',
      icon: null
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Loading MyPHiS Integration Hub...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] relative font-sans overflow-x-hidden pb-16 text-slate-800">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-8">
        {/* Breadcrumbs & Header Section */}
        <div className="space-y-4">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <button onClick={() => navigate('/pharmacy')} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              Pharmacy
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-extrabold tracking-wide">MyPHiS Integration Hub</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                  MyPHiS Integration Hub
                </h1>
                <p className="text-slate-500 font-semibold text-[11px]">
                  Launch external Pharmacy Information Systems and track daily server backup disk swaps.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* Connection status badge */}
              <Badge variant={isSupabaseConfigured() ? 'success' : 'warning'} className="gap-1.5 font-medium py-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isSupabaseConfigured() ? 'Supabase Connected' : 'Offline / Local Storage Mode'}
              </Badge>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadData(true)} 
                disabled={refreshing}
                className="flex items-center gap-1 bg-white hover:bg-slate-50 border-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>




      {/* Warnings & Alerts */}
      {missedDays.length > 0 && (
        <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-900 animate-fadeIn">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-sm flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-rose-950">Action Required: Missed Backup Disk Change Logs</p>
              <p className="text-rose-800 text-xs mt-0.5 max-w-2xl leading-relaxed">
                There {missedDays.length === 1 ? 'is 1 missed backup swap' : `are ${missedDays.length} missed backup swaps`} in the current month. 
                Please complete the logs by selecting the highlighted days in the rotation calendar below.
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            onClick={() => handleOpenLogModal(missedDays[0].dateStr)}
            className="bg-rose-600 hover:bg-rose-700 text-white border-transparent shrink-0 self-start sm:self-center font-semibold text-xs py-2 px-3 shadow-sm"
          >
            Log Most Recent ({new Date(missedDays[0].dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
          </Button>
        </div>
      )}


      {/* Section 1: External Portal Navigation Launchpad */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <span>Official PHiS Portals</span>
          <Badge variant="gray" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5">Audited Navigation</Badge>
        </h2>
        <p className="text-slate-600 text-sm font-medium mb-4">
          All clicks to external systems are securely recorded with timestamp and username for security and compliance audits.
        </p>
        
        <div className="max-w-md">
          {[
            {
              name: 'Official PHiS Portal',
              url: 'http://10.191.105.190:8080/iphis/login.zul;jsessionid=48a6aa512832d6dda17c6e544ea0',
              desc: 'Log in to the Pharmacy Information System. Complete prescriptions, dispense items, and check state inventories.',
              badge: 'System Access'
            }
          ].map(portal => (
            <div 
              key={portal.name}
              className="group flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <Badge variant="gray" className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5">{portal.badge}</Badge>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{portal.name}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{portal.desc}</p>
              </div>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => handleExternalLink(portal.name, portal.url)}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm py-2"
              >
                Launch Portal
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Daily Backup Disk Rotation Tracker */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-0.5">Daily Backup Disk Rotation</h2>
              <p className="text-slate-500 text-xs">
                Everyday disk swaps are mandatory for the local database server backup routine. Select any day to record or edit logs.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Month selection dropdown */}
              <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm uppercase tracking-wider w-full sm:min-w-[150px] appearance-none text-center h-9"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem 1.25rem',
                    backgroundRepeat: 'no-repeat',
                    paddingRight: '2.5rem'
                  }}
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthLabel = new Date(currentYear, i).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return (
                      <option key={i} value={i} className="text-slate-800 bg-white font-semibold normal-case">
                        {monthLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoPlotLogs}
                className="flex items-center justify-center gap-1.5 shadow-sm font-semibold border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 h-9 transition-all px-3.5 whitespace-nowrap flex-1 sm:flex-initial"
              >
                <RefreshCw className="w-4 h-4" />
                Auto Plot
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleOpenLogModal(todayStr)}
                className="flex items-center justify-center gap-1.5 shadow-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 h-9 px-3.5 whitespace-nowrap flex-1 sm:flex-initial"
              >
                <Plus className="w-4 h-4" />
                Log Disk Swap
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar headers */}
        <div className="grid grid-cols-7 gap-3 mb-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider select-none border-b border-slate-100 pb-2">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-indigo-500 font-black">Sat</div>
          <div className="text-indigo-500 font-black">Sun</div>
        </div>

        {/* Calendar visual Grid (showing Mon-Sun fixed grid layout) */}
        <div className="grid grid-cols-7 gap-3 mb-6">
          {placeholders.map((_, idx) => (
            <div 
              key={`placeholder-${idx}`} 
              className="bg-slate-50/20 border border-dashed border-slate-200/50 rounded-xl min-h-[92px] opacity-25"
            />
          ))}
          {dateList.map(day => {
            const styles = getDayGridStyles(day.dateStr)
            const log = diskChanges.find(l => l.tarikh === day.dateStr)
            return (
              <button
                key={day.dateStr}
                disabled={day.isFuture}
                onClick={() => handleOpenLogModal(day.dateStr, log)}
                className={`relative flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all ${styles.bgColor} min-h-[92px] ${day.isFuture ? 'cursor-not-allowed pointer-events-none opacity-60' : ''}`}
              >
                {day.isToday && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white" title="Today" />
                )}
                
                <div className="flex justify-end w-full">
                  <span className="text-xs font-black font-mono leading-none">{day.dayNum}</span>
                </div>
                
                <div className="my-1">
                  {styles.icon ? (
                    styles.icon
                  ) : (
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full block mx-auto" />
                  )}
                </div>
                
                <div className="text-[8px] font-extrabold uppercase tracking-wider truncate max-w-full leading-none">
                  {styles.statusText}
                </div>
              </button>
            )
          })}
        </div>
        
        {/* Color key */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="font-medium text-slate-400 uppercase text-[10px] tracking-wider mr-2">Status Key:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 block border border-emerald-600/10" /> Swapped Successfully
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 block border border-amber-600/10" /> Pending (Today)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 block border border-rose-600/10" /> Missed / Failure Alert
          </span>
          <span className="flex items-center gap-1.5 animate-fadeIn">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500 block border border-indigo-600/10" /> Weekend / Holiday (Unrecorded)
          </span>
        </div>
      </div>

      {/* Section 3: Audit Tables (Tabs Layout) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-slate-100 gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100 p-1 rounded-lg self-start">
              <TabsTrigger value="disk-logs" className="px-4 py-1.5 rounded text-xs font-semibold">
                Backup Rotations
              </TabsTrigger>
              <TabsTrigger value="click-logs" className="px-4 py-1.5 rounded text-xs font-semibold">
                External Click Audit
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Month Filter Dropdown */}
            <div className="relative w-full sm:w-44">
              <select
                value={tableMonthFilter}
                onChange={(e) => setTableMonthFilter(e.target.value)}
                className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none pr-8 h-9 animate-fadeIn"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1rem 1rem',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <option value="all">All Months</option>
                {Array.from({ length: 12 }).map((_, i) => {
                  const label = new Date(currentYear, i).toLocaleDateString('en-US', { month: 'long' });
                  return (
                    <option key={i} value={i} className="normal-case">
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search Input bar */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={activeTab === 'disk-logs' ? 'Search disk logs...' : 'Search portal clicks...'}
                value={activeTab === 'disk-logs' ? diskSearch : navSearch}
                onChange={e => activeTab === 'disk-logs' ? setDiskSearch(e.target.value) : setNavSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-sm h-9"
              />
            </div>

            {activeTab === 'disk-logs' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePdfReport}
                className="flex items-center gap-1.5 shadow-sm font-semibold border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50/20 h-9 transition-all px-4 whitespace-nowrap"
              >
                <FileText className="w-4 h-4 text-red-500" />
                Export PDF
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="disk-logs" className="m-0">
            {filteredDiskChanges.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm">No disk change records found matching search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-medium">
                      <th className="p-4 pl-6">Date</th>
                      <th className="p-4">Time</th>
                      <th className="p-4">Disk Label</th>
                      <th className="p-4">Responsible Officer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Remarks</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDiskChanges.map(log => {
                      const isMissedRetroactive = log.status === 'completed' && log.created_at && 
                        new Date(log.created_at).toISOString().split('T')[0] > log.tarikh
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6 font-semibold text-slate-900">
                            {new Date(log.tarikh).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="p-4 text-slate-500">{log.waktu}</td>
                          <td className="p-4 font-mono font-medium">
                            <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded">{log.disk_label}</span>
                          </td>
                          <td className="p-4">{log.petugas_nama}</td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={log.status === 'completed' ? 'success' : 'error'} size="sm">
                                {log.status === 'completed' ? 'Success' : 'Failed'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 max-w-[200px] truncate" title={log.nota && !log.nota.startsWith('Auto-plotted') ? log.nota : ''}>
                            {log.nota && !log.nota.startsWith('Auto-plotted') ? log.nota : '-'}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenLogModal(log.tarikh, log)}
                              className="text-blue-600 hover:bg-blue-50 font-medium px-2 h-7"
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="click-logs" className="m-0">
            {filteredNavLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm">No navigation click audits found matching search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-medium">
                      <th className="p-4 pl-6">Timestamp</th>
                      <th className="p-4">Destination Portal</th>
                      <th className="p-4">Target URL</th>
                      <th className="p-4 pr-6">Accessed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredNavLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 text-slate-500">
                          {new Date(log.tarikh_masa).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-4 font-semibold text-slate-900">{log.destination_name}</td>
                        <td className="p-4 font-mono text-xs text-blue-600 max-w-[250px] truncate" title={log.destination_url}>
                          {log.destination_url}
                        </td>
                        <td className="p-4 pr-6">{log.petugas_nama}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Log Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLog ? 'Edit Disk Change Log' : 'New Disk Change Log'}
        description={`Record backup rotation status for ${new Date(formDate || todayStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`}
        size="md"
      >
        <form onSubmit={handleSaveLog} className="space-y-4">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Readonly Date display */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Backup Date</label>
            <Input
              type="date"
              value={formDate}
              disabled
              className="bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Swap Time input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Swap Time</label>
              <Input
                type="time"
                value={formTime}
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
                required
              />
            </div>
            
            {/* Responsible officer display (Prefilled & Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Responsible Officer</label>
              <Input
                type="text"
                value={petugasNama}
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Disk Label selection dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Disk Label Preset</label>
              <select
                value={formDiskLabel}
                onChange={e => setFormDiskLabel(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DISK-MON">DISK-MON</option>
                <option value="DISK-TUE">DISK-TUE</option>
                <option value="DISK-WED">DISK-WED</option>
                <option value="DISK-THU">DISK-THU</option>
                <option value="DISK-FRI">DISK-FRI</option>
                <option value="DISK-SAT">DISK-SAT</option>
                <option value="DISK-SUN">DISK-SUN</option>
                <option value="custom">Custom Label...</option>
              </select>
            </div>

            {/* Rotation swap status selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Rotational Status</label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as any)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="completed">Completed Successfully</option>
                <option value="failed">Swap Failure / Alert</option>
              </select>
            </div>
          </div>

          {/* Conditional Custom Disk Label text input */}
          {formDiskLabel === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Custom Label Name</label>
              <Input
                type="text"
                placeholder="e.g. DISK-WEEK-1A"
                value={formCustomLabel}
                onChange={e => setFormCustomLabel(e.target.value)}
                required
              />
            </div>
          )}

          {/* Rotation remarks notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks & Swapping Notes</label>
            <textarea
              placeholder="Provide a short description of the rotation (e.g. disk swap complete, server checked, any warnings)."
              value={formNota}
              onChange={e => setFormNota(e.target.value)}
              rows={3}
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Footer buttons */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              loading={isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {selectedLog ? 'Save Changes' : 'Record Log'}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </div>
  )
}

export default MyPhisDashboardPage

