// src/modules/mystaff/pages/StaffOrgChartPage.tsx
// Enterprise-Grade Organizational Chart — Dark Glassmorphic Design
// Inspired by Linear.app, Vercel, and Stripe design systems

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Network, Search, ArrowLeft, ChevronRight, Building2,
  Mail, Phone, Clock, CheckCircle2, Printer, ZoomIn, ZoomOut,
  RotateCcw, LayoutGrid, GitFork, ListFilter, Layers, Edit3,
  Plus, Trash2, Save, X, AlertTriangle, UserPlus, Zap, UserX,
  Crown, ChevronUp, ChevronDown, Palmtree, SlidersHorizontal,
  BadgeCheck, Dot, MoreHorizontal, ArrowUpRight, Calendar,
  Briefcase, Cloud, CloudOff, RefreshCw
} from 'lucide-react'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { getUsers } from '@/services/userService'
import { JATA_NEGARA_BASE64 } from '@/modules/mytransporter/pages/jataNegaraBase64'
import {
  fetchOrgChartFromCloud,
  saveOrgChartToCloud,
  subscribeToOrgChartCloud,
  DEFAULT_HOSPITAL_ID,
  DEFAULT_CHART_KEY,
  getCachedOrgChart,
  setCachedOrgChart,
} from '../services/staffOrgChartService'

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface OrgNode {
  id: string
  name: string
  role: string
  grade: string
  department: string
  unit: string
  email: string
  phone?: string
  avatar?: string
  status: 'active' | 'leave' | 'movement' | 'course' | 'vacant'
  statusDetail?: string
  reportsTo?: string | null
  children?: OrgNode[]
}

