import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, LoadingOverlay } from '@/components/ui'
import { louService } from '@/services/pharmacy/louService'
import { LOU } from '@/types/pharmacy/procurementNew'
import { FileText, Layers, Mail, Eye } from 'lucide-react'

export default function LOUManagementPage() {
    const [lous, setLous] = useState<LOU[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchLOUs = async () => {
        setIsLoading(true)
        try {
            const data = await louService.getAllLOUs()
            setLous(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLOUs()
    }, [])

    const handleGenerate = async (lou: LOU) => {
        setIsLoading(true)
        try {
            await louService.generateLOULetter(lou.id)
            fetchLOUs()
        } catch (error) {
            alert('Failed to generate LOU')
        } finally {
            setIsLoading(false)
        }
    }

    const handleMerge = async (lou: LOU) => {
        setIsLoading(true)
        try {
            await louService.mergeLOUDocuments(lou.id)
            fetchLOUs()
        } catch (error) {
            alert('Failed to merge documents')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendEmail = (lou: LOU) => {
        const mailto = `mailto:supplier@example.com?subject=LOU Package - ${(lou as any).lpo?.lpo_number}&body=Please find attached...`
        window.open(mailto, '_blank')

        // Mock update status
        louService.sendLOUEmail(lou.id, { to: 'supplier@example.com', subject: 'LOU', body: '...' })
            .then(() => fetchLOUs())
    }

    return (
        <div className="space-y-6 pt-6 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">LOU Management</h1>
                    <p className="text-slate-500">Manage Letters of Undertaking for conditional deliveries</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Letters of Undertaking</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>LPO Number</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>LOU Letter</TableHead>
                                <TableHead>Merged Package</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lous.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                        No LOUs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                lous.map((lou) => (
                                    <TableRow key={lou.id}>
                                        <TableCell className="font-medium">{(lou as any).lpo?.lpo_number}</TableCell>
                                        <TableCell>{lou.lou_reason}</TableCell>
                                        <TableCell>
                                            {lou.lou_letter_url ? (
                                                <Button size="sm" variant="ghost" onClick={() => window.open(lou.lou_letter_url, '_blank')}>
                                                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                                    View
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleGenerate(lou)}>Generate</Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {lou.merged_pdf_url ? (
                                                <Button size="sm" variant="ghost" onClick={() => window.open(lou.merged_pdf_url, '_blank')}>
                                                    <Layers className="w-4 h-4 mr-2 text-purple-500" />
                                                    View Package
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleMerge(lou)} disabled={!lou.lou_letter_url}>
                                                    Merge
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={lou.status === 'sent' ? 'success' : 'warning'}>
                                                {lou.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleSendEmail(lou)} disabled={!lou.merged_pdf_url}>
                                                <Mail className="w-4 h-4 mr-2" />
                                                Send
                                            </Button>
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
