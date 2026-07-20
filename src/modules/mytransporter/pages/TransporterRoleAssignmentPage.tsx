// src/modules/mytransporter/pages/TransporterRoleAssignmentPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Users, 
  Shield, 
  Check, 
  Search,
  UserCheck,
  UserX,
  Plus
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { getUsers } from '@/services/userService'
import { getTransporterRoles, assignTransporterRole } from '../services/transporterService'
import type { UserWithRelations } from '@/shared/types/auth'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge,
  Input
} from '@/components/ui'

const TransporterRoleAssignmentPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [users, setUsers] = useState<UserWithRelations[]>([])
  const [transporterRoles, setTransporterRoles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Load users
      const userRes = await getUsers({ page: 1, pageSize: 100 })
      if (userRes && userRes.data) {
        setUsers(userRes.data)
      }

      // 2. Load transporter roles mapping
      const roleRes = await getTransporterRoles()
      if (roleRes.data) {
        setTransporterRoles(roleRes.data)
      }
    } catch (err: any) {
      toast.error('Gagal Memuatkan Pengguna', err.message || 'Sila cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string | null) => {
    try {
      const res = await assignTransporterRole(userId, newRole)
      if (res.error) throw new Error(res.error)
      
      toast.success('Kemaskini Berjaya', 'Kebenaran peranan pengguna berjaya dikemaskini.')
      
      // Update local state
      setTransporterRoles(prev => {
        const next = { ...prev }
        if (newRole) {
          next[userId] = newRole
        } else {
          delete next[userId]
        }
        return next
      })
    } catch (err: any) {
      toast.error('Ralat Mengemaskini', err.message || 'Sila cuba lagi.')
    }
  }

  // Filter users based on search term
  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.department?.department_name && u.department.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getTransporterRoleLabel = (role: string | null) => {
    if (role === 'transport_driver') return <Badge variant="success">Pemandu Bertugas</Badge>
    if (role === 'transport_admin') return <Badge variant="error">Pentadbir Transport</Badge>
    return <Badge variant="gray">Staff Biasa (Pemohon)</Badge>
  }

  return (
    <div className="w-full p-6 md:p-8 space-y-6">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/transporter/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Papan Pemuka</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-indigo-600 animate-pulse" />
          Kebenaran & Peranan Kakitangan (Module Access Controls)
        </h1>
        <p className="text-slate-500 text-sm">
          Tentukan kakitangan yang mempunyai peranan sebagai Pemandu Bertugas atau Pentadbir Pengangkutan untuk meluluskan permohonan.
        </p>
      </div>

      {/* User Search Card */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <Input 
              placeholder="Cari Pengguna melalui Nama / ID Pekerja / Jabatan"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-xs text-slate-400 flex items-center italic justify-end">
            * Perubahan peranan berkuatkuasa serta-merta pada sesi pengguna.
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Memuatkan maklumat kakitangan hospital...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Tiada kakitangan sepadan dijumpai.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Kakitangan</th>
                    <th className="px-6 py-4">ID Pekerja / Email</th>
                    <th className="px-6 py-4">Jabatan Asal</th>
                    <th className="px-6 py-4">Akses Pengangkutan Semasa</th>
                    <th className="px-6 py-4 text-right">Tukar Peranan Transporter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredUsers.map((u) => {
                    const currentRole = transporterRoles[u.id] || null
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{u.full_name}</div>
                          <div className="text-xxs text-slate-400 font-semibold">{u.jawatan || 'Kakitangan'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs">{u.employee_id}</div>
                          <div className="text-xxs text-slate-400">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-600">
                          {u.department?.department_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTransporterRoleLabel(currentRole)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <select
                            value={currentRole || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              handleRoleChange(u.id, val === '' ? null : val)
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none"
                          >
                            <option value="">Tiada (Akses Pemohon Sahaja)</option>
                            <option value="transport_driver">Pemandu Bertugas (Driver)</option>
                            <option value="transport_admin">Pentadbir Transport (Admin)</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

export default TransporterRoleAssignmentPage
