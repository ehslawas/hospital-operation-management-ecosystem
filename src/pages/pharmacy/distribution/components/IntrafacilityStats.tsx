"use client";

import React from 'react';
import {
    Activity,
    Clock,
    CheckCircle,
    XCircle,
    ClipboardList
} from 'lucide-react';
import { StatCard } from '@/components/ui';

interface IntrafacilityStatsProps {
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    loading?: boolean;
}

export const IntrafacilityStats: React.FC<IntrafacilityStatsProps> = ({ stats, loading = false }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Requests"
                value={stats.total}
                icon={ClipboardList}
                color="primary"
                loading={loading}
            />
            <StatCard
                title="Pending Review"
                value={stats.pending}
                icon={Clock}
                color="warning"
                loading={loading}
            />
            <StatCard
                title="Preparing/Approved"
                value={stats.approved}
                icon={Activity}
                color="info"
                loading={loading}
            />
            <StatCard
                title="Rejected/Cancelled"
                value={stats.rejected}
                icon={XCircle}
                color="error"
                loading={loading}
            />
        </div>
    );
};
