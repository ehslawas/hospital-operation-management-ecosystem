// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Plus,
  Trash2,
  Building2,
  Search,
  Package,
  Pill,
  AlertCircle,
  Edit2,
  CheckCircle2,
  X,
  Check,
  Layers,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Spinner, Input, Badge } from '@/components/ui'
import {
  getDepartments,
  getIndentEntitlements,
  upsertIndentEntitlement,
  deleteIndentEntitlement,
  getFacilityInventoryCatalog,
} from '@/modules/distribution/services/indentService'
import type { IndentEntitlement, IndentItemType } from '@/types/pharmacy'

export interface CatalogItem {
  item_code: string
  item_name: string
  item_type: IndentItemType
  unit: string
}

export interface SelectedItemConfig {
  item: CatalogItem
  maxQty: number
}

export const IndentEntitlementPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-1'
  const { success: showSuccess, error: showError } = useToastStore()

  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-nephro')
  const [entitlements, setEntitlements] = useState<IndentEntitlement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Facility Inventory Catalog state
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)

  // Drawer Panel State (Slide over from right - 2 Column Wide Layout)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingEntitlement, setEditingEntitlement] = useState<Partial<IndentEntitlement> | null>(null)
  
  // Selected items queue for 2-column configuration
  const [selectedQueue, setSelectedQueue] = useState<SelectedItemConfig[]>([])
  
  const [catalogFilterType, setCatalogFilterType] = useState<'all' | 'drug' | 'non_drug'>('all')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [globalMaxQty, setGlobalMaxQty] = useState<number>(500)
  const [isSaving, setIsSaving] = useState(false)

  // Page level search filter
  const [search, setSearch] = useState('')

  useEffect(() => {
    getDepartments(hospitalId).then((res) => {
      if (res.data) setDepartments(res.data)
    })
  }, [hospitalId])

  const loadEntitlements = async () => {
    setIsLoading(true)
    const res = await getIndentEntitlements(hospitalId, selectedDeptId)
    if (res.data) setEntitlements(res.data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (selectedDeptId) {
      void loadEntitlements()
    }
  }, [selectedDeptId, hospitalId])

  const loadCatalog = async () => {
    setIsCatalogLoading(true)
    const res = await getFacilityInventoryCatalog(hospitalId)
    if (res.data && res.data.length > 0) {
      setCatalogItems(res.data)
    }
    setIsCatalogLoading(false)
  }

  const handleOpenAddDrawer = () => {
    setEditingEntitlement(null)
    setCatalogFilterType('all')
    setCatalogSearch('')
    setGlobalMaxQty(500)
    setSelectedQueue([])
    setIsDrawerOpen(true)
    void loadCatalog()
  }

  const handleOpenEditDrawer = (ent: IndentEntitlement) => {
    setEditingEntitlement(ent)
    const matched = catalogItems.find((c) => c.item_code === ent.item_code) || {
      item_code: ent.item_code || 'CODE-NEW',
      item_name: ent.item_name,
      item_type: ent.item_type,
      unit: 'UNIT',
    }
    setSelectedQueue([
      {
        item: matched,
        maxQty: ent.max_qty_per_request || 500,
      },
    ])
    setIsDrawerOpen(true)
    void loadCatalog()
  }

  const handleToggleSelectItem = (item: CatalogItem) => {
    setSelectedQueue((prev) => {
      const exists = prev.find((q) => q.item.item_code === item.item_code)
      if (exists) {
        return prev.filter((q) => q.item.item_code !== item.item_code)
      } else {
        return [...prev, { item, maxQty: globalMaxQty }]
      }
    })
  }

  const handleUpdateItemQty = (itemCode: string, qty: number) => {
    setSelectedQueue((prev) =>
      prev.map((q) => (q.item.item_code === itemCode ? { ...q, maxQty: Math.max(1, qty) } : q))
    )
  }

  const handleApplyPresetToAll = (qty: number) => {
    setGlobalMaxQty(qty)
    setSelectedQueue((prev) => prev.map((q) => ({ ...q, maxQty: qty })))
  }

  const handleSave = async () => {
    if (selectedQueue.length === 0) {
      showError('Please select at least one item from the facility catalog')
      return
    }

    setIsSaving(true)
    let hasError = false

    for (const config of selectedQueue) {
      const res = await upsertIndentEntitlement({
        id: editingEntitlement?.id,
        hospital_id: hospitalId,
        department_id: selectedDeptId,
        item_type: config.item.item_type,
        item_code: config.item.item_code,
        item_name: config.item.item_name,
        max_qty_per_request: config.maxQty,
        is_active: true,
      })

      if (res.error) {
        hasError = true
        showError(res.error)
        break
      }
    }

    setIsSaving(false)

    if (!hasError) {
      showSuccess(`Saved ${selectedQueue.length} item(s) to department entitlement successfully!`)
      setIsDrawerOpen(false)
      void loadEntitlements()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item from department entitlement?')) return
    const res = await deleteIndentEntitlement(id)
    if (res.error) {
      showError(res.error)
    } else {
      showSuccess('Entitlement item removed.')
      void loadEntitlements()
    }
  }

  const selectedDeptObj = departments.find((d) => d.id === selectedDeptId)
  const filteredEntitlements = entitlements.filter(
    (e) =>
      e.item_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.item_code && e.item_code.toLowerCase().includes(search.toLowerCase()))
  )

  // Catalog items filtered in left column
  const filteredCatalogItems = catalogItems.filter((item) => {
    const matchesType = catalogFilterType === 'all' || item.item_type === catalogFilterType
    const matchesSearch =
      item.item_name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.item_code.toLowerCase().includes(catalogSearch.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-slate-800/90 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Department Indent Entitlement Setup
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure allowed drug and non-drug items each department (e.g., Nephrology) can indent from store
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenAddDrawer}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Entitlement Item
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Department Selector */}
        <div className="lg:col-span-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-3 shadow-xl">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Building2 className="w-4 h-4 text-emerald-400" /> Select Department
          </h2>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {departments.map((dept) => {
              const isSelected = dept.id === selectedDeptId
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{dept.department_name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Entitled Items Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Entitlement Item List
                  <span className="text-xs font-semibold text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {selectedDeptObj?.department_name || 'Nephrology'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {entitlements.length} item(s) authorized for indenting by this department
                </p>
              </div>

              <div className="w-full sm:w-64 relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <Input
                  placeholder="Filter items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 bg-slate-950 border-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : filteredEntitlements.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No entitlement items configured for this department yet. Click "Add Entitlement Item" to grant access.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Item Code</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Max Qty / Req</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredEntitlements.map((ent) => (
                      <tr key={ent.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-emerald-400 font-semibold">
                          {ent.item_code || '—'}
                        </td>
                        <td className="p-3 font-semibold text-slate-100">{ent.item_name}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              ent.item_type === 'drug'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {ent.item_type === 'drug' ? (
                              <Pill className="w-3 h-3" />
                            ) : (
                              <Package className="w-3 h-3" />
                            )}
                            {ent.item_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-200">
                          {ent.max_qty_per_request ? ent.max_qty_per_request : 'Unlimited'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={ent.is_active ? 'success' : 'neutral'}>
                            {ent.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditDrawer(ent)}
                              className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(ent.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-Over 2-COLUMN Wide Drawer from Right */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
            />

            {/* Drawer Container (Wider 2-Column Panel max-w-5xl) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 27, stiffness: 230 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-5xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      {editingEntitlement ? 'Edit Entitlement Limit' : 'Add Item Entitlements'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Target Dept:{' '}
                      <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 ml-1">
                        {selectedDeptObj?.department_name || 'Nephrology'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body - 2 Columns Layout */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                {/* LEFT COLUMN: Facility Catalog Picker */}
                <div className="flex flex-col h-full overflow-hidden p-5 space-y-4 bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-400" />
                      1. Select Items from Facility Catalog
                    </label>
                    {isCatalogLoading && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
                      </span>
                    )}
                  </div>

                  {/* Filter Tabs & Search */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                      <button
                        onClick={() => setCatalogFilterType('all')}
                        className={`flex-1 py-1 rounded-lg text-center font-medium transition-colors ${
                          catalogFilterType === 'all'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All ({catalogItems.length})
                      </button>
                      <button
                        onClick={() => setCatalogFilterType('drug')}
                        className={`flex-1 py-1 rounded-lg text-center font-medium transition-colors ${
                          catalogFilterType === 'drug'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Drugs ({catalogItems.filter((i) => i.item_type === 'drug').length})
                      </button>
                      <button
                        onClick={() => setCatalogFilterType('non_drug')}
                        className={`flex-1 py-1 rounded-lg text-center font-medium transition-colors ${
                          catalogFilterType === 'non_drug'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Non-Drugs ({catalogItems.filter((i) => i.item_type === 'non_drug').length})
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <Input
                        placeholder="Search facility inventory by code or description..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="pl-9 bg-slate-950 border-slate-800 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Catalog Item Selection List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-800/80 rounded-xl p-2 bg-slate-950/60 space-y-2">
                    {isCatalogLoading ? (
                      <div className="py-12 flex justify-center">
                        <Spinner size="md" />
                      </div>
                    ) : filteredCatalogItems.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500">
                        No inventory items found matching search.
                      </div>
                    ) : (
                      filteredCatalogItems.map((item) => {
                        const isSelected = selectedQueue.some((q) => q.item.item_code === item.item_code)
                        return (
                          <div
                            key={item.item_code}
                            onClick={() => handleToggleSelectItem(item)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                                : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-emerald-400">
                                  {item.item_code}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                    item.item_type === 'drug'
                                      ? 'bg-purple-500/20 text-purple-300'
                                      : 'bg-blue-500/20 text-blue-300'
                                  }`}
                                >
                                  {item.item_type}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-100">{item.item_name}</p>
                              <p className="text-[10px] text-slate-500">Unit: {item.unit}</p>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                                  : 'border-slate-700 bg-slate-950 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Configuration & Summary Panel */}
                <div className="flex flex-col h-full overflow-hidden p-5 space-y-4 bg-slate-900/90">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      2. Entitlement Quota & Summary
                    </label>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                      {selectedQueue.length} Item(s) Selected
                    </span>
                  </div>

                  {/* Preset Quick Actions */}
                  {selectedQueue.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold">
                        Apply Quota Limit Preset to All Selected ({selectedQueue.length})
                      </label>
                      <div className="flex items-center gap-2">
                        {[100, 200, 500, 1000].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => handleApplyPresetToAll(preset)}
                            className="flex-1 py-1 text-center rounded-lg text-xs font-mono bg-slate-900 border border-slate-700/70 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-200 transition-colors"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Items Queue List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-800/80 rounded-xl p-3 bg-slate-950/80 space-y-3">
                    {selectedQueue.length === 0 ? (
                      <div className="py-20 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                          <ArrowRight className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          No items selected yet.
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Click items from the catalog on the left to configure quota limits and authorize them for{' '}
                          <span className="text-emerald-400 font-semibold">{selectedDeptObj?.department_name}</span>.
                        </p>
                      </div>
                    ) : (
                      selectedQueue.map((config) => (
                        <div
                          key={config.item.item_code}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-100">{config.item.item_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-emerald-400 font-bold">
                                  {config.item.item_code}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Unit: {config.item.unit}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleSelectItem(config.item)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                            <label className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                              Max Quota / Request:
                            </label>
                            <div className="w-32">
                              <Input
                                type="number"
                                min={1}
                                value={config.maxQty}
                                onChange={(e) =>
                                  handleUpdateItemQty(config.item.item_code, parseInt(e.target.value) || 1)
                                }
                                className="bg-slate-950 border-slate-800 text-xs text-slate-100 font-bold text-right"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Target Department:{' '}
                  <span className="text-slate-200 font-semibold">
                    {selectedDeptObj?.department_name || 'Nephrology'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-xs text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || selectedQueue.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 px-5 py-2"
                  >
                    {isSaving ? (
                      'Saving Entitlements...'
                    ) : (
                      <>
                        Confirm & Save ({selectedQueue.length}) Item(s)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default IndentEntitlementPage
