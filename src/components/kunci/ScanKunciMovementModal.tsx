// src/components/kunci/ScanKunciMovementModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  QrCode, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Camera, 
  Keyboard, 
  Check, 
  Volume2, 
  VolumeX, 
  Search, 
  Database,
  Lock,
  UserCheck,
  Building,
  Clock,
  Upload
} from 'lucide-react';
import { 
  getKunciByKod, 
  checkoutKunci, 
  getActiveLogByKunciId, 
  returnKunci 
} from '@/modules/mykunci/services/kunciService';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { Modal, Button, Badge, FileUpload } from '@/components/ui';
import type { KunciDaftar, KunciLog } from '@/shared/types/mykunci';

interface ScanKunciMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MOCK_BORROWERS = [
  { id: 'user-1', full_name: 'Muhammad Farhan bin Razali', jawatan: 'Pegawai Farmasi U41' },
  { id: 'user-2', full_name: 'Khairul Amin bin Zulkifli', jawatan: 'Penolong Pegawai Farmasi U32' },
  { id: 'user-3', full_name: 'Sarah binti Ahmad', jawatan: 'Penjaga Stor Farmasi U29' },
  { id: 'user-4', full_name: 'Dr. Jason Ling', jawatan: 'Pegawai Perubatan UD44' },
  { id: 'user-5', full_name: 'Noraini binti Hassan', jawatan: 'Pembantu Tadbir N19' }
];

