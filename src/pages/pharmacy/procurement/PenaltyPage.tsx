import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, LoadingOverlay, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import { penaltyService } from '@/services/pharmacy/penaltyService'
import { Penalty } from '@/types/pharmacy/procurementNew'
import { format } from 'date-fns'
import { AlertTriangle, Mail, CheckCircle, FileText } from 'lucide-react'

export default function PenaltyPage() {
    const [penalties, setPenalties] = useState<Penalty[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null)
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)

    const fetchPenalties = async () => {
        setIsLoading(true)
        try {
            const data = await penaltyService.getPenalties()
            setPenalties(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPenalties()
    }, [])

    const handleGenerateNotice = async (penalty: Penalty) => {
        setIsLoading(true)
        try {
            await penaltyService.generatePenaltyNotice(penalty.id)
            alert('Penalty Notice Generated')
            fetchPenalties()
        } catch (error) {
            console.error(error)
            alert('Failed to generate notice')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendEmail = (penalty: Penalty) => {
        // Construct mailto link
        const subject = `Penalty Notice - LPO ${(penalty as any).lpo?.lpo_number}`
        const body = `Dear Supplier,\n\nWe regret to inform you that a penalty of RM${penalty.penalty_amount.toFixed(2)} has been imposed due to late delivery (${penalty.days_overdue} days overdue) for LPO ${(penalty as any).lpo?.lpo_number}.\n\nPlease find the attached Penalty Notice.\n\nRegards,\nPharmacy Department`

        const mailto = `mailto:supplier@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.open(mailto, '_blank')

        // Log email sent status (optional)
        // penaltyService.updatePenaltyStatus(penalty.id, 'issued') 
    }

    const handleMarkPaid = async (penalty: Penalty) => {
        if (confirm('Mark this penalty as PAID?')) {
            setIsLoading(true)
            try {
                await penaltyService.updatePenaltyStatus(penalty.id, 'paid', { method: 'Manual', reference: 'N/A' })
                fetchPenalties()
            } catch (error) {
                alert('Error updating status')
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="space-y-6 pt-6 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Penalty Management</h1>
                    <p className="text-slate-500">Track late delivery penalties (LAD)</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Penalties</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>LPO Number</TableHead>
                                <TableHead className="text-right">Days Overdue</TableHead>
                                <TableHead className="text-right">Amount (RM)</TableHead>
                                <TableHead>Notice</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {penalties.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                        No penalties found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                penalties.map((penalty) => (
                                    <TableRow key={penalty.id}>
                                        <TableCell className="font-medium">{(penalty as any).lpo?.lpo_number || 'Unknown'}</TableCell>
                                        <TableCell className="text-right">{penalty.days_overdue}</TableCell>
                                        <TableCell className="text-right">{penalty.penalty_amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {penalty.penalty_notice_url ? (
                                                <Button size="sm" variant="outline" onClick={() => window.open(penalty.penalty_notice_url, '_blank')}>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    View PDF
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleGenerateNotice(penalty)}>
                                                    Generate
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={penalty.status === 'paid' ? 'success' : 'error'}>
                                                {penalty.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" onClick={() => handleSendEmail(penalty)}>
                                                <Mail className="w-4 h-4 mr-2" />
                                                Email
                                            </Button>
                                            {penalty.status !== 'paid' && (
                                                <Button size="sm" variant="outline" onClick={() => handleMarkPaid(penalty)}>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Paid
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {isLoading && <LoadingOverlay />}
        </div>
    )
}
