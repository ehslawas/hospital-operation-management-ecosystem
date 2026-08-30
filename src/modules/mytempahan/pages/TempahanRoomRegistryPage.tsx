// src/modules/mytempahan/pages/TempahanRoomRegistryPage.tsx
// Master Hospital Facility & Room Registry Directory with Dark/Light Support & Admin Add/Edit Modal

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  Layers,
  Wrench,
  Edit3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  Tv,
  Check,
  X,
  ArrowLeft,
  CalendarDays
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import {
  Room,
  RoomCategory,
  RoomStatus,
  RoomAmenity
} from '@/shared/types/mytempahan'
import {
  getRooms,
  saveRoom,
  deleteRoom
} from '../services/tempahanService'
import { cn } from '@/lib/utils'

export const TempahanRoomRegistryPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getRooms()
      if (res.data) setRooms(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('tempahan_rooms_updated', handleUpdate)
    return () => window.removeEventListener('tempahan_rooms_updated', handleUpdate)
  }, [])

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          r.name.toLowerCase().includes(q) ||
          r.room_code.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [rooms, selectedCategory, searchQuery])

  const handleOpenAddModal = () => {
    setEditingRoom({
      name: '',
      room_code: '',
      category: 'meeting_room',
      capacity: 20,
      location: 'Hospital Daerah Lawas',
      floor_level: 'Aras 1',
      building_block: 'Blok Pentadbiran',
      status: 'available',
      amenities: ['wifi_kkm', 'aircond', 'smart_tv'],
      operating_hours: { start: '07:30', end: '22:00', operatingDays: [0, 1, 2, 3, 4, 5, 6] },
      min_notice_hours: 2,
      max_advance_days: 180,
      setup_buffer_minutes: 15,
      cleanup_buffer_minutes: 15,
      requires_approval: true,
      pic: {
        name: user?.full_name || 'Pegawai Penjaga Bilik',
        phone: user?.phone_number || '085-284100',
        email: user?.email || 'hosp_lawas@moh.gov.my',
        jawatan: user?.jawatan || 'Pegawai Pentadbiran',
        department: 'Unit Fasiliti'
      }
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(JSON.parse(JSON.stringify(room)))
    setIsModalOpen(true)
  }

  const handleSaveRoom = async () => {
    if (!editingRoom || !editingRoom.name?.trim()) {
      addToast({ type: 'warning', title: 'Nama Diperlukan', message: 'Sila masukkan nama fasiliti/bilik.' })
      return
    }

    try {
      setSaving(true)
      const res = await saveRoom(editingRoom)
      if (res.data) {
        addToast({
          type: 'success',
          title: 'Fasiliti Dikemaskini',
          message: `Maklumat ${res.data.name} berjaya disimpan.`
        })
        setIsModalOpen(false)
        setEditingRoom(null)
      }
    } catch (err) {
      console.error(err)
      addToast({ type: 'error', title: 'Ralat', message: 'Gagal menyimpan maklumat bilik.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleAmenity = (amenity: RoomAmenity) => {
    if (!editingRoom) return
    const current = editingRoom.amenities || []
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity]
    setEditingRoom({ ...editingRoom, amenities: updated })
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(ROUTES.TEMPAHAN)}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Kembali ke Papan Pemuka"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Direktori Fasiliti & Bilik Hospital
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {filteredRooms.length} Fasiliti
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar bilik mesyuarat, dewan persidangan, makmal latihan dan spesifikasi peralatan sokongan.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Daftar Fasiliti Baharu</span>
        </button>
      </div>

      {/* 2. Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'Semua Fasiliti' },
            { id: 'meeting_room', label: 'Bilik Mesyuarat' },
            { id: 'conference_hall', label: 'Dewan / Auditorium' },
            { id: 'training_room', label: 'Bilik Latihan & Seminar' },
            { id: 'computer_lab', label: 'Makmal Komputer' },
            { id: 'discussion_room', label: 'Bilik Diskusi' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                selectedCategory === tab.id
                  ? 'bg-slate-900 dark:bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari kod bilik, nama, aras..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* 3. Rooms Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredRooms.map(room => {
          const isMaintenance = room.status === 'maintenance'

          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: room.color_code || '#0284c7' }}
                    />
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                      {room.room_code}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                      room.status === 'available' && 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                      isMaintenance && 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                      room.status === 'inactive' && 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {isMaintenance ? 'PENYELENGGARAAN' : room.status === 'available' ? 'TERSEDIA' : 'TIDAK AKTIF'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-snug">
                  {room.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{room.location}</span>
                </p>

                {/* Capacity & Buffer Stats */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">KAPASITI</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{room.capacity} Pax Maks</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">BUFFER TURNAROUND</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{room.setup_buffer_minutes || 15}m / {room.cleanup_buffer_minutes || 15}m</span>
                  </div>
                </div>

                {/* Amenities List */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Peralatan Sedia Ada:</span>
                  <div className="flex flex-wrap gap-1">
                    {(room.amenities || []).map(a => (
                      <span key={a} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200/60 dark:border-slate-700/60">
                        {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* PIC Info */}
                {room.pic && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Pegawai Penjaga Bilik:</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{room.pic.name}</div>
                    <div>Tel: {room.pic.phone}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigate(`${ROUTES.TEMPAHAN_CALENDAR}?roomId=${room.id}`)}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Jadual
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(room)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate(`${ROUTES.TEMPAHAN_REQUEST_NEW}?roomId=${room.id}`)}
                    className="py-2 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    Tempah
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Add / Edit Room Modal */}
      <AnimatePresence>
        {isModalOpen && editingRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {editingRoom.id ? 'Kemaskini Maklumat Fasiliti' : 'Daftar Fasiliti & Bilik Baharu'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Nama Fasiliti / Bilik *</label>
                    <input
                      type="text"
                      value={editingRoom.name || ''}
                      onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })}
                      placeholder="cth. Bilik Mesyuarat Melati"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Kod Bilik</label>
                    <input
                      type="text"
                      value={editingRoom.room_code || ''}
                      onChange={e => setEditingRoom({ ...editingRoom, room_code: e.target.value })}
                      placeholder="cth. BM-MLTI-02"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Kategori</label>
                    <select
                      value={editingRoom.category || 'meeting_room'}
                      onChange={e => setEditingRoom({ ...editingRoom, category: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="meeting_room">Bilik Mesyuarat</option>
                      <option value="conference_hall">Dewan / Auditorium</option>
                      <option value="training_room">Bilik Latihan & Seminar</option>
                      <option value="computer_lab">Makmal Komputer</option>
                      <option value="discussion_room">Bilik Diskusi</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Kapasiti Maksimum (Pax)</label>
                    <input
                      type="number"
                      value={editingRoom.capacity || 20}
                      onChange={e => setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) || 1 })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Status Bilik</label>
                    <select
                      value={editingRoom.status || 'available'}
                      onChange={e => setEditingRoom({ ...editingRoom, status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="available">Tersedia</option>
                      <option value="maintenance">Penyelenggaraan</option>
                      <option value="inactive">Tidak Aktif</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Lokasi Lengkap & Blok</label>
                    <input
                      type="text"
                      value={editingRoom.location || ''}
                      onChange={e => setEditingRoom({ ...editingRoom, location: e.target.value })}
                      placeholder="cth. Aras 3, Blok Pentadbiran"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Aras Bangunan</label>
                    <input
                      type="text"
                      value={editingRoom.floor_level || ''}
                      onChange={e => setEditingRoom({ ...editingRoom, floor_level: e.target.value })}
                      placeholder="cth. Aras 3"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Amenities Toggle */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Peralatan Sedia Ada</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'projector', label: 'Projektor HD' },
                      { id: 'smart_tv', label: 'Smart TV' },
                      { id: 'video_conferencing', label: 'Zoom / VC Hardware' },
                      { id: 'pa_sound_system', label: 'Sistem PA' },
                      { id: 'wireless_mic', label: 'Mikrofon Tanpa Wayar' },
                      { id: 'whiteboard', label: 'Papan Putih' },
                      { id: 'wifi_kkm', label: 'WiFi KKM' },
                      { id: 'aircond', label: 'Penghawa Dingin' },
                      { id: 'podium', label: 'Podium Rasmi' }
                    ].map(a => {
                      const isSelected = (editingRoom.amenities || []).includes(a.id as any)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAmenity(a.id as any)}
                          className={cn(
                            'p-2 rounded-lg border text-left text-xs font-semibold flex items-center justify-between',
                            isSelected
                              ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 dark:border-teal-500 text-teal-900 dark:text-teal-200'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          )}
                        >
                          <span>{a.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveRoom}
                  disabled={saving}
                  className="py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Maklumat Bilik'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TempahanRoomRegistryPage