export interface RealSystemUser {
  id: string
  full_name: string
  email: string
  phone_number?: string
  jawatan?: string
  profile_photo_url?: string
  department_name?: string
  status?: string
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CURRENT_STORAGE_KEY = 'mystaff_org_chart_data_v10'
const STORAGE_KEYS = [
  CURRENT_STORAGE_KEY,
  'mystaff_org_chart_data_v9',
  'mystaff_org_chart_data_v8',
  'mystaff_org_chart_data_v7',
  'mystaff_org_chart_data_v6',
  'mystaff_org_chart_data_v5',
  'mystaff_org_chart_data',
  'mystaff_org_chart_data_v4',
  'mystaff_org_chart_data_v3',
]

export const extractGradeFromSystem = (jawatan?: string): string => {
  if (!jawatan) return ''
  const match = jawatan.trim().match(/\b([A-Z]{1,3}\s*\d{1,2}(?:\s*TBK\s*\d?)?)\b/i)
  return match ? match[1].replace(/\s+/g, '').toUpperCase() : ''
}

export const cleanNodeUnit = (node: OrgNode): OrgNode => {
  let unit = (node.unit || 'pharmacy satelite').trim()
  const unitLower = unit.toLowerCase()
  if (
    unitLower.includes('pathology') || unitLower.includes('patologi') ||
    unitLower.includes('makmal') || unitLower.includes('lab') ||
    unitLower.includes('radiology') || unitLower.includes('emergency') ||
    unitLower.includes('kecemasan') || unitLower.includes('rehab') ||
    unitLower.includes('nursing') || unitLower.includes('jururawat') ||
    unitLower.includes('warrant') || unitLower.startsWith('my')
  ) {
    const roleLower = (node.role || '').toLowerCase()
    unit = roleLower.includes('logistik') || roleLower.includes('stor') || roleLower.includes('bekalan')
      ? 'Pharmacy logistic'
      : (roleLower.includes('pengarah') || roleLower.includes('pentadbiran') ? 'Pengurusan & Pentadbiran' : 'pharmacy satelite')
  }
  const dept = node.department || (unit.toLowerCase().includes('pengurusan') ? 'Pengurusan & Pentadbiran' : 'Jabatan Farmasi')
  return { ...node, unit, department: dept, children: node.children ? node.children.map(cleanNodeUnit) : [] }
}

const REAL_SYSTEM_DEFAULT_ORG: OrgNode = {
  id: 'node-root-pengarah',
  name: '(Kekosongan Jawatan)',
  role: 'PENGARAH HOSPITAL LAWAS',
  grade: 'UD54',
  department: 'Pengurusan & Pentadbiran',
  unit: 'Pengurusan & Pentadbiran',
  email: '—',
  phone: '—',
  status: 'vacant',
  statusDetail: 'Jawatan Kosong',
  children: [
    {
      id: 'user-hod-tyz',
      name: 'TAN YUAN ZHANG',
      role: 'Ketua Pegawai Farmasi (HOD)',
      grade: 'UF52',
      department: 'Jabatan Farmasi',
      unit: 'Pharmacy logistic',
      email: 'hosplawas@gmail.com',
      phone: '0163224178',
      status: 'active',
      statusDetail: 'Hadir Bertugas',
      children: [
        {
          id: 'user-lead-logistik',
          name: 'Mohamad Izwan bin Mat Zaid',
          role: 'Ketua Unit Farmasi Logistik & Bekalan',
          grade: 'UF9',
          department: 'Jabatan Farmasi',
          unit: 'Pharmacy logistic',
          email: 'aimanmz135@gmail.com',
          phone: '0172274015',
          status: 'active',
          statusDetail: 'Hadir Bertugas',
          children: [
            {
              id: 'user-staff-amri',
              name: 'AMRI AMIT',
              role: 'Penolong Pegawai Farmasi (Logistik)',
              grade: 'U5',
              department: 'Jabatan Farmasi',
              unit: 'Pharmacy logistic',
              email: 'amri.amit@yahoo.com',
              phone: '0111657713',
              status: 'active',
              statusDetail: 'Hadir Bertugas',
              children: [
                { id: 'vacant-pka-ambulatori-logistik', name: '(Kekosongan Jawatan)', role: 'Pembantu Khidmat Am (Ambulatori)', grade: 'H11', department: 'Jabatan Farmasi', unit: 'pharmacy satelite', email: '—', phone: '—', status: 'vacant', statusDetail: 'Jawatan Kosong' },
                { id: 'user-staff-enung', name: 'EMUNG RIGI', role: 'Pembantu Khidmat Am (Stor)', grade: 'H1', department: 'Jabatan Farmasi', unit: 'Pharmacy logistic', email: 'margaretnongrigi@gmail.com', phone: '0194855640', status: 'active', statusDetail: 'Hadir Bertugas' },
                { id: 'user-staff-mohidin', name: 'Mohidin Bin Malik', role: 'Pembantu Khidmat Am (Operasi)', grade: 'H1', department: 'Jabatan Farmasi', unit: 'Pharmacy logistic', email: 'mohidin123malik@gmail.com', phone: '0133018256', status: 'active', statusDetail: 'Hadir Bertugas' },
                { id: 'user-staff-saidin', name: 'Saidin Bin Bakar', role: 'Pembantu Awam', grade: 'H11', department: 'Jabatan Farmasi', unit: 'Pharmacy logistic', email: '80saidinbakar@gmail.com', phone: '01123583667', status: 'active', statusDetail: 'Hadir Bertugas' },
                { id: 'vacant-pka-stor', name: '(Kekosongan Jawatan)', role: 'Pembantu Khidmat Am (Stor)', grade: 'H11', department: 'Jabatan Farmasi', unit: 'Pharmacy logistic', email: '—', phone: '—', status: 'vacant', statusDetail: 'Jawatan Kosong' },
              ]
            }
          ]
        },
        {
          id: 'user-lead-opd',
          name: 'NURUL ASYIQIN BINTI MD REDZAN',
          role: 'Ketua Unit Farmasi Pesakit Luar & Satelit',
          grade: 'UF9',
          department: 'Jabatan Farmasi',
          unit: 'Pharmacy logistic',
          email: 'asyiqin.ridzuan@moh.gov.my',
          phone: '0134426469',
          status: 'active',
          statusDetail: 'Hadir Bertugas',
          children: []
        },
        {
          id: 'user-lead-kppf',
          name: 'KAMRIAH BT HAJI MAIL',
          role: 'Ketua Penolong Pegawai Farmasi Kanan (KPPF)',
          grade: 'UF9',
          department: 'Jabatan Farmasi',
          unit: 'Pharmacy logistic',
          email: 'kamriah_phar@yahoo.com',
          phone: '0108067174',
          status: 'active',
          statusDetail: 'Hadir Bertugas',
          children: [
            { id: 'user-staff-stella', name: 'Stella Ladu Marten', role: 'Penolong Pegawai Farmasi (Pelatih)', grade: '', department: 'Jabatan Farmasi', unit: 'Pharmacy logistic', email: 'stellaladu12@gmail.com', phone: '0135957809', status: 'active', statusDetail: 'Hadir Bertugas' },
            { id: 'user-staff-maslihah', name: 'MASLINAH BINTI SAIDIN', role: 'Penolong Pegawai Farmasi (Satelit)', grade: 'U5', department: 'Jabatan Farmasi', unit: 'pharmacy satelite', email: 'maslinah.s@moh.gov.my', phone: '0125744302', status: 'active', statusDetail: 'Hadir Bertugas' },
            { id: 'user-staff-johari', name: 'JOHARI BIN EPIN', role: 'Penolong Pegawai Farmasi (Satelit)', grade: 'U5', department: 'Jabatan Farmasi', unit: 'pharmacy satelite', email: 'johaee24@gmail.com', phone: '0135515350', status: 'active', statusDetail: 'Hadir Bertugas' },
            { id: 'user-staff-noryakshin', name: 'NORFARAIN BIN SARBINI', role: 'Penolong Pegawai Farmasi (Satelit)', grade: 'U5', department: 'Jabatan Farmasi', unit: 'pharmacy satelite', email: 'norfarainsarbini@gmail.com', phone: '0138462914', status: 'active', statusDetail: 'Hadir Bertugas' },
            { id: 'user-staff-winnie', name: 'Winnie Ruth anak William', role: 'Penolong Pegawai Farmasi (Pelatih)', grade: 'U5', department: 'Jabatan Farmasi', unit: 'Pharmacy logistic', email: 'ruthwillyy@gmail.com', phone: '0132984203', status: 'active', statusDetail: 'Hadir Bertugas' },
            {
              id: 'user-staff-rahimah',
              name: 'RAHIMAH BINTI OSMAN',
              role: 'Penolong Pegawai Farmasi (Satelit)',
              grade: 'U5',
              department: 'Jabatan Farmasi',
              unit: 'pharmacy satelite',
              email: 'emmaa5316@gmail.com',
              phone: '—',
              status: 'active',
              statusDetail: 'Hadir Bertugas',
              children: [
                { id: 'vacant-pka-ambulatori-satelit', name: '(Kekosongan Jawatan)', role: 'Pembantu Khidmat Am (Ambulatori)', grade: 'H11', department: 'Jabatan Farmasi', unit: 'pharmacy satelite', email: '—', phone: '—', status: 'vacant', statusDetail: 'Jawatan Kosong' }
              ]
            }
          ]
        },
        {
          id: 'user-officer-nursyafiqin',
          name: 'Nursyafiqin Bt Hasnal',
          role: 'Pegawai Farmasi (Satelit)',
          grade: 'UF9',
          department: 'Jabatan Farmasi',
          unit: 'pharmacy satelite',
          email: 'nursyafiqinhasnal@gmail.com',
          phone: '—',
          status: 'active',
          statusDetail: 'Hadir Bertugas'
        },
        {
          id: 'user-officer-soong',
          name: 'Soong Zhia Huey',
          role: 'Pegawai Farmasi (Satelit)',
          grade: 'UF9',
          department: 'Jabatan Farmasi',
          unit: 'pharmacy satelite',
          email: 'zhiahuey@moh.gov.my',
          phone: '—',
          avatar: 'https://ahnpjmdfutxdiotrbtzc.supabase.co/storage/v1/object/public/avatar/access-requests/52ghtsk5df-IMG_1192.jpeg',
          status: 'active',
          statusDetail: 'Hadir Bertugas'
        },
        { id: 'vacant-pf-1', name: '(Kekosongan Jawatan)', role: 'PEGAWAI FARMASI (UF41/44)', grade: 'UF41', department: 'Jabatan Farmasi', unit: 'pharmacy satelite', email: '—', phone: '—', status: 'vacant', statusDetail: 'Jawatan Kosong' },
        { id: 'vacant-pf-2', name: '(Kekosongan Jawatan)', role: 'PEGAWAI FARMASI (UF41/44)', grade: 'UF41', department: 'Jabatan Farmasi', unit: 'pharmacy satelite', email: '—', phone: '—', status: 'vacant', statusDetail: 'Jawatan Kosong' }
      ]
    }
  ]
}

const COMMON_ROLE_PRESETS = [
  'Pengarah Hospital', 'Ketua Pegawai Farmasi (HOD)', 'Ketua Unit Farmasi Logistik & Bekalan',
  'Ketua Unit Farmasi Pesakit Luar & Satelit', 'Ketua Penolong Pegawai Farmasi (KPPF)',
  'Pegawai Farmasi', 'Penolong Pegawai Farmasi', 'Pembantu Khidmat Am', 'Pembantu Awam',
]

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:   { label: 'Hadir', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', ring: '#22c55e' },
  vacant:   { label: 'Kosong', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', ring: '#f59e0b' },
  leave:    { label: 'Cuti', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', ring: '#ef4444' },
  movement: { label: 'Tugas Luar', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', ring: '#3b82f6' },
  course:   { label: 'Kursus', color: '#a855f7', bg: 'rgba(168,85,247,0.15)', ring: '#a855f7' },
}

// ─── UNIT COLOR MAP ────────────────────────────────────────────────────────────
const UNIT_ACCENT: Record<string, string> = {
  'Pengurusan & Pentadbiran': '#6366f1',
  'Pharmacy logistic': '#06b6d4',
  'pharmacy satelite': '#10b981',
}
const getUnitAccent = (unit: string) => UNIT_ACCENT[unit] || '#6366f1'

// ─── GRADIENT AVATAR FALLBACK ─────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'from-violet-600 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
]
const getAvatarGradient = (name: string) => {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[idx]
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function StaffOrgChartPage() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const toast = useToast()
  const { user } = useAuthStore()

  const hospitalId = user?.hospital_id || user?.hospital?.id || DEFAULT_HOSPITAL_ID
  const chartKey = DEFAULT_CHART_KEY

  // ── DATA ──
  const [realSystemUsers, setRealSystemUsers] = useState<RealSystemUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>('synced')

  const [orgData, setOrgData] = useState<OrgNode>(() => {
    try {
      const cached = getCachedOrgChart(hospitalId, chartKey)
      if (cached?.name && !cached.name.includes('Rohana')) {
        return cleanNodeUnit(cached)
      }
      const saved = localStorage.getItem(CURRENT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.name && !parsed.name.includes('Rohana')) {
          return cleanNodeUnit(parsed)
        }
      }
      const defaultCleaned = cleanNodeUnit(REAL_SYSTEM_DEFAULT_ORG)
      STORAGE_KEYS.forEach(k => { try { localStorage.setItem(k, JSON.stringify(defaultCleaned)) } catch {} })
      return defaultCleaned
    } catch { return REAL_SYSTEM_DEFAULT_ORG }
  })

  // ─── CLOUD FETCH & REALTIME SYNC ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    const loadCloudData = async () => {
      try {
        const result = await fetchOrgChartFromCloud(hospitalId, chartKey)
        if (!isMounted) return
        if (result.data) {
          const cleaned = cleanNodeUnit(result.data)
          setOrgData(cleaned)
          setCloudSyncStatus('synced')
        } else if (result.source === 'none' && isSupabaseConfigured()) {
          const defaultCleaned = cleanNodeUnit(REAL_SYSTEM_DEFAULT_ORG)
          saveOrgChartToCloud(defaultCleaned, hospitalId, chartKey, user?.id)
        }
      } catch (err) {
        console.error('Error fetching org chart from cloud:', err)
        if (isMounted) setCloudSyncStatus('offline')
      }
    }

    loadCloudData()

    const unsubscribe = subscribeToOrgChartCloud(hospitalId, chartKey, (remoteTree) => {
      if (!isMounted) return
      const cleaned = cleanNodeUnit(remoteTree)
      setOrgData(cleaned)
      setCloudSyncStatus('synced')
      toast.info('Carta organisasi dikemas kini secara langsung dari cloud')
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [hospitalId, chartKey])

  // ── UI STATE ──
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'list'>('tree')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isTwoLayerLayout, setIsTwoLayerLayout] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const [selectedStaff, setSelectedStaff] = useState<OrgNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // ── EDIT MODAL ──
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [formRole, setFormRole] = useState('')
  const [formReportsTo, setFormReportsTo] = useState('')
  const [formName, setFormName] = useState('')
  const [formGrade, setFormGrade] = useState('')
  const [formUnit, setFormUnit] = useState('pharmacy satelite')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formAvatar, setFormAvatar] = useState('')
  const [formStatus, setFormStatus] = useState<OrgNode['status']>('active')
  const [formStatusDetail, setFormStatusDetail] = useState('Hadir Bertugas')

