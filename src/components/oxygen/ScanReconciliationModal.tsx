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
  ClipboardCheck,
  Plus,
  Trash2,
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
  ListPlus,
  CheckCheck,
  ExternalLink,
  Table
} from 'lucide-react';
import { getCylinderByQrOrSerial, registerScannedCylinderOnTheFly } from '@/services/pharmacy/oxygenService';
import { useAuthStore } from '@/stores/authStore';
import type { OxygenCylinderWithRelations } from '@/types/pharmacy';

export interface ScannedBatchItem {
  scanId: string;
  cylinder: OxygenCylinderWithRelations;
  status: string;
  unitLocation: string;
  scannedAt: string;
}

export const isStoreUnit = (unit?: string | null) => {
  if (!unit) return true;
  const u = (unit || '').toLowerCase();
  return u.includes('store') || u.includes('farmasi') || u.includes('depot');
};

export const RECONCILIATION_UNITS = [
  { id: 'Emergency & Trauma', label: 'Emergency & Trauma', icon: '🚨' },
  { id: 'General Ward', label: 'General Ward', icon: '🛏️' },
  { id: 'Paediatric Ward', label: 'Paediatric Ward', icon: '👶' },
  { id: 'Radiology & Radiography', label: 'Radiology', icon: '🩻' },
  { id: 'Anaesthesiology / OT', label: 'Anaesthesiology (Anaes)', icon: '💉' },
  { id: 'Nephrology', label: 'Nephrology', icon: '🩺' },
  { id: 'Pharmacy Store', label: 'Pharmacy Store (Central)', icon: '🏬' },
];

export const RECONCILIATION_STATUSES = [
  { id: 'used', label: 'Used / In Use (Ward)', desc: 'In use or active in department / ward' },
  { id: 'available', label: 'Available (Store)', desc: 'Full cylinder ready in store' },
  { id: 'empty', label: 'Empty (Store)', desc: 'Empty cylinder waiting in store' },
  { id: 'return', label: 'Return (Supplier)', desc: 'Returned back to supplier' },
];

interface ScanReconciliationModalProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onScanMatch: (cylinderId: string, status: string, unitLocation?: string) => void;
  onBatchScanMatch?: (items: { cylinderId: string; status: string; unitLocation?: string }[]) => void;
  onNewCylinderRegistered?: (cylinder: OxygenCylinderWithRelations) => void;
  existingCylinders: OxygenCylinderWithRelations[];
}

