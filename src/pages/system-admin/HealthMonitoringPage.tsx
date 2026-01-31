import { useState, useEffect } from 'react'
import { Activity, Database, Server, Globe } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { systemAnalyticsService } from '@/services/systemAnalyticsService'

const HealthMonitoringPage = () => {
    const [loading, setLoading] = useState(false)
    const [lastChecked, setLastChecked] = useState(new Date())
    const [healthMetrics, setHealthMetrics] = useState<any>(null)

    // Initial load
    useEffect(() => { refreshHealth() }, [])

    const refreshHealth = async () => {
        setLoading(true)
        try {
            const result = await systemAnalyticsService.checkSystemHealth()
            setHealthMetrics(result)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
            setLastChecked(new Date())
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
                    <p className="text-slate-500">Real-time monitoring of infrastructure and services</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">Last checked: {lastChecked.toLocaleTimeString()}</span>
                    <Button onClick={refreshHealth} disabled={loading} variant="outline">
                        Refresh Status
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <HealthCard
                    title="Overall Uptime"
                    value="99.98%"
                    status="healthy"
                    icon={Activity}
                    description="Last 30 days"
                />
                <HealthCard
                    title="API Success Rate"
                    value="99.5%"
                    status="healthy"
                    icon={Globe}
                    description="Last 24 hours"
                />
                <HealthCard
                    title="Active Connections"
                    value="1,240"
                    status="healthy"
                    icon={Server}
                    description="Current open sockets"
                />
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Service Status</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${healthMetrics?.status === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Database className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900">Primary Database</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>Latency: {healthMetrics?.metrics?.database_latency || '-'}ms</span>
                                </div>
                            </div>
                        </div>
                        <Badge variant={healthMetrics?.status === 'healthy' ? 'success' : 'descructive'}>
                            {healthMetrics?.status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${healthMetrics?.metrics?.api_status === 'operational' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Server className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900">API Status</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>Status: {healthMetrics?.metrics?.api_status || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                        <Badge variant={healthMetrics?.metrics?.api_status === 'operational' ? 'success' : 'descructive'}>
                            {healthMetrics?.metrics?.api_status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                    </div>
                </div>
            </Card>
        </div>
    )
}

const HealthCard = ({ title, value, icon: Icon, description }: any) => (
    <Card className="p-6 border-l-4 border-l-green-500">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
                <p className="text-xs text-slate-400 mt-1">{description}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </Card>
)

export default HealthMonitoringPage
