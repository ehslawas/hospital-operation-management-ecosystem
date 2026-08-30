import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, ArrowLeft, Lock, RefreshCw, KeyRound, Home } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/constants'

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const state = location.state as { attemptedPath?: string; requiredRole?: string; moduleName?: string } | undefined

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6"
      >
        {/* Shield Icon Badge */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* Header Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-white/5 text-[11px] font-mono uppercase tracking-wider text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            KKM Security Policy Active (HTTP 403)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Akses Disekat (Restricted)
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Akaun anda tidak mempunyai had kuasa atau peranan yang diperlukan untuk mengakses modul atau tindakan ini di bawah polisi keselamatan KKM.
          </p>
        </div>

        {/* User Role Card */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Nama Pengguna</span>
            <span className="font-semibold text-white">{user?.full_name || 'Tidak Diketahui'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Peranan Semasa</span>
            <span className="font-mono font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 uppercase">
              {user?.role?.role_name || user?.role?.role_code || 'Staff Biasa'}
            </span>
          </div>
          {state?.attemptedPath && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-slate-500">Laluan Dipohon</span>
              <span className="font-mono text-slate-400 truncate max-w-[200px]">{state.attemptedPath}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => navigate(ROUTES.HUB)}
            variant="primary"
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-teal-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Hub</span>
          </Button>

          <Button
            onClick={() => {
              logout()
              navigate(ROUTES.LOGIN)
            }}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2 border-white/10 hover:bg-white/5 text-slate-300 hover:text-white py-2.5 rounded-xl"
          >
            <KeyRound className="w-4 h-4" />
            <span>Tukar Akaun</span>
          </Button>
        </div>

        {/* Security Notice Footer */}
        <p className="text-[11px] text-slate-500 pt-2">
          Jika anda memerlukan akses kepada modul ini bagi tujuan tugas rasmi hospital, sila hubungi Pegawai Pentadbir Sistem (System Admin) untuk pengemaskinian peranan.
        </p>
      </motion.div>
    </div>
  )
}

export default UnauthorizedPage
