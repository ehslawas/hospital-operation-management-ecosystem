import React, { useEffect, useState } from 'react'
import { Activity, AirVent, Wind, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, StatCard, Table, Badge } from '@/components/ui'
import { getOxygenCylinders, getOxygenSummary } from '@/services/pharmacy/oxygenService'
import type { OxygenCylinderWithRelations, OxygenSummary } from '@/types/pharmacy'
import type { ApiResponse, Paginated, Column } from '@/types'

export const OxygenDashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [summary, setSummary] = useState<OxygenSummary | null>(null)
  const [cylinders, setCylinders] = useState<OxygenCylinderWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hospitalId) return

    const load = async () => {
      setIsLoading(true)
      setError(null)

      const [summaryRes, listRes]: [
        ApiResponse<OxygenSummary>,
        ApiResponse<Paginated<OxygenCylinderWithRelations>>
      ] = await Promise.all([
        getOxygenSummary(hospitalId),
        getOxygenCylinders(hospitalId, {}, 1, 10) as any,
      ])

      if (summaryRes.error) {
        setError(summaryRes.error)
      } else {
        setSummary(summaryRes.data || null)
      }

      if (listRes.error) {
        setError((prev) => prev ?? listRes.error)
      } else {
        setCylinders(listRes.data?.data || [])
      }

      setIsLoading(false)
    }

    void load()
  }, [hospitalId])

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'full':
        return <Badge variant="success">Full</Badge>
      case 'empty':
        return <Badge variant="secondary">Empty</Badge>
      case 'in_use':
        return <Badge variant="info">In Use</Badge>
      case 'maintenance':
        return <Badge variant="warning">Maintenance</Badge>
      case 'disposed':
        return <Badge variant="error">Disposed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const columns: Column<OxygenCylinderWithRelations>[] = [
    {
      key: 'serial_number',
      label: 'Serial',
      className: 'font-mono text-xs text-gray-700',
    },
    {
      key: 'type_info',
      label: 'Type',
      className: 'text-sm text-gray-900',
      render: (_, row) => (row as any).type_info?.type_name || '-',
    },
    {
      key: 'current_location_id',
      label: 'Location',
      className: 'text-sm text-gray-600',
      render: (_, row) => ((row as any).current_location_id ? 'Location' : '-'),
    },
    {
      key: 'assigned_ward_id',
      label: 'Ward',
      className: 'text-sm text-gray-600',
      render: (_, row) => ((row as any).assigned_ward_id ? 'Ward' : '-'),
    },
    {
      key: 'status',
      label: 'Status',
      className: 'text-right',
      render: (value) => renderStatusBadge(String(value)),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wind className="w-6 h-6 text-sky-600" />
            Medical Oxygen Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of oxygen cylinder capacity, utilization, and status across the hospital.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load oxygen data</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={AirVent}
            title="Total Cylinders"
            value={summary.total_cylinders}
            color="info"
          />
          <StatCard
            icon={Activity}
            title="In Use"
            value={summary.in_use_cylinders}
            color="primary"
          />
          <StatCard
            icon={Wind}
            title="Full"
            value={summary.full_cylinders}
            color="success"
          />
          <StatCard
            icon={AlertTriangle}
            title="Maintenance"
            value={summary.maintenance_cylinders}
            color="warning"
          />
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Cylinder Status (Top 10)
            </h2>
          </div>
          <Table
            data={cylinders}
            columns={columns}
            emptyMessage="No cylinders found."
          />
        </div>
      )}
    </div>
  )
}

export default OxygenDashboardPage