export const ScanReconciliationModal: React.FC<ScanReconciliationModalProps> = ({
  hospitalId,
  isOpen,
  onClose,
  onScanMatch,
  onBatchScanMatch,
  existingCylinders,
}) => {
  const { user } = useAuthStore();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Scanned Batch List Queue for Multi-Cylinder audit
  const [scannedBatch, setScannedBatch] = useState<ScannedBatchItem[]>([]);
  
  // Applied Items Summary (Track items applied to audit draft)
  const [appliedSummary, setAppliedSummary] = useState<ScannedBatchItem[]>([]);

  // Batch Defaults
  const [batchUnit, setBatchUnit] = useState<string>('General Ward');
  const [batchStatus, setBatchStatus] = useState<string>('used');

  // Instant Auto-Register on Scan Mode
  const [autoRegisterOnScan, setAutoRegisterOnScan] = useState<boolean>(true);

  // Manual barcode/serial text input for handheld scanner / typing
  const [manualCodeInput, setManualCodeInput] = useState<string>('');

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [successFlash, setSuccessFlash] = useState(false);

  // Camera settings
  const [cameraActive, setCameraActive] = useState(false);
  const [useRealCamera, setUseRealCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Cooldown ref to prevent duplicate camera frame scans within 2 seconds
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

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

  // Canvas-based QR Code Detection using jsQR
  useEffect(() => {
    let detectorInterval: any;
    if (cameraActive && useRealCamera && stream && videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });

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

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraActive, useRealCamera]);

  const handleCodeLookup = async (code: string) => {
    let cleaned = code.trim();
    if (!cleaned) return;

    // Cooldown check to prevent camera from re-scanning exact same frame 10 times
    const now = Date.now();
    if (lastScannedRef.current.code.toLowerCase() === cleaned.toLowerCase() && (now - lastScannedRef.current.time) < 2000) {
      return;
    }
    lastScannedRef.current = { code: cleaned, time: now };

    // Support QR codes that are URLs
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      try {
        const url = new URL(cleaned);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          cleaned = pathSegments[pathSegments.length - 1];
        }
      } catch (err) {
        console.error("Failed to parse scanned URL:", err);
      }
    }

    setStatusMessage(null);

    try {
      const q = String(cleaned || '').toLowerCase();

      // 1. Exact match by serial number or QR code
      let cyl = existingCylinders.find(
        c => String(c.serial_number || '').toLowerCase() === q ||
             String(c.qr_code_value || c.qr_code || '').toLowerCase() === q
      );

      // 2. Partial / contains match (e.g. "sabox", "saboxy", "0071", "P101")
      if (!cyl) {
        cyl = existingCylinders.find(c => {
          const sn = String(c.serial_number || '').toLowerCase();
          const qr = String(c.qr_code_value || c.qr_code || '').toLowerCase();
          const typeName = String(c.type_info?.type_name || c.type_info?.name || '').toLowerCase();
          const sizeCode = String(c.size_info?.code || c.size_info?.size_code || c.size_info?.capacity || '').toLowerCase();
          return sn.includes(q) || qr.includes(q) || typeName.includes(q) || sizeCode.includes(q);
        });
      }

      // 3. Database lookup via service
      if (!cyl) {
        try {
          const res = await getCylinderByQrOrSerial(hospitalId, cleaned);
          if (res.data && !res.error) {
            cyl = res.data;
          }
        } catch (dbErr) {
          console.warn('DB lookup exception:', dbErr);
        }
      }

      // 4. Auto-Register or Update Location/Auditor in Database
      const auditorName = user?.full_name || user?.name || user?.email || 'Staff Pharmacist';
      let wasAutoRegistered = false;
      try {
        const autoRes = await registerScannedCylinderOnTheFly(hospitalId, cleaned, {
          location: batchUnit,
          status: batchStatus === 'used' ? 'issued' : batchStatus,
          userId: user?.id,
          userName: auditorName,
        });
        if (autoRes.data && !autoRes.error) {
          cyl = autoRes.data;
          wasAutoRegistered = true;
          if (onNewCylinderRegistered) {
            onNewCylinderRegistered(cyl);
          }
        } else if (autoRes.error) {
          console.error('Auto-registration error:', autoRes.error);
        }
      } catch (autoErr) {
        console.error('Auto-registration exception:', autoErr);
      }

      if (cyl) {
        playBeep('success');
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 500);

        // Immediately sync with parent audit table in real time
        if (onScanMatch) {
          onScanMatch(cyl.id, batchStatus, batchUnit);
        }

        // Deduplicate or add to batch queue
        const currentCyl = cyl;
        setScannedBatch(prev => {
          const existingIdx = prev.findIndex(item => item.cylinder.id === currentCyl.id);
          if (existingIdx !== -1) {
            // Already scanned: update unit/status and bring to front
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              unitLocation: batchUnit,
              status: batchStatus,
              scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
            return updated;
          } else {
            // New scan: append to batch
            const newItem: ScannedBatchItem = {
              scanId: `scan-${Date.now()}-${Math.random()}`,
              cylinder: currentCyl,
              status: batchStatus,
              unitLocation: batchUnit,
              scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
            return [newItem, ...prev];
          }
        });

        setStatusMessage({
          type: 'success',
          text: wasAutoRegistered
            ? `⚡ Auto-Registered & Added: ${cyl.serial_number} (${cyl.type_info?.type_name || 'Standard'}) → Assigned to ${batchUnit}`
            : `Added Cylinder: ${cyl.serial_number} → Assigned to ${batchUnit}`
        });
      } else {
        playBeep('error');
        setStatusMessage({
          type: 'error',
          text: `Cylinder "${cleaned}" could not be found or registered.`
        });
      }
    } catch (err: any) {
      console.error(err);
      playBeep('error');
      setStatusMessage({
        type: 'error',
        text: err?.message ? `Scan error: ${err.message}` : 'Error processing scanned code.'
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCodeInput.trim()) {
      handleCodeLookup(manualCodeInput.trim());
      setManualCodeInput('');
    }
  };

  const handleUpdateItemStatus = (scanId: string, newStatus: string) => {
    setScannedBatch(prev => prev.map(item => item.scanId === scanId ? { ...item, status: newStatus } : item));
  };

  const handleUpdateItemUnit = (scanId: string, newUnit: string) => {
    setScannedBatch(prev => prev.map(item => {
      if (item.scanId === scanId) {
        const autoStatus = isStoreUnit(newUnit) ? 'available' : 'used';
        return { ...item, unitLocation: newUnit, status: autoStatus };
      }
      return item;
    }));
  };

  const handleRemoveBatchItem = (scanId: string) => {
    setScannedBatch(prev => prev.filter(item => item.scanId !== scanId));
  };

  const handleApplyAllBatch = () => {
    if (scannedBatch.length === 0) return;

    if (onBatchScanMatch) {
      const itemsToMatch = scannedBatch.map(item => ({
        cylinderId: item.cylinder.id,
        status: item.status,
        unitLocation: item.unitLocation
      }));
      onBatchScanMatch(itemsToMatch);
    } else {
      scannedBatch.forEach(item => {
        onScanMatch(item.cylinder.id, item.status, item.unitLocation);
      });
    }

    playBeep('success');
    
    // Add to applied summary list
    setAppliedSummary(prev => [...scannedBatch, ...prev]);

    setStatusMessage({
      type: 'success',
      text: `Applied ${scannedBatch.length} cylinder(s) to Audit Table! Close scanner panel to review draft & save audit.`
    });

    setScannedBatch([]);
  };

  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex justify-end transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-all duration-300"
      />

      {/* Drawer Panel */}
      <div className={`relative w-full max-w-3xl bg-slate-50 border-l border-slate-200/80 shadow-2xl flex flex-col h-full transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-850 to-emerald-900 border-b border-teal-950 text-white shadow-lg shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-md font-extrabold text-white tracking-tight leading-tight">Multi-Cylinder Audit Scanner</h3>
                <span className="text-[9px] font-black bg-teal-500/30 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Batch Mode</span>
              </div>
              <p className="text-teal-200/80 text-[11px] font-bold mt-0.5">Scan multiple cylinders & assign physical unit / location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-teal-950/60 hover:bg-teal-900 border border-teal-800 flex items-center justify-center transition-all duration-200 cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Controls Bar & Sound Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" /> Continuous Batch Scanner
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Scan cylinder after cylinder — ready for next scan immediately.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  soundEnabled 
                    ? 'bg-teal-50 border-teal-200 text-teal-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title="Toggle Beep Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'Beep ON' : 'Beep Muted'}</span>
              </button>
            </div>
          </div>

          {/* Auto-Register on Scan Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-950">
                    ⚡ Auto-Register Unknown Cylinders on Scan
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                    Live Supabase Sync
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                  Scanning any unlisted physical cylinder tag will instantly create & register it in the database.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoRegisterOnScan(!autoRegisterOnScan)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                autoRegisterOnScan
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {autoRegisterOnScan ? 'AUTO-REGISTER: ACTIVE' : 'AUTO-REGISTER: OFF'}
            </button>
          </div>

          {/* Scanner Console & Manual Entry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Camera View Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-inner text-white flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Camera Scanner
                </span>
                <button
                  type="button"
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black font-mono transition-all cursor-pointer ${
                    cameraActive 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  {cameraActive ? 'PAUSE CAMERA' : 'START CAMERA'}
                </button>
              </div>

              {cameraActive ? (
                <div className={`relative aspect-video rounded-xl overflow-hidden border border-slate-750 bg-slate-950 flex flex-col items-center justify-center shadow-inner transition-all duration-300 ${successFlash ? 'ring-4 ring-teal-400/50' : ''}`}>
                  {successFlash && (
                    <div className="absolute inset-0 bg-teal-500/20 backdrop-blur-xs flex items-center justify-center z-20">
                      <CheckCircle2 className="w-12 h-12 text-teal-400 animate-bounce" />
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
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-4">
                      <QrCode className="w-8 h-8 text-teal-400/80 animate-pulse mb-2" />
                      <span className="text-[10px] font-bold text-slate-300 font-mono tracking-wider">AUTO SCANNER RUNNING</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-1">Point QR label to webcam stream</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-3 text-[8px] font-mono text-slate-400 select-none">
                    1080p &nbsp; MULTI-SCAN ENABLED
                  </div>

                  <div className="absolute inset-x-6 top-1/2 h-0.5 bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-[pulse_1.2s_infinite] z-10" />
                  <div className="absolute inset-4 border border-slate-500/20 rounded-lg pointer-events-none z-10">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-teal-400" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-teal-400" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-teal-400" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-teal-400" />
                  </div>
                </div>
              ) : (
                <div className="h-36 border border-dashed border-slate-700/60 rounded-xl flex flex-col items-center justify-center text-center p-4 bg-slate-950/40 text-slate-400">
                  <Camera className="w-6 h-6 mb-2 opacity-50 text-slate-300" />
                  <span className="text-[10px] font-bold font-mono tracking-wide uppercase">Camera view paused</span>
                  <span className="text-[9px] text-slate-500 mt-1">Click START CAMERA to begin scanning QR code tags.</span>
                </div>
              )}
            </div>

            {/* Batch Defaults & Handheld Input Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-xs flex flex-col justify-between">
              
              {/* Default Unit Setting */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" /> Target Unit / Location for Scans
                </label>
                <select
                  value={batchUnit}
                  onChange={(e) => {
                    const newUnit = e.target.value;
                    setBatchUnit(newUnit);
                    if (isStoreUnit(newUnit)) {
                      setBatchStatus('available');
                    } else {
                      setBatchStatus('used');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all cursor-pointer"
                >
                  {RECONCILIATION_UNITS.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.icon} {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Physical Status */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-teal-600" /> Default Physical Status for Scans
                </label>
                <select
                  value={batchStatus}
                  onChange={(e) => setBatchStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all cursor-pointer"
                >
                  {RECONCILIATION_STATUSES.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Serial Entry for Handheld Barcode Reader */}
              <form onSubmit={handleManualSubmit} className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Handheld Barcode / Serial Entry
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="e.g. O2-P101-F-0044..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </form>

            </div>

          </div>

          {/* Status Message Notification Banner */}
          {statusMessage && (
            <div className={`p-4 rounded-xl text-xs font-bold border flex items-start gap-3 transition-all duration-300 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p className="leading-snug font-bold">{statusMessage.text}</p>
                {statusMessage.type === 'success' && statusMessage.text.includes('Audit Table') && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900 underline mt-1 cursor-pointer"
                  >
                    <Table className="w-3.5 h-3.5" /> Click here to close scanner & review Audit Table on Dashboard
                  </button>
                )}
              </div>
            </div>
          )}

          {/* APPLIED TO AUDIT DRAFT SUMMARY SECTION */}
          {appliedSummary.length > 0 && (
            <div className="bg-emerald-50/70 border-2 border-emerald-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                    Applied to Reconciliation Audit Table ({appliedSummary.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Close & Review Audit Table <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-emerald-800 font-semibold">
                The cylinders below have been applied to the <strong>Reconciliation Audit Table</strong> on the Oxygen Dashboard. Close this panel to review and save the final audit!
              </p>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                {appliedSummary.map(item => (
                  <span 
                    key={item.scanId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3px]" />
                    <span className="font-mono text-slate-900">{item.cylinder.serial_number}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                      {item.status} ({item.unitLocation})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SCANNED BATCH QUEUE TABLE / LIST */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-teal-600" />
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Scanned Cylinder Queue
                </h4>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  {scannedBatch.length} {scannedBatch.length === 1 ? 'cylinder' : 'cylinders'}
                </span>
              </div>

              {scannedBatch.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScannedBatch([])}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Queue
                </button>
              )}
            </div>

            {scannedBatch.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200/80 rounded-2xl text-center bg-white text-slate-400 space-y-2">
                <QrCode className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
                <p className="text-xs font-bold text-slate-600">No cylinders currently in queue.</p>
                <p className="text-[11px] text-slate-400">Point the camera scanner or enter serial numbers to add cylinders to this list.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {scannedBatch.map((item, index) => (
                  <div 
                    key={item.scanId}
                    className="p-3.5 bg-white border border-slate-200/80 hover:border-teal-300 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    {/* Cylinder Serial & Details */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-150 text-teal-700 font-extrabold text-xs flex items-center justify-center shrink-0 font-mono">
                        #{scannedBatch.length - index}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">{item.cylinder.serial_number}</span>
                          <span className="text-[10px] font-bold text-slate-400">{item.scannedAt}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                          {item.cylinder.type_info?.type_name || 'Medical Oxygen Cylinder'} — {item.cylinder.size_info?.capacity ? `${item.cylinder.size_info.capacity}m³` : 'Standard'}
                        </p>
                      </div>
                    </div>

                    {/* Controls: Unit Dropdown & Status Dropdown */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                      
                      {/* Unit Selector */}
                      <div className="flex-1 md:w-48">
                        <select
                          value={item.unitLocation}
                          onChange={(e) => handleUpdateItemUnit(item.scanId, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all cursor-pointer"
                        >
                          {RECONCILIATION_UNITS.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.icon} {u.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Selector */}
                      <div className="flex-1 md:w-40">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateItemStatus(item.scanId, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
                        >
                          {RECONCILIATION_STATUSES.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBatchItem(item.scanId)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shrink-0"
                        title="Remove cylinder from scan list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-white flex items-center justify-between shrink-0 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            CLOSE PANEL
          </button>

          <button
            type="button"
            disabled={scannedBatch.length === 0}
            onClick={handleApplyAllBatch}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black tracking-wider uppercase shadow-md shadow-emerald-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Apply All ({scannedBatch.length}) to Audit Table
          </button>
        </div>

      </div>
    </div>
  );
};
