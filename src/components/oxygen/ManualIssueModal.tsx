// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  X, Plus, Trash2, ShieldAlert, Store, User as UserIcon, 
  Camera, Keyboard, Database, Check, QrCode, AlertCircle, 
  RefreshCw, CheckCircle2, Volume2, VolumeX, Search 
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import type { User } from '@/types';

interface ManualIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    department_id: string;
    items: { size_code: string; quantity: number; usage_notes?: string }[];
    remarks?: string;
    requested_by?: string;
    manual_requester_name?: string;
    cylinder_ids?: string[];
  }) => Promise<void>;
  departments: { id: string; department_name: string }[];
  currentUser: User | null;
  users: { id: string; full_name: string; jawatan?: string; department_id?: string }[];
  hospitalId: string;
}

export const ManualIssueModal: React.FC<ManualIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments,
  currentUser,
  users,
  hospitalId,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isManualRequester, setIsManualRequester] = useState(false);
  const [selectedRequesterId, setSelectedRequesterId] = useState('');
  const [manualRequesterName, setManualRequesterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs: trackable (scan/select) vs loan (quantity input)
  const [cylinderTab, setCylinderTab] = useState<'trackable' | 'loan'>('trackable');

  // Trackable scanner / picker states
  const [qrInput, setQrInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [successFlash, setSuccessFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Available in-stock cylinders (status = 'available')
  const [availableCylinders, setAvailableCylinders] = useState<any[]>([]);
  const [isLoadingCylinders, setIsLoadingCylinders] = useState(false);
  const [selectedCylinders, setSelectedCylinders] = useState<any[]>([]);

  // Database Picker state
  const [showPicker, setShowPicker] = useState(true);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [pickerPage, setPickerPage] = useState(1);
  const pickerPageSize = 20;

  // Reset page when filter changes
  useEffect(() => {
    setPickerPage(1);
  }, [selectedTypeFilter, qrInput]);

  // Loan quantities: 101-F & 101-N
  const [loanQtyF, setLoanQtyF] = useState<number>(0);
  const [loanNotesF, setLoanNotesF] = useState('');
  const [loanQtyN, setLoanQtyN] = useState<number>(0);
  const [loanNotesN, setLoanNotesN] = useState('');

  // Fetch available cylinders from database on open
  useEffect(() => {
    if (isOpen && hospitalId) {
      const fetchAvailable = async () => {
        setIsLoadingCylinders(true);
        try {
          const { data, error: err } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .select(`
              *,
              type_info:pharmacy_oxygen_cylinder_types(*),
              size_info:pharmacy_oxygen_cylinder_sizes(*),
              department:departments(*)
            `)
            .eq('hospital_id', hospitalId)
            .eq('status', 'available');

          if (!err && data) {
            // Map or store standard trackable cylinders (filter out 101-N / 8m┬│ loan unit)
            const normalized = data
              .filter((c: any) => {
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
                  size_code: sizeCode
                };
              });
            setAvailableCylinders(normalized);

            // Set default type filter to the first type
            const uniqueTypes = Array.from(
              new Set(normalized.map((c: any) => c.type_name_display))
            ).filter(Boolean).sort();
            if (uniqueTypes.length > 0) {
              setSelectedTypeFilter(uniqueTypes[0] as string);
            }
          }
        } catch (e) {
          console.error("Error loading available cylinders:", e);
        } finally {
          setIsLoadingCylinders(false);
        }
      };
      fetchAvailable();
    }
  }, [isOpen, hospitalId]);

  // Handle camera stream toggling
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive]);

  // Audio success/error sound indicator
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
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, 120);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, 250);
      }
    } catch (e) {
      console.warn("Audio Context beep unsupported:", e);
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
              handleCylinderSelectByCode(code.data);
            }
          }
        }
      }, 500);
    }
    return () => {
      if (detectorInterval) clearInterval(detectorInterval);
    };
  }, [cameraActive, useRealCamera, stream]);

  // Code scanner or input submission logic
  const handleCylinderSelectByCode = (code: string) => {
    const cleaned = code.trim();
    if (!cleaned) return;

    // Check if loan cylinder is scanned
    const upper = cleaned.toUpperCase();
    if (upper.startsWith('101-N') || upper.startsWith('101-F') || upper.startsWith('101N') || upper.startsWith('101F')) {
      playBeep('error');
      setError(`"${cleaned}" is a loan cylinder and should be added using the "Loan Cylinders (Bulk)" tab instead.`);
      return;
    }

    // Normalise the scanned code: strip common QR prefixes like "O2-" or "O2 "
    // so that a QR value of "O2-P101-F0130" still matches a serial of "P101-F0130"
    const normaliseCode = (raw: string) =>
      raw.trim().replace(/^O2[-\s]*/i, '').trim().toLowerCase();

    const cleanedNorm = normaliseCode(cleaned);

    // Find cylinder in inventory – try exact match first, then normalised prefix-stripped match
    const match = availableCylinders.find(c => {
      const serial = (c.serial_number || '').toLowerCase();
      const qr     = (c.qr_code     || '').toLowerCase();
      const serialNorm = normaliseCode(c.serial_number || '');
      const qrNorm     = normaliseCode(c.qr_code     || '');

      return (
        serial === cleaned.toLowerCase() ||
        qr     === cleaned.toLowerCase() ||
        serialNorm === cleanedNorm       ||
        qrNorm     === cleanedNorm
      );
    });

    if (!match) {
      playBeep('error');
      setError(`Cylinder "${cleaned}" not found in available store inventory.`);
      return;
    }

    // Toggle select
    toggleCylinderSelect(match);
    setQrInput('');
  };

  const toggleCylinderSelect = (cyl: any) => {
    const isSelected = selectedCylinders.some(c => c.id === cyl.id);
    if (isSelected) {
      setSelectedCylinders(selectedCylinders.filter(c => c.id !== cyl.id));
    } else {
      setSelectedCylinders([...selectedCylinders, cyl]);
      playBeep('success');
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 500);
    }
    setError(null);
  };

  // Filter available cylinders list by type/size and manual query
  const filteredAvailable = availableCylinders.filter(c => {
    if (selectedTypeFilter && c.type_name_display !== selectedTypeFilter) return false;
    if (!qrInput) return true;
    const query = qrInput.toLowerCase();
    return (
      (c.serial_number || '').toLowerCase().includes(query) || 
      (c.qr_code || '').toLowerCase().includes(query) || 
      c.type_name_display.toLowerCase().includes(query)
    );
  });

  const availableTypes = Array.from(
    new Set(availableCylinders.map((c) => c.type_name_display))
  ).filter(Boolean).sort();

  // Pagination calculations
  const totalPickerItems = filteredAvailable.length;
  const totalPickerPages = Math.ceil(totalPickerItems / pickerPageSize);
  const paginatedCylinders = filteredAvailable.slice(
    (pickerPage - 1) * pickerPageSize,
    pickerPage * pickerPageSize
  );

  // Grouped by size and type
  const groupedCylinders = paginatedCylinders.reduce((acc: any, cyl: any) => {
    const key = cyl.type_name_display || 'Standard';
    if (!acc[key]) acc[key] = [];
    acc[key].push(cyl);
    return acc;
  }, {});

  // System users filter based on selected department
  const filteredUsers = selectedDeptId
    ? users.filter((u) => u.department_id === selectedDeptId)
    : [];

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) {
      setError('Please select a department.');
      return;
    }

    if (!isManualRequester && !selectedRequesterId) {
      setError('Please select a requesting user.');
      return;
    }

    if (isManualRequester && !manualRequesterName.trim()) {
      setError('Please enter the requester name manually.');
      return;
    }

    // Build the request items mapping both selected trackables and bulk loan cylinders
    const dispatchItems: { size_code: string; quantity: number; usage_notes?: string }[] = [];

    // 1. Group trackable cylinders by size code
    const trackableGroups: { [size: string]: number } = {};
    selectedCylinders.forEach(c => {
      const code = c.size_code || '101-N';
      trackableGroups[code] = (trackableGroups[code] || 0) + 1;
    });

    Object.keys(trackableGroups).forEach(code => {
      dispatchItems.push({
        size_code: code,
        quantity: trackableGroups[code],
        usage_notes: 'Trackable inventory cylinder'
      });
    });

    // 2. Add loan items if any
    if (loanQtyF > 0) {
      dispatchItems.push({
        size_code: '101-F',
        quantity: loanQtyF,
        usage_notes: loanNotesF || 'Loan cylinder (1.4m┬│)'
      });
    }

    if (loanQtyN > 0) {
      dispatchItems.push({
        size_code: '101-N',
        quantity: loanQtyN,
        usage_notes: loanNotesN || 'Loan cylinder (8.0m┬│)'
      });
    }

    if (dispatchItems.length === 0) {
      setError('Please scan trackable cylinders or enter loan cylinder quantities.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const selectedUser = users.find(u => u.id === selectedRequesterId);
      await onSubmit({
        department_id: selectedDeptId,
        items: dispatchItems,
        remarks: remarks || undefined,
        requested_by: isManualRequester ? undefined : selectedRequesterId,
        manual_requester_name: isManualRequester ? manualRequesterName : selectedUser?.full_name,
        cylinder_ids: selectedCylinders.map(c => c.id)
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-in {
          animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
      <div 
        className="bg-slate-50 w-full max-w-2xl h-full rounded-l-3xl shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-200/80 flex items-center justify-between bg-white shadow-sm relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Borang Pengeluaran Silinder Manual</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Record a manual cylinder issue to a department directly.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all duration-200 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-6 bg-slate-50/50">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl sm:rounded-2xl flex items-start gap-2.5 text-rose-800 text-sm animate-in fade-in zoom-in-95 duration-200">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Department Selection */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Requesting Department *
            </label>
            <div className="relative">
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedRequesterId('');
                }}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold appearance-none cursor-pointer"
                required
              >
                <option value="">Select Department...</option>
                {departments
                  .filter(dept => {
                    const name = dept.department_name.toLowerCase();
                    const keywords = [
                      'paediatric', 'paed',
                      'maternity', 'bersalin',
                      'emergency', 'trauma', 'kecemasan',
                      'general ward', 'wad am',
                      'haemodialysis', 'hemodialysis', 'hemodialisis', 'dialisis',
                      'radiology', 'radiografi', 'radiography', 'x-ray',
                      'operation theater', 'operation theatre', 'dewan bedah', 'ot'
                    ];
                    return keywords.some(keyword => name.includes(keyword));
                  })
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
              </select>
              <div className="absolute right-3.5 top-3 sm:top-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Requester Selection */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Requested By (Requester) *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsManualRequester(!isManualRequester);
                  setSelectedRequesterId('');
                  setManualRequesterName('');
                  setError(null);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none transition-colors"
              >
                {isManualRequester ? 'Choose from system users' : 'Enter name manually'}
              </button>
            </div>

            {isManualRequester ? (
              <input
                type="text"
                placeholder="Enter requester name manually..."
                value={manualRequesterName}
                onChange={(e) => setManualRequesterName(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                required
              />
            ) : (
              <div className="relative">
                <select
                  value={selectedRequesterId}
                  onChange={(e) => setSelectedRequesterId(e.target.value)}
                  disabled={!selectedDeptId}
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {selectedDeptId ? 'Select Requester...' : 'Please select department first...'}
                  </option>
                  {selectedDeptId && (filteredUsers || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} {u.jawatan ? `(${u.jawatan})` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-3 sm:top-3.5 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            )}
          </div>

          {/* Tab Selector: Trackable vs Loan */}
          <div className="space-y-3.5">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cylinders to Dispatch *
            </label>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200 shadow-inner gap-2 bg-gradient-to-b from-slate-100 to-slate-200/60">
              <button
                type="button"
                onClick={() => setCylinderTab('trackable')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-extrabold rounded-xl transition-all cursor-pointer focus:outline-none ${
                  cylinderTab === 'trackable' 
                    ? 'bg-white text-indigo-700 shadow-md border border-indigo-250/70 ring-2 ring-indigo-500/5' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <QrCode className={`w-4 h-4 shrink-0 transition-transform ${cylinderTab === 'trackable' ? 'scale-110 text-indigo-600' : 'text-slate-400'}`} />
                <span>Trackable Cylinders (Scan & Pick)</span>
              </button>
              <button
                type="button"
                onClick={() => { setCylinderTab('loan'); stopCamera(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-extrabold rounded-xl transition-all cursor-pointer focus:outline-none ${
                  cylinderTab === 'loan' 
                    ? 'bg-white text-indigo-700 shadow-md border border-indigo-250/70 ring-2 ring-indigo-500/5' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Store className={`w-4 h-4 shrink-0 transition-transform ${cylinderTab === 'loan' ? 'scale-110 text-indigo-600' : 'text-slate-400'}`} />
                <span>Loan Cylinders (Bulk/Manual)</span>
              </button>
            </div>

            {/* Cylinder Content A: Trackables (QR + DB Picker) */}
            {cylinderTab === 'trackable' && (
              <div className="space-y-4">
                
                {/* Embedded Camera / Manual Scan UI */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-inner text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Camera Console</span>
                      <span className="text-[9px] text-slate-500 font-mono">QR & Barcode Reader</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title={soundEnabled ? 'Mute' : 'Unmute'}
                      >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCameraActive(!cameraActive)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold font-mono transition-all cursor-pointer ${
                          cameraActive 
                            ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {cameraActive ? 'SHUTDOWN LENS' : 'ACTIVATE CAMERA'}
                      </button>
                    </div>
                  </div>

                  {cameraActive && (
                    <div className={`relative aspect-video rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col items-center justify-center shadow-inner transition-all duration-300 ${successFlash ? 'ring-8 ring-emerald-500/30' : ''}`}>
                      {successFlash && (
                        <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-xs flex items-center justify-center z-25">
                          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                        </div>
                      )}
                      {useRealCamera ? (
                        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-4">
                          <QrCode className="w-6 h-6 text-indigo-400 animate-pulse mb-1.5" />
                          <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider">LENS STREAM ACTIVE</span>
                        </div>
                      )}
                      <div className="absolute inset-x-8 top-1/2 h-0.5 bg-indigo-500 shadow-[0_0_8px_#4f46e5] animate-[pulse_1.2s_infinite] z-10" />
                      <div className="absolute inset-6 border border-slate-500/15 rounded-lg pointer-events-none z-10">
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-indigo-400" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-indigo-400" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-indigo-400" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-indigo-400" />
                      </div>
                    </div>
                  )}

                  {/* Manual search query line inside Console */}
                  <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-1.5 flex gap-2 shadow-inner">
                    <Search className="w-4 h-4 text-slate-400 shrink-0 mt-2 ml-1" />
                    <input
                      type="text"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="Scan QR or search serial key..."
                      className="flex-1 px-1.5 py-1.5 bg-transparent text-xs font-semibold text-white placeholder-slate-500 focus:outline-none border-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCylinderSelectByCode(qrInput)}
                      disabled={!qrInput.trim()}
                      className="px-4 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      Pick
                    </button>
                  </div>
                </div>

                {/* Collapsible Supabase cylinder picker */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 space-y-3 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Select Cylinder from Database (Available in Store)</span>
                    </div>
                    <span className="text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg font-bold border border-indigo-100/50">
                      {showPicker ? 'Hide List' : 'Show List'}
                    </span>
                  </button>

                  {showPicker && (
                    <div className="space-y-4 pt-3 border-t border-slate-200/50">
                      
                      {/* Size & Type Filter Tabs */}
                      <div className="flex flex-wrap gap-1.5 pb-2.5 border-b border-slate-100">
                        {availableTypes.map((tName) => {
                          const count = availableCylinders.filter(c => c.type_name_display === tName).length;
                          return (
                            <button
                              key={tName}
                              type="button"
                              onClick={() => setSelectedTypeFilter(tName)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer focus:outline-none ${
                                selectedTypeFilter === tName
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-250 text-slate-650'
                              }`}
                            >
                              {tName} ({count})
                            </button>
                          );
                        })}
                      </div>

                      {isLoadingCylinders ? (
                        <div className="text-center py-8 text-[11px] font-semibold text-slate-400 animate-pulse">
                          Fetching database stock...
                        </div>
                      ) : Object.keys(groupedCylinders).length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-slate-400 italic">
                          No cylinders match search filter.
                        </div>
                      ) : (
                        <div className="space-y-3.5 pr-1">
                          {Object.keys(groupedCylinders).map((typeName) => (
                            <div key={typeName} className="space-y-1.5">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block bg-slate-100/60 px-2 py-1 rounded">
                                {typeName}
                              </span>
                              <div className="grid grid-cols-4 gap-2">
                                {groupedCylinders[typeName].map((cyl: any) => {
                                  const isSelected = selectedCylinders.some(sc => sc.id === cyl.id);
                                  return (
                                    <button
                                      key={cyl.id}
                                      type="button"
                                      onClick={() => toggleCylinderSelect(cyl)}
                                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer shadow-2xs w-full text-xs ${
                                        isSelected 
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' 
                                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                                      }`}
                                    >
                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                      }`}>
                                        {isSelected && <Check className="w-2 h-2" />}
                                      </div>
                                      <span className="font-mono text-[9px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                        {(cyl.serial_number || cyl.qr_code || '').replace(/\s*\(\d+(?:\.\d+)?\s*(?:m3|m┬│)\)/gi, '')}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pagination Controls */}
                      {totalPickerPages > 1 && (
                        <div className="flex items-center justify-between pt-2.5 text-[10px] font-bold text-slate-500 border-t border-slate-100">
                          <span>
                            Showing {(pickerPage - 1) * pickerPageSize + 1} - {Math.min(pickerPage * pickerPageSize, totalPickerItems)} of {totalPickerItems} cylinders
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={pickerPage === 1}
                              onClick={() => setPickerPage(prev => Math.max(1, prev - 1))}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors font-bold text-[10px] focus:outline-none"
                            >
                              Prev
                            </button>
                            <button
                              type="button"
                              disabled={pickerPage === totalPickerPages}
                              onClick={() => setPickerPage(prev => Math.min(totalPickerPages, prev + 1))}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors font-bold text-[10px] focus:outline-none"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected log view */}
                {selectedCylinders.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                      <span>Cylinders Added to Dispatch List:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCylinders([])}
                        className="text-[10px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer"
                      >
                        Reset List
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-inner">
                      {selectedCylinders.map(cyl => (
                        <div key={cyl.id} className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-950 font-mono">
                          <span>{cyl.serial_number}</span>
                          <button
                            type="button"
                            onClick={() => toggleCylinderSelect(cyl)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 rounded-md hover:bg-indigo-100 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cylinder Content B: Loan cylinders */}
            {cylinderTab === 'loan' && (
              <div className="space-y-4 bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs">
                <div className="flex flex-col gap-0.5 mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan / Temporary Cylinders</span>
                  <span className="text-[9px] text-slate-450 font-semibold">Bulk entries not requiring tracking numbers</span>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Loan cylinder 101-F */}
                  <div className="p-3.5 bg-slate-50/50 border border-slate-200/80 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">101-F (1.4m┬│)</span>
                        <span className="text-[9px] text-slate-400 block font-semibold">Medium Size Loan Cylinder</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLoanQtyF(Math.max(0, loanQtyF - 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 shadow-2xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={loanQtyF}
                          onChange={(e) => setLoanQtyF(Math.max(0, Number(e.target.value)))}
                          className="w-12 py-1 border border-slate-250 bg-white rounded-lg text-center text-xs font-black text-slate-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setLoanQtyF(loanQtyF + 1)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Usage notes for 101-F loan..."
                      value={loanNotesF}
                      onChange={(e) => setLoanNotesF(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Loan cylinder 101-N */}
                  <div className="p-3.5 bg-slate-50/50 border border-slate-200/80 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">101-N (8.0m┬│)</span>
                        <span className="text-[9px] text-slate-400 block font-semibold">Large Size Loan Cylinder</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLoanQtyN(Math.max(0, loanQtyN - 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 shadow-2xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={loanQtyN}
                          onChange={(e) => setLoanQtyN(Math.max(0, Number(e.target.value)))}
                          className="w-12 py-1 border border-slate-250 bg-white rounded-lg text-center text-xs font-black text-slate-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setLoanQtyN(loanQtyN + 1)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Usage notes for 101-N loan..."
                      value={loanNotesN}
                      onChange={(e) => setLoanNotesN(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Remarks / Justification
            </label>
            <textarea
              placeholder="Enter additional remarks or justification..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Current User Info Card */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs text-slate-600 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl">
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recorded by Officer (Issuer)</span>
                <span className="font-extrabold text-slate-800 text-xs block mt-0.5">{currentUser?.full_name || 'Loading user...'}</span>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] uppercase">
              {currentUser?.jawatan || 'Officer'}
            </span>
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <div className="px-5 py-4 sm:px-8 sm:py-5 border-t border-slate-200/80 flex justify-end gap-3 bg-white relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl sm:rounded-2xl text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitForm}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl sm:rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] focus:outline-none"
          >
            {isSubmitting ? 'Submitting...' : 'Issue Cylinders'}
          </button>
        </div>
      </div>
    </div>
  );
};
