import React, { useState } from 'react'
import { ClipboardCheck, Plus, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Table, Badge, Button, Select, Input } from '@/components/ui'
import type { VerificationType, VerificationStatus } from '@/types/pharmacy'

// Mock data for demonstration
const mockVerifications = [
  {
    id: 'sv-001',
    verification_number: 'SV-2024-001',
    verification_type: 'full' as VerificationType,
    location_name: 'Main Pharmacy Store',
    scheduled_date: '2024-01-15',
    started_at: '2024-01-15T09:00:00',
    completed_at: '2024-01-15T17:30:00',
    status: 'completed' as VerificationStatus,
    total_items: 450,
    variance_count: 12,
    performed_by: 'Ahmad bin Hassan',
  },
  {
    id: 'sv-002',
    verification_number: 'SV-2024-002',
    verification_type: 'cycle' as VerificationType,
    location_name: 'Ward 3A Store',
    scheduled_date: '2024-01-20',
    started_at: '2024-01-20T08:30:00',
    completed_at: null,
    status: 'in_progress' as VerificationStatus,
    total_items: 85,
    variance_count: 3,
    performed_by: 'Siti Aminah',
  },
  {
    id: 'sv-003',
    verification_number: 'SV-2024-003',
    verification_type: 'spot' as VerificationType,
    location_name: 'Cold Room',
    scheduled_date: '2024-01-25',
    started_at: null,
    completed_at: null,
    status: 'scheduled' as VerificationStatus,
    total_items: 0,
    variance_count: 0,
    performed_by: null,
  },
]

export const StockVerificationPage: React.FC = () => {
  const [verifications] = useState(mockVerifications)
  const [typeFilter, setTypeFilter] = useState<VerificationType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'all'>('all')

  const filteredVerifications = verifications.filter((v) => {
    if (typeFilter !== 'all' && v.verification_type !== typeFilter) return false
    if (statusFilter !== 'all' && v.status !== statusFilter) return false
    return true
  })

  const renderStatusBadge = (status: VerificationStatus) => {
    const map: Record<VerificationStatus, { color: 'success' | 'warning' | 'info' | 'secondary'; label: string; icon: React.ReactNode }> = {
      scheduled: { color: 'info', label: 'Scheduled', icon: <Calendar className="w-3 h-3" /> },
      in_progress: { color: 'warning', label: 'In Progress', icon: <Clock className="w-3 h-3" /> },
      completed: { color: 'success', label: 'Completed', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { color: 'secondary', label: 'Cancelled', icon: <AlertTriangle className="w-3 h-3" /> },
    }
    const cfg = map[status] || { color: 'secondary', label: status, icon: null }
    return (
      <Badge variant={cfg.color} className="flex items-center gap-1">
        {cfg.icon}
        {cfg.label}
      </Badge>
    )
  }

  const renderTypeBadge = (type: VerificationType) => {
    const map: Record<VerificationType, { color: 'info' | 'warning' | 'secondary'; label: string }> = {
      full: { color: 'info', label: 'Full Count' },
      cycle: { color: 'warning', label: 'Cycle Count' },
      spot: { color: 'secondary', label: 'Spot Check' },
    }
    const cfg = map[type] || { color: 'secondary', label: type }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Summary counts
  const scheduled = verifications.filter((v) => v.status === 'scheduled').length
  const inProgress = verifications.filter((v) => v.status === 'in_progress').length
  const completed = verifications.filter((v) => v.status === 'completed').length
  const totalVariances = verifications.reduce((sum, v) => sum + v.variance_count, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-teal-600" />
            Stock Verification
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Schedule and conduct physical inventory counts to ensure accuracy.
          </p>
        </div>

        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule Verification
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <span className="text-sm font-medium text-blue-700">Scheduled</span>
          <p className="text-2xl font-bold text-blue-800 mt-1">{scheduled}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-sm font-medium text-amber-700">In Progress</span>
          <p className="text-2xl font-bold text-amber-800 mt-1">{inProgress}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-sm font-medium text-green-700">Completed</span>
          <p className="text-2xl font-bold text-green-800 mt-1">{completed}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="text-sm font-medium text-red-700">Total Variances</span>
          <p className="text-2xl font-bold text-red-800 mt-1">{totalVariances}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="w-full md:w-44">
          <label className="block text-xs font-medium text-gray-600 mb-1">Verification Type</label>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as VerificationType | 'all')}>
            <option value="all">All Types</option>
            <option value="full">Full Count</option>
            <option value="cycle">Cycle Count</option>
            <option value="spot">Spot Check</option>
          </Select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as VerificationStatus | 'all')}>
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
          <ClipboardCheck className="w-3 h-3" />
          <span>{filteredVerifications.length} verifications</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Cell as="th">Verification No.</Table.Cell>
              <Table.Cell as="th">Type</Table.Cell>
              <Table.Cell as="th">Location</Table.Cell>
              <Table.Cell as="th">Scheduled</Table.Cell>
              <Table.Cell as="th">Completed</Table.Cell>
              <Table.Cell as="th" className="text-right">Items</Table.Cell>
              <Table.Cell as="th" className="text-right">Variances</Table.Cell>
              <Table.Cell as="th" className="text-center">Status</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {filteredVerifications.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center text-sm text-gray-500 py-8">
                  No stock verifications found.
                </Table.Cell>
              </Table.Row>
            )}

            {filteredVerifications.map((verification) => (
              <Table.Row key={verification.id}>
                <Table.Cell className="font-mono text-xs text-teal-600 font-medium">
                  {verification.verification_number}
                </Table.Cell>
                <Table.Cell>
                  {renderTypeBadge(verification.verification_type)}
                </Table.Cell>
                <Table.Cell className="text-sm text-gray-900">
                  {verification.location_name}
                </Table.Cell>
                <Table.Cell className="text-sm text-gray-600">
                  {formatDate(verification.scheduled_date)}
                </Table.Cell>
                <Table.Cell className="text-sm text-gray-600">
                  {formatDate(verification.completed_at)}
                </Table.Cell>
                <Table.Cell className="text-right text-sm">
                  {verification.total_items || '—'}
                </Table.Cell>
                <Table.Cell className="text-right">
                  {verification.variance_count > 0 ? (
                    <span className="text-red-600 font-medium">{verification.variance_count}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </Table.Cell>
                <Table.Cell className="text-center">
                  {renderStatusBadge(verification.status)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Info Box */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <h3 className="font-medium text-teal-800 mb-2">📋 Verification Types</h3>
        <ul className="text-sm text-teal-700 space-y-1 list-disc list-inside">
          <li><strong>Full Count:</strong> Complete physical inventory of all items in a location (typically annual)</li>
          <li><strong>Cycle Count:</strong> Counting a subset of items on a rotating basis (typically monthly/quarterly)</li>
          <li><strong>Spot Check:</strong> Random verification of specific items or batches (as needed)</li>
        </ul>
      </div>
    </div>
  )
}

export default StockVerificationPage

