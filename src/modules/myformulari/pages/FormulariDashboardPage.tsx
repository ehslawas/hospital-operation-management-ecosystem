import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Grid,
  List,
  Flame,
  AlertTriangle,
  Droplets,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  PlusCircle,
  FileText,
  SlidersHorizontal,
  X,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Pill,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { getAllFormulariDrugs, searchDrugs, getFormulariSummaryStats } from '../services/formulariService'
import { DrugEntry, PrescriberCategory, HAMCategory } from '../types/formulariTypes'
import { DrugCard } from '../components/DrugCard'
import { DrugInteractionModal } from '../components/DrugInteractionModal'
import { TallManLettering } from '../components/TallManLettering'
import { PrescriberBadge, HAMBadge, LASABadge, NAGBadge, PoisonBadge } from '../components/DrugBadge'
import { QuotaProgressBar } from '../components/QuotaProgressBar'
import { ROUTES } from '@/lib/constants'
import { useLanguage } from '@/shared/contexts/LanguageContext'

type SortField = 'genericName' | 'prescriberCategory' | 'atcCode'
type SortOrder = 'asc' | 'desc'

export const FormulariDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPrescriber, setSelectedPrescriber] = useState<PrescriberCategory | 'ALL'>('ALL')
  const [selectedHamCategory, setSelectedHamCategory] = useState<HAMCategory | 'ALL'>('ALL')
  const [hamOnly, setHamOnly] = useState(false)
  const [lasaOnly, setLasaOnly] = useState(false)
  const [antimicrobialOnly, setAntimicrobialOnly] = useState(false)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false)

  // Table sorting
  const [sortField, setSortField] = useState<SortField>('genericName')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const allDrugs = useMemo(() => getAllFormulariDrugs(), [])
  const stats = useMemo(() => getFormulariSummaryStats(), [allDrugs])

  const filteredDrugs = useMemo(() => {
    const results = searchDrugs(searchTerm, {
      prescriberCategory: selectedPrescriber,
      hamOnly,
      hamCategory: selectedHamCategory,
      lasaOnly,
      antimicrobialOnly,
      lowStockOnly
    })

    // Sort results
    return [...results].sort((a, b) => {
      let comparison = 0
      if (sortField === 'genericName') {
        comparison = a.genericName.localeCompare(b.genericName)
      } else if (sortField === 'prescriberCategory') {
        const order: Record<string, number> = { 'A*': 1, 'A': 2, 'A/KK': 3, 'B': 4, 'C': 5, 'C+': 6 }
        comparison = (order[a.prescriberCategory] || 99) - (order[b.prescriberCategory] || 99)
      } else if (sortField === 'atcCode') {
        comparison = a.atcCode.localeCompare(b.atcCode)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [searchTerm, selectedPrescriber, hamOnly, selectedHamCategory, lasaOnly, antimicrobialOnly, lowStockOnly, allDrugs, sortField, sortOrder])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedPrescriber, selectedHamCategory, hamOnly, lasaOnly, antimicrobialOnly, lowStockOnly, sortField, sortOrder, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredDrugs.length / pageSize))
  const paginatedDrugs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDrugs.slice(start, start + pageSize)
  }, [filteredDrugs, currentPage, pageSize])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedPrescriber('ALL')
    setSelectedHamCategory('ALL')
    setHamOnly(false)
    setLasaOnly(false)
    setAntimicrobialOnly(false)
    setLowStockOnly(false)
  }

  const hasActiveFilters = searchTerm || selectedPrescriber !== 'ALL' || selectedHamCategory !== 'ALL' || hamOnly || lasaOnly || antimicrobialOnly || lowStockOnly

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 inline-block ml-1" />
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-violet-600 inline-block ml-1" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-violet-600 inline-block ml-1" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      {/* Header Panel (Matches System Module Design with violet accent stripe) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl shadow-md flex-shrink-0">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <span>Carian & Senarai Formulari Ubat (FUKKM)</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              Pangkalan Data Rasmi Formulari Ubat KKM (Edisi Ke-4) & Panduan Klinikal Hospital Lawas
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-3">
          <a
            href="https://myformulary.pharmacy.gov.my/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            title="Buka Portal MyFormulary Rasmi KKM"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Portal KKM</span>
          </a>

          <button
            onClick={() => setIsInteractionModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Semak Interaksi Ubat</span>
          </button>
        </div>
      </div>

      {/* Stats KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => { handleResetFilters(); }}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-violet-300 transition-all"
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Jumlah Ubat</span>
          <strong className="text-2xl font-extrabold text-slate-900">{stats.totalDrugs}</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tersenarai dlm FUKKM</span>
        </div>

        <div
          onClick={() => { handleResetFilters(); setHamOnly(true); }}
          className={`p-4 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all ${
            hamOnly ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20' : 'border-rose-200 hover:border-rose-400'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-600" /> HAM List
          </span>
          <strong className="text-2xl font-extrabold text-rose-700">{stats.hamCount}</strong>
          <span className="text-[10px] text-rose-500 block mt-0.5">High Alert Drugs</span>
        </div>

        <div
          onClick={() => { handleResetFilters(); setLasaOnly(true); }}
          className={`p-4 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all ${
            lasaOnly ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20' : 'border-amber-200 hover:border-amber-400'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> LASA Pairs
          </span>
          <strong className="text-2xl font-extrabold text-amber-700">{stats.lasaCount}</strong>
          <span className="text-[10px] text-amber-600 block mt-0.5">TALL-Man Lettering</span>
        </div>

        <div
          onClick={() => { handleResetFilters(); setAntimicrobialOnly(true); }}
          className={`p-4 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all ${
            antimicrobialOnly ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> NAG 2024
          </span>
          <strong className="text-2xl font-extrabold text-emerald-700">{stats.antimicrobialCount}</strong>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Antimikrobial KKM</span>
        </div>

        <div
          onClick={() => { handleResetFilters(); }}
          className="p-4 bg-white rounded-2xl border border-teal-200 shadow-xs cursor-pointer hover:border-teal-400 transition-all"
        >
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block flex items-center gap-1">
            <Droplets className="w-3 h-3 text-teal-600" /> Dilusi IV
          </span>
          <strong className="text-2xl font-extrabold text-teal-700">{stats.ivDilutionCount}</strong>
          <span className="text-[10px] text-teal-600 block mt-0.5">Protokol Rekonstitusi</span>
        </div>

        <div
          onClick={() => { handleResetFilters(); setLowStockOnly(true); }}
          className={`p-4 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all ${
            lowStockOnly ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20' : 'border-rose-200 hover:border-rose-400'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-rose-600" /> Amaran Kuota
          </span>
          <strong className="text-2xl font-extrabold text-rose-700">{stats.lowStockCount}</strong>
          <span className="text-[10px] text-rose-500 block mt-0.5">Stok Rendah / Habis</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari mengikut Nama Generik (INN), Jenama Dagang, Kod ATC, Indikasi, atau Kelas Terapi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Prescriber Dropdown */}
          <select
            value={selectedPrescriber}
            onChange={e => setSelectedPrescriber(e.target.value as PrescriberCategory | 'ALL')}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-violet-500 focus:bg-white"
          >
            <option value="ALL">Semua Kategori Preskriber</option>
            <option value="A*">Kategori A* (Pakar Sahaja)</option>
            <option value="A">Kategori A (Pegawai Perubatan Hospital)</option>
            <option value="A/KK">Kategori A/KK (Hospital & KK)</option>
            <option value="B">Kategori B (Semua Pegawai)</option>
            <option value="C">Kategori C (Komuniti)</option>
          </select>

          {/* View Mode Toggle: Table List (default) vs Card Grid */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Senarai Jadual (List)</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Kad Grid</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Toggle Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Penapis Pantas:</span>
          </span>

          <button
            onClick={() => setHamOnly(!hamOnly)}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              hamOnly ? 'bg-rose-600 text-white border-rose-700 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>High Alert (HAM) Sahaja</span>
          </button>

          <button
            onClick={() => setLasaOnly(!lasaOnly)}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              lasaOnly ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Ubat LASA Sahaja</span>
          </button>

          <button
            onClick={() => setAntimicrobialOnly(!antimicrobialOnly)}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              antimicrobialOnly ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Antimikrobial (NAG)</span>
          </button>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              lowStockOnly ? 'bg-rose-500 text-white border-rose-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Kuota Rendah / Habis</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl font-semibold text-violet-700 hover:text-violet-900 hover:bg-violet-50 transition-colors ml-auto flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Set Semula Penapis</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Menunjukkan <strong className="text-slate-900">{filteredDrugs.length}</strong> daripada <strong className="text-slate-900">{allDrugs.length}</strong> ubat formulari</span>
        {hasActiveFilters && <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md font-semibold">Penapis aktif digunakan</span>}
      </div>

      {/* PRIMARY VIEW: Full-Width Clinical Table List with Rich Columns */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider select-none">
                <tr>
                  <th className="p-4 text-center w-12 text-slate-400">Bil</th>
                  <th
                    onClick={() => handleSort('genericName')}
                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors min-w-[240px]"
                  >
                    <span>Nama Generik (INN) & Jenama</span>
                    {renderSortIcon('genericName')}
                  </th>
                  <th
                    onClick={() => handleSort('prescriberCategory')}
                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors min-w-[150px]"
                  >
                    <span>Kategori Preskriber & Racun</span>
                    {renderSortIcon('prescriberCategory')}
                  </th>
                  <th className="p-4 min-w-[170px]">Kekuatan & Bentuk Dos</th>
                  <th
                    onClick={() => handleSort('atcCode')}
                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors min-w-[200px]"
                  >
                    <span>Kelas Terapi & ATC</span>
                    {renderSortIcon('atcCode')}
                  </th>
                  <th className="p-4 min-w-[260px]">Indikasi Klinikal Utama (FUKKM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDrugs.map((drug, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1
                  return (
                    <tr
                      key={drug.id}
                      onClick={() => navigate(`/formulari/drug/${drug.id}`)}
                      className="hover:bg-violet-50/40 cursor-pointer transition-colors group"
                    >
                      {/* 1. Bil */}
                      <td className="p-4 text-center font-mono text-slate-400 font-bold">
                        {globalIndex}
                      </td>

                      {/* 2. Generic Name (with TALL-Man) & Brands */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-sm leading-snug group-hover:text-violet-700 transition-colors">
                            {drug.isLASA && drug.tallManName ? (
                              <TallManLettering name={drug.tallManName} />
                            ) : (
                              drug.genericName
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            {drug.brandNames.join(' • ')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Kod: {drug.mohDrugCode}
                          </div>
                        </div>
                      </td>

                      {/* 3. Prescriber Category & Poison */}
                      <td className="p-4 space-y-1.5">
                        <PrescriberBadge category={drug.prescriberCategory} size="sm" />
                        <div className="text-[11px] text-slate-500 font-medium">
                          {drug.poisonCategory}
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono block w-fit">
                          Skim: {drug.skimPerolehan}
                        </span>
                      </td>

                      {/* 4. Strengths & Dosage Forms */}
                      <td className="p-4 space-y-1">
                        {drug.strengths.map((str, idx) => (
                          <div key={idx} className="font-semibold text-slate-800 text-[11px]">
                            {str}
                          </div>
                        ))}
                        <div className="text-[11px] text-slate-500 italic">
                          {drug.dosageForms.join(', ')}
                        </div>
                      </td>

                      {/* 5. Therapeutic Class & ATC Code */}
                      <td className="p-4 space-y-1">
                        <div className="font-medium text-slate-800 leading-snug text-xs">
                          {drug.therapeuticClass}
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono inline-block font-semibold">
                          ATC: {drug.atcCode}
                        </span>
                      </td>

                      {/* 6. Main Clinical Indications */}
                      <td className="p-4">
                        <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside leading-snug">
                          {drug.indications.slice(0, 2).map((ind, idx) => (
                            <li key={idx} className="line-clamp-2">{ind}</li>
                          ))}
                          {drug.indications.length > 2 && (
                            <span className="text-[10px] text-violet-600 font-medium pl-3">
                              +{drug.indications.length - 2} indikasi lagi...
                            </span>
                          )}
                        </ul>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECONDARY VIEW: Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {paginatedDrugs.map(drug => (
            <DrugCard key={drug.id} drug={drug} />
          ))}
        </div>
      )}

      {/* Pagination Controls Bar */}
      {filteredDrugs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none">
          <div className="flex items-center gap-3 text-slate-600">
            <span>
              Menunjukkan <strong className="text-slate-900 font-bold">{(currentPage - 1) * pageSize + 1}</strong> - <strong className="text-slate-900 font-bold">{Math.min(currentPage * pageSize, filteredDrugs.length)}</strong> daripada <strong className="text-slate-900 font-bold">{filteredDrugs.length.toLocaleString()}</strong> rekod formulari
            </span>
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
              <span className="text-slate-500">Papar:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-hidden"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <span className="px-3 py-1.5 bg-violet-50 text-violet-700 font-bold rounded-xl border border-violet-200 mx-1">
              Halaman {currentPage} daripada {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 flex items-center gap-1"
            >
              <span className="hidden sm:inline">Seterusnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Zero State */}
      {filteredDrugs.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <Search className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">Tiada ubat formulari dijumpai</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tiada ubat sepadan dengan carian "{searchTerm}" atau penapis yang dipilih. Sila semak ejaan atau tetapkan semula penapis.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs"
          >
            Tetapkan Semula Semua Penapis
          </button>
        </div>
      )}

      {/* Multi-drug Interaction Modal */}
      <DrugInteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        allDrugs={allDrugs}
      />
    </div>
  )
}

export default FormulariDashboardPage

