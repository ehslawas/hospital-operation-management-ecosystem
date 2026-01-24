import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, LoadingOverlay, Textarea, Label } from '@/components/ui'
import { receivingService } from '@/services/pharmacy/receivingService'
import { LPOWithRelations, ReceivingItem } from '@/types/pharmacy/procurementNew'
import { Search, PackageCheck, Upload, QrCode } from 'lucide-react'
import { format } from 'date-fns'
import { QRScanner } from '@/components/procurement/QRScanner'

export default function ReceivingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lpo, setLpo] = useState<LPOWithRelations | null>(null)
  const [items, setItems] = useState<Partial<ReceivingItem>[]>([])
  const [notes, setNotes] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Search LPO
  const handleSearch = async (term: string = searchTerm) => {
    if (!term) return

    setIsLoading(true)
    try {
      // Note: In real usage, assume term is ID or we handle lookup
      const data = await receivingService.getLPOForReceiving(term)
      if (data) {
        setLpo(data)
        // Initialize receiving items from current PO items
        // Initialize receiving items from current PO items, filtered by Tracking Status
        const poItems = data.purchase_order?.items || []
        const trackItems = data.tracking_items || []

        const validItems = poItems.filter((poItem: any) => {
          // Find tracking record for this item
          const track = trackItems.find((t: any) => t.item_id === poItem.item_id)
          // Allow if tracked and status is receivable
          return track && ['pending', 'in_transit', 'overdue'].includes(track.status)
        }).map((poItem: any) => ({
          lpo_item_id: poItem.id,
          item_id: poItem.item_id,
          item_type: (poItem.drug ? 'drug' : 'non_drug') as 'drug' | 'non_drug',
          ordered_quantity: poItem.quantity,
          received_quantity: poItem.quantity,
          outstanding_quantity: 0,
          is_fully_received: true
        }))

        setItems(validItems)
        setSearchTerm(term)
      } else {
        alert('LPO not found')
      }
    } catch (error) {
      console.error(error)
      alert('Error fetching LPO')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScan = (data: string | null) => {
    if (data) {
      console.log('Scanned QR:', data)
      // Assuming QR contains LPO ID directly for now
      // If it contains a URL or other format, we'd parse it here
      const lpoId = data.replace('LPO:', '') // Example: simple parse
      setSearchTerm(lpoId)
      handleSearch(lpoId)
    }
  }

  const handleQuantityChange = (index: number, val: string) => {
    const qty = parseInt(val) || 0
    const newItems = [...items]
    const ordered = newItems[index].ordered_quantity || 0

    newItems[index].received_quantity = qty
    newItems[index].outstanding_quantity = Math.max(0, ordered - qty)
    newItems[index].is_fully_received = qty >= ordered

    setItems(newItems)
  }

  const handleSubmit = async () => {
    if (!lpo) return

    setIsLoading(true)
    try {
      await receivingService.createReceiving(
        lpo.id,
        items,
        { doUrl: 'placeholder-url', invoiceUrl: 'placeholder-url' }, // TODO: File upload
        notes
      )
      alert('Receiving recorded successfully!')
      setLpo(null)
      setItems([])
      setSearchTerm('')
      setNotes('')
    } catch (error) {
      console.error(error)
      alert('Failed to record receiving')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Receiving</h1>
          <p className="text-slate-500">Process incoming deliveries and verify DOs</p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Find LPO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Enter LPO ID / Scan QR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button onClick={() => handleSearch()} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Find
              </Button>
            </div>
            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receiving Form */}
      {lpo && (
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Receive Details: {lpo.lpo_number}</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Supplier: {lpo.purchase_order?.supplier?.company_name} |
                  Order Date: {format(new Date(lpo.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
              <Badge variant="gray" className="h-fit">Status: {lpo.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Items Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right w-32">Received</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {/* In real app, fetch name using item_id or include in PO relation */}
                        <span className="font-medium">Item {(item.item_id || '').substring(0, 8)}...</span>
                      </TableCell>
                      <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          value={item.received_quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-24 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">{item.outstanding_quantity}</TableCell>
                      <TableCell>
                        {item.is_fully_received ?
                          <Badge variant="success">Full</Badge> :
                          <Badge variant="warning">Partial</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Documents & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Delivery Order (DO)</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer relative"
                >
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        alert(`File selected: ${e.target.files[0].name}\n(Note: File upload storage is not yet configured)`)
                      }
                    }}
                  />
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Click to upload DO</span>
                </div>
              </div>
              <div className="space-y-4">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Enter any remarks..."
                  className="h-32"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button size="lg" onClick={handleSubmit} disabled={isLoading}>
                <PackageCheck className="w-5 h-5 mr-2" />
                Confirm Receiving
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && <LoadingOverlay />}

      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  )
}
