import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, LoadingOverlay, ConfirmationDialog } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { lpoService } from '@/services/pharmacy/lpoService'
import { supabase } from '@/services/supabase'
import { LPOWithRelations } from '@/types/pharmacy/procurementNew'
import { FileText, Download, Search, Send, Clock, Plus, Upload, CheckCircle2 } from 'lucide-react'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { extractLPODataFromPDF } from '@/utils/pdfExtractor'

export default function LPOManagementPage() {
    const [lpos, setLpos] = useState<LPOWithRelations[]>([])
    const [pendingPOs, setPendingPOs] = useState<PurchaseOrderWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const { user } = useAuthStore()
    const hospitalId = user?.hospital_id
    const { success: showSuccess, error: showError } = useToastStore()
    const [isSending, setIsSending] = useState(false)
    const [showSendDialog, setShowSendDialog] = useState(false)
    const [selectedLpo, setSelectedLpo] = useState<LPOWithRelations | null>(null)
    const [activeTab, setActiveTab] = useState('pending-pos')
    const [lpoDrafts, setLpoDrafts] = useState<Record<string, { lpo_number: string, document_date: string, file?: File, document_url?: string }>>({})
    const [isProcessingBulk, setIsProcessingBulk] = useState(false)
    const [page, setPage] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const pageSize = 10

    const handleDraftChange = async (poId: string, field: string, value: any) => {
        setLpoDrafts(prev => ({
            ...prev,
            [poId]: {
                ...(prev[poId] || { lpo_number: '', document_date: '' }),
                [field]: value
            }
        }))

        // Auto-save metadata change to Supabase (Draft)
        if (field === 'lpo_number' || field === 'document_date') {
            try {
                const currentDraft = {
                    ...(lpoDrafts[poId] || { lpo_number: '', document_date: '' }),
                    [field]: value
                }

                if (currentDraft.lpo_number) {
                    await lpoService.upsertLPODraft({
                        po_id: poId,
                        lpo_number: currentDraft.lpo_number,
                        document_date: currentDraft.document_date || new Date().toISOString().split('T')[0],
                        hospital_id: hospitalId!
                    })
                }
            } catch (err) {
                console.error('Failed to auto-save draft:', err)
            }
        }
    }

    const handleLocalPreview = (file: File) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    };

    useEffect(() => {
        loadData(page)
    }, [hospitalId, page])

    const loadData = async (currentPage = page) => {
        try {
            if (!hospitalId) return
            setIsLoading(true)
            const [lpoData, poData] = await Promise.all([
                lpoService.getAllLPOs(hospitalId),
                lpoService.getPendingPOs(hospitalId, currentPage, pageSize)
            ])
            setLpos(lpoData)
            setPendingPOs(poData.data)
            setTotalItems(poData.total)

            // Populate drafts from database
            const newDrafts: Record<string, any> = {}
            poData.data.forEach(po => {
                const lpo = Array.isArray((po as any).lpo) ? (po as any).lpo[0] : (po as any).lpo
                if (lpo) {
                    newDrafts[po.id] = {
                        lpo_number: lpo.lpo_number,
                        document_date: lpo.document_date,
                        document_url: lpo.document_url
                    }
                }
            })
            setLpoDrafts(prev => ({ ...prev, ...newDrafts }))
        } catch (error) {
            console.error('Error loading LPO data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGeneratePdf = async (lpoId: string) => {
        // Logic to open generation modal or trigger generation
        console.log('Generate PDF for', lpoId)
        // For now just navigate to a detail/preview page or open modal
    }

    const sortPONumbers = (a: string, b: string) => {
        if (!a || !b) return 0
        const partsA = a.split('-')
        const partsB = b.split('-')

        // Handle PO-2026-0001 format
        if (partsA.length === 3 && partsB.length === 3) {
            // Compare years first
            if (partsA[1] !== partsB[1]) return partsB[1].localeCompare(partsA[1])
            // Compare sequence numerically
            return partsA[2].localeCompare(partsB[2])
        }
        return a.localeCompare(b)
    }

    const filteredLpos = lpos
        .filter(lpo =>
            lpo.lpo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lpo.purchase_order?.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lpo.purchase_order?.supplier?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || ''
        )
        .sort((a, b) => sortPONumbers(a.purchase_order?.po_number || '', b.purchase_order?.po_number || ''))

    const filteredPendingPOs = pendingPOs
        .filter(po =>
            po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.supplier?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || ''
        )
        .sort((a, b) => sortPONumbers(a.po_number, b.po_number))

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'generated': return <Badge variant="success">Generated</Badge>
            case 'uploaded': return <Badge variant="info">Uploaded</Badge>
            case 'draft': return <Badge variant="gray">Draft</Badge>
            default: return <Badge variant="gray">{status}</Badge>
        }
    }

    const onSendClick = (lpo: LPOWithRelations) => {
        setSelectedLpo(lpo)
        setShowSendDialog(true)
    }

    const handleSendToSupplier = async () => {
        if (!selectedLpo) return

        try {
            setIsSending(true)
            await lpoService.sendLPO(selectedLpo.id)
            showSuccess('LPO Sent', 'The LPO has been sent to the supplier and tracking has been initialized.')
            setShowSendDialog(false)
            loadData() // Refresh list
        } catch (error) {
            console.error('Error sending LPO:', error)
            showError('Error', 'Failed to send LPO')
        } finally {
            setIsSending(false)
            setSelectedLpo(null)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-GB')
    }

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !pendingPOs.length) return

        try {
            setIsProcessingBulk(true)
            let matchedCount = 0
            const usedPoIds = new Set<string>()

            // Fetch a larger set of pending POs for matching (avoid pagination limits)
            const { data: allPending } = await lpoService.getPendingPOs(hospitalId!, 1, 100);
            const matchingPool = allPending || [];

            // 1. Fetch missing names for the matching pool (Solve NO_NAME issue)
            const poItemsToFetch = matchingPool.flatMap(po => (po as any).items || []);
            const drugIds = [...new Set(poItemsToFetch.filter((it: any) => it.item_type === 'drug' && it.item_id && !it.item_name).map((it: any) => it.item_id))];
            const nonDrugIds = [...new Set(poItemsToFetch.filter((it: any) => it.item_type === 'non_drug' && it.item_id && !it.item_name).map((it: any) => it.item_id))];

            const [drugsData, nonDrugsData] = await Promise.all([
                drugIds.length > 0 ? supabase.from('drugs').select('id, drug_name').in('id', drugIds) : { data: [] },
                nonDrugIds.length > 0 ? supabase.from('non_drugs').select('id, item_name').in('id', nonDrugIds) : { data: [] }
            ]);

            const drugNameMap = new Map((drugsData.data || []).map((d: any) => [d.id, d.drug_name]));
            const nonDrugNameMap = new Map((nonDrugsData.data || []).map((nd: any) => [nd.id, nd.item_name]));

            // DIAGNOSTIC: Fetch ALL POs to see why some are missing from the matchingPool
            const { data: allEver } = await supabase
                .from('pharmacy_purchase_orders')
                .select('po_number, status, total_amount, lpo:pharmacy_lpo(status)')
                .eq('hospital_id', hospitalId);

            console.log('[DEEP-DIAGNOSTIC] All POs in DB (Count: ' + (allEver?.length || 0) + '):');
            allEver?.forEach(p => {
                const lpoStatus = Array.isArray(p.lpo) ? p.lpo[0]?.status : (p.lpo as any)?.status || 'NONE';
                console.log(`- ${p.po_number}: PO=${p.status}, LPO=${lpoStatus}, Amt=$${p.total_amount}`);
            });

            console.log('Bulk processing started for', files.length, 'files');
            console.log('[MATCHING-V2] Total POs available in pool:', matchingPool.length);
            matchingPool.forEach((po) => {
                const items = (po as any).items || [];
                const names = items.map((it: any) => {
                    if (it.item_name) return it.item_name;
                    if (it.item_type === 'drug') return drugNameMap.get(it.item_id) || 'UNKNOWN_DRUG';
                    if (it.item_type === 'non_drug') return nonDrugNameMap.get(it.item_id) || 'UNKNOWN_NON_DRUG';
                    return 'NO_NAME';
                }).join(', ');
                console.log(`[Diagnostic] PO ${po.po_number}: $${po.total_amount || 0}, Items: ${names}`);
            });
            console.log('-------------------------------------------');

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                try {
                    const extracted = await extractLPODataFromPDF(file)
                    console.log(`[Matching] Processing ${file.name}:`, extracted);

                    let bestMatchPoId = ''
                    let bestScore = 0

                    matchingPool.forEach(po => {
                        // Skip if this PO was already perfectly matched by a previous file in this loop
                        if (usedPoIds.has(po.id)) return

                        let score = 0
                        const details: string[] = []

                        // ... (poHint logic remains) ...
                        if (extracted.poHint) {
                            const poNum = po.po_number.toUpperCase()
                            const hint = extracted.poHint.toUpperCase()

                            if (poNum.includes(hint) || hint.includes(poNum)) {
                                score += 100
                                details.push('Direct PO Match (+100)')
                            }
                        }

                        // 0.1 Numeric Stem Match
                        const poNumericStem = po.po_number.split('-').pop(); // e.g., "0033" from "PO-2026-0033"
                        if (poNumericStem) {
                            const lpoNum = extracted.lpoNumber || '';
                            const poHint = extracted.poHint || '';
                            const stemRegex = new RegExp(`(?<!\\d)${poNumericStem}(?!\\d)`);

                            if (stemRegex.test(lpoNum) || stemRegex.test(poHint)) {
                                if (!details.some(d => d.includes('Direct PO Match'))) {
                                    score += 40
                                    details.push('Numeric Stem Match (+40)')
                                }
                            }
                        }

                        // 1. Match by Supplier Name
                        const normalizeSupplier = (name: string) => {
                            return (name || '').toLowerCase()
                                .replace(/\b(sdn|bhd|corp|inc|limited|ltd|co|enterprise|trading|resources|global)\b/g, '')
                                .replace(/[^\w\s]/g, '')
                                .trim();
                        }

                        const poSupplierRaw = po.supplier?.company_name || po.manual_supplier_name || ''
                        const poSupplierNormalized = normalizeSupplier(poSupplierRaw)
                        const extractedSupplierNormalized = normalizeSupplier(extracted.supplierHint || '')

                        if (poSupplierNormalized && extractedSupplierNormalized) {
                            const poTokens = poSupplierNormalized.split(/\s+/).filter(t => t.length > 2)
                            const extTokens = extractedSupplierNormalized.split(/\s+/).filter(t => t.length > 2)

                            const hasOverlap = poTokens.some(pt => extTokens.includes(pt)) || extTokens.some(et => poTokens.includes(et))

                            if (poSupplierNormalized.includes(extractedSupplierNormalized) || extractedSupplierNormalized.includes(poSupplierNormalized) || hasOverlap) {
                                score += 60
                                details.push('Supplier Match (+60)')
                            }
                        }

                        // 2. Match by Total Amount with Tolerance
                        const poAmount = po.total_amount || 0
                        const diff = Math.abs((extracted.totalAmount || 0) - poAmount);
                        if (extracted.totalAmount && diff < 0.101) {
                            score += 80 // Increased from 60
                            details.push('Amount Match (+80)')
                        } else if (extracted.totalAmount && diff > (poAmount * 0.05 + 1)) {
                            // Significant amount mismatch penalty
                            score -= 100
                            details.push(`Amount Mismatch (${diff.toFixed(2)}, -100)`)
                        }

                        // 3. Match by Partial PO Number (Suffix/Stem match)
                        const poNumberDigits = po.po_number.replace(/\D/g, '')
                        const extractedLPONumberDigits = (extracted.lpoNumber || '').replace(/\D/g, '')
                        const poSuffix = poNumberDigits.slice(-4)

                        if (extractedLPONumberDigits.includes(poSuffix)) {
                            score += 50
                            details.push(`PO Suffix Match (${poSuffix}, +50)`)
                        }

                        // 4. Match by Item Names (Tokenized)
                        if (extracted.itemHints && extracted.itemHints.length > 0) {
                            const poItems = (po as any).items || []
                            let itemMatches = 0

                            poItems.forEach((item: any) => {
                                const itemName = (
                                    item.item_name ||
                                    drugNameMap.get(item.item_id) ||
                                    nonDrugNameMap.get(item.item_id) ||
                                    ''
                                ).toLowerCase()

                                if (!itemName) return

                                // Relaxed token length to 3
                                const poItemTokens = itemName.split(/\s+/).filter((t: string) => t.length >= 3)

                                const isMatched = extracted.itemHints?.some(hint => {
                                    const h = hint.toLowerCase()
                                    if (h.includes(itemName) || itemName.includes(h)) return true

                                    // Complex token matching (must match at least 2 tokens if total tokens > 2)
                                    if (poItemTokens.length >= 2) {
                                        const matches = poItemTokens.filter(pt => h.includes(pt)).length
                                        return matches >= Math.min(2, poItemTokens.length)
                                    }

                                    return poItemTokens.some((pt: string) => h.includes(pt))
                                })

                                if (isMatched) {
                                    itemMatches++
                                }
                            })

                            if (itemMatches > 0) {
                                const itemScore = Math.min(itemMatches * 25, 100)
                                score += itemScore
                                details.push(`Items Match (${itemMatches} items, +${itemScore})`)
                            }
                        }

                        // TRACE: specifically for $18 or PO-0015
                        if (extracted.totalAmount === 18 || po.po_number.includes('0015')) {
                            console.log(`[TRACE-0015] Checking PO ${po.po_number} ($${po.total_amount}) vs $18 Extracted. Score: ${score}. Details: ${details.join(', ')}`);
                        }

                        if (score >= 100) {
                            console.log(`[Matching] HIGH CONFIDENCE: PO ${po.po_number} for ${file.name} - Score: ${score} - ${details.join(', ')}`);
                        } else if (score > 40) {
                            console.log(`[Matching] Match: PO ${po.po_number} for ${file.name} - Score: ${score} - ${details.join(', ')}`);
                        }

                        if (score > bestScore) {
                            bestScore = score
                            bestMatchPoId = po.id
                        }
                    })

                    console.log(`[Matching] Best match for ${file.name}: PO ID ${bestMatchPoId}, Score ${bestScore}`);

                    if (bestMatchPoId && bestScore >= 40) { // Lowered threshold slightly for tokenized matches
                        usedPoIds.add(bestMatchPoId)

                        const updatedMeta = {
                            lpo_number: extracted.lpoNumber || lpoDrafts[bestMatchPoId]?.lpo_number || '',
                            document_date: extracted.lpoDate || lpoDrafts[bestMatchPoId]?.document_date || '',
                            file: file
                        }

                        setLpoDrafts(prev => ({
                            ...prev,
                            [bestMatchPoId]: updatedMeta
                        }))

                        matchedCount++

                        // Save to Supabase immediately (Draft)
                        if (updatedMeta.lpo_number) {
                            try {
                                const lpoRecord = await lpoService.upsertLPODraft({
                                    po_id: bestMatchPoId,
                                    lpo_number: updatedMeta.lpo_number,
                                    document_date: updatedMeta.document_date || new Date().toISOString().split('T')[0],
                                    hospital_id: hospitalId!
                                })
                                // Upload file as well
                                await lpoService.uploadLPODocument(lpoRecord.id, file)
                                console.log(`[Matching] Saved and uploaded draft for PO ${bestMatchPoId}`);
                            } catch (err) {
                                console.error(`[Matching] Failed to save draft for PO ${bestMatchPoId}:`, err);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Failed to process ${file.name}:`, err)
                }
            }

            loadData() // Refresh to sync everything from DB

            if (matchedCount > 0) {
                showSuccess('Bulk Detect Success', `Automatically matched ${matchedCount} documents to pending orders. Check the table below.`)
            } else {
                showSuccess('Process Complete', 'Documents processed, but no clear matches found. You may need to assign them manually.')
            }
        } catch (error) {
            showError('Bulk Error', 'Failed to process some files')
        } finally {
            setIsProcessingBulk(false)
        }
    }

    const handleProcessAllMatched = async () => {
        const matchedIds = Object.keys(lpoDrafts).filter(id => lpoDrafts[id].lpo_number && (lpoDrafts[id].file || lpoDrafts[id].document_url))
        if (matchedIds.length === 0) {
            showError('No Matched Files', 'Please upload and match PDFs first.')
            return
        }

        try {
            setIsLoading(true)
            let successCount = 0
            console.log(`Bulk processing ${matchedIds.length} matched LPOs...`);

            for (const poId of matchedIds) {
                const draft = lpoDrafts[poId]
                const po = pendingPOs.find(p => p.id === poId)
                if (!draft || !po) continue

                try {
                    let currentLpoId = ''
                    const existingLpo = Array.isArray((po as any).lpo) ? (po as any).lpo[0] : (po as any).lpo

                    if (existingLpo) {
                        currentLpoId = existingLpo.id
                    } else {
                        // 1. Create LPO
                        const lpo = await lpoService.createLPO({
                            po_id: poId,
                            lpo_number: draft.lpo_number,
                            document_date: draft.document_date || new Date().toISOString().split('T')[0],
                            hospital_id: hospitalId!
                        })
                        currentLpoId = lpo.id
                    }

                    // 2. Upload Document if local file exists
                    if (draft.file) {
                        await lpoService.uploadLPODocument(currentLpoId, draft.file)
                    }

                    // 3. Send (Initialize Tracking)
                    await lpoService.sendLPO(currentLpoId)

                    // Clear this draft from state
                    setLpoDrafts(prev => {
                        const { [poId]: _, ...rest } = prev
                        return rest
                    })
                    successCount++
                } catch (err) {
                    console.error(`Failed to process PO ${po.po_number}:`, err)
                }
            }

            showSuccess('Bulk Processing Complete', `Successfully processed ${successCount} LPOs.`)
            loadData()
        } catch (error) {
            console.error('Bulk processing error:', error)
            showError('Error', 'Bulk processing failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 pt-6 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Letter of Purchase Order (LPO)</h1>
                    <p className="text-slate-500">Manage and track government LPO documents</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all-lpos" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        All LPOs
                    </TabsTrigger>
                    <TabsTrigger value="pending-pos" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pending POs
                        {totalItems > 0 && (
                            <Badge variant="primary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                {totalItems}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all-lpos">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent LPOs</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search LPO, PO or Supplier..."
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
                                            <TableHead>LPO Date</TableHead>
                                            <TableHead>PO Reference</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">LPO Document</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                            <TableHead className="text-right">Send to Supplier</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                            </TableRow>
                                        ) : filteredLpos.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                                    No LPOs found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredLpos.map((lpo) => (
                                                <TableRow key={lpo.id}>
                                                    <TableCell className="font-medium text-blue-600">{lpo.lpo_number}</TableCell>
                                                    <TableCell>{formatDate(lpo.document_date)}</TableCell>
                                                    <TableCell className="font-medium text-slate-700">{lpo.purchase_order?.po_number}</TableCell>
                                                    <TableCell>{lpo.purchase_order?.supplier?.company_name}</TableCell>
                                                    <TableCell>{getStatusBadge(lpo.status)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex justify-center gap-2">
                                                            {lpo.document_url ? (
                                                                <Button variant="ghost" size="sm" asChild className="text-blue-600">
                                                                    <a href={lpo.document_url} target="_blank" rel="noopener noreferrer">
                                                                        <Download className="w-4 h-4 mr-1" /> View doc
                                                                    </a>
                                                                </Button>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-[10px] text-red-500 font-bold uppercase">No Document</span>
                                                                    <label className="cursor-pointer">
                                                                        <Input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept=".pdf"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0]
                                                                                if (file) {
                                                                                    lpoService.uploadLPODocument(lpo.id, file)
                                                                                        .then(() => loadData())
                                                                                        .catch(err => showError('Upload failed', err.message))
                                                                                }
                                                                            }}
                                                                        />
                                                                        <div className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-1 rounded border border-slate-200 hover:bg-slate-200 transition-colors">
                                                                            <Plus className="w-3 h-3" /> Upload PDF
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleGeneratePdf(lpo.id)}
                                                                title="Generate LPO PDF"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            disabled={!lpo.lpo_number || !lpo.document_date || !lpo.document_url}
                                                            onClick={() => onSendClick(lpo)}
                                                            className={`
                                                                ${(!lpo.lpo_number || !lpo.document_date || !lpo.document_url)
                                                                    ? 'bg-slate-100 text-slate-400'
                                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                                                } transition-all duration-200
                                                            `}
                                                            title={(!lpo.lpo_number || !lpo.document_date || !lpo.document_url) ? "Missing LPO details or document" : "Send to Order Tracking"}
                                                        >
                                                            <Send className="w-4 h-4 mr-1" />
                                                            Send
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending-pos">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle>Approved POs Awaiting LPO</CardTitle>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer">
                                            <Input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept=".pdf"
                                                onChange={handleBulkUpload}
                                            />
                                            <Button variant="outline" size="sm" asChild className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100" disabled={isProcessingBulk || totalItems === 0}>
                                                <span>
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    {isProcessingBulk ? 'Processing...' : 'Bulk Upload & Detect'}
                                                </span>
                                            </Button>
                                        </label>

                                        {Object.keys(lpoDrafts).some(id => lpoDrafts[id].lpo_number && (lpoDrafts[id].file || lpoDrafts[id].document_url)) && (
                                            <Button
                                                onClick={handleProcessAllMatched}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300 h-9"
                                                size="sm"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Process All ({Object.keys(lpoDrafts).filter(id => lpoDrafts[id].lpo_number && (lpoDrafts[id].file || lpoDrafts[id].document_url)).length})
                                            </Button>
                                        )}
                                    </div>
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search PO or Supplier..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>PO Number</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>LPO Number</TableHead>
                                            <TableHead>LPO Date</TableHead>
                                            <TableHead className="text-center">Upload LPO Document</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                            </TableRow>
                                        ) : filteredPendingPOs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                                    No pending POs found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPendingPOs.map((po) => (
                                                <TableRow key={po.id}>
                                                    <TableCell className="font-medium">{po.po_number}</TableCell>
                                                    <TableCell>{po.supplier?.company_name || po.manual_supplier_name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            placeholder="Draft LPO #"
                                                            value={lpoDrafts[po.id]?.lpo_number || ''}
                                                            onChange={(e) => handleDraftChange(po.id, 'lpo_number', e.target.value)}
                                                            className="h-8 text-xs w-32"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="date"
                                                            value={lpoDrafts[po.id]?.document_date || ''}
                                                            onChange={(e) => handleDraftChange(po.id, 'document_date', e.target.value)}
                                                            className="h-8 text-xs w-36"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <label className="cursor-pointer inline-block">
                                                                <Input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept=".pdf"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0]
                                                                        if (!file) return

                                                                        try {
                                                                            console.log('Single PDF upload started for PO:', po.id);
                                                                            const data = await extractLPODataFromPDF(file)
                                                                            console.log('Extracted data for single upload:', data);

                                                                            const updatedDraft = {
                                                                                lpo_number: data.lpoNumber || lpoDrafts[po.id]?.lpo_number || '',
                                                                                document_date: data.lpoDate || lpoDrafts[po.id]?.document_date || '',
                                                                                file: file
                                                                            }

                                                                            setLpoDrafts(prev => ({
                                                                                ...prev,
                                                                                [po.id]: updatedDraft
                                                                            }))

                                                                            if (data.lpoNumber) {
                                                                                showSuccess('Data Extracted', `LPO Number found: ${data.lpoNumber}`)

                                                                                // Save to Supabase (Draft)
                                                                                const lpoRecord = await lpoService.upsertLPODraft({
                                                                                    po_id: po.id,
                                                                                    lpo_number: data.lpoNumber!,
                                                                                    document_date: data.lpoDate || new Date().toISOString().split('T')[0],
                                                                                    hospital_id: hospitalId!
                                                                                })
                                                                                // Upload file
                                                                                await lpoService.uploadLPODocument(lpoRecord.id, file)
                                                                                loadData() // Refresh to sync URL
                                                                            }
                                                                        } catch (err: any) {
                                                                            console.error('Extraction failed:', err)
                                                                            handleDraftChange(po.id, 'file', file)
                                                                        }
                                                                    }}
                                                                />
                                                                <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${(lpoDrafts[po.id]?.file || lpoDrafts[po.id]?.document_url)
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                                    }`}>
                                                                    <FileText className="w-3 h-3" />
                                                                    {lpoDrafts[po.id]?.file || lpoDrafts[po.id]?.document_url ? 'Change PDF' : 'Select PDF'}
                                                                </div>
                                                            </label>
                                                            {(lpoDrafts[po.id]?.file || lpoDrafts[po.id]?.document_url) && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (lpoDrafts[po.id]?.file) {
                                                                            handleLocalPreview(lpoDrafts[po.id]!.file!)
                                                                        } else if (lpoDrafts[po.id]?.document_url) {
                                                                            window.open(lpoDrafts[po.id]!.document_url, '_blank')
                                                                        }
                                                                    }}
                                                                    className="text-[10px] text-blue-600 hover:underline font-medium"
                                                                >
                                                                    View Uploaded PDF
                                                                </button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            disabled={!lpoDrafts[po.id]?.lpo_number || !lpoDrafts[po.id]?.file}
                                                            onClick={async () => {
                                                                const draft = lpoDrafts[po.id]
                                                                if (!draft?.lpo_number || (!draft?.file && !draft?.document_url)) return

                                                                try {
                                                                    setIsLoading(true)

                                                                    let currentLpoId = ''
                                                                    const lpo = Array.isArray((po as any).lpo) ? (po as any).lpo[0] : (po as any).lpo

                                                                    if (lpo) {
                                                                        currentLpoId = lpo.id
                                                                    } else {
                                                                        // 1. Create LPO if not exists
                                                                        const newLpo = await lpoService.createLPO({
                                                                            po_id: po.id,
                                                                            lpo_number: draft.lpo_number,
                                                                            document_date: draft.document_date || new Date().toISOString().split('T')[0],
                                                                            hospital_id: hospitalId!
                                                                        })
                                                                        currentLpoId = newLpo.id
                                                                    }

                                                                    // 2. Upload Document if file is selected locally
                                                                    if (draft.file) {
                                                                        await lpoService.uploadLPODocument(currentLpoId, draft.file)
                                                                    }

                                                                    // 3. Send (Initialize Tracking)
                                                                    await lpoService.sendLPO(currentLpoId)

                                                                    showSuccess('LPO Sent', `LPO ${draft.lpo_number} has been created and sent successfully.`)
                                                                    loadData()
                                                                } catch (err: any) {
                                                                    showError('Fulfillment failed', err.message)
                                                                } finally {
                                                                    setIsLoading(false)
                                                                }
                                                            }}
                                                            className={`
                                                                ${(!lpoDrafts[po.id]?.lpo_number || (!lpoDrafts[po.id]?.file && !lpoDrafts[po.id]?.document_url))
                                                                    ? 'bg-slate-100 text-slate-400'
                                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                                                } transition-all duration-200 flex items-center gap-1
                                                            `}
                                                        >
                                                            <Send className="w-3.5 h-3.5" />
                                                            Send to Supplier
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {totalItems > pageSize && (
                                    <div className="flex items-center justify-between mt-4 border-t pt-4">
                                        <div className="text-sm text-slate-500">
                                            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to {Math.min(page * pageSize, totalItems)} of {totalItems} orders
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="h-8"
                                            >
                                                Previous
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.ceil(totalItems / pageSize) }, (_, i) => i + 1).map((p) => (
                                                    <Button
                                                        key={p}
                                                        variant={page === p ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPage(p)}
                                                        className={`h-8 w-8 p-0 ${page === p ? 'bg-blue-600' : ''}`}
                                                    >
                                                        {p}
                                                    </Button>
                                                ))}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => p + 1)}
                                                disabled={page >= Math.ceil(totalItems / pageSize)}
                                                className="h-8"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Send Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={showSendDialog}
                onClose={() => {
                    if (isSending) return
                    setShowSendDialog(false)
                    setSelectedLpo(null)
                }}
                onConfirm={handleSendToSupplier}
                title="Send LPO to Supplier"
                message={`Are you sure you want to send LPO ${selectedLpo?.lpo_number} to ${selectedLpo?.purchase_order?.supplier?.company_name}? This will move the order to the Tracking stage.`}
                variant="info"
                confirmText="Send"
                cancelText="Cancel"
                isLoading={isSending}
            />

            {isLoading && <LoadingOverlay />}
        </div>
    )
}
