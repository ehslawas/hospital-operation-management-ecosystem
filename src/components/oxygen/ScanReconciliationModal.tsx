// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  Camera, 
  Volume2, 
  VolumeX, 
  Check, 
  ClipboardCheck
} from 'lucide-react';
import { getCylinderByQrOrSerial } from '@/services/pharmacy/oxygenService';
import type { OxygenCylinderWithRelations } from '@/types/pharmacy';

interface ScanReconciliationModalProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onScanMatch: (cylinderId: string, status: string) => void;
  existingCylinders: OxygenCylinderWithRelations[];
}

export const ScanReconciliationModal: React.FC<ScanReconciliationModalProps> = ({
  hospitalId,
  isOpen,
  onClose,
  onScanMatch,
  existingCylinders,
}) => {
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [matchedCylinder, setMatchedCylinder] = useState<OxygenCylinderWithRelations | null>(null);
  
  // Options for physical status
  const [selectedStatus, setSelectedStatus] = useState<string>('available');

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [successFlash, setSuccessFlash] = useState(false);

  // Camera settings
  const [cameraActive, setCameraActive] = useState(false);
  const [useRealCamera, setUseRealCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Animation states
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsAnimating(true), 20);
      setCameraActive(true); // Auto-activate camera when modal opens
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setCameraActive(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive]);

  // HTML5 Barcode Detector logic
  // Canvas-based QR Code Detection using jsQR
  useEffect(() => {
    let detectorInterval: any;
    if (cameraActive && useRealCamera && stream && videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      detectorInterval = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              handleCodeLookup(code.data);
            }
          }
        }
      }, 500);
    }
    return () => {
      if (detectorInterval) clearInterval(detectorInterval);
    };
  }, [cameraActive, useRealCamera, stream]);

  const playBeep = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, 120);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, 280);
      }
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      setUseRealCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.warn("Webcam fallback triggered.", err);
      setUseRealCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setUseRealCamera(false);
  };

  // Safely bind the media stream to the video element once the element mounts
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraActive, useRealCamera]);

  const handleCodeLookup = async (code: string) => {
    const cleaned = code.trim();
    if (!cleaned) return;

    setStatusMessage(null);
    setMatchedCylinder(null);

    try {
      // First try to look up in local prop list for zero latency
      let cyl = existingCylinders.find(
        c => c.serial_number.toLowerCase() === cleaned.toLowerCase() ||
             (c.qr_code_value && c.qr_code_value.toLowerCase() === cleaned.toLowerCase())
      );

      if (!cyl) {
        // Fallback to database lookup via service
        const res = await getCylinderByQrOrSerial(hospitalId, cleaned);
        if (res.data && !res.error) {
          cyl = res.data;
        }
      }

      if (cyl) {
        playBeep('success');
        setMatchedCylinder(cyl);
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 500);
        setStatusMessage({
          type: 'success',
          text: `Found Cylinder: ${cyl.serial_number}`
        });
        
        // Match expected status in dropdown/selector
        const norm = (cyl.status || '').toLowerCase();
        if (norm === 'available' || norm === 'full') setSelectedStatus('available');
        else if (norm === 'used' || norm === 'in_use' || norm === 'issued') setSelectedStatus('used');
        else if (norm === 'empty') setSelectedStatus('empty');
        else if (norm === 'returned_to_supplier' || norm === 'returned' || norm === 'return') setSelectedStatus('return');
        else setSelectedStatus('available');

      } else {
        playBeep('error');
        setStatusMessage({
          type: 'error',
          text: `Cylinder "${cleaned}" not found in inventory.`
        });
      }
    } catch (err) {
      console.error(err);
      playBeep('error');
      setStatusMessage({
        type: 'error',
        text: 'Error searching for cylinder.'
      });
    }
  };

  const handleConfirmReconciliation = () => {
    if (!matchedCylinder) return;

    onScanMatch(matchedCylinder.id, selectedStatus);

    playBeep('success');
    setStatusMessage({
      type: 'success',
      text: `Draft updated! ${matchedCylinder.serial_number} is now set to "${selectedStatus.toUpperCase()}"`
    });

    // Clear matched cylinder so they can scan next
    setMatchedCylinder(null);
  };

  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex justify-end transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-all duration-300"
      />

      {/* Expanded Width Drawer Panel */}
      <div className={`relative w-full max-w-2xl bg-slate-50 border-l border-slate-200/80 shadow-2xl flex flex-col h-full transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-850 to-emerald-905 border-b border-teal-950 text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-teal-355" />
            </div>
            <div>
              <h3 className="text-md font-extrabold text-white tracking-tight leading-tight">Scan QR to Audit Draft</h3>
              <p className="text-teal-200/80 text-[11px] font-bold mt-0.5">Quickly reconciliation cylinders using barcode/serial scanner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-teal-950/60 hover:bg-teal-900 border border-teal-800 flex items-center justify-center transition-all duration-205 cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-350" />
          </button>
        </div>

        {/* Workspace body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-slate-700">Audit Scanning Assist</span>
              <span className="text-[10px] text-slate-400 font-bold">Auto-matches serials or QR labels</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  soundEnabled 
                    ? 'bg-teal-50 border-teal-200 text-teal-600' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
                title="Toggle Beep Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Scanner Console */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-3.5 shadow-inner text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider font-mono">Scanner Camera View</span>
              <button
                type="button"
                onClick={() => setCameraActive(!cameraActive)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black font-mono transition-all cursor-pointer ${
                  cameraActive 
                    ? 'bg-rose-500 hover:bg-rose-650 text-white' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                <Camera className="w-3 h-3" />
                {cameraActive ? 'SHUTDOWN CAMERA' : 'START CAMERA'}
              </button>
            </div>

            {cameraActive ? (
              <div className={`relative aspect-video rounded-xl overflow-hidden border border-slate-750 bg-slate-950 flex flex-col items-center justify-center shadow-inner transition-all duration-300 ${successFlash ? 'ring-4 ring-teal-400/50' : ''}`}>
                {successFlash && (
                  <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-xs flex items-center justify-center z-20">
                    <CheckCircle2 className="w-10 h-10 text-teal-400 animate-bounce" />
                  </div>
                )}

                {useRealCamera ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-4">
                    <QrCode className="w-6 h-6 text-teal-400/70 animate-pulse mb-1.5" />
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider">LENS STREAM ACTIVE</span>
                  </div>
                )}

                <div className="absolute top-2 left-3 text-[8px] font-mono text-slate-500 select-none">
                  1080p &nbsp; AF-L
                </div>

                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-teal-500 shadow-[0_0_8px_#0d9488] animate-[pulse_1.2s_infinite] z-10" />
                <div className="absolute inset-6 border border-slate-500/15 rounded-lg pointer-events-none z-10">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-teal-400" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-teal-400" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-teal-400" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-teal-400" />
                </div>
              </div>
            ) : (
              <div className="h-36 border border-dashed border-slate-700/60 rounded-xl flex flex-col items-center justify-center text-center p-4 bg-slate-950/20 text-slate-500">
                <Camera className="w-6 h-6 mb-2 opacity-40 text-slate-400" />
                <span className="text-[10px] font-bold font-mono tracking-wide uppercase">Camera view offline</span>
                <span className="text-[9px] text-slate-600 mt-1">Click START CAMERA to begin scanning QR tag.</span>
              </div>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition-all duration-300 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-105 text-emerald-800' 
                : 'bg-rose-50 border-rose-105 text-rose-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* MATCHED CYLINDER ACTIONS */}
          {matchedCylinder && (
            <div className="bg-gradient-to-br from-white to-slate-50/50 border-2 border-teal-500/20 rounded-3xl p-6 space-y-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-teal-600 bg-teal-50 border border-teal-100 rounded-md px-2 py-0.5">MATCH FOUND</span>
                  <h4 className="text-sm font-black text-slate-800 font-mono tracking-tight mt-1">{matchedCylinder.serial_number}</h4>
                  <p className="text-[11px] text-slate-400 font-bold">{matchedCylinder.type_info?.type_name || 'Standard Cylinder'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Expected Status</span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase mt-1 inline-block">
                    {matchedCylinder.status}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                  Select Physical Status
                </span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'available', label: 'Available (Store)', desc: 'Full cylinder in central store' },
                    { id: 'used', label: 'Used (Ward)', desc: 'In use or active in department' },
                    { id: 'empty', label: 'Empty (Store)', desc: 'Empty and waiting in store' },
                    { id: 'return', label: 'Return (Supplier)', desc: 'Returned back to supplier' },
                  ].map((opt) => {
                    const isSelected = selectedStatus === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedStatus(opt.id)}
                        className={`text-left p-3 rounded-2xl border transition-all duration-200 flex flex-col gap-0.5 cursor-pointer hover:shadow-xs active:scale-97 ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-black tracking-tight">{opt.label}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-teal-550 flex items-center justify-center shadow-sm">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleConfirmReconciliation}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md shadow-emerald-500/10 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <ClipboardCheck className="w-4 h-4" />
                Apply to Audit Draft
              </button>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-55 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            CLOSE PANEL
          </button>
        </div>

      </div>
    </div>
  );
};
