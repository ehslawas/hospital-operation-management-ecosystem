import React, { useState } from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { Modal, Button } from '@/components/ui';

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
    allowMultiple?: boolean;
    debounceMs?: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({
    onScan,
    onClose,
    allowMultiple = false,
    debounceMs = 500
}) => {
    const [error, setError] = useState<string | null>(null);
    const lastScanRef = React.useRef<{ code: string; time: number } | null>(null);

    const handleScan = (detected: IDetectedBarcode[]) => {
        if (detected && detected.length > 0) {
            const code = detected[0].rawValue;
            const now = Date.now();

            // Debounce: skip if same code scanned within debounceMs
            if (lastScanRef.current &&
                lastScanRef.current.code === code &&
                now - lastScanRef.current.time < debounceMs) {
                return;
            }

            lastScanRef.current = { code, time: now };
            onScan(code);
        }
    };

    return (
        <Modal size="2xl" isOpen onClose={onClose} title="Scan QR Code">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-full max-w-sm overflow-hidden rounded-xl border-4 border-sky-100 shadow-inner">
                    <Scanner
                        onScan={handleScan}
                        onError={(err: any) => setError(err.message)}
                        allowMultiple={allowMultiple}
                        styles={{
                            container: { width: '100%', aspectRatio: '1/1' },
                            video: { borderRadius: '0.75rem' }
                        }}
                    />
                </div>
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 w-full text-center">
                        <strong>Scanner Error:</strong> {error}
                    </div>
                )}
                <div className="flex gap-3 w-full">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
