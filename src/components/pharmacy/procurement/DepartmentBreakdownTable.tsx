import React, { useMemo } from 'react'
import { DepartmentBreakdownItem } from '@/types/pharmacy'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui'
import { Building2, FileDigit, Activity } from 'lucide-react'

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
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50/50 rounded-md border border-blue-100">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                    Department Breakdown
                </h3>
                <span className="ml-1 text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    Detailed Report
                </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                            <TableCell as="th" className="h-7 font-semibold text-slate-500 text-[11px] w-1/4 pl-4 uppercase tracking-wider">Department</TableCell>
                            <TableCell as="th" className="h-7 font-semibold text-slate-500 text-[11px] w-1/4 uppercase tracking-wider">Vote Code</TableCell>
                            <TableCell as="th" className="h-7 font-semibold text-slate-500 text-[11px] w-1/4 uppercase tracking-wider">Activity</TableCell>
                            <TableCell as="th" className="h-7 font-semibold text-slate-500 text-[11px] text-center w-1/8 uppercase tracking-wider">Orders</TableCell>
                            <TableCell as="th" className="h-7 font-semibold text-slate-500 text-[11px] text-right w-1/8 pr-4 uppercase tracking-wider">Items</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, index) => {
                            // Add a stronger border if it's the start of a new department (and not the very first row)
                            const isNewDepartment = row.isFirstInDept;
                            const borderClass = isNewDepartment && index !== 0
                                ? 'border-t border-slate-300' // Stronger separator
                                : 'border-t border-slate-50'; // Subtle separator

                            return (
                                <TableRow key={index} className={`hover:bg-slate-50/50 transition-colors ${borderClass} last:border-0 group`}>

                                    {/* Department Column */}
                                    {row.isFirstInDept ? (
                                        <TableCell
                                            rowSpan={row.deptRowSpan}
                                            className="align-top bg-white font-medium text-slate-700 py-2 pl-4 border-r border-slate-100" // Added light border-r
                                        >
                                            <div className="flex items-center gap-2 sticky top-4">
                                                <span className="p-0.5 rounded text-slate-400">
                                                    <Building2 className="w-3 h-3" />
                                                </span>
                                                <span className="text-xs">{formatDepartmentName(row.deptName)}</span>
                                            </div>
                                        </TableCell>
                                    ) : null}

                                    {/* Vote Code Column */}
                                    {row.isFirstInVC ? (
                                        <TableCell
                                            rowSpan={row.vcRowSpan}
                                            className="align-top bg-white/30 text-slate-600 font-mono text-[11px] py-2 border-r border-slate-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileDigit className="w-3 h-3 text-slate-300" />
                                                <span className="font-medium">{row.vcCode}</span>
                                            </div>
                                        </TableCell>
                                    ) : null}

                                    {/* Activity Column */}
                                    <TableCell className="text-slate-500 text-[11px] py-1 border-r border-slate-50">
                                        <div className="flex items-center gap-2">
                                            {row.isActivity && <Activity className="w-3 h-3 text-slate-300" />}
                                            <span className="font-mono text-[10px]">{row.actCode}</span>
                                        </div>
                                    </TableCell>

                                    {/* Metrics */}
                                    <TableCell className="text-center font-mono text-[11px] text-slate-600 py-1 border-r border-slate-50">
                                        {row.orders}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-[11px] text-slate-600 py-1 pr-4">
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
