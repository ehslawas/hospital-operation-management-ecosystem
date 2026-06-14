"use client";

import React from 'react';
import { Table, Badge, Button } from '@/components/ui';
import { Eye, ArrowRightLeft } from 'lucide-react';
import type { TransferRequestWithRelations, TransferStatus } from '@/types/pharmacy';
import type { Column } from '@/types';

interface IntrafacilityTableProps {
    data: TransferRequestWithRelations[];
    onViewDetail: (request: TransferRequestWithRelations) => void;
    loading?: boolean;
}

export const IntrafacilityTable: React.FC<IntrafacilityTableProps> = ({ data, onViewDetail, loading = false }) => {

    const renderStatusBadge = (status: TransferStatus) => {
        switch (status) {
            case 'pending': return <Badge variant="warning">Pending Approval</Badge>
            case 'approved': return <Badge variant="info">Approved / Preparing</Badge>
            case 'preparing': return <Badge variant="info">Preparing</Badge>
            case 'in_transit': return <Badge variant="info">In Transit</Badge>
            case 'received': return <Badge variant="success">Received</Badge>
            case 'completed': return <Badge variant="success">Completed</Badge>
            case 'rejected': return <Badge variant="error">Rejected</Badge>
            case 'cancelled': return <Badge variant="gray">Cancelled</Badge>
            default: return <Badge variant="gray">{status}</Badge>
        }
    }

    const renderPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent': return <Badge variant="error" className="uppercase font-bold">Urgent</Badge>
            case 'high': return <Badge variant="warning" className="uppercase font-bold">High</Badge>
            case 'normal': return <Badge variant="info" className="uppercase font-bold">Normal</Badge>
            case 'low': return <Badge variant="gray" className="uppercase font-bold">Low</Badge>
            default: return <Badge variant="gray" className="uppercase font-bold">{priority}</Badge>
        }
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('en-MY', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const columns: Column<TransferRequestWithRelations>[] = [
        {
            key: 'transfer_number',
            label: 'Transfer No.',
            className: 'font-mono text-xs text-purple-600 font-bold',
        },
        {
            key: 'to_department',
            label: 'Requesting Dept',
            className: 'text-sm font-bold text-slate-700',
            render: (_, row) => (
                <div className="flex flex-col">
                    <span>{row.to_department?.department_name || '—'}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase leading-tight mt-0.5">INTRA-FACILITY</span>
                </div>
            )
        },
        {
            key: 'request_date',
            label: 'Requested At',
            className: 'text-xs text-slate-500 font-medium',
            render: (val) => formatDate(val as string)
        },
        {
            key: 'priority',
            label: 'Priority',
            className: 'text-center',
            render: (val) => renderPriorityBadge(val as string)
        },
        {
            key: 'status',
            label: 'Status',
            className: 'text-center',
            render: (val) => renderStatusBadge(val as TransferStatus)
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: (_, row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail(row);
                    }}
                    className="h-8 w-8 p-0 rounded-full hover:bg-purple-50 text-purple-600"
                >
                    <Eye className="w-4 h-4" />
                </Button>
            )
        }
    ];

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <Table
                data={data}
                columns={columns}
                loading={loading}
                onRowClick={onViewDetail}
                emptyMessage="No intrafacility requests found."
            />
        </div>
    );
};
