// @ts-nocheck
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Key } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

export const KunciSubMenu: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <button 
          onClick={() => navigate(ROUTES.HUB)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Hub Utama</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Key className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">MyKunci</h1>
            <p className="text-slate-500">Sistem Pengurusan Kunci Bersepadu</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Modul Sedang Dibina</h2>
        <p className="text-slate-500">Sub-modul ini sedang dalam pembangunan. Sila rujuk Dashboard utama untuk fungsi sedia ada.</p>
        <button 
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="mt-6 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Kembali ke Papan Pemuka
        </button>
      </div>
    </div>
  )
}

export default KunciSubMenu