  // ─── FETCH USERS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        let rawUsers: any[] = []
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone_number, jawatan, profile_photo_url, status, department:departments!department_id(id, department_name)')
            .order('full_name', { ascending: true })
          if (!error && data?.length) rawUsers = data
        }
        if (!rawUsers.length) {
          const res = await getUsers({ pageSize: 500 })
          if (res.data?.length) rawUsers = res.data
        }
        const mappedUsers = rawUsers.map((u: any) => ({
          id: u.id, full_name: u.full_name, email: u.email,
          phone_number: u.phone_number || '',
          jawatan: u.jawatan || '',
          profile_photo_url: u.profile_photo_url || '',
          department_name: u.department?.department_name || 'Jabatan Farmasi',
          status: u.status || 'active'
        }))
        setRealSystemUsers(mappedUsers)

        // Automatically sync and sanitize existing tree with updated user info & clean out legacy MyWarrant units
        setOrgData(prev => {
          const syncWithUsers = (n: OrgNode): OrgNode => {
            let nClean = cleanNodeUnit(n)
            const matched = mappedUsers.find((u: any) =>
              u.id === nClean.id ||
              (u.email && nClean.email && u.email.toLowerCase() === nClean.email.toLowerCase() && nClean.email !== '—') ||
              (u.full_name && nClean.name && u.full_name.toLowerCase() === nClean.name.toLowerCase() && !nClean.name.includes('Kekosongan'))
            )
            if (matched) {
              let matchedDept = matched.department_name
              if (matchedDept && !matchedDept.toLowerCase().startsWith('my') && !matchedDept.toLowerCase().includes('warrant')) {
                nClean.unit = matchedDept
              }
              if (matched.profile_photo_url) {
                nClean.avatar = matched.profile_photo_url
              }
            }
            return {
              ...cleanNodeUnit(nClean),
              children: nClean.children ? nClean.children.map(syncWithUsers) : []
            }
          }
          const updated = syncWithUsers(prev)
          STORAGE_KEYS.forEach(key => { try { localStorage.setItem(key, JSON.stringify(updated)) } catch {} })
          setCachedOrgChart(updated, hospitalId, chartKey)
          return updated
        })
      } catch (err) { console.error(err) }
      finally { setIsLoadingUsers(false) }
    }
    fetchUsers()
  }, [])

  // ─── PHOTO MAP ───────────────────────────────────────────────────────────────
  const userPhotoMap = useMemo(() => {
    const map: Record<string, string> = {}
    realSystemUsers.forEach(u => {
      if (u.profile_photo_url) {
        map[u.full_name.toLowerCase().trim()] = u.profile_photo_url
        map[u.id] = u.profile_photo_url
        if (u.email) map[u.email.toLowerCase().trim()] = u.profile_photo_url
      }
    })
    return map
  }, [realSystemUsers])

  const getNodePhoto = useCallback((node: OrgNode): string | undefined => {
    if (node.avatar) return node.avatar
    const nameKey = (node.name || '').toLowerCase().trim()
    const emailKey = (node.email || '').toLowerCase().trim()
    return userPhotoMap[nameKey] || userPhotoMap[node.id] || (emailKey ? userPhotoMap[emailKey] : undefined)
  }, [userPhotoMap])

  // ─── PERSISTENCE ─────────────────────────────────────────────────────────────
  const saveTreeData = useCallback((newTree: OrgNode) => {
    const cleaned = cleanNodeUnit(newTree)
    // 1. Optimistic UI update
    setOrgData(cleaned)
    // 2. Cache in localStorage
    STORAGE_KEYS.forEach(key => { try { localStorage.setItem(key, JSON.stringify(cleaned)) } catch {} })
    setCachedOrgChart(cleaned, hospitalId, chartKey)

    // 3. Persist to Supabase Cloud Database
    setCloudSyncStatus('saving')
    saveOrgChartToCloud(cleaned, hospitalId, chartKey, user?.id).then(res => {
      if (res.success) {
        setCloudSyncStatus('synced')
      } else {
        setCloudSyncStatus('error')
        console.error('Failed to sync org chart to cloud database:', res.error)
        toast.error('Gagal menyimpan ke cloud. Disimpan secara lokal.')
      }
    }).catch(err => {
      setCloudSyncStatus('error')
      console.error('Error syncing org chart to cloud:', err)
    })
  }, [hospitalId, chartKey, user?.id])

  // ─── FLAT LIST ───────────────────────────────────────────────────────────────
  const allStaffList = useMemo(() => {
    const list: Array<OrgNode & { parentId: string | null }> = []
    const traverse = (node: OrgNode, parentId: string | null = null, parentName: string | null = null) => {
      const cleaned = cleanNodeUnit(node)
      list.push({ ...cleaned, parentId, reportsTo: parentName })
      cleaned.children?.forEach(c => traverse(c, cleaned.id, cleaned.name))
    }
    traverse(orgData)
    return list
  }, [orgData])

  const unitsList = useMemo(() => {
    const set = new Set<string>()
    allStaffList.forEach(s => {
      const u = (s.unit || '').trim()
      const uLower = u.toLowerCase()
      if (
        u &&
        !uLower.includes('pathology') &&
        !uLower.includes('patologi') &&
        !uLower.includes('warrant') &&
        !uLower.startsWith('my')
      ) {
        set.add(u)
      }
    })
    if (!set.size) { set.add('Pengurusan & Pentadbiran'); set.add('Pharmacy logistic'); set.add('pharmacy satelite') }
    return Array.from(set)
  }, [allStaffList])

  const filteredStaffList = useMemo(() => allStaffList.filter(staff => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || staff.name.toLowerCase().includes(q) || staff.role.toLowerCase().includes(q) || staff.grade.toLowerCase().includes(q) || staff.unit.toLowerCase().includes(q)
    const matchUnit = selectedUnit === 'all' || staff.unit === selectedUnit
    const matchStatus = selectedStatus === 'all' || staff.status === selectedStatus
    return matchSearch && matchUnit && matchStatus
  }), [allStaffList, searchQuery, selectedUnit, selectedStatus])

  const stats = useMemo(() => ({
    total: allStaffList.length,
    active: allStaffList.filter(s => s.status === 'active').length,
    vacant: allStaffList.filter(s => s.status === 'vacant' || s.name.includes('Kekosongan')).length,
    leave: allStaffList.filter(s => s.status === 'leave').length,
    movement: allStaffList.filter(s => s.status === 'movement' || s.status === 'course').length,
  }), [allStaffList])

  // ─── TREE HELPERS ────────────────────────────────────────────────────────────
  const findNode = (root: OrgNode, id: string): OrgNode | null => {
    if (root.id === id) return root
    for (const c of (root.children || [])) { const f = findNode(c, id); if (f) return f }
    return null
  }

  const findParent = (root: OrgNode, childId: string): OrgNode | null => {
    for (const c of (root.children || [])) { if (c.id === childId) return root; const f = findParent(c, childId); if (f) return f }
    return null
  }

  const isDescendant = (src: OrgNode, targetId: string): boolean => {
    for (const c of (src.children || [])) { if (c.id === targetId || isDescendant(c, targetId)) return true }
    return false
  }

  const toggleCollapse = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCollapsedNodes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // ─── USER SELECT ─────────────────────────────────────────────────────────────
  const handleRealUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    if (userId === '__VACANT__') {
      setFormName('(Kekosongan Jawatan)'); setFormGrade(''); setFormEmail('—'); setFormPhone('—')
      setFormAvatar(''); setFormStatus('vacant'); setFormStatusDetail('Jawatan Kosong'); setFormUnit('pharmacy satelite'); return
    }
    if (userId === '__CUSTOM__') {
      setFormName('Pengarah Hospital Lawas'); setFormRole('Pengarah Hospital'); setFormGrade('')
      setFormUnit('Pengurusan & Pentadbiran'); setFormEmail(''); setFormPhone(''); setFormAvatar('')
      setFormStatus('active'); setFormStatusDetail('Hadir Bertugas'); return
    }
    const u = realSystemUsers.find(u => u.id === userId)
    if (u) {
      setFormName(u.full_name); setFormGrade(extractGradeFromSystem(u.jawatan))
      let uDept = u.department_name || 'pharmacy satelite'
      if (
        uDept.toLowerCase().includes('pathology') ||
        uDept.toLowerCase().includes('patologi') ||
        uDept.toLowerCase().startsWith('my') ||
        uDept.toLowerCase().includes('warrant')
      ) {
        uDept = (u.jawatan || '').toLowerCase().includes('logistik') ? 'Pharmacy logistic' : 'pharmacy satelite'
      }
      setFormUnit(uDept); setFormEmail(u.email); setFormPhone(u.phone_number || '')
      setFormAvatar(u.profile_photo_url || ''); setFormStatus('active'); setFormStatusDetail('Hadir Bertugas')
      if (!formRole || formRole.includes('Kekosongan')) setFormRole(u.jawatan || 'Pegawai Farmasi')
    }
  }

  // ─── EDIT/ADD HANDLERS ───────────────────────────────────────────────────────
  const handleOpenEdit = (node: OrgNode, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const parent = findParent(orgData, node.id)
    setEditingNode(node); setIsAddingNew(false)
    const isVacant = node.status === 'vacant' || node.name.includes('Kekosongan')
    setSelectedUserId(isVacant ? '__VACANT__' : (realSystemUsers.find(u => u.full_name.toLowerCase() === node.name.toLowerCase())?.id || node.name))
    let nodeUnit = node.unit || 'pharmacy satelite'
    if (
      nodeUnit.toLowerCase().includes('pathology') ||
      nodeUnit.toLowerCase().includes('patologi') ||
      nodeUnit.toLowerCase().startsWith('my') ||
      nodeUnit.toLowerCase().includes('warrant')
    ) {
      nodeUnit = (node.role || '').toLowerCase().includes('logistik') ? 'Pharmacy logistic' : 'pharmacy satelite'
    }
    setFormName(node.name); setFormRole(node.role); setFormGrade(node.grade || ''); setFormUnit(nodeUnit)
    setFormEmail(node.email); setFormPhone(node.phone || ''); setFormAvatar(node.avatar || getNodePhoto(node) || '')
    setFormStatus(node.status); setFormStatusDetail(node.statusDetail || 'Hadir Bertugas')
    setFormReportsTo(parent ? parent.id : ''); setEditModalOpen(true)
  }

  const handleOpenAddUnder = (parentNode: OrgNode, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingNode(null); setIsAddingNew(true)
    let parentUnit = parentNode.unit || 'Pharmacy logistic'
    if (parentUnit.toLowerCase().includes('pathology')) parentUnit = 'pharmacy satelite'
    setSelectedUserId('__VACANT__'); setFormName('(Kekosongan Jawatan)'); setFormRole('Pegawai Farmasi')
    setFormGrade(''); setFormUnit(parentUnit); setFormEmail('—'); setFormPhone('—')
    setFormAvatar(''); setFormStatus('vacant'); setFormStatusDetail('Jawatan Kosong')
    setFormReportsTo(parentNode.id); setEditModalOpen(true)
  }

  const handleOpenAddGlobal = () => {
    setEditingNode(null); setIsAddingNew(true)
    setSelectedUserId('__CUSTOM__'); setFormName('Pengarah Hospital Lawas'); setFormRole('Pengarah Hospital')
    setFormGrade(''); setFormUnit('Pengurusan & Pentadbiran'); setFormEmail(''); setFormPhone('')
    setFormAvatar(''); setFormStatus('active'); setFormStatusDetail('Hadir Bertugas')
    setFormReportsTo('__NEW_ROOT__'); setEditModalOpen(true)
  }

  const handleDeleteNode = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const nodeToDelete = findNode(orgData, nodeId)
    if (!nodeToDelete) return
    if (!window.confirm(`Remove "${nodeToDelete.name}" from the chart?`)) return
    let cloneTree = JSON.parse(JSON.stringify(orgData)) as OrgNode
    const removeAndReassign = (curr: OrgNode, targetId: string): boolean => {
      if (!curr.children) return false
      const idx = curr.children.findIndex(c => c.id === targetId)
      if (idx !== -1) { const orphans = curr.children[idx].children || []; curr.children.splice(idx, 1, ...orphans); return true }
      for (const child of curr.children) { if (removeAndReassign(child, targetId)) return true }
      return false
    }
    removeAndReassign(cloneTree, nodeId)
    saveTreeData(cloneTree)
    if (selectedStaff?.id === nodeId) setSelectedStaff(null)
    toast.success('Position removed from chart')
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formRole.trim()) { toast.error('Please complete name and designation'); return }
    let cloneTree = JSON.parse(JSON.stringify(orgData)) as OrgNode
    const isVacant = selectedUserId === '__VACANT__' || formName.includes('Kekosongan') || formStatus === 'vacant'
    let cleanUnit = formUnit || 'pharmacy satelite'
    if (cleanUnit.toLowerCase().includes('pathology')) cleanUnit = 'pharmacy satelite'

    if (isAddingNew) {
      const newNode: OrgNode = {
        id: `user-node-${Date.now()}`, name: isVacant ? '(Kekosongan Jawatan)' : formName.trim(),
        role: formRole.trim(), grade: isVacant ? '' : formGrade.trim(),
        department: 'Jabatan Farmasi', unit: cleanUnit,
        email: isVacant ? '—' : formEmail.trim(), phone: isVacant ? '—' : formPhone.trim(),
        avatar: isVacant ? '' : (formAvatar.trim() || undefined),
        status: isVacant ? 'vacant' : formStatus,
        statusDetail: isVacant ? 'Jawatan Kosong' : (formStatusDetail.trim() || 'Hadir Bertugas'), children: []
      }
      if (formReportsTo === '__NEW_ROOT__') {
        newNode.children = [cloneTree]; cloneTree = newNode
        saveTreeData(cloneTree); toast.success(`"${newNode.name}" set as top leader`)
      } else {
        const parentNode = findNode(cloneTree, formReportsTo || cloneTree.id)
        if (parentNode) { if (!parentNode.children) parentNode.children = []; parentNode.children.push(newNode) }
        saveTreeData(cloneTree); toast.success(`Position "${newNode.role}" added`)
      }
    } else if (editingNode) {
      const currentParent = findParent(cloneTree, editingNode.id)
      const targetParentId = editingNode.id === cloneTree.id ? null : (formReportsTo || cloneTree.id)
      if (targetParentId && isDescendant(editingNode, targetParentId)) { toast.error('Cannot report to own subordinate'); return }
      const nodeToUpdate = findNode(cloneTree, editingNode.id)
      if (!nodeToUpdate) return
      nodeToUpdate.name = isVacant ? '(Kekosongan Jawatan)' : formName.trim()
      nodeToUpdate.role = formRole.trim(); nodeToUpdate.grade = isVacant ? '' : formGrade.trim()
      nodeToUpdate.unit = cleanUnit; nodeToUpdate.email = isVacant ? '—' : formEmail.trim()
      nodeToUpdate.phone = isVacant ? '—' : formPhone.trim()
      nodeToUpdate.avatar = isVacant ? '' : (formAvatar.trim() || nodeToUpdate.avatar)
      nodeToUpdate.status = isVacant ? 'vacant' : formStatus
      nodeToUpdate.statusDetail = isVacant ? 'Jawatan Kosong' : formStatusDetail.trim()
      if (editingNode.id !== cloneTree.id && targetParentId && targetParentId !== currentParent?.id) {
        if (currentParent?.children) currentParent.children = currentParent.children.filter(c => c.id !== editingNode.id)
        const newParent = findNode(cloneTree, targetParentId)
        if (newParent) { if (!newParent.children) newParent.children = []; newParent.children.push(nodeToUpdate) }
      }
      saveTreeData(cloneTree); toast.success(`"${nodeToUpdate.name}" updated`)
    }
    setEditModalOpen(false)
  }

  const handleResetToDefault = () => {
    if (!window.confirm('Reset chart to default template?')) return
    saveTreeData(REAL_SYSTEM_DEFAULT_ORG); setCollapsedNodes(new Set()); setSelectedStaff(null)
    toast.success('Chart reset to default')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: ENTERPRISE ORG NODE CARD & HIERARCHY TREE
  // ─────────────────────────────────────────────────────────────────────────────
  const renderTreeNode = (node: OrgNode, depth: number = 0) => {
    const isCollapsed = collapsedNodes.has(node.id)
    const hasChildren = !!(node.children?.length)
    const isSelected = selectedStaff?.id === node.id
    const isVacant = node.status === 'vacant' || node.name.includes('Kekosongan')
    const isRoot = depth === 0
    const isMidLevel = depth === 1
    const photoUrl = getNodePhoto(node)
    const accent = getUnitAccent(node.unit)
    const statusCfg = STATUS_CONFIG[node.status] || STATUS_CONFIG.active

    const cardWidth = isRoot ? 260 : isVacant ? 215 : isMidLevel ? 245 : 230

    return (
      <div key={node.id} className="flex flex-col items-center select-none">
        {/* ── NODE CARD ── */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          whileHover={{ y: isEditMode ? 0 : -5, transition: { duration: 0.18 } }}
          onClick={() => isEditMode ? handleOpenEdit(node) : setSelectedStaff(node)}
          style={{ width: cardWidth }}
          className={`
            relative cursor-pointer group rounded-2xl overflow-hidden
            border transition-all duration-[150ms]
            ${isRoot
              ? 'bg-gradient-to-b from-[#1a1f2e] to-[#111827] border-[rgba(99,102,241,0.5)] shadow-[0_0_40px_rgba(99,102,241,0.22)] hover:border-[rgba(99,102,241,0.8)] hover:shadow-[0_0_60px_rgba(99,102,241,0.35)]'
              : isVacant
              ? 'bg-[#1e1a12] border-[rgba(245,158,11,0.4)] hover:border-[rgba(245,158,11,0.7)] shadow-[0_2px_14px_rgba(0,0,0,0.4)]'
              : isSelected
              ? 'bg-[#0e241c] border-[rgba(34,197,94,0.6)] shadow-[0_0_30px_rgba(34,197,94,0.2)]'
              : 'bg-[#141a27] border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.24)] shadow-[0_4px_18px_rgba(0,0,0,0.45)] hover:shadow-[0_8px_26px_rgba(0,0,0,0.6)]'
            }
            ${isEditMode ? 'ring-1 ring-amber-500/50' : ''}
          `}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: isVacant ? 'rgba(245,158,11,0.8)' : `${accent}` }}
          />

          {/* Edit Mode Actions (top-right) */}
          {isEditMode && (
            <div
              className="absolute top-2 right-2 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={e => handleOpenEdit(node, e)} className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="Edit">
                <Edit3 className="w-3 h-3" />
              </button>
              <button onClick={e => handleOpenAddUnder(node, e)} className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="Add below">
                <Plus className="w-3 h-3" />
              </button>
              <button onClick={e => handleDeleteNode(node.id, e)} className="w-6 h-6 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="Remove">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="p-4">
            {/* Unit + Grade Row */}
            <div className="flex items-center justify-between gap-1 mb-3">
              <span
                className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md truncate max-w-[145px]"
                style={{ color: accent, background: `${accent}22`, border: `1px solid ${accent}45` }}
                title={node.unit}
              >
                {node.unit}
              </span>
              {node.grade && (
                <span className="text-[11px] font-mono font-black text-white px-2 py-0.5 rounded bg-white/[0.14] border border-white/20 shadow-sm shrink-0">
                  {node.grade}
                </span>
              )}
            </div>

            {/* Avatar - centered above name */}
            <div className="flex flex-col items-center mb-2.5">
              <div className="relative mb-2">
                {/* Status halo ring */}
                <div
                  className="absolute -inset-[3px] rounded-full opacity-60"
                  style={{ background: `conic-gradient(${statusCfg.ring} 0deg, transparent 180deg, ${statusCfg.ring} 360deg)` }}
                />
                <div className="absolute -inset-[3px] rounded-full blur-[3px]" style={{ background: statusCfg.ring, opacity: 0.25 }} />

                {isVacant ? (
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-[#251b0a] border-2 border-amber-400/50 shadow-md">
                    <UserX className="w-6 h-6 text-amber-400" />
                  </div>
                ) : photoUrl ? (
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-[2px] ring-[#141923] shadow-md">
                    <img src={photoUrl} alt={node.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-tr ${getAvatarGradient(node.name)} flex items-center justify-center font-black text-white text-lg ring-[2px] ring-[#141923] shadow-md`}>
                    {node.name.charAt(0)}
                  </div>
                )}

                {/* Status dot */}
                <div
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#141923] shadow-lg"
                  style={{ background: statusCfg.color }}
                />
              </div>

              {/* Name - 2 lines allowed, bold, clear and sharp */}
              <h4
                className={`text-center font-bold leading-tight line-clamp-2 w-full px-1 min-h-[32px] flex items-center justify-center ${
                  isRoot
                    ? 'text-white text-[13px] font-extrabold tracking-wide'
                    : isVacant
                    ? 'text-amber-300 text-[11.5px] italic font-bold'
                    : 'text-white text-[12px] font-bold'
                }`}
                title={node.name}
              >
                {node.name}
              </h4>

              {/* Role - clear high contrast, 2 lines */}
              <p
                className={`text-center text-[11px] font-medium leading-snug mt-1 line-clamp-2 px-1 min-h-[28px] flex items-center justify-center ${
                  isVacant ? 'text-amber-200/90 font-semibold' : 'text-slate-300 font-medium'
                }`}
                title={node.role}
              >
                {node.role}
              </p>
            </div>

            {/* Bottom divider + status & phone */}
            <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.color}40` }}
              >
                <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ background: statusCfg.color }} />
                {statusCfg.label}
              </span>
              {node.phone && node.phone !== '—' && (
                <span className="text-[10px] font-mono text-slate-300 font-semibold truncate max-w-[100px]">{node.phone}</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Collapse toggle button */}
        {hasChildren && (
          <button
            onClick={e => toggleCollapse(node.id, e)}
            className={`mt-1.5 w-6 h-6 rounded-full flex items-center justify-center border text-white transition-all duration-150 z-20 shadow-md ${
              isCollapsed
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                : 'bg-[#1e2538] border-indigo-400/50 hover:border-indigo-400 text-indigo-200 hover:text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]'
            }`}
          >
            {isCollapsed
              ? <span className="text-[10px] font-black">{node.children?.length}</span>
              : <ChevronUp className="w-3.5 h-3.5 text-indigo-300" />
            }
          </button>
        )}

        {/* Children Sub-Tree */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical stem from parent down to children */}
            <div className="w-[2px] h-7 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.7)]" />

            {/* Children Row directly below supervisor */}
            <div className="flex justify-center gap-3 sm:gap-4 relative">
              {node.children!.map((child, i) => {
                const isOnlyChild = node.children!.length === 1
                const isFirstChild = i === 0
                const isLastChild = i === node.children!.length - 1

                return (
                  <div key={child.id} className="flex flex-col items-center relative">
                    {/* Top horizontal branch connector */}
                    {!isOnlyChild && (
                      <div
                        className={`absolute top-0 h-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.7)] ${
                          isFirstChild
                            ? 'left-1/2 right-0'
                            : isLastChild
                            ? 'left-0 right-1/2'
                            : 'left-0 right-0'
                        }`}
                      />
                    )}

                    {/* Glowing Junction dot on horizontal bar */}
                    {!isOnlyChild && (
                      <div className="w-2 h-2 rounded-full bg-indigo-400 border border-white/60 shadow-[0_0_8px_rgba(99,102,241,1)] absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" />
                    )}

                    {/* Vertical connector dropping down to card */}
                    <div className="w-[2px] h-6 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.7)]" />

                    {/* Child Node and its children directly beneath it */}
                    {renderTreeNode(child, depth + 1)}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── STATUS BADGE HELPER ───
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Hadir
          </span>
        )
      case 'leave':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Cuti
          </span>
        )
      case 'movement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Tugas Luar
          </span>
        )
      case 'vacant':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Kosong
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] text-white/60 border border-white/[0.10]">
            {status || '—'}
          </span>
        )
    }
  }

  // ─── CURRENT DATE FOR OFFICIAL REPORTS ───
  const currentDateStr = useMemo(() => {
    const d = new Date()
    return d.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PRINT-OPTIMIZED TREE NODE (WHITE/LIGHT THEME FOR EXECUTIVE REPORT)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPrintTreeNode = (node: OrgNode, depth: number = 0) => {
    const hasChildren = !!(node.children?.length)
    const isVacant = node.status === 'vacant' || node.name.includes('Kekosongan')
    const isRoot = depth === 0
    const isMid = depth === 1
    const photoUrl = getNodePhoto(node)
    const accent = getUnitAccent(node.unit)

    // Optimized executive print dimensions to fully utilize A4 landscape canvas
    const cardWidth = isRoot ? 116 : isMid && hasChildren ? 90 : isVacant ? 68 : 78

    return (
      <div key={`print-${node.id}`} className="flex flex-col items-center select-none shrink-0">
        {/* Node Card for Print */}
        <div
          style={{
            width: cardWidth,
            border: isRoot
              ? '2px solid #1e1b4b'
              : isVacant
              ? '1.2px dashed #b45309'
              : '1.2px solid #1e293b',
            backgroundColor: isRoot ? '#f8fafc' : isVacant ? '#fffbeb' : '#ffffff',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
          className="rounded-md px-1.5 py-1 flex flex-col justify-between relative text-left shadow-none"
        >
          {/* Top accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-md"
            style={{ background: isVacant ? '#d97706' : accent }}
          />

          {/* Unit & Grade */}
          <div className="flex items-center justify-between gap-0.5 mb-1 mt-0.5">
            <span
              className="text-[6.5px] font-black uppercase tracking-tight px-1 py-0.2 rounded truncate max-w-[58px]"
              style={{
                color: isVacant ? '#92400e' : accent,
                background: isVacant ? '#fef3c7' : `${accent}18`,
                border: `0.5px solid ${isVacant ? '#f59e0b' : accent}50`
              }}
              title={node.unit}
            >
              {node.unit}
            </span>
            {node.grade && (
              <span className="text-[6.5px] font-mono font-black text-white px-1 py-0.2 rounded bg-slate-900 shrink-0">
                {node.grade}
              </span>
            )}
          </div>

          {/* Photo & Name */}
          <div className="flex flex-col items-center text-center my-0.5">
            {isVacant ? (
              <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center mb-0.5 text-amber-700 text-[8px] font-bold">
                ✕
              </div>
            ) : photoUrl ? (
              <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-700 mb-0.5">
                <img src={photoUrl} alt={node.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center font-black text-white text-[8px] mb-0.5"
                style={{ background: '#4338ca' }}
              >
                {node.name.charAt(0)}
              </div>
            )}

            <p
              className={`font-black leading-tight line-clamp-2 w-full px-0.5 ${
                isRoot ? 'text-slate-950 text-[8.5px]' : isVacant ? 'text-amber-950 italic text-[7.2px]' : 'text-slate-900 text-[7.8px]'
              }`}
            >
              {node.name}
            </p>
            <p className="text-[6.8px] font-semibold text-slate-700 leading-tight mt-0.5 line-clamp-1 px-0.5">
              {node.role}
            </p>
          </div>

          {/* Bottom row */}
          <div className="pt-0.5 border-t border-slate-200 flex items-center justify-between text-[6px]">
            <span
              className="font-bold px-1 py-0.2 rounded"
              style={{
                color: isVacant ? '#92400e' : '#15803d',
                background: isVacant ? '#fef3c7' : '#dcfce7',
                border: `0.5px solid ${isVacant ? '#f59e0b' : '#22c55e'}40`
              }}
            >
              {isVacant ? 'Kosong' : 'Hadir'}
            </span>
            {node.phone && node.phone !== '—' && (
              <span className="font-mono text-slate-700 font-bold">{node.phone}</span>
            )}
          </div>
        </div>

        {/* Children for Print */}
        {hasChildren && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical stem down */}
            <div className="w-[1.5px] h-2.5 bg-slate-800" />

            {/* Horizontal branch */}
            <div className="flex justify-center gap-[2px] relative">
              {node.children!.map((child, i) => {
                const isOnlyChild = node.children!.length === 1
                const isFirstChild = i === 0
                const isLastChild = i === node.children!.length - 1

                return (
                  <div key={`print-child-${child.id}`} className="flex flex-col items-center relative">
                    {!isOnlyChild && (
                      <div
                        className={`absolute top-0 h-[1.5px] bg-slate-800 ${
                          isFirstChild
                            ? 'left-1/2 right-0'
                            : isLastChild
                            ? 'left-0 right-1/2'
                            : 'left-0 right-0'
                        }`}
                      />
                    )}
                    {!isOnlyChild && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" />
                    )}
                    <div className="w-[1.5px] h-2.5 bg-slate-800" />
                    {renderPrintTreeNode(child, depth + 1)}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white pb-20 relative" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.08) 0%, transparent 70%), #0a0c14' }}>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 4mm 4mm 4mm 4mm;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            max-height: 100vh !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Inter', Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          .screen-only-view,
          nav,
          header,
          aside,
          footer {
            display: none !important;
          }
          #official-org-chart-print-area {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            box-sizing: border-box !important;
            padding: 2mm 3mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none no-print" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-5 space-y-4 max-w-none screen-only-view no-print">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(ROUTES.STAFF_DASHBOARD)} className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors duration-150 text-xs font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
            <span>MyStaff</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span>MyStaff</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <span className="text-white/70 font-semibold">Carta Organisasi</span>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 px-6 py-5 rounded-2xl border border-white/[0.08] backdrop-blur-sm" style={{ background: 'rgba(20,25,35,0.8)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20"><Network className="w-6 h-6 text-indigo-400" /></div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Carta Organisasi Hospital & Jabatan</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-white/40">{isLoadingUsers ? 'Memuat data…' : `${stats.total} posisi · ${stats.active} hadir · ${stats.vacant} kekosongan`}</p>
                <span className="text-white/20">·</span>
                {cloudSyncStatus === 'saving' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Menyimpan ke Cloud…</span>
                  </span>
                )}
                {cloudSyncStatus === 'synced' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cloud Synced</span>
                  </span>
                )}
                {cloudSyncStatus === 'error' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                    <CloudOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>Ralat Cloud</span>
                  </span>
                )}
                {cloudSyncStatus === 'offline' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-500/10 px-2.5 py-0.5 rounded-full border border-slate-500/20">
                    <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mod Tempatan</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              {([['tree', GitFork, 'Hierarki'], ['grid', LayoutGrid, 'Grid'], ['list', ListFilter, 'Direktori']] as [string, any, string][]).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    viewMode === mode ? 'bg-white/[0.10] text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Edit toggle */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isEditMode
                  ? 'bg-amber-500 text-white ring-2 ring-amber-500/30'
                  : 'bg-white/[0.06] border border-white/[0.10] text-white/70 hover:text-white hover:bg-white/[0.10]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Selesai Edit' : 'Edit Hierarki'}</span>
            </button>

            {isEditMode && (
              <>
                <button
                  onClick={handleOpenAddGlobal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors duration-150"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Posisi</span>
                </button>
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white/80 transition-colors duration-150"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </>
            )}

            {!isEditMode && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 shadow-lg shadow-indigo-500/20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                title="Cetak Carta Organisasi Rasmi (PDF Landscape)"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Cetak PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Jumlah Posisi', value: stats.total, color: '#6366f1', icon: Users },
            { label: 'Hadir Bertugas', value: stats.active, color: '#22c55e', icon: CheckCircle2 },
            { label: 'Jawatan Kosong', value: stats.vacant, color: '#f59e0b', icon: UserX },
            { label: 'Cuti / Tugas Luar', value: stats.leave + stats.movement, color: '#ef4444', icon: Palmtree },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-black text-white tabular-nums">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, jawatan, gred..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all duration-150 shadow-sm font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedUnit}
            onChange={e => setSelectedUnit(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          >
            <option value="all" className="bg-slate-900 text-slate-200">Semua Unit</option>
            {unitsList.map(u => <option key={u} value={u} className="bg-slate-900 text-slate-200">{u}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          >
            <option value="all" className="bg-slate-900 text-slate-200">Semua Status</option>
            <option value="active" className="bg-slate-900 text-slate-200">Hadir Bertugas</option>
            <option value="vacant" className="bg-slate-900 text-slate-200">Jawatan Kosong</option>
            <option value="movement" className="bg-slate-900 text-slate-200">Tugas Luar</option>
            <option value="leave" className="bg-slate-900 text-slate-200">Cuti</option>
            <option value="course" className="bg-slate-900 text-slate-200">Kursus</option>
          </select>

          {(searchQuery || selectedUnit !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedUnit('all'); setSelectedStatus('all') }}
              className="px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors duration-150"
            >
              Reset
            </button>
          )}
        </div>

        {/* ─── VIEW: TREE ─────────────────────────────────────────────────────── */}
        {viewMode === 'tree' && (
          <div
            className="rounded-2xl border border-white/[0.06] overflow-hidden"
            style={{ background: 'rgba(10,12,20,0.7)' }}
          >
            {/* Canvas toolbar */}
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Layers className="w-3.5 h-3.5" />
                <span>Hierarchical Tree View</span>
                {isEditMode && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold">EDIT MODE</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* 2-Layer vs 1-Layer Toggle */}
                <button
                  onClick={() => setIsTwoLayerLayout(prev => !prev)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all duration-150 ${
                    isTwoLayerLayout
                      ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                      : 'bg-white/[0.05] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.10]'
                  }`}
                  title="Toggle 2-Layer Compact Tree Layout"
                >
                  <GitFork className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isTwoLayerLayout ? 'Staggered (2-Height)' : 'Uniform (1-Height)'}</span>
                </button>

                <div className="h-4 w-px bg-white/10 mx-1" />

                <button onClick={() => setZoomLevel(z => Math.min(z + 0.1, 1.5))} className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-all duration-150">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.4))} className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-all duration-150">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setZoomLevel(1.0); setCollapsedNodes(new Set()) }} className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-xs font-semibold text-white transition-all duration-150">
                  {Math.round(zoomLevel * 100)}%
                </button>
              </div>
            </div>

            {/* Canvas with subtle engineering grid */}
            <div
              className="w-full p-6 sm:p-10 overflow-x-auto min-h-[720px] flex justify-center items-start"
              style={{
                backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.08) 1.2px, transparent 1.2px)',
                backgroundSize: '24px 24px',
              }}
            >
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s cubic-bezier(0.2,0,0,1)' }}
                className="w-fit min-w-full flex justify-center"
              >
                {renderTreeNode(orgData, 0)}
              </div>
            </div>
          </div>
        )}

        {/* ─── VIEW: GRID ─────────────────────────────────────────────────────── */}
        {viewMode === 'grid' && (
          <div className="space-y-5">
            {unitsList.map(unitName => {
              const unitStaff = filteredStaffList.filter(s => s.unit === unitName)
              if (!unitStaff.length) return null
              const accent = getUnitAccent(unitName)
              return (
                <div
                  key={unitName}
                  className="rounded-2xl border border-white/[0.08] overflow-hidden"
                  style={{ background: 'rgba(14,17,28,0.8)' }}
                >
                  <div className="px-6 py-4 border-b border-white/[0.08] flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
                    <h3 className="text-sm font-bold text-white">{unitName}</h3>
                    <span className="text-xs text-slate-400 font-medium">{unitStaff.length} posisi</span>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {unitStaff.map(staff => {
                      const isVacant = staff.status === 'vacant' || staff.name.includes('Kekosongan')
                      const photoUrl = getNodePhoto(staff)
                      const statusCfg = STATUS_CONFIG[staff.status] || STATUS_CONFIG.active
                      return (
                        <motion.div
                          key={staff.id}
                          whileHover={{ y: -3, transition: { duration: 0.15 } }}
                          onClick={() => isEditMode ? handleOpenEdit(staff) : setSelectedStaff(staff)}
                          className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-[150ms] group ${
                            isVacant
                              ? 'bg-[#1e1a12] border-[rgba(245,158,11,0.3)] hover:border-[rgba(245,158,11,0.6)]'
                              : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                          } ${isEditMode ? 'ring-1 ring-amber-500/40' : ''}`}
                        >
                          <div
                            className="absolute top-0 left-4 right-4 h-[2px]"
                            style={{ background: isVacant ? 'rgba(245,158,11,0.6)' : `${accent}70` }}
                          />

                          <div className="flex flex-col items-center text-center space-y-2">
                            {/* Avatar */}
                            <div className="relative">
                              <div className="absolute -inset-[2px] rounded-full opacity-50" style={{ background: `${statusCfg.ring}30` }} />
                              {isVacant ? (
                                <div className="relative w-12 h-12 rounded-full bg-amber-900/30 border border-amber-500/40 flex items-center justify-center">
                                  <UserX className="w-5 h-5 text-amber-400" />
                                </div>
                              ) : photoUrl ? (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                  <img src={photoUrl} alt={staff.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className={`relative w-12 h-12 rounded-full bg-gradient-to-tr ${getAvatarGradient(staff.name)} flex items-center justify-center font-black text-white`}>
                                  {staff.name.charAt(0)}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0e1120]" style={{ background: statusCfg.color }} />
                            </div>

                            <div>
                              <p className={`text-xs font-bold truncate w-full ${isVacant ? 'text-amber-300 italic' : 'text-white'}`} title={staff.name}>
                                {staff.name}
                              </p>
                              <p className="text-[11px] text-slate-300 font-medium mt-0.5 line-clamp-2" title={staff.role}>{staff.role}</p>
                              {staff.grade && (
                                <span className="mt-1 inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.10] text-white border border-white/10">{staff.grade}</span>
                              )}
                            </div>

                            <div className="pt-2 w-full border-t border-white/10 flex items-center justify-between">
                              {renderStatusBadge(staff.status)}
                              <button className="text-[10px] text-indigo-400 group-hover:text-indigo-300 transition-colors duration-150 font-bold">
                                {isEditMode ? 'Edit →' : 'View →'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── VIEW: LIST ─────────────────────────────────────────────────────── */}
        {viewMode === 'list' && (
          <div
            className="rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{ background: 'rgba(14,17,28,0.8)' }}
          >
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {['Nama Pegawai', 'Jawatan & Gred', 'Unit / Seksyen', 'Lapor Kepada', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold text-slate-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStaffList.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">Tiada posisi dijumpai</td></tr>
                ) : filteredStaffList.map((staff, i) => {
                  const photoUrl = getNodePhoto(staff)
                  const isVacant = staff.status === 'vacant' || staff.name.includes('Kekosongan')
                  const accent = getUnitAccent(staff.unit)
                  return (
                    <tr
                      key={staff.id}
                      onClick={() => isEditMode ? handleOpenEdit(staff) : setSelectedStaff(staff)}
                      className={`border-b border-white/[0.04] cursor-pointer transition-colors duration-100 hover:bg-white/[0.04] group ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {isVacant ? (
                            <div className="w-7 h-7 rounded-full bg-amber-900/30 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                              <UserX className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                          ) : photoUrl ? (
                            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/20">
                              <img src={photoUrl} alt={staff.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(staff.name)} flex items-center justify-center font-black text-white text-xs flex-shrink-0`}>
                              {staff.name.charAt(0)}
                            </div>
                          )}
                          <span className={`text-xs font-bold group-hover:text-indigo-300 transition-colors duration-150 ${isVacant ? 'text-amber-300 italic' : 'text-white'}`}>
                            {staff.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-300 font-medium">{staff.role}</span>
                          {staff.grade && <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.10] text-white border border-white/10">{staff.grade}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-md" style={{ color: accent, background: `${accent}20`, border: `1px solid ${accent}40` }}>{staff.unit}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-400">{staff.reportsTo || '— Ketua Tertinggi'}</span>
                      </td>
                      <td className="px-5 py-3">{renderStatusBadge(staff.status)}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); isEditMode ? handleOpenEdit(staff) : setSelectedStaff(staff) }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                            isEditMode
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-white/[0.08] text-slate-200 hover:bg-white/[0.15] hover:text-white'
                          }`}
                        >
                          {isEditMode ? 'Edit' : 'View'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── DRAWER: PROFILE VIEW ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedStaff && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm border-l border-white/[0.12] shadow-2xl flex flex-col overflow-hidden"
              style={{ background: 'rgba(12,15,26,0.97)', backdropFilter: 'blur(20px)' }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.12] bg-slate-900/50">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Profil Pegawai</span>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-slate-300 hover:text-white flex items-center justify-center transition-all duration-150"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Hero Profile Area */}
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div
                        className="absolute -inset-1 rounded-full blur-md opacity-40"
                        style={{ background: STATUS_CONFIG[selectedStaff.status]?.ring || '#22c55e' }}
                      />
                      {selectedStaff.status === 'vacant' ? (
                        <div className="relative w-20 h-20 rounded-full bg-amber-900/20 border-2 border-amber-500/30 flex items-center justify-center">
                          <UserX className="w-9 h-9 text-amber-500/50" />
                        </div>
                      ) : getNodePhoto(selectedStaff) ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden ring-[3px] ring-white/10">
                          <img src={getNodePhoto(selectedStaff)} alt={selectedStaff.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`relative w-20 h-20 rounded-full bg-gradient-to-tr ${getAvatarGradient(selectedStaff.name)} flex items-center justify-center font-black text-white text-2xl ring-[3px] ring-white/10`}>
                          {selectedStaff.name.charAt(0)}
                        </div>
                      )}
                      <div
                        className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[#0c0f1a]"
                        style={{ background: STATUS_CONFIG[selectedStaff.status]?.color || '#22c55e' }}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{selectedStaff.name}</h3>
                    <p className="text-sm text-slate-300 mt-1 font-medium">{selectedStaff.role}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {selectedStaff.grade && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">{selectedStaff.grade}</span>
                      )}
                      {renderStatusBadge(selectedStaff.status)}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-2">
                  {[
                    { label: 'Unit / Seksyen', value: selectedStaff.unit, accent: getUnitAccent(selectedStaff.unit) },
                    { label: 'Jabatan', value: selectedStaff.department },
                    { label: 'Emel Rasmi', value: selectedStaff.email },
                    { label: 'No. Telefon / Ext', value: selectedStaff.phone || '—' },
                    { label: 'Status Semasa', value: selectedStaff.statusDetail || STATUS_CONFIG[selectedStaff.status]?.label },
                  ].map(({ label, value, accent: itemAccent }) => (
                    <div key={label} className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 mt-0.5">{label}</span>
                      <span
                        className="text-xs font-semibold text-right"
                        style={{ color: itemAccent || '#f8fafc' }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider px-1">Tindakan Pantas</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setSelectedStaff(null); navigate(ROUTES.STAFF_CALENDAR) }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-all duration-150"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Kalendar</span>
                    </button>
                    <button
                      onClick={() => { setSelectedStaff(null); navigate(ROUTES.STAFF_MOVEMENT) }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-all duration-150"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Log Pergerakan</span>
                    </button>
                  </div>
                  {isEditMode === false && (
                    <button
                      onClick={() => { handleOpenEdit(selectedStaff); setSelectedStaff(null); setIsEditMode(true) }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all duration-150"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Kemaskini Maklumat Posisi</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── EDIT MODAL ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              className="w-full max-w-lg rounded-2xl border border-white/[0.12] shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: 'rgba(16,20,32,0.98)', backdropFilter: 'blur(24px)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.12] bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
                    {isAddingNew ? <UserPlus className="w-4 h-4 text-amber-400" /> : <Edit3 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isAddingNew ? 'Tambah Posisi Baharu' : 'Kemaskini Posisi'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">Pilih pegawai, kemaskini peranan, dan tetapkan pelaporan</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-slate-300 hover:text-white flex items-center justify-center transition-all duration-150"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="p-6 space-y-5">
                {/* 1. User Select */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <span>Pilih Pengguna / Status <span className="text-rose-400">*</span></span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium normal-case tracking-normal">
                      <Zap className="w-3.5 h-3.5" /> Auto-plot dari database
                    </span>
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={e => handleRealUserSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">-- Pilih pengguna atau pilihan --</option>
                    <option value="__CUSTOM__" className="bg-slate-900 text-amber-300 font-semibold">⭐ PENGARAH HOSPITAL / KEPIMPINAN ATASAN</option>
                    <option value="__VACANT__" className="bg-slate-900 text-amber-400 font-medium">📭 KEKOSONGAN JAWATAN / VACANT</option>
                    <optgroup label="Warga Hospital (Database)" className="bg-slate-900 text-slate-300 font-bold">
                      {realSystemUsers.map(u => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white py-1">{u.full_name} {u.jawatan ? `(${u.jawatan})` : ''}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Custom name input */}
                {selectedUserId === '__CUSTOM__' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                      Nama Penuh <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text" required placeholder="cth. Pengarah Hospital Lawas"
                      value={formName} onChange={e => setFormName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-indigo-500/50 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-indigo-400 placeholder:text-slate-500 shadow-sm"
                    />
                  </div>
                )}

                {/* 2. Designation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Jawatan / Designation <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text" required placeholder="cth. Pegawai Farmasi"
                    value={formRole} onChange={e => setFormRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 shadow-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_ROLE_PRESETS.slice(0, 5).map(p => (
                      <button key={p} type="button" onClick={() => setFormRole(p)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all duration-100 font-medium ${
                          formRole === p
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm font-semibold'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                      >{p}</button>
                    ))}
                  </div>
                </div>

                {/* 3. Unit / Penempatan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Unit / Penempatan <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                  >
                    <option value="pharmacy satelite" className="bg-slate-900 text-white">pharmacy satelite (Farmasi Satelit & Wad)</option>
                    <option value="Pharmacy logistic" className="bg-slate-900 text-white">Pharmacy logistic (Farmasi Logistik & Bekalan)</option>
                    <option value="Pengurusan & Pentadbiran" className="bg-slate-900 text-white">Pengurusan & Pentadbiran</option>
                  </select>
                </div>

                {/* 4. Reports To */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Lapor Kepada (Reports To)</label>
                  <select
                    disabled={editingNode?.id === orgData.id}
                    value={formReportsTo} onChange={e => setFormReportsTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-40 shadow-sm"
                  >
                    {isAddingNew && <option value="__NEW_ROOT__" className="bg-slate-900 text-amber-300 font-medium">👑 JADIKAN KETUA TERTINGGI (Root)</option>}
                    {allStaffList.filter(s => !editingNode || s.id !== editingNode.id).map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white py-1">{s.name} — {s.role}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Auto-plotted preview */}
                <div className="px-4 py-3.5 rounded-xl border border-slate-700/70 bg-slate-900/80 space-y-3">
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Auto-Plotted Preview</p>
                  <div className="flex items-center gap-3">
                    {selectedUserId === '__VACANT__' ? (
                      <div className="w-10 h-10 rounded-full bg-amber-900/30 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                        <UserX className="w-5 h-5 text-amber-400" />
                      </div>
                    ) : formAvatar ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/20">
                        <img src={formAvatar} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(formName)} flex items-center justify-center font-black text-white flex-shrink-0 ring-2 ring-white/20`}>
                        {formName.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{formName || '—'}</p>
                      <p className="text-[11px] text-slate-300 truncate font-medium">{formEmail || '—'}</p>
                      {formGrade && <span className="inline-block text-[10px] font-mono font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 mt-0.5">{formGrade}</span>}
                    </div>
                    <div>{renderStatusBadge(formStatus)}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.10]">
                  <button
                    type="button" onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 transition-all duration-150"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-150 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ─────────────────────────────────────────────────────────────────────────────
          OFFICIAL PRINT VIEW (KKM / HOSPITAL LAWAS EXECUTIVE LANDSCAPE REPORT)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div id="official-org-chart-print-area" className="hidden bg-white text-slate-900">
        {/* Formal Government Letterhead Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2 mb-2">
          <div className="flex items-center gap-4">
            <img
              src={JATA_NEGARA_BASE64}
              alt="Jata Negara Malaysia"
              className="h-[64px] w-auto object-contain shrink-0"
            />
            <div className="leading-tight">
              <h1 className="text-sm font-black tracking-wide text-slate-950 uppercase">
                Kementerian Kesihatan Malaysia
              </h1>
              <h2 className="text-[10px] font-bold text-slate-800 uppercase">
                Jabatan Kesihatan Negeri Sarawak
              </h2>
              <h3 className="text-xs font-black text-indigo-950 uppercase mt-0.5">
                Hospital Lawas
              </h3>
              <p className="text-[9px] font-semibold text-slate-600 uppercase">
                Jabatan Farmasi &amp; Bekalan Logistik Perubatan
              </p>
              <div className="inline-block mt-1 px-2 py-0.5 bg-slate-900 text-white text-[8.5px] font-black uppercase tracking-wider rounded">
                Carta Organisasi Perjawatan &amp; Hierarki Klinikal / Operasi
              </div>
            </div>
          </div>

          <div className="text-right border border-slate-300 rounded-lg p-2 bg-slate-50 text-[8px] min-w-[190px] space-y-1">
            <div className="flex justify-between gap-2 border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold">No. Dokumen:</span>
              <span className="font-mono font-bold text-slate-900">HLWS/FARM/ORG/2026-V2</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold">Tarikh Cetakan:</span>
              <span className="font-bold text-slate-900">{currentDateStr}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold">Klasifikasi:</span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-1 rounded">Rasmi / Edaran Dalaman</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 font-semibold">Status:</span>
              <span className="font-bold text-indigo-900">Berkuat Kuasa Serta-Merta</span>
            </div>
          </div>
        </div>

        {/* Tree Container for Landscape Print (Optimized scale to fill entire A4 canvas) */}
        <div className="w-full flex-1 flex items-center justify-center overflow-visible my-auto">
          <div
            style={{
              transform: 'scale(0.74)',
              transformOrigin: 'top center',
              width: 'max-content',
              margin: '0 auto'
            }}
            className="flex justify-center"
          >
            {renderPrintTreeNode(orgData)}
          </div>
        </div>

        {/* Official 3-Tier Verification Sign-Off Footer */}
        <div className="shrink-0 mt-2 pt-2 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-[8.5px] break-inside-avoid page-break-inside-avoid">
          {/* Box 1: Disediakan */}
          <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col justify-between h-18">
            <div>
              <p className="font-black text-slate-900 uppercase text-[8px] border-b border-slate-200 pb-1 mb-1">
                1. Disediakan Oleh:
              </p>
              <div className="h-6 border-b border-dashed border-slate-400 mb-1" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-[8px]">Pegawai Pentadbiran / Sistem MyStaff</p>
              <p className="text-[7.5px] text-slate-600">Unit Pengurusan Sumber Manusia, Hospital Lawas</p>
            </div>
          </div>

          {/* Box 2: Disemak */}
          <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col justify-between h-18">
            <div>
              <p className="font-black text-slate-900 uppercase text-[8px] border-b border-slate-200 pb-1 mb-1">
                2. Disemak Oleh:
              </p>
              <div className="h-6 border-b border-dashed border-slate-400 mb-1" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-[8px]">Timbalan Pengarah Hospital (Klinikal)</p>
              <p className="text-[7.5px] text-slate-600">Hospital Lawas, Sarawak</p>
            </div>
          </div>

          {/* Box 3: Disahkan */}
          <div className="border-2 border-indigo-950 rounded-lg p-2 bg-indigo-50/60 flex flex-col justify-between h-18">
            <div>
              <p className="font-black text-indigo-950 uppercase text-[8px] border-b border-indigo-200 pb-1 mb-1">
                3. Disahkan &amp; Diluluskan Oleh:
              </p>
              <div className="h-6 border-b border-dashed border-indigo-400 mb-1" />
            </div>
            <div>
              <p className="font-black text-slate-950 text-[8.5px]">Tan Yuan Zhang</p>
              <p className="text-[7.5px] font-bold text-indigo-950">Ketua Pegawai Farmasi (UF52 / UF48)</p>
              <p className="text-[7px] text-slate-600">Hospital Lawas, Sarawak</p>
            </div>
          </div>
        </div>

        {/* Print Disclaimer Footer */}
        <div className="shrink-0 mt-1 flex items-center justify-between text-[7px] text-slate-500">
          <span>Sistem Pengurusan Hospital Lawas (HOMES) — Modul MyStaff OrgChart</span>
          <span>Dokumen ini dijana secara digital dan sah untuk kegunaan urusan rasmi KKM.</span>
        </div>
      </div>
    </div>
  )
}

export default StaffOrgChartPage
