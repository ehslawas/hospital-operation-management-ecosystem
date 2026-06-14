import { useEffect, useState } from 'react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { getOxygenAnalytics } from '@/services/pharmacy/oxygenService'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, TrendingUp } from 'lucide-react'


export interface OxygenAnalyticsProps {
    year: number
    onYearChange: (year: number) => void
}

export const OxygenAnalytics = ({ year, onYearChange }: OxygenAnalyticsProps) => {
    const { user } = useAuthStore()
    const hospitalId = user?.hospital_id
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        if (hospitalId) {
            loadAnalytics()
        }
    }, [hospitalId, year])

    const loadAnalytics = async () => {
        setLoading(true)
        const res = await getOxygenAnalytics(hospitalId!, year)
        if (res.data) {
            setData(res.data)
        }
        setLoading(false)
    }

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

    // Proper Google Data Viz Palette
    const typeColors: Record<string, string> = {
        'Medical Oxygen - P101-C': '#34A853', // Google Green
        'Medical Oxygen - P101-D': '#4285F4', // Google Blue
        'Medical Oxygen - P101-E': '#A142F4', // Google Purple
        'Medical Oxygen - P101-F': '#FBBC04', // Google Yellow
        'Medical Oxygen - P101-G': '#EA4335', // Google Red
        'Medical Oxygen - P101-H': '#FA7B17', // Google Orange
        'Medical Oxygen - P101-J': '#24C1E0', // Google Cyan
    }

    // Fallback color generator
    const getColor = (type: string, index: number) => {
        const baseKey = Object.keys(typeColors).find(k => type.startsWith(k))
        if (baseKey && typeColors[baseKey]) return typeColors[baseKey]
        const colors = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#A142F4', '#FA7B17', '#24C1E0']
        return colors[index % colors.length]
    }

    if (!data && loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
    }

    if (!data) return null

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        Logistics Performance Analytics
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Monthly trends and quarterly breakdown of oxygen consumption</p>
                </div>
                <div className="w-[140px]">
                    <Select value={year.toString()} onValueChange={(v) => onYearChange(Number(v))}>
                        <SelectTrigger className="bg-white border-gray-200">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Synchronized Usage Monitoring Channels */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cylinder Usage Channels</h3>
                    <div className="h-px flex-1 bg-gray-100 mx-4" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {data.cylinder_types.map((type: string, idx: number) => {
                        const color = getColor(type, idx);
                        const cleanType = type.replace('Medical Oxygen - ', '');

                        return (
                            <Card key={type} className="shadow-none border border-gray-100 bg-white overflow-hidden">
                                <div className="flex h-[140px]">
                                    {/* Type Info Sidebar */}
                                    <div className="w-[200px] border-r border-gray-50 p-4 flex flex-col justify-center bg-slate-50/30">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Cylinder Type</span>
                                        <span className="text-sm font-bold text-gray-800 leading-tight">{cleanType}</span>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                            <span className="text-[11px] text-slate-600 font-semibold tracking-tight">Monitoring Active</span>
                                        </div>
                                    </div>

                                    {/* Mini Timeline */}
                                    <div className="flex-1 pr-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={data.monthly_usage}
                                                syncId="usageSync"
                                                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9fafb" />
                                                <XAxis
                                                    dataKey="name"
                                                    hide={idx !== data.cylinder_types.length - 1}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
                                                />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                                    cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey={type}
                                                    stroke={color}
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill={`url(#color-${idx})`}
                                                    animationDuration={1000}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Financial Performance Channels */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Financial Performance Channels</h3>
                    <div className="h-px flex-1 bg-gray-100 mx-4" />
                </div>

                {/* Channel: Loan Count */}
                <Card className="shadow-none border border-gray-100 bg-white overflow-hidden">
                    <div className="flex h-[140px]">
                        <div className="w-[200px] border-r border-gray-50 p-4 flex flex-col justify-center bg-blue-50/20">
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider mb-1">Performance Metric</span>
                            <span className="text-sm font-bold text-gray-800 leading-tight">Loan Count</span>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <span className="text-[11px] text-slate-600 font-semibold tracking-tight">Cylinder Volume Tracking</span>
                            </div>
                        </div>
                        <div className="flex-1 pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data.monthly_loans}
                                    syncId="usageSync"
                                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4285F4" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9fafb" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                        cursor={{ stroke: '#4285F4', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area type="monotone" dataKey="count" name="Loan Count" stroke="#4285F4" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                {/* Channel: Loan Cost */}
                <Card className="shadow-none border border-gray-100 bg-white overflow-hidden">
                    <div className="flex h-[140px]">
                        <div className="w-[200px] border-r border-gray-50 p-4 flex flex-col justify-center bg-yellow-50/20">
                            <span className="text-[11px] font-black text-yellow-700 uppercase tracking-wider mb-1">Financial Metric</span>
                            <span className="text-sm font-bold text-gray-800 leading-tight">Rental Cost (RM)</span>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                <span className="text-[11px] text-slate-700 font-semibold tracking-tight">Spend Optimization</span>
                            </div>
                        </div>
                        <div className="flex-1 pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data.monthly_loans}
                                    syncId="usageSync"
                                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FBBC04" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#FBBC04" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9fafb" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                        cursor={{ stroke: '#FBBC04', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area type="monotone" dataKey="cost" name="Load Cost (RM)" stroke="#FBBC04" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 3. Quarterly Summary Table */}
            <Card className="shadow-md border-none overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                    <CardTitle className="text-lg font-semibold text-gray-800">Quarterly Performance Matrix</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3">Cylinder Type</th>
                                    <th className="px-4 py-3 text-center">Q1 <span className="text-[11px] block font-normal text-slate-500">(Jan-Mar)</span></th>
                                    <th className="px-4 py-3 text-center">Q2 <span className="text-[11px] block font-normal text-slate-500">(Apr-Jun)</span></th>
                                    <th className="px-4 py-3 text-center">Q3 <span className="text-[11px] block font-normal text-slate-500">(Jul-Sep)</span></th>
                                    <th className="px-4 py-3 text-center">Q4 <span className="text-[11px] block font-normal text-slate-500">(Oct-Dec)</span></th>
                                    <th className="px-4 py-3 text-right">Total Year</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.quarterly_stats.map((q: any) => (
                                    <tr key={q.type} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700">
                                            {q.type.replace('Medical Oxygen - ', '')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-slate-900">{q.q1}</span>
                                                <span className="text-[11px] text-slate-500 font-medium tracking-tight">Avg {q.avg_q1}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-slate-900">{q.q2}</span>
                                                <span className="text-[11px] text-slate-500 font-medium tracking-tight">Avg {q.avg_q2}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-slate-900">{q.q3}</span>
                                                <span className="text-[11px] text-slate-500 font-medium tracking-tight">Avg {q.avg_q3}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-slate-900">{q.q4}</span>
                                                <span className="text-[11px] text-slate-500 font-medium tracking-tight">Avg {q.avg_q4}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-slate-900">
                                            {q.total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