export const ScanKunciMovementModal: React.FC<ScanKunciMovementModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const loggedUser = useAuthStore((state) => state.user);
  const toast = useToast();
  
  // Navigation tabs for the 2 modes
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [qrInput, setQrInput] = useState('');
  
  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [successFlash, setSuccessFlash] = useState(false);
  
  // Camera settings
  const [cameraActive, setCameraActive] = useState(false);
  const [useRealCamera, setUseRealCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Process states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Key state once scanned
  const [scannedKey, setScannedKey] = useState<KunciDaftar | null>(null);
  const [activeLog, setActiveLog] = useState<KunciLog | null>(null);
  
  // Checkout Form States
  const [borrowerId, setBorrowerId] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [customHours, setCustomHours] = useState('');
  const [witnessId, setWitnessId] = useState('');
  const [purpose, setPurpose] = useState('');
  
  // Return Form States
  const [keyCondition, setKeyCondition] = useState<'good' | 'damaged'>('good');
  const [lockCondition, setLockCondition] = useState<'good' | 'damaged' | 'loose'>('good');
  const [remarks, setRemarks] = useState('');
  const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
  const [returnDateTime, setReturnDateTime] = useState('');

  // Setup default values when loggedUser is loaded
  useEffect(() => {
    if (loggedUser?.id) {
      setBorrowerId(loggedUser.id);
    }
  }, [loggedUser, isOpen]);

  // Handle camera toggles
  useEffect(() => {
    if (cameraActive && activeTab === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive, activeTab, isOpen]);

  // Reset form when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setScannedKey(null);
      setActiveLog(null);
      setQrInput('');
      setStatusMessage(null);
      stopCamera();
      setCameraActive(false);
    } else {
      // Default return datetime to local time (yyyy-MM-ddThh:mm)
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setReturnDateTime(localIso);
    }
  }, [isOpen]);

  const playBeep = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === 'success') {
        const playTone = (freq: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.55, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        playTone(880, audioCtx.currentTime, 0.12);
        playTone(1320, audioCtx.currentTime + 0.13, 0.18);
        setTimeout(() => audioCtx.close(), 400);
      } else {
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

  // Canvas-based QR Code Detection using jsQR
  const lastScannedRef = useRef<{ code: string; ts: number } | null>(null);
  const SCAN_COOLDOWN_MS = 3000;

  useEffect(() => {
    let animFrameId: number;
    let running = false;

    if (cameraActive && useRealCamera && stream && videoRef.current && isOpen && !scannedKey) {
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
            const scale = Math.min(1, 640 / video.videoWidth);
            canvas.width = Math.floor(video.videoWidth * scale);
            canvas.height = Math.floor(video.videoHeight * scale);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const detected = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (detected && detected.data) {
              const now = Date.now();
              const last = lastScannedRef.current;
              if (!last || last.code !== detected.data || now - last.ts > SCAN_COOLDOWN_MS) {
                lastScannedRef.current = { code: detected.data, ts: now };
                handleCodeInput(detected.data);
              }
            }
          }
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
  }, [cameraActive, useRealCamera, stream, scannedKey, isOpen]);

  // Unified lookup processing
  const handleCodeInput = async (inputStr: string) => {
    if (isSubmitting) return;

    let cleanedInput = inputStr.trim().toUpperCase();
    if (!cleanedInput) return;

    // Extract last segment if barcode represents an HTTP URL
    if (cleanedInput.startsWith('HTTP://') || cleanedInput.startsWith('HTTPS://')) {
      try {
        const url = new URL(cleanedInput);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          cleanedInput = pathSegments[pathSegments.length - 1].toUpperCase();
        }
      } catch (err) {
        console.error("Failed to parse scanned URL:", err);
      }
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await getKunciByKod(cleanedInput);
      if (res.error || !res.data) {
        playBeep('error');
        setStatusMessage({ type: 'error', text: `Kunci "${cleanedInput}" tidak dijumpai dalam daftar induk.` });
        setScannedKey(null);
        setActiveLog(null);
      } else {
        const keyData = res.data;
        playBeep('success');
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 500);

        setScannedKey(keyData);
        
        // If the key is borrowed, fetch the active log for returns
        if (keyData.status === 'borrowed') {
          const logRes = await getActiveLogByKunciId(keyData.id);
          if (logRes.data) {
            setActiveLog(logRes.data);
          } else {
            setStatusMessage({ type: 'error', text: 'Kunci bertaraf dipinjam tetapi tiada rekod pinjaman aktif ditemui!' });
          }
        } else {
          setActiveLog(null);
        }
      }
    } catch (err) {
      console.error(err);
      playBeep('error');
      setStatusMessage({ type: 'error', text: 'Ralat menghubungkan ke database.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Checkout Transaction
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedKey || !borrowerId) return;

    // Witness mandate verification for high-security keys
    if (scannedKey.tahap_kawalan === 'high' && !witnessId) {
      toast.error('Saksi Diperlukan', 'Kunci DDA memerlukan witness/saksi kedua mengikut arahan Sarawak KKM!');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      let hours = 1;
      if (durationHours === 'until_done') {
        hours = 24;
      } else if (durationHours === 'other') {
        hours = parseInt(customHours) || 1;
      } else {
        hours = parseInt(durationHours) || 1;
      }
      const eta = new Date(now.getTime() + hours * 3600 * 1000);

      const checkoutPayload = {
        kunci_id: scannedKey.id,
        peminjam_id: borrowerId,
        pegawai_penyerah_id: loggedUser?.id || 'user-1',
        pegawai_saksi_id: witnessId || undefined,
        tujuan: purpose,
        tarikh_masa_ambil: now.toISOString(),
        jangka_masa_pulang: eta.toISOString(),
        is_overdue: false,
        hospital_id: loggedUser?.hospital_id || 'hosp-1'
      };

      const res = await checkoutKunci(checkoutPayload);
      if (res.error) throw new Error(res.error);

      toast.success('Peminjaman Direkod', `Kunci [${scannedKey.kod_kunci}] berjaya dipinjam!`);
      
      // Reset forms
      setScannedKey(null);
      setWitnessId('');
      setPurpose('');
      setDurationHours('1');
      setCustomHours('');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Ralat Peminjaman', err.message || 'Gagal menyimpan transaksi checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Return Transaction
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedKey || !activeLog) return;
    if (!returnPhoto) {
      toast.error('Semakan Foto', 'Sila tangkap atau muat naik foto kunci untuk bukti pemulangan!');
      return;
    }

    setIsSubmitting(true);

    try {
      const returnPayload = {
        tarikh_masa_pulang: new Date(returnDateTime).toISOString(),
        pegawai_penerima_id: loggedUser?.id || 'user-1',
        keadaan_kunci: keyCondition,
        keadaan_mangga: lockCondition,
        catatan_penggunaan: remarks
      };

      const res = await returnKunci(activeLog.id, returnPayload);
      if (res.error) throw new Error(res.error);

      toast.success('Pemulangan Direkod', `Kunci [${scannedKey.kod_kunci}] berjaya dipulangkan!`);
      
      // Reset forms
      setScannedKey(null);
      setActiveLog(null);
      setRemarks('');
      setReturnPhoto(null);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Ralat Pemulangan', err.message || 'Gagal menyimpan transaksi pulangan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sistem Imbasan QR Kunci (Movement Tracker)"
      size={scannedKey ? "2xl" : "lg"}
    >
      <div className="space-y-6 pt-2">
        
        {/* Toggle Mode Tab (Camera Scanner vs Manual Key-In) */}
        {!scannedKey && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40">
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
              Kamera QR Feed
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
              Siri Manual
            </button>
          </div>
        )}

        {/* Status Messages */}
        {statusMessage && !scannedKey && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border text-xs font-semibold ${
            statusMessage.type === 'error' 
              ? 'bg-rose-50 border-rose-100 text-rose-800' 
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>{statusMessage.text}</div>
          </div>
        )}

        {/* SCANNER VIEWPORT */}
        {!scannedKey && activeTab === 'camera' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-inner text-white">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Camera Viewport</span>
                <span className="text-[9px] text-slate-500 font-mono">Status: {cameraActive ? 'Online' : 'Offline'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    soundEnabled 
                      ? 'bg-slate-800 border-slate-700 text-amber-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold font-mono transition-all cursor-pointer ${
                    cameraActive 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  {cameraActive ? 'TUTUP LENS' : 'BUKA KAMERA'}
                </button>
              </div>
            </div>

            {cameraActive ? (
              <div className={`relative aspect-video rounded-2xl overflow-hidden border border-slate-700 bg-slate-955 flex flex-col items-center justify-center transition-all duration-300 bg-slate-950 ${successFlash ? 'ring-8 ring-emerald-500/30' : ''}`}>
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
                    <QrCode className="w-8 h-8 text-amber-400 animate-pulse mb-2" />
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider">HALAKAN LENSA KE LABEL QR KUNCI</span>
                  </div>
                )}

                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-[pulse_1.2s_infinite] z-10" />
                <div className="absolute inset-6 border border-slate-500/15 rounded-lg pointer-events-none z-10">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400" />
                </div>
              </div>
            ) : (
              <div className="h-44 border border-dashed border-slate-700/60 rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-slate-950/20 text-slate-500">
                <Camera className="w-8 h-8 mb-2 text-slate-500 opacity-40" />
                <span className="text-[10px] font-bold font-mono tracking-wide uppercase">Konsol Kamera Offline</span>
                <span className="text-[9px] text-slate-400 mt-1">Aktifkan butang BUKA KAMERA di atas untuk memulakan pengimbas.</span>
              </div>
            )}
          </div>
        )}

        {/* MANUAL KEY-IN */}
        {!scannedKey && activeTab === 'manual' && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Code Search</span>
              <span className="text-[9px] text-slate-400 font-semibold">Please type key code (e.g.: KUNCI-PH-LOG-01)</span>
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleCodeInput(qrInput); }} 
              className="flex gap-2"
            >
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Type key code..."
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={isSubmitting || !qrInput.trim()}
                className="px-5 py-2.5 bg-slate-850 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-xs"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* TRANSACTIONS FLOW: Checkout (Available) vs Return (Borrowed) */}
        {scannedKey && (
          <div className="space-y-6">
            
            {/* Scanned Key Summary Card */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KUNCI DIIMBAS</div>
                <div className="text-base font-black text-slate-850">{scannedKey.nama_kunci}</div>
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                  <Badge className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5">
                    {scannedKey.kod_kunci}
                  </Badge>
                  <span>•</span>
                  <span>Lokasi: {scannedKey.lokasi_fizikal}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                {scannedKey.status === 'borrowed' ? (
                  <Badge className="border-amber-200 text-amber-700 bg-amber-50 font-bold uppercase text-[9px] animate-pulse">
                    Dipinjam (OUT)
                  </Badge>
                ) : (
                  <Badge className="border-emerald-200 text-emerald-700 bg-emerald-50 font-bold uppercase text-[9px]">
                    Tersedia (IN)
                  </Badge>
                )}
                
                {scannedKey.tahap_kawalan === 'high' && (
                  <Badge className="border-rose-200 text-rose-700 bg-rose-50 font-bold text-[9px] flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> DDA Double-Custody
                  </Badge>
                )}
              </div>
            </div>

            {/* FLOW A: CHECKOUT FORM */}
            {scannedKey.status !== 'borrowed' && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Peminjam Kunci *
                    </label>
                    <select
                      value={borrowerId}
                      onChange={(e) => setBorrowerId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800 font-medium"
                    >
                      {MOCK_BORROWERS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.full_name} ({b.jawatan})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Tempoh Pinjaman *
                    </label>
                    <select
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800 font-medium"
                    >
                      <option value="1">1 Jam (1 Hour)</option>
                      <option value="2">2 Jam (2 Hours)</option>
                      <option value="until_done">Sehingga Selesai (Until Done)</option>
                      <option value="other">Lain-lain (Others)</option>
                    </select>
                    {durationHours === 'other' && (
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Bilangan jam..."
                        value={customHours}
                        onChange={(e) => setCustomHours(e.target.value)}
                        className="w-full mt-2 rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      />
                    )}
                  </div>
                </div>

                {/* Saksi required for high-security DDA keys */}
                {scannedKey.tahap_kawalan === 'high' && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      Saksi / Pegawai Kedua (Co-Signer Mandatori) *
                    </label>
                    <select
                      value={witnessId}
                      onChange={(e) => setWitnessId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-rose-200 p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-800 font-semibold"
                    >
                      <option value="">-- Pilih Saksi Saksi Kedua --</option>
                      {MOCK_BORROWERS.map((b) => (
                        b.id !== borrowerId && (
                          <option key={b.id} value={b.id}>
                            {b.full_name} ({b.jawatan})
                          </option>
                        )
                      ))}
                    </select>
                    <p className="text-[10px] text-rose-600 leading-relaxed font-semibold">
                      Polisi Sarawak Dangerous Drugs Act (DDA) mewajibkan witness bertandatangan bagi pengeluaran kunci peti kawalan dadah.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                    Tujuan Peminjaman Kunci
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan tujuan (cth: Pengeluaran Morfin Wad Kanak-Kanak / Pendaftaran Stok)..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setScannedKey(null)}
                    className="border-slate-200 text-slate-500 hover:bg-slate-50 px-4 py-2 border rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-soft"
                  >
                    {isSubmitting ? 'Merekod...' : 'Sahkan Pinjaman (Check-Out)'}
                  </Button>
                </div>
              </form>
            )}

            {/* FLOW B: RETURN FORM */}
            {scannedKey.status === 'borrowed' && activeLog && (
              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div className="bg-slate-100/60 rounded-xl p-3 border border-slate-200/30 text-xs space-y-1 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Peminjam: <strong className="text-slate-800">{activeLog.peminjam?.full_name || MOCK_BORROWERS.find(b => b.id === activeLog.peminjam_id)?.full_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pinjam Sejak: <strong className="text-slate-850">{new Date(activeLog.tarikh_masa_ambil).toLocaleString('ms-MY')}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Keadaan Fizikal Anak Kunci *
                    </label>
                    <select
                      value={keyCondition}
                      onChange={(e) => setKeyCondition(e.target.value as any)}
                      required
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800 font-medium"
                    >
                      <option value="good">Baik / Tiada Keretakan (Good)</option>
                      <option value="damaged">Rosak / Bengkok (Damaged)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Keadaan Mangga / Padlock Pintu *
                    </label>
                    <select
                      value={lockCondition}
                      onChange={(e) => setLockCondition(e.target.value as any)}
                      required
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800 font-medium"
                    >
                      <option value="good">Kukuh / Berfungsi Baik</option>
                      <option value="loose">Longgar / Longgatan Skru</option>
                      <option value="damaged">Rosak / Engsel Rosak</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Tarikh & Masa Pulang *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={returnDateTime}
                      onChange={(e) => setReturnDateTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Catatan Pemulangan & Kejadian
                    </label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Masukkan catatan (jika ada)..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <FileUpload
                    label="Snap / Muat Naik Foto Kunci (Wajib) *"
                    accept="image/*"
                    required
                    value={returnPhoto}
                    onChange={(file) => setReturnPhoto(file)}
                    helperText="Ambil gambar anak kunci fizikal yang dipulangkan sebagai bukti simpanan"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setScannedKey(null);
                      setActiveLog(null);
                      setReturnPhoto(null);
                    }}
                    className="border-slate-200 text-slate-500 hover:bg-slate-50 px-4 py-2 border rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !returnPhoto}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Merekod...' : 'Sahkan Pulangan (Check-In)'}
                  </Button>
                </div>
              </form>
            )}

          </div>
        )}

      </div>
    </Modal>
  );
};
