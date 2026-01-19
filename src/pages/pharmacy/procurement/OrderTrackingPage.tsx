import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, LoadingOverlay } from '@/components/ui'
import { orderTrackingService } from '@/services/pharmacy/orderTrackingService'
import { OrderTrackingWithRelations } from '@/types/pharmacy/procurementNew'
import { Search, AlertTriangle, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { generateOverdueReminderEmail, openGmailComposer } from '@/services/emailService'
import { useToast } from '@/stores/toastStore'

export default function OrderTrackingPage() {
    const { success, error, warning } = useToast()
    const [trackingItems, setTrackingItems] = useState<OrderTrackingWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState<'all' | 'overdue' | 'in_transit' | 'pending'>('all')

    useEffect(() => {
        loadTrackingData()
    }, [])

    const loadTrackingData = async () => {
        try {
            setIsLoading(true)
            const data = await orderTrackingService.getActiveTracking()
            setTrackingItems(data)

            // Background check for overdues
            orderTrackingService.checkOverdueItems().catch(console.error)
        } catch (err) {
            console.error('Error loading tracking data:', err)
            error('Failed to load tracking data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendReminder = async (item: OrderTrackingWithRelations) => {
        try {
            const emailData = generateOverdueReminderEmail(item)

            // Get supplier email if available in nested structure
            const supplierEmail = item.lpo?.purchase_order?.supplier?.email || ''
            emailData.to = supplierEmail

            if (!supplierEmail) {
                warning('Supplier Not Found', 'Supplier email not found. Please enter it manually in Gmail.')
            }

            openGmailComposer(emailData)

            // Record the reminder attempt
            await orderTrackingService.markReminderSent(item.id)

            // Refresh local data to show updated reminder count/date
            loadTrackingData()

            success('Reminder Prepared', 'Reminder composer opened')
        } catch (err) {
            console.error('Error sending reminder:', err)
            error('Failed to prepare reminder')
        }
    }

    const getStatusBadge = (status: string, isOverdue: boolean) => {
        if (isOverdue) return <Badge variant="error" dot>Overdue</Badge>

        switch (status) {
            case 'delivered': return <Badge variant="success">Delivered</Badge>
            case 'in_transit': return <Badge variant="info">In Transit</Badge>
            case 'pending': return <Badge variant="gray">Pending</Badge>
            default: return <Badge variant="gray">{status}</Badge>
        }
    }

    const filteredItems = trackingItems.filter(item => {
        const matchesSearch =
            item.lpo?.lpo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.lpo?.purchase_order?.supplier?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.item_code.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilter =
            filter === 'all' ||
            (filter === 'overdue' && item.is_overdue) ||
            item.status === filter

        return matchesSearch && matchesFilter
    })

    const overdueCount = trackingItems.filter(i => i.is_overdue).length

    return (
        <div className="space-y-6 pt-6 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order Tracking</h1>
                    <p className="text-slate-500">Monitor delivery timelines and overdue items</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={filter === 'overdue' ? 'destructive' : 'outline'} onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Overdue ({overdueCount})
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Active Orders</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search LPO, Supplier or Item Code..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>LPO Number</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Item Details</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Expected Delivery</TableHead>
                                    <TableHead>Days Left</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                            No active orders found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => {
                                        const daysLeft = Math.ceil((new Date(item.expected_delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.lpo?.lpo_number}</TableCell>
                                                <TableCell>{item.lpo?.purchase_order?.supplier?.company_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{item.item_code}</span>
                                                        <span className="text-xs text-slate-500 capitalize">{item.item_type.replace('_', ' ')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={item.item_category === 'APPL' ? 'primary' : 'gray'} size="sm">
                                                        {item.item_category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(item.expected_delivery_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>
                                                    <span className={daysLeft < 0 ? 'text-red-600 font-bold' : daysLeft < 3 ? 'text-amber-600' : 'text-slate-600'}>
                                                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(item.status, item.is_overdue)}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.is_overdue && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSendReminder(item)}
                                                            className="text-primary hover:text-primary/80"
                                                        >
                                                            <Mail className="w-4 h-4 mr-1" />
                                                            Remind ({item.reminder_count})
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {isLoading && <LoadingOverlay />}
        </div>
    )
}
