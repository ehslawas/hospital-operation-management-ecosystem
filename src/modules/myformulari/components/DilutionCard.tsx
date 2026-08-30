import React from 'react'
import { Droplets, CheckCircle2, XCircle, AlertTriangle, Clock, Activity, ShieldAlert, MapPin, Sparkles, Layers, ArrowRight, ShieldCheck, Thermometer } from 'lucide-react'
import { ReconstitutionProtocol, DilutionProtocol } from '../types/formulariTypes'

interface DilutionCardProps {
  reconstitution?: ReconstitutionProtocol
  dilution?: DilutionProtocol
  drugName: string
}

export const DilutionCard: React.FC<DilutionCardProps> = ({
  reconstitution,
  dilution,
  drugName
}) => {
  if (!reconstitution?.isApplicable && !dilution?.isApplicable) {
    return (
      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-2">
        <Droplets className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
        <p className="font-bold text-slate-800 text-sm">Tiada Protokol Rekonstitusi / Pelarutan IV Khusus</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Ubat ini sedia untuk digunakan dalam bentuk dos asal (cth: tablet oral, sirap sedia guna, krim) dan tidak memerlukan pembancuhan parenteral.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* QUICK CLINICAL SUMMARY DASHBOARD */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 text-white rounded-3xl p-6 sm:p-7 shadow-md border border-indigo-800/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-black tracking-wide uppercase text-indigo-200">
              Ringkasan Pantas Infusi & Pembancuhan (Clinical IV Quick-Guide)
            </h4>
          </div>
          <span className="text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full">
            Garis Panduan IV KKM
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* 1. Guna Apa Untuk Bancuh */}
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
              1. Guna Apa Untuk Bancuh (Reconstitute):
            </span>
            <p className="text-white font-bold text-sm">
              {reconstitution?.preferredSolvent || 'Water for Injection (WFI)'}
            </p>
            <span className="text-[11px] text-slate-300 block">
              Isipadu: {reconstitution?.solventVolume || 'Ikut label vial'}
            </span>
          </div>

          {/* 2. Guna Apa Untuk Dilute */}
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
              2. Cecair Pembawa (Diluent):
            </span>
            <p className="text-white font-bold text-sm">
              {dilution?.compatibleDiluents?.[0] || '0.9% Normal Saline (NS)'}
            </p>
            <span className="text-[11px] text-slate-300 block">
              Isipadu beg: {dilution?.standardDilution?.volume || '50 mL - 100 mL'}
            </span>
          </div>

          {/* 3. Cara & Berapa Lama Infusi */}
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
              3. Berapa Lama Infusi (Duration):
            </span>
            <p className="text-emerald-300 font-black text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{dilution?.standardDilution?.infusionDuration || '30 - 60 minit'}</span>
            </p>
            <span className="text-[11px] text-slate-300 block">
              Laluan: {dilution?.standardDilution?.route || 'IV Intermittent Infusion'}
            </span>
          </div>

          {/* 4. Di Mana Hendak Simpan */}
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
              4. Di Mana & Berapa Lama Tahan:
            </span>
            <p className="text-amber-300 font-bold text-sm">
              Suhu Bilik / Peti Sejuk (2-8°C)
            </p>
            <span className="text-[11px] text-slate-300 block">
              Beg IV: Tahan 8j (25°C) / 48j (2-8°C)
            </span>
          </div>
        </div>
      </div>

      {/* 1. RECONSTITUTION SECTION */}
      {reconstitution?.isApplicable && (
        <div className="bg-white rounded-3xl border border-teal-200 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Droplets className="w-5 h-5" />
              <div>
                <h4 className="font-bold text-sm">Langkah 1: Rekonstitusi Serbuk Botol (Vial Reconstitution)</h4>
                <p className="text-[11px] text-teal-100">Cara membancuh serbuk kering asal menjadi larutan pekat sebelum dilarutkan ke dalam beg IV</p>
              </div>
            </div>
            {reconstitution.standardVialStrength && (
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                Kekuatan: {reconstitution.standardVialStrength}
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100">
                <span className="text-[11px] text-teal-800 font-bold uppercase tracking-wider block mb-0.5">Pelarut Disyorkan</span>
                <strong className="text-sm text-slate-900">{reconstitution.preferredSolvent || 'Water for Injection (WFI)'}</strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">atau 0.9% Normal Saline</span>
              </div>

              <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100">
                <span className="text-[11px] text-teal-800 font-bold uppercase tracking-wider block mb-0.5">Isipadu Pelarut Ditambah</span>
                <strong className="text-sm text-slate-900">{reconstitution.solventVolume || '3.2 mL (bagi 1.5g)'}</strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">Suntik perlahan ke dinding vial</span>
              </div>

              <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100">
                <span className="text-[11px] text-teal-800 font-bold uppercase tracking-wider block mb-0.5">Kepekatan Terhasil</span>
                <strong className="text-sm text-teal-950 font-bold">{reconstitution.resultingConcentration || '375 mg/mL'}</strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">Selepas larut sepenuhnya</span>
              </div>
            </div>

            {/* Step by Step Instructions */}
            {reconstitution.stepByStepInstructions && reconstitution.stepByStepInstructions.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Arahan Pembancuhan Aseptik Langkah Demi Langkah:</span>
                </h5>
                <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                  {reconstitution.stepByStepInstructions.map((step, idx) => (
                    <li key={idx} className="leading-relaxed pl-1">
                      <span className="text-slate-800 font-medium">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Appearance & Displacement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-teal-50/40 p-3.5 rounded-2xl border border-teal-100">
              <div>
                <span className="font-bold text-teal-900 block mb-0.5">Rupa Fizikal Larutan:</span>
                <span className="text-slate-700 font-medium">{reconstitution.physicalAppearance || 'Jernih, tidak berwarna hingga kuning jerami pucat tanpa zarah terampai.'}</span>
              </div>
              <div>
                <span className="font-bold text-teal-900 block mb-0.5">Isipadu Anjakan (Displacement Volume):</span>
                <span className="text-slate-700 font-medium">{reconstitution.displacementVolume || '0.8 mL per 1.5g vial (ambil kira jika mengira dos pediatrik).'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DILUTION & INFUSION SECTION */}
      {dilution?.isApplicable && (
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5" />
              <div>
                <h4 className="font-bold text-sm">Langkah 2: Pelarutan Sekunder & Kaedah Infusi IV (Dilution & Infusion Protocol)</h4>
                <p className="text-[11px] text-indigo-100">Garis panduan kepekatan selamat, cecair pembawa serasi & tempoh titisan infusi KKM</p>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
              Laluan: {dilution.standardDilution.route}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Infusion Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <span className="text-[11px] text-indigo-800 font-bold uppercase tracking-wider block mb-0.5">Dos Lazim</span>
                <strong className="text-xs text-slate-900">{dilution.standardDilution.doseRange}</strong>
              </div>

              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <span className="text-[11px] text-indigo-800 font-bold uppercase tracking-wider block mb-0.5">Isipadu Pelarutan Beg IV</span>
                <strong className="text-xs text-slate-900">{dilution.standardDilution.volume}</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">50 mL - 100 mL Normal Saline</span>
              </div>

              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <span className="text-[11px] text-indigo-800 font-bold uppercase tracking-wider block mb-0.5">Kepekatan Akhir Beg</span>
                <strong className="text-xs text-indigo-950 font-bold">{dilution.standardDilution.finalConcentration}</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">Maks 45 mg/mL jika sekatan cecair</span>
              </div>

              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block mb-0.5">Tempoh Infusi (How Long)</span>
                <strong className="text-xs text-emerald-950 font-black flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{dilution.standardDilution.infusionDuration}</span>
                </strong>
                <span className="text-[10px] text-emerald-700 block mt-0.5">IV Bolus: perlahan &gt;10-15 min</span>
              </div>
            </div>

            {/* Compatibility with Infusion Fluids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cecair Pembawa Yang Boleh Digunakan (Compatible):</span>
                </h5>
                <ul className="space-y-1 text-xs text-emerald-800 font-medium">
                  {dilution.compatibleDiluents.map((fluid, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{fluid}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
                <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Cecair / Bahan DILARANG Digunakan (Incompatible):</span>
                </h5>
                <ul className="space-y-1 text-xs text-rose-800 font-medium">
                  {dilution.incompatibleDiluents.map((fluid, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>{fluid}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Y-Site Compatibility Matrix */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Kesesuaian Laluan Y-Site (Y-Site Line Compatibility & Flushing):
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-emerald-800 block mb-1">Boleh Dikongsi Talian (Y-Site Compatible):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {dilution.ySiteCompatibility.compatible.map((item, idx) => (
                      <span key={idx} className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md font-semibold text-[11px]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-rose-800 block mb-1">DILARANG Kongsi Talian (Y-Site Incompatible):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {dilution.ySiteCompatibility.incompatible.map((item, idx) => (
                      <span key={idx} className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md font-semibold text-[11px]">
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 italic font-medium">
                    * Mesti gunakan talian IV berasingan atau bilas (flush) dengan &ge; 20 mL Normal Saline sebelum dan selepas ubat tidak serasi (cth: Aminoglycosides / Gentamicin).
                  </p>
                </div>
              </div>
            </div>

            {/* Monitoring Parameters */}
            {dilution.monitoringParameters && dilution.monitoringParameters.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Parameter Pemantauan Semasa Infusi:
                </h5>
                <div className="flex flex-wrap gap-2 text-xs">
                  {dilution.monitoringParameters.map((param, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-3 py-1 rounded-xl font-medium">
                      • {param}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
