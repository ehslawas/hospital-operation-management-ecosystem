import React, { useState } from 'react'
import { X, ShieldAlert, AlertTriangle, CheckCircle2, Search, Plus, Trash2, ArrowRight } from 'lucide-react'
import { DrugEntry } from '../types/formulariTypes'
import { checkDrugInteractions } from '../services/formulariService'

interface DrugInteractionModalProps {
  isOpen: boolean
  onClose: () => void
  allDrugs: DrugEntry[]
  initialDrug?: DrugEntry | null
}

export const DrugInteractionModal: React.FC<DrugInteractionModalProps> = ({
  isOpen,
  onClose,
  allDrugs,
  initialDrug
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialDrug ? [initialDrug.id] : [])
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  const handleAddDrug = (id: string) => {
    if (!selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id])
    }
    setSearchTerm('')
  }

  const handleRemoveDrug = (id: string) => {
    setSelectedIds(selectedIds.filter(item => item !== id))
  }

  const availableToAdd = allDrugs.filter(d => 
    !selectedIds.includes(d.id) &&
    (d.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     d.brandNames.some(b => b.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const selectedDrugs = allDrugs.filter(d => selectedIds.includes(d.id))
  const interactions = checkDrugInteractions(selectedIds)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Semakan Interaksi Ubat Klinikal</h2>
              <p className="text-xs text-purple-200">Pemeriksaan silang interaksi ubat-ke-ubat (Drug-Drug Interaction Checker)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Drug Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Pilih Ubat untuk Pemeriksaan Silang ({selectedDrugs.length} dipilih):
            </label>

            {/* Selected Pills */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
              {selectedDrugs.length === 0 ? (
                <span className="text-xs text-slate-400 italic self-center">
                  Sila pilih sekurang-kurangnya 2 ubat di bawah untuk melihat interaksi.
                </span>
              ) : (
                selectedDrugs.map(drug => (
                  <span
                    key={drug.id}
                    className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-900 border border-violet-300 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs"
                  >
                    <span>{drug.genericName}</span>
                    <button
                      onClick={() => handleRemoveDrug(drug.id)}
                      className="text-violet-700 hover:text-rose-600 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Search Input & Dropdown */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari ubat untuk ditambah (cth: Meropenem, Valproate, Morphine, Heparin)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              {searchTerm.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-20 p-2 space-y-1">
                  {availableToAdd.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">Tiada ubat ditemui</div>
                  ) : (
                    availableToAdd.map(drug => (
                      <div
                        key={drug.id}
                        onClick={() => handleAddDrug(drug.id)}
                        className="p-2.5 hover:bg-violet-50 rounded-xl cursor-pointer flex items-center justify-between text-xs text-slate-800 transition-colors"
                      >
                        <span className="font-semibold">{drug.genericName}</span>
                        <span className="text-[11px] text-slate-500">{drug.therapeuticClass}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results Analysis */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Keputusan Interaksi ({interactions.length} dikesan)
              </h3>
              {interactions.length > 0 && (
                <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Amaran Interaksi Klinikal Wujud
                </span>
              )}
            </div>

            {selectedDrugs.length < 2 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                Sila tambah sekurang-kurangnya 2 ubat untuk menjalankan semakan keselamatan silang.
              </div>
            ) : interactions.length === 0 ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <strong className="text-sm font-bold block">Tiada Interaksi Kritikal Dikesan</strong>
                  <span>Ubat-ubatan yang dipilih tidak mempunyai rekod kontraindikasi silang langsung dalam pangkalan data formulari.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((res, idx) => {
                  const isCrit = res.interaction.severity === 'CRITICAL'
                  const isMaj = res.interaction.severity === 'MAJOR'

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border ${
                        isCrit 
                          ? 'bg-rose-50/80 border-rose-300 shadow-xs' 
                          : isMaj
                          ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{res.drugA.genericName}</span>
                          <span className="text-slate-400">↔</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{res.drugB.genericName}</span>
                        </div>

                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isCrit ? 'bg-rose-600 text-white' : isMaj ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'
                        }`}>
                          SEVERITI: {res.interaction.severity}
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 text-slate-700">
                        <p>
                          <strong className="text-slate-900">Kesan Interaksi: </strong>
                          {res.interaction.effect}
                        </p>
                        <p className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 text-slate-800">
                          <strong className="text-violet-900 font-semibold">Tindakan Klinikal / Pengurusan: </strong>
                          {res.interaction.management}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Rujukan: Pangkalan Data FUKKM, Lexicomp & Micromedex KKM</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
