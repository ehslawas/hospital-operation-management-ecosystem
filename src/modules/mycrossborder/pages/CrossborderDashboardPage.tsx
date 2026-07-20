// src/modules/mycrossborder/pages/CrossborderDashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  History,
  FileText
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { getCrossborderTransfers } from '../services/crossborderService';
import type { CrossborderTransfer } from '@/shared/types/mycrossborder';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const CrossborderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const loggedUser = useAuthStore((state) => state.user);
  const toast = useToast();
  
  const [transfers, setTransfers] = useState<CrossborderTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getCrossborderTransfers();
      setTransfers(res.data || []);
    } catch (err) {
      console.error('Failed to load transfers', err);
      toast.error('Ralat', 'Gagal memuatkan rekod rentasi sempadan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const total = transfers.length;
    const pending = transfers.filter(t => t.status === 'submitted').length;
    const approved = transfers.filter(t => t.status === 'approved').length;
    const completed = transfers.filter(t => t.status === 'completed').length;
    return { total, pending, approved, completed };
  }, [transfers]);

  const recentTransfers = useMemo(() => {
    return transfers.slice(0, 5);
  }, [transfers]);

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

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-blue-600" />
            MyCrossBorder
          </h1>
          <p className="text-sm text-slate-500">
            Sistem Bersepadu Pengurusan & Pelepasan Sempadan Malaysia-Brunei (Hospital Lawas - Hospital Limbang)
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/crossborder/create')}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-sm rounded-xl px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Daftar Pemindahan Baru
          </Button>
          <Button 
            onClick={() => navigate('/crossborder/log')}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-xl"
          >
            <History className="w-4 h-4" />
            Log Sejarah
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Jumlah Permohonan</span>
              <p className="text-2xl font-bold font-mono mt-1 text-slate-900">
                {loading ? '...' : stats.total}
              </p>
              <p className="text-xs text-slate-400 mt-1">Keseluruhan kes</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Menunggu Kelulusan</span>
              <p className="text-2xl font-bold font-mono mt-1 text-slate-900">
                {loading ? '...' : stats.pending}
              </p>
              <p className="text-xs text-slate-400 mt-1">Perlu kelulusan Pengarah</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Kebenaran Aktif</span>
              <p className="text-2xl font-bold font-mono mt-1 text-slate-900">
                {loading ? '...' : stats.approved}
              </p>
              <p className="text-xs text-slate-400 mt-1">Kebenaran pelepasan aktif</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Selesai Perjalanan</span>
              <p className="text-2xl font-bold font-mono mt-1 text-slate-900">
                {loading ? '...' : stats.completed}
              </p>
              <p className="text-xs text-slate-400 mt-1">Selamat tiba di Limbang</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transfers Table */}
        <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Permohonan Terkini
            </h2>
            <Button 
              onClick={() => navigate('/crossborder/log')}
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700 font-semibold p-0 flex items-center gap-1 text-sm hover:bg-transparent"
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Memuatkan data...</div>
          ) : recentTransfers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">Tiada rekod perjalanan ditemui.</div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs uppercase bg-slate-50/70 text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th scope="col" className="px-4 py-3">No Rujukan</th>
                    <th scope="col" className="px-4 py-3">Tarikh & Masa</th>
                    <th scope="col" className="px-4 py-3">Pesakit Utama</th>
                    <th scope="col" className="px-4 py-3">Kenderaan</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransfers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-blue-600">
                        {item.no_rujukan}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900">
                          {formatDate(new Date(item.tarikh_perjalanan))}
                        </div>
                        <div className="text-xs text-slate-400">{item.masa_berlepas}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {item.patients && item.patients.length > 0 ? (
                          <div>
                            <div className="font-medium text-slate-900">{item.patients[0].nama}</div>
                            {item.patients.length > 1 && (
                              <div className="text-xs text-slate-400">
                                + {item.patients.length - 1} pesakit lain
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Tiada pesakit</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">
                        {item.no_pendaftaran}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          onClick={() => navigate(`/crossborder/detail/${item.id}`)}
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs"
                        >
                          Butiran
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Rujukan Sempadan Brunei
            </h2>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Rujukan kecemasan merentasi pos sempadan Malaysia-Brunei bagi pesakit Hospital Lawas memerlukan kelengkapan borang:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500">
                <li>Borang Transfer Pesakit Merentasi Sempadan rasmi bercop basah hospital.</li>
                <li>Surat Pelepasan Imigresen bertandatangan Pengarah Hospital Lawas.</li>
                <li>Pasport / Dokumen perjalanan fizikal bagi semua pengiring dan pesakit.</li>
              </ul>
              <p className="text-xs text-amber-800 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                Sila pastikan data perjalanan (No Pasport/IC) adalah tepat untuk mengelakkan kelewatan di pintu kawalan sempadan.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrossborderDashboardPage;
