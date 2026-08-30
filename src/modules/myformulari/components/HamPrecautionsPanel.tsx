import React, { useState } from 'react'
import { Flame, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Lock, Users, Activity, AlertOctagon } from 'lucide-react'
import { HAMCategory, HAMRiskLevel } from '../types/formulariTypes'

interface HamPrecautionsPanelProps {
  hamCategory: HAMCategory
  riskLevel: HAMRiskLevel
  precautions?: string[]
  drugName: string
}

export const HamPrecautionsPanel: React.FC<HamPrecautionsPanelProps> = ({
  hamCategory,
  riskLevel,
  precautions = [],
  drugName
}) => {
  const [isOpen, setIsOpen] = useState(true)

  const isCritical = riskLevel === 'CRITICAL'

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
      isCritical ? 'border-rose-300 bg-rose-50/50 shadow-sm' : 'border-amber-300 bg-amber-50/50 shadow-sm'
    }`}>
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 cursor-pointer flex items-center justify-between transition-colors ${
          isCritical ? 'bg-rose-100/80 hover:bg-rose-100' : 'bg-amber-100/80 hover:bg-amber-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl text-white ${isCritical ? 'bg-rose-600' : 'bg-amber-600'}`}>
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isCritical ? 'text-rose-950' : 'text-amber-950'}`}>
                Protokol Keselamatan High Alert Medication (HAM) — KKM
              </h4>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                RISIKO {riskLevel}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Kategori: <strong className="text-slate-800">{hamCategory}</strong>
            </p>
          </div>
        </div>

        <button className="text-slate-500 hover:text-slate-800 p-1">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Content Body */}
      {isOpen && (
        <div className="p-5 space-y-4">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-rose-200/60 text-xs leading-relaxed text-slate-700">
            <p className="font-semibold text-rose-900 mb-1 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Garis Panduan Penggunaan Selamat Ubat Berisiko Tinggi (KKM Edisi Ke-2):</span>
            </p>
            <p>
              Ubat ini berpotensi menyebabkan kemudaratan serius atau kematian kepada pesakit sekiranya berlaku kesilapan dalam pemilihan dos, penyediaan, pelarutan, atau pentadbiran.
            </p>
          </div>

          {/* Core Mandated KKM Checkpoints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5">
              <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-slate-900 block font-semibold">Independent Double-Checking (IDC)</strong>
                <span className="text-slate-600">
                  Dua anggota kesihatan bertauliah wajib menyemak dos, nama pesakit, laluan, dan pengiraan kadar pam secara berasingan.
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-slate-900 block font-semibold">Pelekat Amaran Merah</strong>
                <span className="text-slate-600">
                  Bekas ubat, picagari, dan beg infusi mestilah ditampal dengan pelekat merah khas "HIGH ALERT MEDICATION".
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-slate-900 block font-semibold">Penyimpanan Terkawal</strong>
                <span className="text-slate-600">
                  Disimpan di dalam peti / almari berkunci dengan akses terhad. Hadkan kepelbagaian kepekatan dalam stok wad.
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-slate-900 block font-semibold">Pam Infusi Elektronik</strong>
                <span className="text-slate-600">
                  Wajib menggunakan pam infusi volumetrik / pam picagari bersensor tekanan (elakkan infusi secara graviti bebas).
                </span>
              </div>
            </div>
          </div>

          {/* Specific Precautions for this Drug */}
          {precautions.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Langkah Berjaga-jaga Khusus untuk {drugName}:
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {precautions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-slate-200/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
