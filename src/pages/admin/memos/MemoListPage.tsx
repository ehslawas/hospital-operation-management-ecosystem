import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  X,
  Clock,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { Button, Input, Badge, Spinner, Table, LoadingOverlay, Pagination, ConfirmationDialog } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, AdminFilterBar, StatItem } from '@/components/admin'
import { useAuthStore } from '@/stores/authStore'
import { memoService } from '@/services/memoService'
import { useToast } from '@/stores/toastStore'
import { MemoWithRelations } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import { MemoDocumentView } from '@/components/dashboard/MemoDocumentView'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'

const MemoListPage: React.FC = () => {
  const { user } = useAuthStore()
  const toast = useToast()

  // State
  const [memos, setMemos] = useState<MemoWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [selectedMemo, setSelectedMemo] = useState<MemoWithRelations | null>(null)
  const [actionConfirm, setActionConfirm] = useState<{ isOpen: boolean, memo: MemoWithRelations | null, action: 'approve' | 'reject' | null }>({
    isOpen: false,
    memo: null,
    action: null
  })

  const loadMemos = async () => {
    if (!user?.hospital_id) return
    setLoading(true)
    try {
      const { data } = await memoService.getMemos(user.hospital_id)
      if (data) setMemos(data)
    } catch (err) {
      console.error(err)
      toast.error('Error', 'Failed to load memos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMemos()
  }, [user?.hospital_id])

  const handleStatusUpdate = async () => {
    const { memo, action } = actionConfirm
    if (!memo || !action) return

    try {
      const { error } = await memoService.updateMemoStatus({ memoId: memo.id, status: action === 'approve' ? 'approved' : 'rejected' })
      if (error) throw error

      toast.success('Success', `Memo ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
      setMemos(prev => prev.map(m => m.id === memo.id ? { ...m, status: action === 'approve' ? 'approved' : 'rejected' } : m))
    } catch (err) {
      console.error(err)
      toast.error('Error', 'Failed to update status')
    } finally {
      setActionConfirm({ isOpen: false, memo: null, action: null })
    }
  }

  // Stats
  const stats: StatItem[] = useMemo(() => {
    const total = memos.length
    const pending = memos.filter(m => m.status === 'pending_approval').length
    const urgent = memos.filter(m => m.priority === 'urgent' && m.status === 'pending_approval').length
    const approved = memos.filter(m => m.status === 'approved').length

    return [
      {
        label: 'Total Memos',
        value: total,
        icon: FileText,
        color: 'blue'
      },
      {
        label: 'Pending Approval',
        value: pending,
        icon: Clock,
        color: 'amber',
        description: 'Requires action'
      },
      {
        label: 'Urgent Pending',
        value: urgent,
        icon: AlertTriangle,
        color: 'rose',
        description: 'High priority'
      },
      {
        label: 'Published',
        value: approved,
        icon: CheckCircle,
        color: 'emerald',
        description: 'Active memos'
      }
    ]
  }, [memos])

  // Filter Logic
  const filteredMemos = useMemo(() => {
    return memos.filter(m => {
      const matchesSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.content.toLowerCase().includes(search.toLowerCase()) ||
        m.ref_number?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || m.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [memos, search, statusFilter, priorityFilter])

  // Pagination
  const paginatedMemos = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMemos.slice(start, start + pageSize)
  }, [filteredMemos, currentPage, pageSize])

  const columns = [
    {
      key: 'title',
      label: 'Subject',
      render: (_: unknown, row: MemoWithRelations) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 line-clamp-1">{row.title}</span>
            {row.priority === 'urgent' && <Badge variant="error" size="sm">Urgent</Badge>}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {row.ref_number || 'REF-PENDING'}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (_: unknown, row: MemoWithRelations) => (
        <Badge variant="gray" className="capitalize text-xs">
          {row.is_letter ? 'Official Letter' : 'Internal Memo'}
        </Badge>
      )
    },
    {
      key: 'requester',
      label: 'Requested By',
      render: (_: unknown, row: MemoWithRelations) => (
        <div className="text-sm text-slate-700">
          {row.created_by_user?.full_name || 'Unknown'}
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (_: unknown, row: MemoWithRelations) => (
        <span className="text-sm text-slate-600">
          {formatDate(row.created_at)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: MemoWithRelations) => {
        const styles = {
          approved: 'success',
          rejected: 'error',
          pending_approval: 'warning',
          draft: 'gray'
        } as const
        return (
          <Badge variant={styles[row.status as keyof typeof styles] || 'gray'}>
            {row.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Badge>
        )
      }
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: MemoWithRelations) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'pending_approval' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setActionConfirm({ isOpen: true, memo: row, action: 'approve' })
                }}
                className="text-emerald-600 hover:bg-emerald-50 h-8 w-8 p-0"
                title="Approve"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setActionConfirm({ isOpen: true, memo: row, action: 'reject' })
                }}
                className="text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedMemo(row)
            }}
            className="text-slate-500 hover:bg-slate-100 h-8 w-8 p-0"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-28'
    }
  ]

  const headerActions = (
    <Button
      variant="outline"
      onClick={loadMemos}
      disabled={loading}
      leftIcon={<RefreshCw className={loading ? 'animate-spin' : ''} />}
    >
      Refresh
    </Button>
  )

  return (
    <AdminPageLayout
      title="Memo Management"
      description="Review, approve, and manage hospital memos and official letters"
      icon={Bell}
      breadcrumbs={[{ label: 'Memos' }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        <AdminStatsGrid stats={stats} isLoading={loading} />

        <AdminFilterBar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val)
            setCurrentPage(1)
          }}
          searchPlaceholder="Search memos by title, reference, or content..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'pending_approval', label: 'Pending Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'draft', label: 'Draft' }
              ]
            },
            {
              key: 'priority',
              label: 'Priority',
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { value: 'normal', label: 'Normal' },
                { value: 'urgent', label: 'Urgent' }
              ]
            }
          ]}
          onReset={() => {
            setSearch('')
            setStatusFilter('all')
            setPriorityFilter('all')
            setCurrentPage(1)
          }}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Memo List</h3>
            <span className="text-xs text-slate-500">
              Showing {filteredMemos.length} memos
            </span>
          </div>

          <div className="relative">
            {loading && <LoadingOverlay message="Loading memos..." />}
            <Table
              data={paginatedMemos}
              columns={columns}
              isLoading={loading}
              onRowClick={(row) => setSelectedMemo(row)}
              emptyMessage="No memos found."
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/30 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredMemos.length / pageSize)}
              pageSize={pageSize}
              total={filteredMemos.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        </div>
      </div>

      {selectedMemo && (
        <MemoDocumentView
          isOpen={!!selectedMemo}
          onClose={() => setSelectedMemo(null)}
          memo={selectedMemo}
        />
      )}

      <ConfirmationDialog
        isOpen={actionConfirm.isOpen}
        onClose={() => setActionConfirm({ isOpen: false, memo: null, action: null })}
        onConfirm={handleStatusUpdate}
        title={actionConfirm.action === 'approve' ? 'Approve Memo?' : 'Reject Memo?'}
        message={`Are you sure you want to ${actionConfirm.action} this memo? This action will notify the requester.`}
        variant={actionConfirm.action === 'approve' ? 'success' : 'danger'}
        confirmText={actionConfirm.action === 'approve' ? 'Approve' : 'Reject'}
      />
    </AdminPageLayout>
  )
}

export default MemoListPage
