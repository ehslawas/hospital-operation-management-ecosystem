import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, ShieldAlert, Store, User as UserIcon, QrCode, Barcode, Camera } from 'lucide-react';
import type { User } from '@/types';
import { supabase, isSupabaseConfigured } from '@/services/supabase';

interface ManualIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    department_id: string;
    items: { size_code: string; quantity: number; usage_notes?: string }[];
    remarks?: string;
    requested_by?: string;
    manual_requester_name?: string;
  }) => Promise<void>;
  departments: { id: string; department_name: string }[];
  currentUser: User | null;
  users: { id: string; full_name: string; jawatan?: string }[];
}

interface ItemRow {
  size_code: string;
  quantity: number;
  usage_notes: string;
  scanned_tags?: string[];
}

const CYLINDER_SIZES = [
  { code: '101-N', label: 'BN (8.0m³)' },
  { code: '101-F', label: 'PI (1.4m³)' },
  { code: '101-E', label: 'E (0.7m³)' },
  { code: '101-D', label: 'D (0.5m³)' },
  { code: '101-HS', label: 'HS (6.4m³)' },
];

export const ManualIssueModal: React.FC<ManualIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments,
  currentUser,
  users,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isManualRequester, setIsManualRequester] = useState(false);
  const [selectedRequesterId, setSelectedRequesterId] = useState('');
  const [manualRequesterName, setManualRequesterName] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { size_code: '101-N', quantity: 1, usage_notes: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startScanner = async () => {
    setShowScannerModal(true);
    setScanError(null);
    setError(null);
    // Auto clear input so they can scan a new code
    setScannedBarcode('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setVideoStream(stream);
    } catch (err) {
      console.error('Failed to open camera:', err);
    }
  };

  const stopScanner = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setShowScannerModal(false);
  };

  const [jsQRLoaded, setJsQRLoaded] = useState(false);

  // Load jsQR library dynamically
  useEffect(() => {
    // @ts-ignore
    if (window.jsQR) {
      setJsQRLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.async = true;
    script.onload = () => setJsQRLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Sync stream to video element when stream or modal visibility changes
  useEffect(() => {
    if (showScannerModal && videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream;
    }
  }, [showScannerModal, videoStream]);

  // QR Code detection loop using jsQR
  useEffect(() => {
    let active = true;
    let scanTimer: any = null;
    let canvas: HTMLCanvasElement | null = null;

    if (showScannerModal && videoStream && jsQRLoaded) {
      canvas = document.createElement('canvas');

      const scanFrame = () => {
        if (!active || !videoRef.current || !canvas) return;
        try {
          const video = videoRef.current;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // @ts-ignore
              if (window.jsQR) {
                // @ts-ignore
                const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'dontInvert',
                });
                
                if (code && code.data) {
                  handleScanInput(code.data);
                  stopScanner();
                  return;
                }
              }
            }
          }
        } catch (err) {
          console.error('QR detection loop error:', err);
        }
        // Check next frame in 150ms
        scanTimer = setTimeout(scanFrame, 150);
      };

      // Start scanning loop after video starts playing
      scanTimer = setTimeout(scanFrame, 500);
    }

    return () => {
      active = false;
      if (scanTimer) clearTimeout(scanTimer);
    };
  }, [showScannerModal, videoStream, jsQRLoaded]);

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

  const handleScanInput = async (barcode: string) => {
    if (!barcode.trim()) return;
    setIsScanning(true);
    setScanError(null);
    setError(null);

    const code = barcode.trim().toUpperCase();

    // Block loan cylinders
    if (code.includes('LOAN') || code === '101-N' || code === '101-F' || code.startsWith('LOAN-') || code === 'OXY-2024-001') {
      setScanError('Loan cylinders (BN 8.0m³ / PI 1.4m³) do not have individual tagging. No scanning allowed.');
      setScannedBarcode('');
      return;
    }

    let sizeCode: string | null = null;
    let cylinderSerial = code;

    try {
      if (isSupabaseConfigured()) {
        const { data, error: dbErr } = await supabase
          .from('pharmacy_oxygen_cylinder_inventory')
          .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*)')
          .or(`qr_code.eq.${code},serial_number.eq.${code}`)
          .maybeSingle();

        if (data && data.size_info) {
          sizeCode = data.size_info.code;
          cylinderSerial = data.serial_number || data.qr_code || code;
        }
      }

      if (!sizeCode) {
        // Mock lookup / pattern detection
        if (code.includes('E') || code.endsWith('E') || code === 'OXY-2024-003') {
          sizeCode = '101-E';
        } else if (code.includes('D') || code.endsWith('D')) {
          sizeCode = '101-D';
        } else if (code.includes('HS') || code.endsWith('HS')) {
          sizeCode = '101-HS';
        } else if (code.startsWith('OXY-')) {
          sizeCode = '101-E';
        }
      }

      if (!sizeCode) {
        setScanError(`Cylinder not found in inventory for tag: "${code}".`);
        setScannedBarcode('');
        return;
      }

      if (sizeCode === '101-N' || sizeCode === '101-F') {
        setScanError('This is a Loan cylinder and does not have individual tagging. No scanning allowed.');
        setScannedBarcode('');
        return;
      }

      const updated = [...items];
      const existingRowIndex = updated.findIndex(item => item.size_code === sizeCode);

      if (existingRowIndex > -1) {
        const row = updated[existingRowIndex];
        const tags = row.scanned_tags || [];
        if (tags.includes(cylinderSerial)) {
          setScanError(`Cylinder "${cylinderSerial}" has already been scanned.`);
          setScannedBarcode('');
          return;
        }
        const newTags = [...tags, cylinderSerial];
        updated[existingRowIndex] = {
          ...row,
          scanned_tags: newTags,
          quantity: newTags.length,
        };
      } else {
        updated.push({
          size_code: sizeCode,
          quantity: 1,
          usage_notes: '',
          scanned_tags: [cylinderSerial],
        });
      }

      setItems(updated);
      setScannedBarcode('');
    } catch (err) {
      console.error(err);
      setScanError('Error identifying cylinder.');
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    const availableLoans = ['101-N', '101-F'].filter(code => !items.some(itm => itm.size_code === code));
    if (availableLoans.length > 0) {
      setItems([...items, { size_code: availableLoans[0], quantity: 1, usage_notes: '' }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    
    // If user changes size_code of an existing row, reset the scanned tags for that row
    if (field === 'size_code') {
      const isNewSizeLoan = value === '101-N' || value === '101-F';
      updated[index] = {
        ...updated[index],
        size_code: value,
        scanned_tags: undefined,
        quantity: isNewSizeLoan ? 1 : 0
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    const invalidItem = items.some((item) => !item.quantity || item.quantity <= 0);
    if (invalidItem) {
      setError('Quantity must be a positive number for all items. Or scan cylinders to add them.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const selectedUser = users.find(u => u.id === selectedRequesterId);
      await onSubmit({
        department_id: selectedDeptId,
        items: items.map((itm) => {
          let notes = itm.usage_notes || '';
          if (itm.scanned_tags && itm.scanned_tags.length > 0) {
            const tagsList = `[Tags: ${itm.scanned_tags.join(', ')}]`;
            notes = notes ? `${notes} ${tagsList}` : tagsList;
          }
          return {
            size_code: itm.size_code,
            quantity: Number(itm.quantity),
            usage_notes: notes || undefined,
          };
        }),
        remarks: remarks || undefined,
        requested_by: isManualRequester ? undefined : selectedRequesterId,
        manual_requester_name: isManualRequester ? manualRequesterName : selectedUser?.full_name,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-8 bg-slate-50/50">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl sm:rounded-2xl flex items-start gap-2.5 text-rose-800 text-sm animate-in fade-in zoom-in-95 duration-200">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Department Selection */}
          <div className="space-y-1.5 sm:space-y-2.5">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Requesting Department *
            </label>
            <div className="relative">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
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
          <div className="space-y-1.5 sm:space-y-2.5">
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
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-200 rounded-xl sm:rounded-2xl bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Requester...</option>
                  {(users || []).map((u) => (
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

          {/* Dynamic Item Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cylinders to Dispatch *
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={['101-N', '101-F'].every(code => items.some(itm => itm.size_code === code))}
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed focus:outline-none bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-lg sm:rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Size
              </button>
            </div>

            {/* Scanning Panel */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Scan Cylinder QR Code</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">E, D, HS Only</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Scan or enter cylinder tag (e.g., OXY-2024-003)..."
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleScanInput(scannedBarcode || 'OXY-2024-003');
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startScanner}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 min-w-[75px]"
                >
                  <Camera className="w-4 h-4" />
                  Scan
                </button>
              </div>
              {scanError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-800 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold">{scanError}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {items.map((item, index) => {
                const isLoan = item.size_code === '101-N' || item.size_code === '101-F';
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2.5 p-3.5 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl relative shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    {/* Size and Qty Row on mobile */}
                    <div className="flex gap-3 w-full">
                      {/* Size Dropdown */}
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Size Code</span>
                        <div className="relative">
                          {isLoan ? (
                            <select
                              value={item.size_code}
                              onChange={(e) => handleItemChange(index, 'size_code', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg sm:rounded-xl bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              {CYLINDER_SIZES.filter(sz => sz.code === '101-N' || sz.code === '101-F').map((sz) => {
                                const isAlreadyChosen = items.some((itm, idx) => idx !== index && itm.size_code === sz.code);
                                return (
                                  <option key={sz.code} value={sz.code} disabled={isAlreadyChosen}>
                                    {sz.label} (Loan)
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <div className="w-full px-2.5 py-1.5 border border-slate-100 bg-slate-50 rounded-lg sm:rounded-xl text-xs font-bold text-slate-500">
                              {CYLINDER_SIZES.find(sz => sz.code === item.size_code)?.label || item.size_code} (Tracked)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-20 sm:w-28 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quantity</span>
                          {!isLoan && (
                            <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">Scanned</span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={isLoan ? 1 : 0}
                          value={item.quantity}
                          onChange={(e) => isLoan && handleItemChange(index, 'quantity', Number(e.target.value))}
                          readOnly={!isLoan}
                          className={`w-full px-2.5 py-1.5 border border-slate-200 rounded-lg sm:rounded-xl bg-white text-xs font-bold focus:outline-none focus:border-indigo-500 ${
                            !isLoan ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'text-slate-800'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Scanned Tags List (for tracked cylinders) */}
                    {!isLoan && item.scanned_tags && item.scanned_tags.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scanned Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.scanned_tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold border border-indigo-100 transition-colors"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = (item.scanned_tags || []).filter(t => t !== tag);
                                  const updated = [...items];
                                  updated[index] = {
                                    ...item,
                                    scanned_tags: filtered,
                                    quantity: filtered.length
                                  };
                                  setItems(updated);
                                }}
                                className="text-indigo-400 hover:text-indigo-900 focus:outline-none text-[10px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-indigo-200"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete Button */}
                    <div className="flex justify-end pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-rose-50 transition-all focus:outline-none border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5 sm:space-y-2.5">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Remarks / Remarks
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl sm:rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] focus:outline-none"
          >
            {isSubmitting ? 'Submitting...' : 'Issue Cylinders'}
          </button>
        </div>
      </div>

      {/* QR Code Scanner Camera Modal overlay */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2 text-white">
                <Camera className="w-5 h-5 text-indigo-500" />
                <span className="font-extrabold text-sm uppercase tracking-wider">Live QR Scanner</span>
              </div>
              <button
                type="button"
                onClick={stopScanner}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder and video */}
            <div className="p-5 flex flex-col items-center gap-4">
              <div className="relative w-full aspect-square max-w-[280px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-850 flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Scanner overlay viewfinder box */}
                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                  <div className="w-full h-full border-2 border-dashed border-indigo-500 rounded-xl relative">
                    {/* Pulsing laser scan line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-rose-500/80 shadow-[0_0_8px_#f43f5e]" style={{
                      animation: 'scanLaser 2.0s linear infinite',
                    }}></div>
                    <style>{`
                      @keyframes scanLaser {
                        0% { top: 0%; }
                        50% { top: 100%; }
                        100% { top: 0%; }
                      }
                    `}</style>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-semibold text-center px-4">
                Point camera at the cylinder QR code to scan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
