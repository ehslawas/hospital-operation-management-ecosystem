import React from 'react'
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '@/components/ui'
import { Camera } from 'lucide-react'

interface QRScannerProps {
    onScan: (data: string | null) => void
    isOpen: boolean
    onClose: () => void
}

export function QRScanner({ onScan, isOpen, onClose }: QRScannerProps) {
    const handleScan = (detected: IDetectedBarcode[]) => {
        if (detected.length > 0) {
            onScan(detected[0].rawValue)
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose} size="md">
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Scan LPO QR Code
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-lg overflow-hidden min-h-[300px]">
                    {isOpen && (
                        <div className="w-full max-w-[300px] aspect-square relative">
                            <Scanner
                                onScan={handleScan}
                                styles={{
                                    container: { width: '100%', height: '100%' },
                                    video: { objectFit: 'cover' }
                                }}
                                components={{
                                    audio: false, // Optional: disable beep
                                    finder: true  // Shows a finder overlay
                                }}
                            />
                        </div>
                    )}
                    <p className="text-white/70 text-sm mt-4 text-center">
                        Align the QR code within the frame to scan
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
