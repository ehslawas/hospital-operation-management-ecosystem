"use client";

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Play, ShieldAlert, Award, FileText } from 'lucide-react';
import { CylinderKpiCards } from '@/components/oxygen/CylinderKpiCards';
import { StoreBalanceGrid } from '@/components/oxygen/StoreBalanceGrid';
import { UnitDistributionTable } from '@/components/oxygen/UnitDistributionTable';
import { StoreUsageBalanceTable } from '@/components/oxygen/StoreUsageBalanceTable';
import { SupplierReturnsSection } from '@/components/oxygen/SupplierReturnsSection';
import { CreateReturnDocumentModal } from '@/components/oxygen/CreateReturnDocumentModal';
import { ReturnDocumentPrintView } from '@/components/oxygen/ReturnDocumentPrintView';
import { CreateRequestDocumentModal } from '@/components/oxygen/CreateRequestDocumentModal';
import { RequestDocumentPrintView } from '@/components/oxygen/RequestDocumentPrintView';
import {
  getCylinderInventoryByType,
  getCylindersByDepartment,
  getStoreUsageBalance,
  getReturnDocuments,
  getRequestDocuments,
} from '@/services/pharmacy/oxygenService';
import type { OxygenReturnDocumentWithRelations, OxygenRequestDocumentWithRelations } from '@/types/pharmacy';

