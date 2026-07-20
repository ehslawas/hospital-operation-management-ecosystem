// src/modules/mycrossborder/pages/CrossborderLogPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Globe, 
  Eye
} from 'lucide-react';
import { useToast } from '@/stores/toastStore';
import { getCrossborderTransfers } from '../services/crossborderService';
import type { CrossborderTransfer } from '@/shared/types/mycrossborder';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const CrossborderLogPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [transfers, setTransfers] = useState<CrossborderTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getCrossborderTransfers();
      setTransfers(res.data || []);
    } catch (err) {
      console.error('Failed to load transfers log', err);
      toast.error('Ralat', 'Gagal memuatkan rekod log rentasi sempadan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Filtered and searched data
  const filteredTransfers = useMemo(() => {
    return transfers.filter((item) => {
      // 1. Search term match (Ref, Patient Name, Vehicle No)
      const matchesSearch = 
        item.no_rujukan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.no_pendaftaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.patients || []).some(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Status match
      const matchesStatus = statusFilter === '' || item.status === statusFilter;

      // 3. Date range match
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(item.tarikh_perjalanan) >= new Date(startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && new Date(item.tarikh_perjalanan) <= new Date(endDate);
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [transfers, searchTerm, statusFilter, startDate, endDate]);

  return (
    <div className="space-y-6 text-slate-800">
      {/* Back button */}
      <div>
        <button 
          onClick={() => navigate('/crossborder/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors group text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Papan Pemuka</span>
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Globe className="w-7 h-7 text-blue-600" />
          Log & Sejarah Rentasi Sempadan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Senarai lengkap permohonan, sejarah pelepasan pos kawalan imigresen dan rekod pesakit Hospital Lawas.
        </p>
      </div>

      {/* Filter panel */}
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-500 block mb-1">Cari Permohonan</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="No Rujukan / Pesakit / No Plat"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="">Semua Status</option>
              <option value="draft">Draf</option>
              <option value="submitted">Menunggu Kelulusan</option>
              <option value="approved">Diluluskan</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Dari Tarikh</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Hingga Tarikh</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Memuatkan data...</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Tiada rekod log padan dengan carian.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs uppercase bg-slate-50/70 text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th scope="col" className="px-4 py-3">No Rujukan</th>
                  <th scope="col" className="px-4 py-3">Tarikh</th>
                  <th scope="col" className="px-4 py-3">Masa</th>
                  <th scope="col" className="px-4 py-3">Pesakit Utama</th>
                  <th scope="col" className="px-4 py-3">No Plat Ambulans</th>
                  <th scope="col" className="px-4 py-3">No Surat Kebenaran</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-blue-600">
                      {item.no_rujukan}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {formatDate(new Date(item.tarikh_perjalanan))}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.masa_berlepas}
                    </td>
                    <td className="px-4 py-4">
                      {item.patients && item.patients.length > 0 ? (
                        <div>
                          <div className="font-semibold text-slate-900">{item.patients[0].nama}</div>
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
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">
                      {item.no_pendaftaran}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-indigo-650 font-medium">
                      {item.surat_kebenaran_ref || '-'}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        onClick={() => navigate(`/crossborder/detail/${item.id}`)}
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Papar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CrossborderLogPage;
