// src/modules/mycrossborder/pages/CrossborderDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Send, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Stamp, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { 
  getCrossborderTransferById, 
  submitCrossborderTransfer,
  approveCrossborderTransfer,
  completeCrossborderTransfer,
  cancelCrossborderTransfer,
  deleteCrossborderTransfer
} from '../services/crossborderService';
import { 
  generateTransferFormPDF,
  generatePermissionLetterPDF
} from '../services/crossborderPdfService';
import type { CrossborderTransfer } from '@/shared/types/mycrossborder';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const CrossborderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [transfer, setTransfer] = useState<CrossborderTransfer | null>(null);
  const [loading, setLoading] = useState(true);

  // Approval inputs
  const [directorName, setDirectorName] = useState('DR DOUGLAS CHU KIN SOON (Pengarah Hospital Lawas)');
  const [letterRef, setLetterRef] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const loadTransfer = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getCrossborderTransferById(id);
      if (res.error) throw new Error(res.error);
      setTransfer(res.data);
      if (res.data) {
        // Set default letter ref if already generated or empty
        const year = new Date(res.data.tarikh_perjalanan).getFullYear() || new Date().getFullYear();
        setLetterRef(res.data.surat_kebenaran_ref || `TF/HL/MW ( ${Math.floor(Math.random() * 50) + 1} ) ${year}`);
      }
    } catch (err: any) {
      toast.error('Ralat', err.message || 'Gagal memuatkan butiran permohonan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfer();
  }, [id]);

  const handleSubmit = async () => {
    if (!transfer) return;
    try {
      const res = await submitCrossborderTransfer(transfer.id);
      if (res.error) throw new Error(res.error);
      toast.success('Hantar Permohonan', 'Permohonan telah berjaya dihantar untuk kelulusan.');
      loadTransfer();
    } catch (err: any) {
      toast.error('Ralat', err.message || 'Gagal menghantar permohonan');
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer || !directorName || !letterRef) return;
    try {
      const res = await approveCrossborderTransfer(transfer.id, directorName, letterRef, user?.id || 'user-1');
      if (res.error) throw new Error(res.error);
      toast.success('Kelulusan Berjaya', 'Permohonan rentasi sempadan telah diluluskan.');
      setShowApproveModal(false);
      loadTransfer();
    } catch (err: any) {
      toast.error('Ralat', err.message || 'Gagal meluluskan permohonan');
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer || !cancelReason) return;
    try {
      const res = await cancelCrossborderTransfer(transfer.id, cancelReason);
      if (res.error) throw new Error(res.error);
      toast.success('Batal Permohonan', 'Permohonan telah dibatalkan.');
      setShowCancelModal(false);
      loadTransfer();
    } catch (err: any) {
      toast.error('Ralat', err.message || 'Gagal membatalkan permohonan');
    }
  };

  const handleComplete = async () => {
    if (!transfer) return;
    try {
      const res = await completeCrossborderTransfer(transfer.id);
      if (res.error) throw new Error(res.error);
      toast.success('Selesai Perjalanan', 'Status pemindahan ditukar ke Selesai.');
      loadTransfer();
    } catch (err: any) {
      toast.error('Ralat', err.message || 'Gagal menukar status');
    }
  };

  const handleDelete = async () => {
    if (!transfer) return;
    if (!confirm('Adakah anda pasti mahu memadam draf permohonan ini?')) return;
    try {
      const res = await deleteCrossborderTransfer(transfer.id);
      if (res.error) throw new Error(res.error);
      toast.success('Padam Berjaya', 'Draf permohonan berjaya dipadam.');
      navigate('/crossborder/dashboard');
    } catch (err: any) {
      toast.error('Ralat', err.message || 'Gagal memadam permohonan');
    }
  };

  const handleDownloadPDF = async (pdfType: 'form' | 'letter') => {
    if (!transfer) return;
    try {
      let blob: Blob;
      let filename = '';
      if (pdfType === 'form') {
        blob = await generateTransferFormPDF(transfer);
        filename = `Borang_CrossBorder_${transfer.no_rujukan}.pdf`;
      } else {
        blob = await generatePermissionLetterPDF(transfer);
        filename = `Surat_Kebenaran_CrossBorder_${transfer.no_rujukan}.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Muat Turun PDF', 'PDF berjaya dijanakan.');
    } catch (e) {
      console.error(e);
      toast.error('Ralat PDF', 'Gagal menjana PDF.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="border-slate-200 text-slate-700 bg-slate-50">Draf</Badge>;
      case 'submitted':
        return <Badge className="border-amber-200 text-amber-800 bg-amber-50">Menunggu Kelulusan</Badge>;
      case 'approved':
        return <Badge className="border-emerald-200 text-emerald-800 bg-emerald-50">Diluluskan</Badge>;
      case 'completed':
        return <Badge className="border-blue-200 text-blue-800 bg-blue-50">Selesai</Badge>;
      case 'cancelled':
        return <Badge className="border-red-200 text-red-800 bg-red-50">Dibatalkan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuatkan butiran permohonan...</div>;
  }

  if (!transfer) {
    return <div className="p-8 text-center text-slate-500">Permohonan tidak ditemui.</div>;
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* Back navigation */}
      <div>
        <button 
          onClick={() => navigate('/crossborder/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors group text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Papan Pemuka</span>
        </button>
      </div>

      {/* Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200 shadow-sm rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-bold text-blue-600">{transfer.no_rujukan}</span>
            {getStatusBadge(transfer.status)}
          </div>
          <p className="text-xs text-slate-500">
            Perjalanan: {formatDate(new Date(transfer.tarikh_perjalanan))} ({transfer.masa_berlepas})
          </p>
        </div>

        {/* Action Buttons based on status */}
        <div className="flex gap-2.5 flex-wrap">
          {transfer.status === 'draft' && (
            <>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-xs flex items-center gap-1.5 rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Padam Draf
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 rounded-xl"
              >
                <Send className="w-3.5 h-3.5" />
                Hantar Kelulusan
              </Button>
            </>
          )}

          {transfer.status === 'submitted' && (
            <>
              <Button
                onClick={() => setShowCancelModal(true)}
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-xs flex items-center gap-1.5 rounded-xl"
              >
                <XCircle className="w-3.5 h-3.5" />
                Batal / Tolak
              </Button>
              <Button
                onClick={() => setShowApproveModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 rounded-xl"
              >
                <Stamp className="w-3.5 h-3.5" />
                Luluskan Permohonan
              </Button>
            </>
          )}

          {transfer.status === 'approved' && (
            <>
              <Button
                onClick={handleComplete}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 rounded-xl"
              >
                <Check className="w-3.5 h-3.5" />
                Selesai Perjalanan
              </Button>
              <Button
                onClick={() => handleDownloadPDF('form')}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 rounded-xl"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Borang Transfer PDF
              </Button>
              <Button
                onClick={() => handleDownloadPDF('letter')}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 rounded-xl"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Surat Pelepasan PDF
              </Button>
            </>
          )}

          {transfer.status === 'completed' && (
            <>
              <Button
                onClick={() => handleDownloadPDF('form')}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 rounded-xl"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Borang Transfer PDF
              </Button>
              <Button
                onClick={() => handleDownloadPDF('letter')}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 rounded-xl"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Surat Pelepasan PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Trip Info */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Butiran Perjalanan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <span className="text-xs text-slate-400 uppercase block">Hospital Perujuk</span>
                <span className="font-semibold text-slate-900">{transfer.referring_hospital}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase block">Hospital Destinasi</span>
                <span className="font-semibold text-slate-900">{transfer.destination_hospital}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase block">Tempat Berlepas</span>
                <span className="text-slate-800">{transfer.tempat_berlepas}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase block">Border Control Post</span>
                <span className="text-slate-800">{transfer.border_control_post}</span>
              </div>
              {transfer.linked_transport_request_id && (
                <div className="md:col-span-2 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold">
                    <span className="bg-blue-600 text-white rounded px-1.5 py-0.5 font-bold uppercase tracking-wide text-[9px]">Linked Transporter</span>
                    <span>No. Rujukan: {transfer.linked_transport_request_id}</span>
                  </div>
                  <button 
                    onClick={() => navigate('/transporter/requests')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                  >
                    Lihat Permohonan Pengangkutan
                  </button>
                </div>
              )}
            </div>
          </Card>


          {/* Section 2: Patients */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Senarai Pesakit</h2>
            <div className="space-y-4">
              {transfer.patients && transfer.patients.length > 0 ? (
                transfer.patients.map((p) => (
                  <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
                    <div className="md:col-span-3 font-semibold text-blue-600 flex items-center gap-2">
                      <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-xs">Pesakit #{p.urutan}</span>
                      {p.nama}
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Jantina</span>
                      <span className="text-slate-800">{p.jantina}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Tarikh Lahir</span>
                      <span className="text-slate-800">{formatDate(new Date(p.tarikh_lahir))}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Warganegara</span>
                      <span className="text-slate-800">{p.warganegara}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Dokumen Perjalanan</span>
                      <span className="text-slate-800">{p.jenis_dokumen} : {p.no_dokumen}</span>
                    </div>
                    {p.no_pengenalan && (
                      <div className="md:col-span-2">
                        <span className="text-xs text-slate-400 block">No Kad Pengenalan Sekunder</span>
                        <span className="text-slate-800">{p.no_pengenalan}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">Tiada pesakit berdaftar.</div>
              )}
            </div>
          </Card>

          {/* Section 3: Vehicle */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Maklumat Kenderaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <span className="text-xs text-slate-400 block">Jenis Kenderaan</span>
                <span className="font-semibold uppercase text-slate-800">{transfer.jenis_kenderaan}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">No. Pendaftaran</span>
                <span className="font-mono font-semibold text-blue-600">{transfer.no_pendaftaran}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Nama Pemandu</span>
                <span className="font-semibold text-slate-800">{(transfer as any).pemandu_nama || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">No. Passport Pemandu</span>
                <span className="font-semibold text-slate-850">{(transfer as any).pemandu_passport || 'N/A'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-slate-400 block">Peralatan Perubatan Lain</span>
                <span className="text-slate-800">{transfer.peralatan_lain || 'Tiada peralatan tambahan'}</span>
              </div>
            </div>
          </Card>

          {/* Section 4: Pengiring KKM */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Pengiring Perubatan KKM</h2>
            <div className="space-y-3">
              {transfer.escorts && transfer.escorts.filter(e => e.jenis_pengiring === 'medical_escort').length > 0 ? (
                transfer.escorts
                  .filter(e => e.jenis_pengiring === 'medical_escort')
                  .map((e) => {
                    const getJobLabel = (job?: string) => {
                      switch (job) {
                        case 'nurse': return 'Jururawat / Nurse';
                        case 'medical_officer': return 'Pegawai Perubatan (MO)';
                        case 'assistant_medical_officer': return 'Penolong Pegawai Perubatan (AMO)';
                        case 'ppk': return 'Pembantu Perawatan Kesihatan (PPK)';
                        default: return 'Kakitangan Perubatan';
                      }
                    };
                    return (
                      <div key={e.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-sm text-slate-600">
                        <div>
                          <div className="font-semibold text-slate-900">{e.nama}</div>
                          {e.no_dokumen && (
                            <div className="text-xs text-slate-450">{e.jenis_dokumen} : {e.no_dokumen}</div>
                          )}
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 text-emerald-800 bg-emerald-50">
                          {getJobLabel(e.jawatan)}
                        </span>
                      </div>
                    );
                  })
              ) : (
                <div className="text-slate-400 text-sm py-2">Tiada pengiring perubatan KKM didaftarkan.</div>
              )}
            </div>
          </Card>

          {/* Section 5: Waris / Pengiring Terdekat */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Waris / Pengiring Terdekat Pesakit</h2>
            <div className="space-y-3">
              {transfer.escorts && transfer.escorts.filter(e => e.jenis_pengiring === 'patient_escort').length > 0 ? (
                transfer.escorts
                  .filter(e => e.jenis_pengiring === 'patient_escort')
                  .map((e) => {
                    const accPatient = transfer.patients?.find(p => p.urutan === e.patient_urutan);
                    return (
                      <div key={e.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-sm text-slate-600">
                        <div>
                          <div className="font-semibold text-slate-900">{e.nama}</div>
                          <div className="text-xs text-slate-450">{e.jenis_dokumen} : {e.no_dokumen}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border border-cyan-200 text-cyan-800 bg-cyan-50">
                            Waris
                          </span>
                          {accPatient && (
                            <div className="text-[10px] text-slate-400 mt-1 font-medium">
                              Pengiring kepada: <span className="font-bold text-slate-500">{accPatient.nama}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-slate-400 text-sm py-2">Tiada waris didaftarkan.</div>
              )}
            </div>
          </Card>
        </div>


        {/* Sidebar Info & Logs */}
        <div className="space-y-6">
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Kelulusan & Pengesahan</h2>
            
            <div className="text-sm text-slate-600 space-y-3">
              <div>
                <span className="text-xs text-slate-400 block">Doktor Perujuk</span>
                <span className="font-semibold text-slate-800">{transfer.doktor_perujuk_nama}</span>
              </div>

              {transfer.pengarah_nama && (
                <div>
                  <span className="text-xs text-slate-400 block">Diluluskan Oleh (Pengarah)</span>
                  <span className="font-semibold text-emerald-700">{transfer.pengarah_nama}</span>
                </div>
              )}

              {transfer.surat_kebenaran_ref && (
                <div>
                  <span className="text-xs text-slate-400 block">No. Rujukan Surat</span>
                  <span className="font-mono text-blue-600 font-semibold">{transfer.surat_kebenaran_ref}</span>
                </div>
              )}

              {transfer.approved_at && (
                <div>
                  <span className="text-xs text-slate-400 block">Masa Diluluskan</span>
                  <span>{formatDate(new Date(transfer.approved_at))}</span>
                </div>
              )}

              {transfer.catatan && (
                <div>
                  <span className="text-xs text-slate-400 block">Catatan / Ulasan</span>
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                    {transfer.catatan}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <Stamp className="w-5 h-5 text-blue-600" />
              Kelulusan Sempadan Pengarah
            </h3>
            <p className="text-xs text-slate-500">
              Sila masukkan butiran kebenaran bertulis rasmi bagi menjana surat pelepasan Border Control Post.
            </p>
            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Pengarah *</label>
                <input 
                  type="text" 
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">No. Rujukan Surat Kebenaran *</label>
                <input 
                  type="text" 
                  value={letterRef}
                  onChange={(e) => setLetterRef(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button 
                  type="button" 
                  onClick={() => setShowApproveModal(false)}
                  variant="outline"
                  className="border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                >
                  Lulus & Log Kebenaran
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-650" />
              Batal / Tolak Permohonan
            </h3>
            <form onSubmit={handleCancel} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Sebab Pembatalan *</label>
                <textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Nyatakan sebab pembatalan kes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button 
                  type="button" 
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  className="border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Kembali
                </Button>
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl"
                >
                  Batal Permohonan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossborderDetailPage;