export default function MedicalOxygenBalancePage() {
  const [department, setDepartment] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string>('85bb6adc-b868-428b-83f4-e5af2f5cf904'); // default standard hospital id
  const [activeTab, setActiveTab] = useState<'overview' | 'unit_monitor' | 'store_balance' | 'supplier_returns'>('overview');

  // Live data states
  const [aggregates, setAggregates] = useState<any[]>([]);
  const [deptDistribution, setDeptDistribution] = useState<any[]>([]);
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [returnDocs, setReturnDocs] = useState<OxygenReturnDocumentWithRelations[]>([]);
  const [requestDocs, setRequestDocs] = useState<OxygenRequestDocumentWithRelations[]>([]);

  // Date range for ledger
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Loading & UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [printDocId, setPrintDocId] = useState<string | null>(null);
  const [printRequestId, setPrintRequestId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dept = localStorage.getItem('department');
      setDepartment(dept);
      
      const storedHospitalId = localStorage.getItem('hospitalId');
      if (storedHospitalId) {
        setHospitalId(storedHospitalId);
      }
    }
  }, []);

  const isViewOnly = department === 'Office Admin';

  // Master fetch function
  const fetchData = useCallback(async () => {
    if (!hospitalId) return;
    setIsLoading(true);
    try {
      // 1. Fetch aggregates for grid and KPI cards
      const aggRes = await getCylinderInventoryByType(hospitalId);
      if (aggRes.data) setAggregates(aggRes.data);

      // 2. Fetch department distribution
      const deptRes = await getCylindersByDepartment(hospitalId);
      if (deptRes.data) setDeptDistribution(deptRes.data);

      // 3. Fetch return documents
      const docsRes = await getReturnDocuments(hospitalId);
      if (docsRes.data) setReturnDocs(docsRes.data);

      // 4. Fetch request documents
      const reqRes = await getRequestDocuments(hospitalId);
      if (reqRes.data) setRequestDocs(reqRes.data);

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching live data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  // Separate ledger fetcher
  const fetchLedger = useCallback(async () => {
    if (!hospitalId) return;
    setIsLedgerLoading(true);
    try {
      const ledgerRes = await getStoreUsageBalance(hospitalId, startDate, endDate);
      if (ledgerRes.data) setLedgerData(ledgerRes.data);
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setIsLedgerLoading(false);
    }
  }, [hospitalId, startDate, endDate]);

  // Load all data on mount/refresh
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch ledger when dates change
  useEffect(() => {
    fetchLedger();
  }, [fetchLedger, startDate, endDate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
      fetchLedger();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData, fetchLedger]);

  // Sum aggregates for KPI Cards
  const kpiTotals = aggregates.reduce(
    (acc, curr) => ({
      total: acc.total + curr.total,
      available: acc.available + curr.available,
      inUse: acc.inUse + curr.in_use,
      returned: acc.returned + curr.returned,
    }),
    { total: 0, available: 0, inUse: 0, returned: 0 }
  );

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      {/* Glass Orbs decoration */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Cylinder Inventory Balance
              </h1>
              <p className="text-slate-500 font-semibold text-sm">
                Real-time medical oxygen cylinder ledger • Supabase live data integration
              </p>
            </div>
          </div>

          {/* Action Header controls */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold bg-white/40 border px-3 py-1 rounded-full uppercase tracking-wider">
              Last Refreshed: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button
              onClick={() => {
                fetchData();
                fetchLedger();
              }}
              className="p-3 bg-white/80 border border-slate-200 text-slate-700 hover:text-blue-600 rounded-2xl font-bold shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-xs uppercase tracking-wider font-bold">Refresh</span>
            </button>
          </div>
        </div>

        {/* Action Quicklinks (from original page) */}
        <div className="flex flex-wrap gap-4">
          {[
            { href: '/inventory/medical-oxygen/request', label: 'Request', color: 'bg-blue-600' },
            { href: '/inventory/medical-oxygen/receive', label: 'Receive Refills', color: 'bg-emerald-600' },
            { href: '/inventory/medical-oxygen/issue', label: 'Issue Cylinders', color: 'bg-indigo-600' },
            { href: '/inventory/medical-oxygen/return-from-unit', label: 'Unit Returns', color: 'bg-amber-600' },
          ].map((lnk) => (
            <a
              key={lnk.label}
              href={lnk.href}
              onClick={(e) => {
                if (isViewOnly && lnk.label !== 'Receive Refills') e.preventDefault();
              }}
              className={`px-5 py-3 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 text-slate-700 hover:text-white font-bold text-xs shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 flex items-center space-x-2 ${
                isViewOnly && lnk.label !== 'Receive Refills' ? 'opacity-50 grayscale cursor-not-allowed hover:scale-100 hover:text-slate-700' : ''
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${lnk.color}`} />
              <span>{lnk.label}</span>
            </a>
          ))}
        </div>

        {/* KPI Totals */}
        <CylinderKpiCards
          total={kpiTotals.total}
          available={kpiTotals.available}
          inUse={kpiTotals.inUse}
          returned={kpiTotals.returned}
        />

        {/* Tab Navigation */}
        <div className="flex bg-white/20 backdrop-blur-xl border border-white/30 p-1.5 rounded-3xl shadow-xl max-w-2xl">
          {[
            { id: 'overview', label: 'Overview Store Grid' },
            { id: 'unit_monitor', label: 'Unit Distribution' },
            { id: 'store_balance', label: 'Store Usage Ledger' },
            { id: 'supplier_returns', label: 'Supplier Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xl scale-102'
                  : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Views */}
        <div className="transition-all duration-500">
          {activeTab === 'overview' && <StoreBalanceGrid data={aggregates} />}
          
          {activeTab === 'unit_monitor' && <UnitDistributionTable data={deptDistribution} />}
          
          {activeTab === 'store_balance' && (
            <StoreUsageBalanceTable
              data={ledgerData}
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
              isLoading={isLedgerLoading}
            />
          )}

          {activeTab === 'supplier_returns' && (
            <SupplierReturnsSection
              documents={returnDocs}
              requestDocuments={requestDocs}
              onCreateClick={() => setIsModalOpen(true)}
              onCreateRequestClick={() => setIsRequestModalOpen(true)}
              onPrintClick={(docId) => setPrintDocId(docId)}
              onPrintRequestClick={(docId) => setPrintRequestId(docId)}
              isViewOnly={isViewOnly}
            />
          )}
        </div>
      </div>

      {/* Return Document Modals */}
      <CreateReturnDocumentModal
        hospitalId={hospitalId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
          fetchLedger();
        }}
      />

      {/* Request Document Modals */}
      <CreateRequestDocumentModal
        hospitalId={hospitalId}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => {
          fetchData();
          fetchLedger();
        }}
      />

      {printDocId && (
        <ReturnDocumentPrintView
          documentId={printDocId}
          isOpen={!!printDocId}
          onClose={() => setPrintDocId(null)}
        />
      )}

      {printRequestId && (
        <RequestDocumentPrintView
          documentId={printRequestId}
          isOpen={!!printRequestId}
          onClose={() => setPrintRequestId(null)}
        />
      )}
    </div>
  );
}