// src/modules/myporter/pages/PorterRoleAssignmentPage.tsx
import React, { useEffect, useState } from 'react'
import { Users, Shield, UserCheck, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/stores/toastStore'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { getPorterProfiles, getPorterRoles, assignPorterRole } from '../services/porterService'
import type { PorterProfile } from '@/shared/types/myporter'

export const PorterRoleAssignmentPage: React.FC = () => {
  const toast = useToast()
  const [porters, setPorters] = useState<PorterProfile[]>([])
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pRes, rRes] = await Promise.all([getPorterProfiles(), getPorterRoles()])
      if (pRes.data) setPorters(pRes.data)
      if (rRes.data) setRolesMap(rRes.data)
    } catch (err: any) {
      toast.error('Ralat Memuat Peranan', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await assignPorterRole(userId, newRole)
      if (res.data) {
        setRolesMap(prev => ({ ...prev, [userId]: newRole }))
        toast.success('Peranan Dikemaskini', 'Akses modul MyPorter telah dikemaskini.')
      }
    } catch (err: any) {
      toast.error('Ralat Mengemaskini Peranan', err.message)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-sky-400" />
          <span>Tetapan Peranan & Kebenaran MyPorter</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Uruskan kebenaran akses kakitangan sebagai Pemohon Wad, PPK Rider, Penerima, atau Penyelia Dispatch
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Senarai Petugas & Peranan Semasa</h3>
        <div className="divide-y divide-slate-800/80">
          {porters.map((p) => {
            const currentRole = rolesMap[p.user_id] || 'porter_driver'
            return (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800"
                  />
                  <div>
                    <h4 className="font-extrabold text-white">{p.full_name}</h4>
                    <p className="text-slate-400 font-mono">{p.staff_no} ({p.gred}) • {p.assigned_zone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 w-full sm:w-auto"
                    value={currentRole}
                    onChange={(e) => handleRoleChange(p.user_id, e.target.value)}
                  >
                    <option value="porter_driver">PPK Dispatch (Driver Panel)</option>
                    <option value="porter_supervisor">Penyelia PPK (Dispatch Manager)</option>
                    <option value="ward_requester">Pemohon Wad (Requester)</option>
                    <option value="ward_receiver">Penerima Wad (Receiver)</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PorterRoleAssignmentPage
