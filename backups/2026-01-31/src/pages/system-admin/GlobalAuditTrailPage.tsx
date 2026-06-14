import { useEffect, useState } from 'react'
import { Shield, Search, User } from 'lucide-react'
import { Card, Input, Badge, Button } from '@/components/ui'
import { systemAuditService } from '@/services/systemAuditService'
import type { SystemAdminAuditLog } from '@/types/systemAdmin.types'

const GlobalAuditTrailPage = () => {
    const [logs, setLogs] = useState<SystemAdminAuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState<'time' | 'hospital'>('time')

    useEffect(() => {
        fetchLogs()
    }, [sortBy])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const { data } = await systemAuditService.getAuditLogs(1, 50, { sortBy })
            setLogs(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-royal-blue" />
                    Global Audit Trail
                </h1>
                <p className="text-slate-500">Immutable log of all System Administrator actions</p>
            </div>

            <Card className="p-4">
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search logs by action, user, or IP..." className="pl-10" />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={sortBy === 'time' ? 'default' : 'outline'}
                            onClick={() => setSortBy('time')}
                            className="w-32"
                        >
                            Recent First
                        </Button>
                        <Button
                            variant={sortBy === 'hospital' ? 'default' : 'outline'}
                            onClick={() => setSortBy('hospital')}
                            className="w-32"
                        >
                            By Hospital
                        </Button>
                        <Button variant="outline">Export Logs</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading audit trail...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            No audit logs found
                        </div>
                    ) : (
                        logs.map((log: any) => (
                            <div key={log.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                                <div className="flex items-start gap-3 min-w-[200px]">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm">{log.actor?.email || 'System'}</p>
                                        <p className="text-xs text-slate-500">{log.ip_address || 'Unknown IP'}</p>
                                        {log.hospital?.hospital_name && (
                                            <Badge variant="outline" className="mt-1 text-[10px] h-5">
                                                {log.hospital.hospital_name}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-white border-slate-200 text-slate-700">{log.action}</Badge>
                                        <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Performed <strong>{log.action}</strong> on {log.entity_type || 'system'}
                                        {log.entity_id && <span className="font-mono text-xs ml-2 bg-slate-100 px-1 rounded">{log.entity_id}</span>}
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <Button variant="ghost" size="sm" className="text-blue-600">
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    )
}

export default GlobalAuditTrailPage
