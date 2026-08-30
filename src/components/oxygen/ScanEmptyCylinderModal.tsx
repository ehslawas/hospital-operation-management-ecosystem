// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { X, QrCode, AlertCircle, AlertTriangle, RefreshCw, CheckCircle2, Trash2, Camera, Keyboard, Check, Volume2, VolumeX, Search, Database } from 'lucide-react';
import { getCylinderByQrOrSerial, markCylinderAsEmpty, markMultipleCylindersAsEmpty } from '@/services/pharmacy/oxygenService';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';
import type { OxygenCylinderWithRelations } from '@/types/pharmacy';

interface ScanEmptyCylinderModalProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionScannedCylinders: OxygenCylinderWithRelations[];
  setSessionScannedCylinders: React.Dispatch<React.SetStateAction<OxygenCylinderWithRelations[]>>;
  targetCombo?: any;
}

export const ScanEmptyCylinderModal: React.FC<ScanEmptyCylinderModalProps> = ({
  hospitalId,
  isOpen,
  onClose,
  onSuccess,
  sessionScannedCylinders,
  setSessionScannedCylinders,
  targetCombo,
}) => {
  // Navigation tabs for the 2 modes
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  
  // Input text field
  const [qrInput, setQrInput] = useState('');
  
  // Database states
  const [activeCylinders, setActiveCylinders] = useState<any[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [showDemoShortcuts, setShowDemoShortcuts] = useState(true); // Expanded by default for quick selection
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  
  // Process states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [matchedCylinder, setMatchedCylinder] = useState<OxygenCylinderWithRelations | null>(null);
  
  // Cylinder Quick Picker pagination page state
  const [pickerPage, setPickerPage] = useState(1);

  // Auto configure for targetCombo when modal opens
  useEffect(() => {
    if (isOpen && targetCombo) {
      setActiveTab('manual');
      setShowDemoShortcuts(true);
      
      const name = (targetCombo.display_name || '').toUpperCase();
      if (name.includes('101-F') || name.includes('P101-F')) setSelectedSizeFilter('P101-F');
      else if (name.includes('101-E') || name.includes('P101-E')) setSelectedSizeFilter('P101-E');
      else if (name.includes('101-D') || name.includes('P101-D')) setSelectedSizeFilter('P101-D');
      else if (name.includes('101-N')) setSelectedSizeFilter('101-N');
      else if (name.includes('101-HS')) setSelectedSizeFilter('101-HS');

      if (name.includes('BN') || name.includes('BULLNOSE')) setSelectedTypeFilter('BN');
      else if (name.includes('PI') || name.includes('PIN INDEX')) setSelectedTypeFilter('PI');
    }
  }, [isOpen, targetCombo]);

  // Reset picker page when search input or filter changes
  useEffect(() => {
    setPickerPage(1);
  }, [qrInput, selectedSizeFilter, selectedTypeFilter]);
  
  // Scan settings
  const [isBulkScanMode, setIsBulkScanMode] = useState(true);
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

  // Fetch real active/allocated cylinders from Supabase (including issued ward cylinders)
  useEffect(() => {
    const fetchActiveCylinders = async () => {
      setIsDbLoading(true);
      try {
        const { data, error } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .select(`
            *,
            type_info:pharmacy_oxygen_cylinder_types(*),
            size_info:pharmacy_oxygen_cylinder_sizes(*),
            department:departments(*)
          `)
          .eq('hospital_id', hospitalId)
          .in('status', ['available', 'allocated', 'in_use', 'full', 'issued']) // retrieve active and deployed cylinders
          .limit(1000);

        if (!error && data) {
          const normalized = data
            .filter((c: any) => {
              if (c.supplier_tagged) return true;
              const sizeCode = c.size_info?.code || '';
              const isLoan = c.is_loan || c.size_info?.is_loan || !sizeCode.startsWith('P');
              return !isLoan;
            })
            .map((c: any) => {
              const sizeCode = c.size_info?.code || '';
              const prefix = sizeCode.startsWith('P') ? sizeCode : `P${sizeCode}`;
              const typeCode = c.type_info?.code || '';
              const capacity = c.size_info?.capacity ? `${Number(c.size_info.capacity)}${c.size_info.unit || 'm3'}` : '';

              let displayName = prefix;
              if (typeCode) {
                displayName = `${prefix} ${typeCode}${capacity ? ` (${capacity})` : ''}`;
              } else if (capacity) {
                displayName = `${prefix} (${capacity})`;
              }

              return {
                ...c,
                type_name_display: displayName,
                size_code: sizeCode,
                assigned_ward: c.department ? {
                  department_name: c.department.department_name || c.department.name
                } : (c.current_location && c.current_location !== 'Store' && c.current_location !== 'Pharmacy Store' ? {
                  department_name: c.current_location
                } : null)
              };
            });
          setActiveCylinders(normalized);
        }
      } catch (err) {
        console.error("Error loading active cylinders from Supabase:", err);
      } finally {
        setIsDbLoading(false);
      }
    };

    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsAnimating(true), 20);
      fetchActiveCylinders();
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hospitalId]);

  // Handle camera toggles
  useEffect(() => {
    if (cameraActive && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive, activeTab]);

  const playBeep = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (type === 'success') {
        // Two-tone confirmation chirp — loud and satisfying
        const playTone = (freq: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.55, startTime + 0.01);  // loud ramp up
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        playTone(880, audioCtx.currentTime, 0.12);          // first beep: A5
        playTone(1320, audioCtx.currentTime + 0.13, 0.18);  // second beep: E6 (higher)
        setTimeout(() => audioCtx.close(), 400);
      } else {
        // Error buzz — harsh descending tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.45, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
        setTimeout(() => audioCtx.close(), 400);
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

  // Canvas-based QR Code Detection using jsQR
  // lastScannedRef: tracks the last successfully decoded QR data and when it was scanned.
  // This prevents the camera re-triggering the same code while an API call is in-flight
  // or scanning a neighbouring QR by accident.
  const lastScannedRef = useRef<{ code: string; ts: number } | null>(null);
  const SCAN_COOLDOWN_MS = 2000; // ignore same code for 2 s after a successful scan

  useEffect(() => {
    let animFrameId: number;
    let running = false;

    if (cameraActive && useRealCamera && stream && videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });

      const scanFrame = () => {
        if (!running) return;
        animFrameId = requestAnimationFrame(() => {
          if (
            videoRef.current &&
            videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
            context
          ) {
            const video = videoRef.current;
            // Scale down to 640px wide for faster jsQR processing without losing readability
            const scale = Math.min(1, 640 / video.videoWidth);
            canvas.width = Math.floor(video.videoWidth * scale);
            canvas.height = Math.floor(video.videoHeight * scale);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const detected = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth', // detect both light-on-dark and dark-on-light QRs
            });
            if (detected && detected.data) {
              const now = Date.now();
              const last = lastScannedRef.current;
              // Cooldown: skip if we just scanned the exact same code within SCAN_COOLDOWN_MS
              if (!last || last.code !== detected.data || now - last.ts > SCAN_COOLDOWN_MS) {
                lastScannedRef.current = { code: detected.data, ts: now };
                handleCodeInput(detected.data);
              }
            }
          }
          // ~150 ms between frames — much faster than the old 500 ms polling
          setTimeout(scanFrame, 150);
        });
      };

      running = true;
      scanFrame();
    }

    return () => {
      running = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [cameraActive, useRealCamera, stream]);

  // Unified lookup processing
  const handleCodeInput = async (inputStr: string) => {
    if (isSubmitting) return;

    let cleanedInput = inputStr.trim();
    if (!cleanedInput) return;

    // Support QR codes that are encoded as URLs (extract the last segment as the serial/code)
    if (cleanedInput.startsWith('http://') || cleanedInput.startsWith('https://')) {
      try {
        const url = new URL(cleanedInput);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          cleanedInput = pathSegments[pathSegments.length - 1];
        }
      } catch (err) {
        console.error("Failed to parse scanned URL:", err);
      }
    }

    // Reject loan cylinders starting with 101-N or 101-F (case insensitive)
    const upperInput = cleanedInput.toUpperCase();
    if (
      upperInput.startsWith('101-N') || 
      upperInput.startsWith('101-F') || 
      upperInput.startsWith('101N') || 
      upperInput.startsWith('101F')
    ) {
      playBeep('error');
      setStatusMessage({ 
        type: 'error', 
        text: `Cylinder "${cleanedInput}" is a loan item (101-N/101-F) and does not need tracking. Please add the quantity directly inside the Create Return Document modal instead.` 
      });
      return;
    }

    // Detect bulk list pasting (lines or comma separated)
    const codes = cleanedInput
      .split(/[\n,;]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (codes.length > 1) {
      setIsSubmitting(true);
      setStatusMessage(null);
      let successCount = 0;
      let errorCount = 0;
      const newScannedBatch: OxygenCylinderWithRelations[] = [];
      const batchSeenIds = new Set<string>();

      // Deduplicate scanned inputs upfront to avoid double-processing repeated barcodes
      const uniqueCodes = Array.from(new Set(codes));
      errorCount += (codes.length - uniqueCodes.length); // count duplicates in scanned text as skipped

      for (const code of uniqueCodes) {
        // Nested check for bulk codes
        const uc = code.toUpperCase();
        if (uc.startsWith('101-N') || uc.startsWith('101-F') || uc.startsWith('101N') || uc.startsWith('101F')) {
          errorCount++;
          continue;
        }
        try {
          const res = await getCylinderByQrOrSerial(hospitalId, code);
          if (res.data && !res.error) {
            let targetCylinder = res.data;
            if (batchSeenIds.has(targetCylinder.id)) {
              errorCount++;
              continue;
            }
            batchSeenIds.add(targetCylinder.id);

            if (targetCylinder.status !== 'empty') {
              const creatorId = user?.id || localStorage.getItem('userId') || 'fbbd44d1-f322-4fdb-a367-a18e5371e205';
              const updateRes = await markCylinderAsEmpty(hospitalId, targetCylinder.id, creatorId);
              if (!updateRes.error) {
                targetCylinder = { ...targetCylinder, status: 'empty', current_location: { location_name: 'Pharmacy Store' } };
              }
            }
            newScannedBatch.push(targetCylinder);
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (newScannedBatch.length > 0) {
        setSessionScannedCylinders(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const toAdd = newScannedBatch.filter(c => !existingIds.has(c.id));
          return [...prev, ...toAdd];
        });
        // Remove processed cylinders from active database list
        const processedIds = new Set(newScannedBatch.map(c => c.id));
        setActiveCylinders(prev => prev.filter(c => !processedIds.has(c.id)));

        playBeep('success');
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 500);
        setStatusMessage({ 
          type: 'success', 
          text: `Processed ${successCount} unique cylinders marked as depleted / empty!${errorCount > 0 ? ` (${errorCount} skipped/duplicates/failed)` : ''}` 
        });
        setQrInput('');
        onSuccess();
      } else {
        playBeep('error');
        setStatusMessage({ type: 'error', text: `None of the pasted codes match existing trackable cylinders.` });
      }
      setIsSubmitting(false);
      return;
    }

    // Process single code
    const singleCode = codes[0];
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await getCylinderByQrOrSerial(hospitalId, singleCode);
      if (res.error || !res.data) {
        playBeep('error');
        setStatusMessage({ type: 'error', text: `Cylinder "${singleCode}" not found in inventory.` });
        setMatchedCylinder(null);
      } else {
        const cyl = res.data;
        if (isBulkScanMode) {
          let targetCylinder = cyl;
          if (cyl.status !== 'empty') {
            const creatorId = user?.id || localStorage.getItem('userId') || 'fbbd44d1-f322-4fdb-a367-a18e5371e205';
            const updateRes = await markCylinderAsEmpty(hospitalId, cyl.id, creatorId);
            if (updateRes.error) {
              playBeep('error');
              setStatusMessage({ type: 'error', text: `Failed to mark empty: ${updateRes.error}` });
              setIsSubmitting(false);
              return;
            }
            targetCylinder = { ...cyl, status: 'empty', current_location: { location_name: 'Pharmacy Store' } };
          }
          setSessionScannedCylinders(prev => {
            if (prev.some(c => c.id === targetCylinder.id)) return prev;
            return [...prev, targetCylinder];
          });
          // Remove from active list
          setActiveCylinders(prev => prev.filter(c => c.id !== targetCylinder.id));
          playBeep('success');
          setSuccessFlash(true);
          setTimeout(() => setSuccessFlash(false), 500);
          setStatusMessage({ type: 'success', text: `Marked as Depleted (Empty): ${targetCylinder.serial_number}` });
          setQrInput('');
          // Reset cooldown so camera is immediately ready for the NEXT cylinder
          lastScannedRef.current = null;
          onSuccess();
        } else {
          playBeep('success');
          setMatchedCylinder(cyl);
          if (sessionScannedCylinders.some(c => c.id === cyl.id)) {
            setStatusMessage({ type: 'success', text: `Cylinder "${cyl.serial_number}" is already in return list.` });
          }
        }
      }
    } catch (err) {
      console.error(err);
      playBeep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSingleConfirm = async () => {
    if (!matchedCylinder) return;
    setIsSubmitting(true);

    try {
      if (matchedCylinder.status === 'empty') {
        setSessionScannedCylinders(prev => {
          if (prev.some(c => c.id === matchedCylinder.id)) return prev;
          return [...prev, matchedCylinder];
        });
        setStatusMessage({ type: 'success', text: `Added "${matchedCylinder.serial_number}" to returns.` });
        setMatchedCylinder(null);
        setQrInput('');
      } else {
        const creatorId = user?.id || localStorage.getItem('userId') || 'fbbd44d1-f322-4fdb-a367-a18e5371e205';
        const res = await markCylinderAsEmpty(hospitalId, matchedCylinder.id, creatorId);
        if (res.error) {
          setStatusMessage({ type: 'error', text: res.error });
        } else {
          const updated = { ...matchedCylinder, status: 'empty', current_location: { location_name: 'Pharmacy Store' } };
          setSessionScannedCylinders(prev => {
            if (prev.some(c => c.id === updated.id)) return prev;
            return [...prev, updated];
          });
          setActiveCylinders(prev => prev.filter(c => c.id !== updated.id));
          setStatusMessage({ type: 'success', text: `Cylinder "${matchedCylinder.serial_number}" marked empty & added.` });
          setMatchedCylinder(null);
          setQrInput('');
          onSuccess();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchDepleteAll = async (cylsToDeplete: any[]) => {
    if (isSubmitting || !cylsToDeplete || cylsToDeplete.length === 0) return;
    setIsSubmitting(true);
    try {
      const creatorId = user?.id || localStorage.getItem('userId') || 'fbbd44d1-f322-4fdb-a367-a18e5371e205';
      const ids = cylsToDeplete.map(c => c.id);
      const res = await markMultipleCylindersAsEmpty(hospitalId, ids, creatorId);
      if (!res.error) {
        const updatedList = cylsToDeplete.map(c => ({
          ...c,
          status: 'empty',
          current_location: { location_name: 'Pharmacy Store' }
        }));
        setSessionScannedCylinders(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const toAdd = updatedList.filter(c => !existingIds.has(c.id));
          return [...prev, ...toAdd];
        });
        setActiveCylinders(prev => prev.filter(c => !ids.includes(c.id)));
        playBeep('success');
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 500);
        setStatusMessage({
          type: 'success',
          text: `Successfully marked ${cylsToDeplete.length} cylinders as depleted / empty!`
        });
        onSuccess();
      } else {
        playBeep('error');
        setStatusMessage({ type: 'error', text: `Failed to mark cylinders depleted: ${res.error}` });
      }
    } catch (err) {
      console.error(err);
      playBeep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter active database cylinders by manual search term and selected category tab
  // Get unique sizes & valve types from fetched database cylinders
  const uniqueSizes = Array.from(
    new Set(activeCylinders.map(c => c.size_info?.code).filter(Boolean))
  ).sort();

  const uniqueTypes = Array.from(
    new Set(activeCylinders.map(c => c.type_info?.code).filter(Boolean))
  ).sort();

  // Filter active database cylinders by manual search term, size filter, and type filter
  const filteredActiveCylinders = activeCylinders.filter(c => {
    // 1. Cylinder Size Filter
    if (selectedSizeFilter && c.size_info?.code !== selectedSizeFilter) return false;

    // 2. Valve Type Filter
    if (selectedTypeFilter && c.type_info?.code !== selectedTypeFilter) return false;

    // 3. Exclude already scanned cylinders in the current session
    if (sessionScannedCylinders.some(sc => sc.id === c.id)) return false;

    // 4. Search Text Filter
    if (!qrInput.trim()) return true;
    const q = qrInput.trim().toLowerCase();
    return (
      (c.serial_number || '').toLowerCase().includes(q) ||
      (c.qr_code || '').toLowerCase().includes(q) ||
      (c.assigned_ward?.department_name || '').toLowerCase().includes(q)
    );
  });

  const sortedActiveCylinders = [...filteredActiveCylinders].sort((a, b) => 
    (a.serial_number || '').localeCompare(b.serial_number || '')
  );

  const pickerPageSize = 20; // 20 items in 2 columns (10 rows) fills space perfectly
  const totalPickerItems = sortedActiveCylinders.length;
  const totalPickerPages = Math.max(1, Math.ceil(totalPickerItems / pickerPageSize));
  const paginatedPickerCylinders = sortedActiveCylinders.slice(
    (pickerPage - 1) * pickerPageSize,
    pickerPage * pickerPageSize
  );

  // Group the paginated cylinders by size code & type code for separated display section
  const paginatedGroupedCylinders = paginatedPickerCylinders.reduce((groups: { [key: string]: typeof paginatedPickerCylinders }, c) => {
    const sizeLabel = c.size_info?.code || 'Other Size';
    const typeLabel = c.type_info?.code || '';
    const capVal = c.size_info?.capacity ? `${Number(c.size_info.capacity)}M³` : '';
    const groupKey = `${sizeLabel} ${typeLabel}${capVal ? ` (${capVal})` : ''}`.trim();
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(c);
    return groups;
  }, {});

  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex justify-end transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-all duration-300"
      />

      {/* Expanded Width Drawer Panel (Redesign V9 - max-w-4xl) */}
      <div className={`relative w-full max-w-4xl bg-slate-50 border-l border-slate-200/80 shadow-2xl flex flex-col h-full transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Dark slate console header (Redesign V4) */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 border-b border-slate-800 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/35 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.35)]">
              <QrCode className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-tight">Scan Cylinder as Empty</h3>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Change cylinder status to empty (ready for returns)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center transition-all duration-205 cursor-pointer hover:scale-105"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Split Column Workspace Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 min-h-0">
          
          {/* Left Column: Console Inputs & Viewports (col-span-7) */}
          <div className="col-span-1 md:col-span-7 space-y-6 border-b md:border-b-0 md:border-r border-slate-200/50 pb-6 md:pb-0 pr-0 md:pr-8">
            
            {/* Bulk Scan Mode Header Switcher */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-700">Bulk Scan Mode</span>
                <span className="text-[10px] text-slate-400 font-semibold">Auto-confirm instantly</span>
              </div>
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    soundEnabled 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkScanMode(!isBulkScanMode)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isBulkScanMode ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      isBulkScanMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Mode Selector Tabs (Scan by Camera vs Key in Manually) */}
            <div className="flex bg-slate-105 p-1 bg-slate-100 rounded-xl border border-slate-200/40">
              <button
                type="button"
                onClick={() => { setActiveTab('camera'); setQrInput(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'camera' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Camera Feed
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('manual'); stopCamera(); setQrInput(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'manual' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                Key-In Manual
              </button>
            </div>

            {/* MODE A: Camera scanner layout */}
            {activeTab === 'camera' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-inner text-white">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Camera Console</span>
                    <span className="text-[9px] text-slate-500 font-mono">Lens status: Connected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraActive(!cameraActive)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold font-mono transition-all cursor-pointer ${
                      cameraActive 
                        ? 'bg-rose-500 hover:bg-rose-650 text-white' 
                        : 'bg-blue-600 hover:bg-blue-750 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {cameraActive ? 'SHUTDOWN LENS' : 'ACTIVATE CAMERA'}
                  </button>
                </div>

                {cameraActive ? (
                  <div className={`relative aspect-video rounded-2xl overflow-hidden border border-slate-700 bg-slate-955 flex flex-col items-center justify-center shadow-inner transition-all duration-300 bg-slate-950 ${successFlash ? 'ring-8 ring-emerald-500/30' : ''}`}>
                    {successFlash && (
                      <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-xs flex items-center justify-center z-20">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
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
                        <QrCode className="w-6 h-6 text-blue-400/70 animate-pulse mb-1.5" />
                        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider">LENS STREAM ACTIVE</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-3 text-[8px] font-mono text-slate-500 select-none">
                      f/2.8 &nbsp; ISO 400 &nbsp; 1080p
                    </div>
                    <div className="absolute top-2 right-3 text-[8px] font-mono text-emerald-500 select-none flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                      AF-L
                    </div>

                    <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981] animate-[pulse_1.2s_infinite] z-10" />
                    <div className="absolute inset-6 border border-slate-500/15 rounded-lg pointer-events-none z-10">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400" />
                    </div>
                  </div>
                ) : (
                  <div className="h-40 border border-dashed border-slate-700/60 rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-slate-950/20 text-slate-500">
                    <Camera className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
                    <span className="text-[10px] font-bold font-mono tracking-wide uppercase">Console View Offline</span>
                    <span className="text-[9px] text-slate-600 mt-1 leading-normal">Click ACTIVATE CAMERA above to start scanner lens.</span>
                  </div>
                )}
              </div>
            )}

            {/* MODE B: Key-In Manual Mode */}
            {activeTab === 'manual' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manual Entry Console</span>
                    <span className="text-[9px] text-slate-400 font-semibold">Type or paste serial keys below</span>
                  </div>

                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleCodeInput(qrInput); }} 
                    className="space-y-3"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex gap-2 shadow-inner focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200">
                      <input
                        type="text"
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        placeholder="Scan code or paste bulk lists..."
                        disabled={isSubmitting}
                        className="flex-1 px-2.5 py-1.5 bg-transparent text-xs font-semibold text-slate-800 focus:outline-none border-none"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !qrInput.trim()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                      </button>
                    </div>
                  </form>
                  
                  {/* Single lookup details preview */}
                  {!isBulkScanMode && matchedCylinder && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-4 border-l-4 border-l-blue-500 animate-[dropdown-enter_180ms_var(--ease-enter)]">
                      <span className="block text-slate-650 font-bold text-[10px] uppercase tracking-wider">
                        Cylinder Found
                      </span>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Serial Number</span>
                          <span className="font-mono">{matchedCylinder.serial_number}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Capacity</span>
                          <span>{matchedCylinder.size_info?.capacity ? `${matchedCylinder.size_info.capacity} M³` : '0.7 M³'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Location</span>
                          <span className="truncate block">{matchedCylinder.assigned_ward?.department_name || 'Store'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Status</span>
                          <span className="capitalize">{matchedCylinder.status}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSingleConfirm}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {matchedCylinder.status === 'issued' ? 'Add to Return List' : 'Confirm: Mark Cylinder as Empty'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Collapsible Database Quick Picker (Standard trackable cylinders only) */}
                {activeCylinders.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowDemoShortcuts(!showDemoShortcuts)}
                      className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-[#00a68a] animate-pulse" />
                        <span>Select Cylinder from Database (Scan Fallback)</span>
                      </div>
                      <span className="text-[9px] text-[#00a68a] bg-emerald-50 px-2 py-0.5 rounded-lg font-bold border border-emerald-100">
                        {showDemoShortcuts ? 'Hide List' : 'Show List'}
                      </span>
                    </button>
                    {showDemoShortcuts && (
                      <div className="space-y-3 pt-3 border-t border-slate-200/50">
                                               {/* Size & Type Filter Controls */}
                        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200/50">
                          {/* Size Filter Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Cylinder Size</label>
                            <select
                              value={selectedSizeFilter}
                              onChange={(e) => setSelectedSizeFilter(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs focus:ring-4 focus:ring-[#00a68a]/10 focus:border-[#00a68a] transition-all cursor-pointer focus:outline-none"
                            >
                              <option value="">All Sizes</option>
                              {uniqueSizes.map(size => {
                                const sample = activeCylinders.find(c => c.size_info?.code === size);
                                const cap = sample?.size_info?.capacity ? ` (${sample.size_info.capacity} M³)` : '';
                                return (
                                  <option key={size} value={size}>
                                    {size}{cap}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Valve Type Filter Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Valve Type</label>
                            <select
                              value={selectedTypeFilter}
                              onChange={(e) => setSelectedTypeFilter(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs focus:ring-4 focus:ring-[#00a68a]/10 focus:border-[#00a68a] transition-all cursor-pointer focus:outline-none"
                            >
                              <option value="">All Types</option>
                              {uniqueTypes.map(type => {
                                const sample = activeCylinders.find(c => c.type_info?.code === type);
                                const typeName = sample?.type_info?.name ? ` (${sample.type_info.name})` : '';
                                return (
                                  <option key={type} value={type}>
                                    {type}{typeName}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {/* Quick Batch Deplete Banner for Active Ward Cylinders */}
                        {(() => {
                          const matchingInUse = filteredActiveCylinders.filter(c => 
                            c.status === 'issued' || c.status === 'in_use' || (c.assigned_ward && c.assigned_ward.department_name)
                          );
                          if (matchingInUse.length === 0) return null;

                          return (
                            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-[dropdown-enter_180ms_var(--ease-enter)]">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                  <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-900 tracking-tight">
                                    {targetCombo ? `Ward Deployment: ${targetCombo.display_name}` : 'Active Ward Deployment'}
                                  </h4>
                                  <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                                    <strong className="text-blue-700 font-bold tabular-nums">{matchingInUse.length}</strong> cylinders in active use in ward.
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleBatchDepleteAll(matchingInUse)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                              >
                                {isSubmitting ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Mark All ({matchingInUse.length}) as Depleted</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })()}

                        {/* Paginated Grid - Grouped under headers */}
                        {paginatedPickerCylinders.length === 0 ? (
                          <div className="text-center py-12 text-[10px] text-slate-455 italic font-semibold bg-white border border-slate-150 rounded-2xl">
                            No cylinders found matching search term/filters.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {Object.keys(paginatedGroupedCylinders).map((groupKey) => (
                              <div key={groupKey} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 font-sans">
                                    {groupKey}
                                  </span>
                                  <div className="h-px bg-slate-200/60 flex-1" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {paginatedGroupedCylinders[groupKey].map((c) => {
                                    const isWardCyl = c.status === 'issued' || c.status === 'in_use' || (c.assigned_ward && c.assigned_ward.department_name);
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleCodeInput(c.serial_number)}
                                        className="inline-flex items-center px-4 py-3 bg-white hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 text-left rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 group justify-between"
                                        title={`Location: ${c.assigned_ward?.department_name || 'Store'}`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className={`w-2 h-2 rounded-full ${isWardCyl ? 'bg-blue-600' : 'bg-emerald-500'} group-hover:bg-white flex-shrink-0 animate-pulse`} />
                                          <div className="flex flex-col min-w-0">
                                            <span className="font-mono text-[11px] font-bold text-slate-800 group-hover:text-white whitespace-nowrap">
                                              {(c.serial_number || '').replace(/\s*\(\d+(?:\.\d+)?\s*(?:m3|m³)\)/gi, '')}
                                            </span>

                                            <span className="text-[9px] text-slate-500 group-hover:text-blue-100 font-semibold truncate leading-tight mt-0.5">
                                              {c.assigned_ward?.department_name ? `Ward: ${c.assigned_ward.department_name}` : 'Location: Store'}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] text-slate-500 group-hover:text-blue-100 font-extrabold border border-slate-150 group-hover:border-blue-400/30 px-2 py-0.5 rounded bg-slate-50 group-hover:bg-blue-700/40 font-mono">
                                            {c.size_info?.capacity ? `${c.size_info.capacity}M³` : '0.7M³'}
                                          </span>
                                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                            isWardCyl ? 'bg-blue-100 text-blue-800 group-hover:bg-white group-hover:text-blue-700' : 'bg-emerald-100 text-emerald-800 group-hover:bg-white group-hover:text-emerald-700'
                                          }`}>
                                            {isWardCyl ? 'Deplete' : 'Mark'}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pagination controller */}
                        {totalPickerPages > 1 && (
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/50 text-[9px] font-bold text-slate-500">
                            <span>
                              Showing {(pickerPage - 1) * pickerPageSize + 1} - {Math.min(pickerPage * pickerPageSize, totalPickerItems)} of {totalPickerItems} cylinders
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={pickerPage === 1}
                                onClick={() => setPickerPage(prev => Math.max(1, prev - 1))}
                                className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                              >
                                Prev
                              </button>
                              <button
                                type="button"
                                disabled={pickerPage === totalPickerPages}
                                onClick={() => setPickerPage(prev => Math.min(totalPickerPages, prev + 1))}
                                className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {isDbLoading && (
                  <div className="text-center py-2 text-[10px] font-semibold text-slate-400 animate-pulse">
                    Querying active Supabase cylinders...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Scanned Activity Registries - Grouped by size (col-span-5) */}
          <div className="col-span-1 md:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <label className="block text-slate-800 font-bold text-sm">
                Scanned Session Log
              </label>
              {sessionScannedCylinders.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionScannedCylinders([])}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                  <span className="bg-slate-100 border border-slate-200/80 text-slate-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    Total Scanned: {sessionScannedCylinders.length}
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic Status message toast box */}
            {statusMessage && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-semibold animate-[toast-enter_150ms_cubic-bezier(0,0,0.2,1)] ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50/70 border-rose-100 text-rose-800'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {sessionScannedCylinders.length > 0 ? (() => {
              const sizeGroups: { [key: string]: OxygenCylinderWithRelations[] } = {};
              
              sessionScannedCylinders.forEach((cyl) => {
                const sizeLabel = cyl.size_info?.capacity ? `${cyl.size_info.capacity}M³` : '0.7M³';
                if (!sizeGroups[sizeLabel]) {
                  sizeGroups[sizeLabel] = [];
                }
                sizeGroups[sizeLabel].push(cyl);
              });

              return (
                <div className="space-y-6 max-h-[580px] overflow-y-auto pr-1">
                  {Object.keys(sizeGroups).sort().map((sizeName) => (
                    <div key={sizeName} className="space-y-3">
                      
                      {/* Dynamic Size Heading Pill Layout */}
                      <div className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-4 py-2.5 rounded-xl flex justify-between items-center shadow-2xs">
                        <span className="font-extrabold text-slate-700">Cylinder Size: {sizeName}</span>
                        <span className="bg-slate-200 text-slate-800 px-3 py-0.5 rounded-lg font-extrabold text-[10px] tracking-wider font-mono">
                          {sizeGroups[sizeName].length} CYL
                        </span>
                      </div>

                      {/* HIGH DENSITY CHIPS CONTAINER */}
                      <div className="flex flex-wrap gap-2 p-4 bg-white border border-slate-200/75 rounded-2xl shadow-2xs">
                        {sizeGroups[sizeName].map((cyl) => (
                          <div 
                            key={cyl.id} 
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-rose-350 hover:bg-rose-50/15 rounded-lg text-xs font-bold text-slate-700 font-mono transition-all duration-150 group"
                          >
                            <span>{cyl.serial_number}</span>
                            <button
                              type="button"
                              onClick={() => setSessionScannedCylinders(prev => prev.filter(c => c.id !== cyl.id))}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 rounded-md hover:bg-slate-200 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              );
            })() : (
              /* Empty state message */
              <div className="h-60 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-6 text-center bg-slate-50/30">
                <Database className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No scanned cylinders yet</h4>
                <p className="text-[10px] text-slate-400 font-semibold max-w-xs mt-1">Cylinders marked empty during this session will display here categorized by size.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-200/55 bg-white flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
          >
            Close Scanner
          </button>
          
          {sessionScannedCylinders.length > 0 && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Use in Return Doc
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
