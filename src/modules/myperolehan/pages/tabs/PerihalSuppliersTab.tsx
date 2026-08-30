// src/modules/myperolehan/pages/tabs/PerihalSuppliersTab.tsx
// Catalog & Suppliers management component matching Screenshot 2 design & specifications

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Download,
  Plus,
  Layers,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Tag,
  Building,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  MoreVertical,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import { deletePerihalItem } from '../../services/perolehanAdminService'
import { AddOrEditPerihalItemModal } from '../../components/AddOrEditPerihalItemModal'
import type { AdminPerihalItem, AdminSupplier } from '@/shared/types/myperolehan'

interface PerihalSuppliersTabProps {
  catalogItems: AdminPerihalItem[]
  suppliers: AdminSupplier[]
  onRefresh?: () => void
}

export const PerihalSuppliersTab: React.FC<PerihalSuppliersTabProps> = ({
  catalogItems,
  suppliers,
  onRefresh
}) => {
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'catalog' | 'suppliers'>('catalog')
  const [searchTerm, setSearchTerm] = useState('')

  // Left Filter State
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [selectedObjek, setSelectedObjek] = useState<string>('all')
  const [selectedKategori, setSelectedKategori] = useState<string>('all')

  // Collapsed sections tracking
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  // Modal State
  const [isAddOrEditModalOpen, setIsAddOrEditModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<AdminPerihalItem | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Filtered Catalog Items
  const filteredCatalog = useMemo(() => {
    return catalogItems.filter((item) => {
      // Program Filter
      if (selectedProgram !== 'all' && item.program_code !== selectedProgram) return false

      // Objek Filter
      if (selectedObjek !== 'all' && item.objek_code !== selectedObjek) return false

      // Kategori Filter
      if (selectedKategori !== 'all' && item.kategori_code !== selectedKategori) return false

      // Search Term Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchName = item.perihal_name.toLowerCase().includes(term)
        const matchCode =
          item.program_code.toLowerCase().includes(term) ||
          item.objek_code.toLowerCase().includes(term) ||
          item.kategori_code.toLowerCase().includes(term) ||
          (item.meal_session && item.meal_session.toLowerCase().includes(term))
        if (!matchName && !matchCode) return false
      }

      return true
    })
  }, [catalogItems, selectedProgram, selectedObjek, selectedKategori, searchTerm])

  // Extract distinct dropdown options based on hierarchy
  const availableObjeks = useMemo(() => {
    const subset = selectedProgram === 'all'
      ? catalogItems
      : catalogItems.filter((i) => i.program_code === selectedProgram)
    return Array.from(new Set(subset.map((i) => i.objek_code))).filter(Boolean)
  }, [catalogItems, selectedProgram])

  const availableKategoris = useMemo(() => {
    const subset = catalogItems.filter((i) => {
      if (selectedProgram !== 'all' && i.program_code !== selectedProgram) return false
      if (selectedObjek !== 'all' && i.objek_code !== selectedObjek) return false
      return true
    })
    return Array.from(new Set(subset.map((i) => i.kategori_code))).filter(Boolean)
  }, [catalogItems, selectedProgram, selectedObjek])

  // Group items by meal session / group
  const groupedCatalog = useMemo(() => {
    const groups: Record<string, AdminPerihalItem[]> = {}
    filteredCatalog.forEach((item) => {
      const groupName = item.meal_session ? item.meal_session.toUpperCase() : 'LAIN-LAIN / PERKHIDMATAN'
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(item)
    })
    return groups
  }, [filteredCatalog])

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  // Actions
  const handleOpenAdd = () => {
    setItemToEdit(null)
    setIsAddOrEditModalOpen(true)
  }

  const handleOpenEdit = (item: AdminPerihalItem) => {
    setItemToEdit(item)
    setIsAddOrEditModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Adakah anda pasti ingin memadamkan "${name}" daripada katalog?`)) return
    try {
      const { error } = await deletePerihalItem(id)
      if (error) throw error
      toast.success('Item berjaya dipadamkan daripada katalog')
      onRefresh?.()
    } catch (err: any) {
      toast.error('Gagal memadam item', err.message || 'Ralat sistem')
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Bil', 'Perihal Item', 'Keterangan', 'Program', 'Objek', 'Kategori', 'Sesi/Unit', 'Harga/Unit (RM)']
    const rows = filteredCatalog.map((item, idx) => [
      idx + 1,
      `"${item.perihal_name.replace(/"/g, '""')}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.program_code,
      item.objek_code,
      item.kategori_code,
      item.meal_session || item.unit || 'UNIT',
      Number(item.unit_price).toFixed(2)
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Katalog_Perihal_Hospital_Lawas_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Katalog berjaya dieksport ke CSV!')
  }

  return (
    <div className="space-y-6">
      {/* Top Header matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Perihal Catalog</h1>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            Manage standard price items and perihal codes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </Button>
        </div>
      </div>

      {/* Sub-navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 bg-white border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Katalog Perihal ({catalogItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 bg-white border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Direktori Pembekal ({suppliers.length})</span>
        </button>
      </div>

      {activeTab === 'catalog' ? (
        /* 2-Column Split View: Left Classification Panel + Right Main Catalog */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Classification Filter Card */}
          <div className="lg:col-span-3 bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-black text-sm text-slate-900">Classification</h3>
            </div>

            {/* PROGRAM DROPDOWN */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                PROGRAM
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value)
                  setSelectedObjek('all')
                  setSelectedKategori('all')
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Program</option>
                <option value="022300">022300 - Dietetik Dan Sajian</option>
                <option value="020200">020200 - Pengurusan Hospital</option>
                <option value="P42">P42 - Pembangunan</option>
              </select>
            </div>

            {/* OBJEK DROPDOWN */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                OBJEK
              </label>
              <select
                value={selectedObjek}
                onChange={(e) => {
                  setSelectedObjek(e.target.value)
                  setSelectedKategori('all')
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Objek</option>
                {availableObjeks.map((obj) => (
                  <option key={obj} value={obj}>
                    {obj}
                  </option>
                ))}
              </select>
            </div>

            {/* KATEGORI DROPDOWN */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                KATEGORI
              </label>
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Kategori</option>
                {availableKategoris.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            {(selectedProgram !== 'all' || selectedObjek !== 'all' || selectedKategori !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedProgram('all')
                  setSelectedObjek('all')
                  setSelectedKategori('all')
                  setSearchTerm('')
                }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors border-t border-slate-100 pt-3"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Right Panel: Search Bar + Table with Grouped Accordions */}
          <div className="lg:col-span-9 space-y-4">
            {/* Top Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search perihal items by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* Main Table Container */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-xs overflow-hidden">
              {/* Header Row matching Screenshot 2 */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/60 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <div className="col-span-5">ITEM NAME & DESCRIPTION</div>
                <div className="col-span-3">CLASSIFICATION DETAILS</div>
                <div className="col-span-2 text-right">PRICE / UNIT</div>
                <div className="col-span-2 text-right">ACTIONS</div>
              </div>

              {/* Grouped List Items */}
              {Object.keys(groupedCatalog).length > 0 ? (
                Object.entries(groupedCatalog).map(([groupName, items]) => {
                  const isCollapsed = collapsedGroups[groupName]

                  return (
                    <div key={groupName} className="border-b border-slate-100 last:border-b-0">
                      {/* Group Header Banner with Chevron */}
                      <button
                        onClick={() => toggleGroup(groupName)}
                        className="w-full flex items-center justify-between px-6 py-3 bg-slate-50/30 hover:bg-slate-50 transition-colors border-b border-slate-100/60 text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-xs font-black text-slate-800 tracking-wide">
                            {groupName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                            {items.length} ITEMS
                          </span>
                        </div>
                      </button>

                      {/* Items under Group */}
                      {!isCollapsed && (
                        <div className="divide-y divide-slate-100">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors"
                            >
                              {/* 1. Item Name & Description */}
                              <div className="col-span-5 space-y-0.5">
                                <h4 className="text-xs font-black text-slate-900 leading-tight">
                                  {item.perihal_name}
                                </h4>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {item.description || 'No description provided'}
                                </p>
                              </div>

                              {/* 2. Classification Details */}
                              <div className="col-span-3 space-y-1">
                                <span
                                  className={`inline-block text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
                                    item.program_code === '022300'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : item.program_code === 'P42'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}
                                >
                                  {item.program_code}
                                </span>
                                <p className="text-[11px] font-mono font-semibold text-slate-500">
                                  {item.objek_code} — {item.kategori_code}
                                </p>
                              </div>

                              {/* 3. Price / Unit */}
                              <div className="col-span-2 text-right">
                                <p className="text-sm font-black text-slate-900 font-mono">
                                  {formatCurrency(Number(item.unit_price) || 0)}
                                </p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                                  PER {item.unit || 'UNIT'}
                                </p>
                              </div>

                              {/* 4. Actions (Edit / Delete) */}
                              <div className="col-span-2 flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Kemaskini Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, item.perihal_name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Padam Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Tiada item perihal ditemui mengikut tapisan semasa.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Suppliers View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[2rem] bg-white border-2 border-slate-100 p-6 shadow-xs space-y-4 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{s.company_name}</h4>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {s.supplier_code || 'ADM-SUPPLIER'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktif
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                {s.contact_person && (
                  <p className="flex items-center gap-2">
                    <span className="text-slate-400">Pegawai:</span>
                    <strong className="text-slate-800">{s.contact_person}</strong>
                  </p>
                )}
                {s.contact_person_phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-mono font-semibold text-slate-700">{s.contact_person_phone}</span>
                  </p>
                )}
                {s.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="truncate text-slate-700">{s.email}</span>
                  </p>
                )}
                {s.address && (
                  <p className="flex items-start gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{s.address}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[10px]">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200 flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3" />
                  <span>MOF DISAHKAN</span>
                </span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-200">
                  BUMIPUTERA
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <AddOrEditPerihalItemModal
        isOpen={isAddOrEditModalOpen}
        onClose={() => setIsAddOrEditModalOpen(false)}
        onSuccess={() => onRefresh?.()}
        itemToEdit={itemToEdit}
      />
    </div>
  )
}
