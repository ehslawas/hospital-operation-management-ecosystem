import React, { useMemo } from 'react'
import { DepartmentBreakdownItem } from '@/types/pharmacy'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui'
import { Building2, Activity } from 'lucide-react'

interface DepartmentBreakdownTableProps {
    data: DepartmentBreakdownItem[]
}

export const DepartmentBreakdownTable: React.FC<DepartmentBreakdownTableProps> = ({ data }) => {
    // Flatten the data for the table
    const rows = useMemo(() => {
        const result: any[] = []

        // Pre-filter the data to remove "Unassigned" at all levels
        const filteredData = data
            .filter(dept => dept.department !== 'Unassigned')
            .map(dept => ({
                ...dept,
                vote_codes: (dept.vote_codes || [])
                    .filter(vc => vc.code !== 'Unassigned')
                    .map(vc => ({
                        ...vc,
                        activities: (vc.activities || []).filter(act => act.code !== 'Unassigned')
                    }))
                    .filter(vc => vc.code !== '' || (vc.activities && vc.activities.length > 0))
            }))
            .filter(dept => dept.vote_codes && dept.vote_codes.length > 0);

        filteredData.forEach((dept) => {
            // Calculate total rows for this department for rowSpan
            let deptRowSpan = 0

            dept.vote_codes.forEach((vc) => {
                const activityCount = vc.activities && vc.activities.length > 0 ? vc.activities.length : 1
                deptRowSpan += activityCount
            })

            let firstRowInDept = true

            dept.vote_codes.forEach((vc) => {
                const activities = vc.activities && vc.activities.length > 0 ? vc.activities : []
                const vcRowSpan = activities.length > 0 ? activities.length : 1

                let firstRowInVC = true

                if (activities.length > 0) {
                    activities.forEach((act) => {
                        result.push({
                            // Department Data
                            deptName: dept.department,
                            deptRowSpan: firstRowInDept ? deptRowSpan : 0,
                            isFirstInDept: firstRowInDept,

                            // Vote Code Data
                            vcCode: vc.code,
                            vcTotalOrders: vc.total_orders,
                            vcRowSpan: firstRowInVC ? vcRowSpan : 0,
                            isFirstInVC: firstRowInVC,

                            // Activity Data
                            actCode: act.code,
                            orders: act.total_orders,
                            items: act.total_items,
                            isActivity: true
                        })
                        firstRowInDept = false
                        firstRowInVC = false
                    })
                } else {
                    // Case where no activities are listed, just display the vote code total
                    result.push({
                        deptName: dept.department,
                        deptRowSpan: firstRowInDept ? deptRowSpan : 0,
                        isFirstInDept: firstRowInDept,

                        vcCode: vc.code,
                        vcRowSpan: 1,
                        isFirstInVC: true,

                        actCode: '-', // No specific activity
                        orders: vc.total_orders,
                        items: vc.total_items,
                        isActivity: false
                    })
                    firstRowInDept = false
                }
            })
        })

        return result
    }, [data])

    if (!data || data.length === 0) return null

    const formatDepartmentName = (name: string) => {
        if (name === 'laboratory_pathology') return 'Pathologist'
        return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100 shadow-sm">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-none">
                            Department Breakdown
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                            Cost distribution by vote code
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-semibold tracking-wide text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                    DETAILED REPORT
                </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white ring-1 ring-slate-200/50">
                <Table>
                    <TableHeader className="bg-slate-50/90 border-b border-slate-200 backdrop-blur-sm">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableCell as="th" className="!h-6 !py-0 font-bold text-slate-600 text-[10px] w-[30%] !pl-4 uppercase tracking-wider">Department</TableCell>
                            <TableCell as="th" className="!h-6 !py-0 font-bold text-slate-600 text-[10px] w-[25%] uppercase tracking-wider">Vote Code</TableCell>
                            <TableCell as="th" className="!h-6 !py-0 font-bold text-slate-600 text-[10px] w-[25%] uppercase tracking-wider">Activity</TableCell>
                            <TableCell as="th" className="!h-6 !py-0 font-bold text-slate-600 text-[10px] text-center w-[10%] uppercase tracking-wider">Orders</TableCell>
                            <TableCell as="th" className="!h-6 !py-0 font-bold text-slate-600 text-[10px] text-right w-[10%] !pr-4 uppercase tracking-wider">Items</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, index) => {
                            // Logic for row separation spacing (only between departments)
                            const isNewDepartment = row.isFirstInDept;

                            // Styling classes - even subtler separators
                            const rowBorderClass = isNewDepartment && index !== 0
                                ? 'border-t border-slate-200'
                                : 'border-t border-slate-50/50';

                            return (
                                <TableRow key={index} className={`hover:bg-blue-50/30 transition-colors ${rowBorderClass} group`}>

                                    {/* Department Column */}
                                    {row.isFirstInDept ? (
                                        <TableCell
                                            rowSpan={row.deptRowSpan}
                                            className="align-top !py-1.5 !pl-4 bg-white"
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="mt-1 min-w-[2px] h-2.5 rounded-full bg-indigo-500/80" />
                                                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                                                    {formatDepartmentName(row.deptName)}
                                                </span>
                                            </div>
                                        </TableCell>
                                    ) : null}

                                    {/* Vote Code Column */}
                                    {row.isFirstInVC ? (
                                        <TableCell
                                            rowSpan={row.vcRowSpan}
                                            className="align-top !py-1.5 text-slate-600 text-[10px]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`px-1 rounded text-[10px] font-mono font-medium border ${row.vcCode !== '-' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-transparent border-transparent text-slate-300'}`}>
                                                    {row.vcCode !== '-' ? row.vcCode : 'Gen'}
                                                </span>
                                            </div>
                                        </TableCell>
                                    ) : null}

                                    {/* Activity Column */}
                                    <TableCell className="!py-0.5 text-[10px] align-middle !h-6">
                                        {row.actCode !== '-' ? (
                                            <div className="flex items-center gap-1.5">
                                                <Activity className="w-2.5 h-2.5 text-slate-300" />
                                                <span className="text-slate-500 font-mono tracking-tighter">{row.actCode}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-200 ml-4">-</span>
                                        )}
                                    </TableCell>

                                    {/* Metrics */}
                                    <TableCell className="!py-0.5 text-center text-[10px] font-medium text-slate-600 align-middle !h-6">
                                        {row.orders > 0 ? (
                                            <span className="inline-flex items-center justify-center min-w-[16px] h-4 text-[10px] font-medium rounded-full bg-slate-50 border border-slate-100 text-slate-700">
                                                {row.orders}
                                            </span>
                                        ) : (
                                            <span className="text-slate-200">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="!py-0.5 text-right !pr-4 text-[10px] font-medium text-slate-700 align-middle !h-6">
                                        {row.items}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
