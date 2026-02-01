import React, { useState, useRef, useEffect } from 'react';
import { Camera, Scan, XCircle, CheckCircle2 } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: string) => void;
    className?: string;
    continuous?: boolean;
    allowDuplicates?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
    onScan,
    onError,
    className = '',
    continuous = false,
    allowDuplicates = false
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState<string[]>([]);
    const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);
    const scannerRef = useRef<HTMLDivElement>(null);
    const scannerIdRef = useRef(`qr-scanner-${Math.random().toString(36).substr(2, 9)}`);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Initialize Audio Context for beeps
    useEffect(() => {
        const initAudio = () => {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        };
        window.addEventListener('click', initAudio, { once: true });
        return () => window.removeEventListener('click', initAudio);
    }, []);

    const playBeep = () => {
        if (!audioCtxRef.current) return;
        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(audioCtxRef.current.currentTime + 0.1);
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (scannerInstance) {
                scannerInstance.stop().catch(console.error);
            }
        };
    }, [scannerInstance]);

    const startScanning = async () => {
        if (!scannerRef.current) return;

        try {
            const scanner = new Html5Qrcode(scannerIdRef.current);
            setScannerInstance(scanner);

            await scanner.start(
                { facingMode: 'environment' }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    // Duplicate prevention
                    if (!allowDuplicates && scannedItems.includes(decodedText)) {
                        return;
                    }

                    playBeep();
                    setScannedItems(prev => [decodedText, ...prev].slice(0, 10)); // Keep last 10
                    onScan(decodedText);

                    if (!continuous) {
                        // Auto-stop after successful scan if NOT continuous
                        scanner.stop().then(() => {
                            setIsScanning(false);
                        }).catch(console.error);
                    }
                },
                (errorMessage) => {
                    // Ignore minor errors during scanning
                    console.debug('QR scan error:', errorMessage);
                }
            );

            setIsScanning(true);
        } catch (err: any) {
            console.error('Failed to start scanner:', err);
            onError?.(err.message || 'Failed to start camera');
            setIsScanning(false);
        }
    };

    const stopScanning = async () => {
        if (scannerInstance) {
            try {
                await scannerInstance.stop();
                setIsScanning(false);
            } catch (err) {
                console.error('Failed to stop scanner:', err);
            }
        }
    };

    return (
        <Card className={`p-6 space-y-4 ${className}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-sky-600" />
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">QR Scanner</h3>
                </div>
                {isScanning && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span>Scanning...</span>
                    </div>
                )}
            </div>

            {/* Scanner Preview */}
            <div className="relative">
                <div
                    id={scannerIdRef.current}
                    ref={scannerRef}
                    className={`w-full rounded-xl overflow-hidden bg-slate-900 ${isScanning ? 'block' : 'hidden'}`}
                    style={{ minHeight: '300px' }}
                />

                {!isScanning && (
                    <div className="w-full h-64 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4">
                        <Scan className="w-16 h-16 text-slate-300" />
                        <p className="text-sm font-medium text-slate-400">Camera preview will appear here</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
                {!isScanning ? (
                    <Button
                        onClick={startScanning}
                        className="flex-1 bg-sky-600 hover:bg-sky-700 text-white h-12 rounded-xl font-bold transition-all"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Scanning
                    </Button>
                ) : (
                    <Button
                        onClick={stopScanning}
                        variant="outline"
                        className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 h-12 rounded-xl font-bold"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Stop Scanner
                    </Button>
                )}
            </div>

            {/* Last Scan Results */}
            {scannedItems.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {continuous ? 'Recently Scanned' : 'Last Scanned'}
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {scannedItems.map((scan, idx) => (
                            <motion.div
                                key={`${scan}-${idx}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <p className="text-xs font-mono font-bold text-emerald-700 truncate flex-1">{scan}</p>
                                {idx === 0 && (
                                    <Badge variant="success" className="text-[8px] h-4 py-0">NEW</Badge>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
