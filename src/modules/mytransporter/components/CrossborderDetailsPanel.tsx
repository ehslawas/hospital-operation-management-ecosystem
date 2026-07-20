// src/modules/mytransporter/components/CrossborderDetailsPanel.tsx
import React from 'react';
import type { CrossborderData } from '@/shared/types/mytransporter';
import { Card, CardContent } from '@/components/ui';

interface CrossborderDetailsPanelProps {
  data?: CrossborderData;
}

export const CrossborderDetailsPanel: React.FC<CrossborderDetailsPanelProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-6 text-slate-800">
      {/* Border & Trip Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/80">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pintu Kawalan Sempadan</span>
          <p className="text-sm font-semibold text-slate-700">{data.border_control_post || '-'}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tempat Berlepas</span>
          <p className="text-sm font-semibold text-slate-700">{data.tempat_berlepas || '-'}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">No. Rujukan Kebenaran</span>
          <p className="text-sm font-semibold text-slate-700">{data.surat_kebenaran_ref || '-'}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Doktor Perujuk</span>
          <p className="text-sm font-semibold text-slate-700">{data.doktor_perujuk_nama || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Nama Pengarah Diluluskan</span>
          <p className="text-sm font-semibold text-slate-700">{data.pengarah_nama || '-'}</p>
        </div>
      </div>

      {/* Patient Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5">
          1. Butiran Pesakit Rentasi Sempadan
        </h4>
        <div className="overflow-hidden border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">Urutan</th>
                <th className="py-2.5 px-3">Nama</th>
                <th className="py-2.5 px-3 w-20">Jantina</th>
                <th className="py-2.5 px-3 w-24">Tarikh Lahir</th>
                <th className="py-2.5 px-3 w-32">Warganegara</th>
                <th className="py-2.5 px-3 w-40">Dokumen Perjalanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.patients && data.patients.length > 0 ? (
                data.patients.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-2 px-3 text-center font-bold text-slate-400">{p.urutan}</td>
                    <td className="py-2 px-3 font-semibold text-slate-700">{p.nama}</td>
                    <td className="py-2 px-3">{p.jantina}</td>
                    <td className="py-2 px-3">{p.tarikh_lahir}</td>
                    <td className="py-2 px-3">{p.warganegara}</td>
                    <td className="py-2 px-3">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold mr-1.5">
                        {p.jenis_dokumen}
                      </span>
                      <span className="font-mono">{p.no_dokumen}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-slate-400 text-xs">
                    Tiada maklumat pesakit ditemui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Escort Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: KKM Escorts */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5">
            2. Pengiring Perubatan (KKM)
          </h4>
          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3 w-28">Jawatan</th>
                  <th className="py-2.5 px-3 w-36">Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.kkm_escorts && data.kkm_escorts.length > 0 ? (
                  data.kkm_escorts.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-700">{e.nama}</td>
                      <td className="py-2 px-3">
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                          {e.jawatan === 'medical_officer' ? 'Doctor / MO' : e.jawatan}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">{e.jenis_dokumen}:</span>
                        <span className="font-mono">{e.no_dokumen}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-slate-400 text-xs">
                      Tiada pengiring perubatan direkodkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section B: Next of Kin Escorts */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5">
            3. Waris / Pengiring Terdekat (Maksimum 1 Per Pesakit)
          </h4>
          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Nama Waris</th>
                  <th className="py-2.5 px-3 w-28">Hubungan</th>
                  <th className="py-2.5 px-3 w-36">Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.waris_escorts && data.waris_escorts.length > 0 ? (
                  data.waris_escorts.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-700">{e.nama}</td>
                      <td className="py-2 px-3 text-slate-600">{e.hubungan}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">{e.jenis_dokumen}:</span>
                        <span className="font-mono">{e.no_dokumen}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-slate-400 text-xs">
                      Tiada pengiring waris direkodkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Catatan / Remarks */}
      {data.catatan && (
        <div className="bg-slate-50/35 border border-slate-100 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Catatan Rentasi Sempadan</span>
          <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{data.catatan}</p>
        </div>
      )}
    </div>
  );
};
