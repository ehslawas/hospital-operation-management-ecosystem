// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { 
  Database, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Truck, 
  Archive, 
  ArrowUpRight, 
  Layers, 
  Sparkles,
  ChevronRight,
  Zap,
  Activity,
  ArrowRight,
  LayoutGrid,
  List,
  GitCommit,
  TrendingUp
} from 'lucide-react';

export interface ComboInventory {
  combo_id: string;
  display_name: string;
  available: number;
  in_use: number;
  empty: number;
  returned: number;
  total: number;
}

export interface StoreBalanceGridProps {
  data: ComboInventory[];
  onQuickIssue?: (combo: ComboInventory) => void;
  onQuickScanEmpty?: (combo: ComboInventory) => void;
  onQuickCreateReturn?: (combo: ComboInventory) => void;
}

export const StoreBalanceGrid: React.FC<StoreBalanceGridProps> = ({ 
  data,
  onQuickIssue,
  onQuickScanEmpty,
  onQuickCreateReturn
}) => {
  const [viewMode, setViewMode] = useState<'pipeline' | 'grid' | 'table'>('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'pi' | 'bn'>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'loan' | 'private'>('all');

  // Filter combos based on criteria
  const filteredData = useMemo(() => {
    return data.filter((combo) => {
      const name = combo.display_name.toLowerCase();
      const isLoan = name.includes('loan');
      const isPinIndex = name.includes('pi') || name.includes('- d') || name.includes('- e');

      // Search matching
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (!name.includes(query) && !combo.combo_id.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Connection filter
      if (connectionFilter === 'pi' && !isPinIndex) return false;
      if (connectionFilter === 'bn' && isPinIndex) return false;

      // Ownership filter
      if (ownershipFilter === 'loan' && !isLoan) return false;
      if (ownershipFilter === 'private' && isLoan) return false;

      return true;
    });
  }, [data, searchTerm, connectionFilter, ownershipFilter]);

  // Aggregate totals
  const totalStats = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => ({
        available: acc.available + curr.available,
        in_use: acc.in_use + curr.in_use,
        empty: acc.empty + curr.empty,
        returned: acc.returned + curr.returned,
        total: acc.total + curr.total,
      }),
      { available: 0, in_use: 0, empty: 0, returned: 0, total: 0 }
    );
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Enterprise Control Bar & View Mode Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cylinder type (e.g. P101, 101-N, Bullnose)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters & View Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Valve Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setConnectionFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  connectionFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Valves
              </button>
              <button
                onClick={() => setConnectionFilter('pi')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  connectionFilter === 'pi' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pin Index (PI)
              </button>
              <button
                onClick={() => setConnectionFilter('bn')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  connectionFilter === 'bn' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bullnose (BN)
              </button>
            </div>

            {/* Ownership Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setOwnershipFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  ownershipFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Contracts
              </button>
              <button
                onClick={() => setOwnershipFilter('loan')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  ownershipFilter === 'loan' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Loan
              </button>
              <button
                onClick={() => setOwnershipFilter('private')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  ownershipFilter === 'private' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Private
              </button>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-900 text-white p-1 rounded-xl shadow-inner text-xs border border-slate-800">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'pipeline' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Movement Pipeline Telemetry Flow"
              >
                <GitCommit className="w-3.5 h-3.5" />
                Pipeline Flow
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Telemetry Grid Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Telemetry Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Dense Data Matrix Table"
              >
                <List className="w-3.5 h-3.5" />
                Data Matrix
              </button>
            </div>
          </div>

        </div>

        {/* Telemetry Summary Banner */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100 font-medium flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              Cylinder Movement Telemetry Matrix ({filteredData.length} Types)
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              Store Available: <strong className="text-emerald-700 font-bold tabular-nums">{totalStats.available}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm" />
              Ward In Use: <strong className="text-blue-700 font-bold tabular-nums">{totalStats.in_use}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
              Depleted Empty: <strong className="text-amber-700 font-bold tabular-nums">{totalStats.empty}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm" />
              Supplier Returned: <strong className="text-indigo-700 font-bold tabular-nums">{totalStats.returned}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: MOVEMENT PIPELINE FLOW (ENTERPRISE STANDARD) */}
      {viewMode === 'pipeline' && (
        <div className="space-y-4">
          {filteredData.map((combo) => {
            const isLoan = combo.display_name.toLowerCase().includes('loan');
            const isPinIndex = combo.display_name.toLowerCase().includes('pi') || combo.display_name.toLowerCase().includes('- d') || combo.display_name.toLowerCase().includes('- e');
            const connectionType = isPinIndex ? 'Pin Index (PI)' : 'Bullnose (BN)';
            
            const availPct = combo.total > 0 ? Math.round((combo.available / combo.total) * 100) : 0;
            const inUsePct = combo.total > 0 ? Math.round((combo.in_use / combo.total) * 100) : 0;
            const emptyPct = combo.total > 0 ? Math.round((combo.empty / combo.total) * 100) : 0;
            const retPct = combo.total > 0 ? Math.round((combo.returned / combo.total) * 100) : 0;

            return (
              <div 
                key={combo.combo_id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* SKU Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
                      {combo.display_name}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-mono">
                      {connectionType}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      isLoan 
                        ? 'bg-amber-50 text-amber-800 border-amber-300' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {isLoan ? 'Loan Contract' : 'Hospital Property'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-500">
                    <span>Fleet Size: <strong className="text-slate-900">{combo.total}</strong> units</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-semibold">
                      {inUsePct}% Active Deployment
                    </span>
                  </div>
                </div>

                {/* 4-Stage Horizontal Telemetry Pipeline */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                  
                  {/* Stage 1: Central Store (Available) */}
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-emerald-400 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>1. Central Store</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-extrabold">
                        {availPct}%
                      </span>
                    </div>
                    <div className="my-3">
                      <div className="text-3xl font-black text-emerald-950 tabular-nums">{combo.available}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Full & Available</div>
                    </div>
                    {onQuickIssue && (
                      <button
                        onClick={() => onQuickIssue(combo)}
                        disabled={combo.available <= 0}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Issue to Ward
                      </button>
                    )}
                  </div>

                  {/* Stage 2: Ward In Use */}
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-blue-400 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>2. Ward Deployment</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-extrabold">
                        {inUsePct}%
                      </span>
                    </div>
                    <div className="my-3">
                      <div className="text-3xl font-black text-blue-950 tabular-nums">{combo.in_use}</div>
                      <div className="text-[11px] text-blue-700 font-semibold mt-0.5">In Active Use</div>
                    </div>
                    {onQuickScanEmpty && (
                      <button
                        onClick={() => onQuickScanEmpty(combo)}
                        disabled={combo.in_use <= 0}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Mark Depleted
                      </button>
                    )}
                  </div>

                  {/* Stage 3: Empty Holding Area */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-amber-400 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>3. Empty Collection</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-extrabold">
                        {emptyPct}%
                      </span>
                    </div>
                    <div className="my-3">
                      <div className="text-3xl font-black text-amber-950 tabular-nums">{combo.empty}</div>
                      <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Awaiting Supplier Return</div>
                    </div>
                    {onQuickCreateReturn && (
                      <button
                        onClick={() => onQuickCreateReturn(combo)}
                        disabled={combo.empty <= 0}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Create Return Doc
                      </button>
                    )}
                  </div>

                  {/* Stage 4: Supplier Returned */}
                  <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-indigo-400 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-800 font-bold text-xs">
                        <Truck className="w-4 h-4 text-indigo-600" />
                        <span>4. Supplier Logistics</span>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-extrabold">
                        {retPct}%
                      </span>
                    </div>
                    <div className="my-3">
                      <div className="text-3xl font-black text-indigo-950 tabular-nums">{combo.returned}</div>
                      <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">Refill in Progress</div>
                    </div>
                    <div className="w-full py-2 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold text-center border border-indigo-200">
                      Returned to Linde
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: HIGH CONTRAST TELEMETRY CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredData.map((combo) => {
            const isLoan = combo.display_name.toLowerCase().includes('loan');
            const isPinIndex = combo.display_name.toLowerCase().includes('pi') || combo.display_name.toLowerCase().includes('- d') || combo.display_name.toLowerCase().includes('- e');
            const connectionType = isPinIndex ? 'Pin Index (PI)' : 'Bullnose (BN)';

            const availPercent = combo.total > 0 ? (combo.available / combo.total) * 100 : 0;
            const inUsePercent = combo.total > 0 ? (combo.in_use / combo.total) * 100 : 0;
            const emptyPercent = combo.total > 0 ? (combo.empty / combo.total) * 100 : 0;
            const returnedPercent = combo.total > 0 ? (combo.returned / combo.total) * 100 : 0;

            return (
              <div
                key={combo.combo_id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-5 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {combo.display_name}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                        {connectionType}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        isLoan
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isLoan ? 'Loan' : 'Private'}
                    </span>
                  </div>

                  {/* 4 Quadrants */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                      <span className="text-emerald-800 font-bold text-xs block">Available</span>
                      <span className="text-2xl font-black text-emerald-950 tabular-nums">{combo.available}</span>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                      <span className="text-blue-800 font-bold text-xs block">In Use</span>
                      <span className="text-2xl font-black text-blue-950 tabular-nums">{combo.in_use}</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      <span className="text-amber-800 font-bold text-xs block">Empty</span>
                      <span className="text-2xl font-black text-amber-950 tabular-nums">{combo.empty}</span>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl">
                      <span className="text-indigo-800 font-bold text-xs block">Returned</span>
                      <span className="text-2xl font-black text-indigo-950 tabular-nums">{combo.returned}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {combo.total > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-600 font-bold">
                        <span>Distribution</span>
                        <span>Total: {combo.total}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden border border-slate-200">
                        {combo.available > 0 && <div style={{ width: `${availPercent}%` }} className="bg-emerald-500 h-full" />}
                        {combo.in_use > 0 && <div style={{ width: `${inUsePercent}%` }} className="bg-blue-600 h-full" />}
                        {combo.empty > 0 && <div style={{ width: `${emptyPercent}%` }} className="bg-amber-500 h-full" />}
                        {combo.returned > 0 && <div style={{ width: `${returnedPercent}%` }} className="bg-indigo-600 h-full" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {onQuickIssue && (
                    <button
                      onClick={() => onQuickIssue(combo)}
                      disabled={combo.available <= 0}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      Issue Ward
                    </button>
                  )}
                  {onQuickScanEmpty && (
                    <button
                      onClick={() => onQuickScanEmpty(combo)}
                      disabled={combo.in_use <= 0}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      Mark Empty
                    </button>
                  )}
                  {onQuickCreateReturn && (
                    <button
                      onClick={() => onQuickCreateReturn(combo)}
                      disabled={combo.empty <= 0}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      Return Doc
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: DENSE DATA MATRIX TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Cylinder Type / Spec</th>
                  <th className="px-5 py-3.5 font-bold">Valve Type</th>
                  <th className="px-5 py-3.5 font-bold">Contract</th>
                  <th className="px-5 py-3.5 font-bold text-emerald-700">Available</th>
                  <th className="px-5 py-3.5 font-bold text-blue-700">In Use</th>
                  <th className="px-5 py-3.5 font-bold text-amber-700">Empty</th>
                  <th className="px-5 py-3.5 font-bold text-indigo-700">Returned</th>
                  <th className="px-5 py-3.5 font-bold">Total Fleet</th>
                  <th className="px-5 py-3.5 font-bold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((combo) => {
                  const isLoan = combo.display_name.toLowerCase().includes('loan');
                  const isPinIndex = combo.display_name.toLowerCase().includes('pi') || combo.display_name.toLowerCase().includes('- d') || combo.display_name.toLowerCase().includes('- e');
                  const connectionType = isPinIndex ? 'Pin Index (PI)' : 'Bullnose (BN)';

                  return (
                    <tr key={combo.combo_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">{combo.display_name}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-slate-600">{connectionType}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isLoan ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isLoan ? 'Loan' : 'Private'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700 text-sm tabular-nums">{combo.available}</td>
                      <td className="px-5 py-4 font-black text-blue-700 text-sm tabular-nums">{combo.in_use}</td>
                      <td className="px-5 py-4 font-black text-amber-700 text-sm tabular-nums">{combo.empty}</td>
                      <td className="px-5 py-4 font-black text-indigo-700 text-sm tabular-nums">{combo.returned}</td>
                      <td className="px-5 py-4 font-black text-slate-900 text-sm tabular-nums">{combo.total}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onQuickIssue && (
                            <button
                              onClick={() => onQuickIssue(combo)}
                              disabled={combo.available <= 0}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded text-[10px] font-bold"
                            >
                              Issue
                            </button>
                          )}
                          {onQuickScanEmpty && (
                            <button
                              onClick={() => onQuickScanEmpty(combo)}
                              disabled={combo.in_use <= 0}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-30 text-white rounded text-[10px] font-bold"
                            >
                              Empty
                            </button>
                          )}
                          {onQuickCreateReturn && (
                            <button
                              onClick={() => onQuickCreateReturn(combo)}
                              disabled={combo.empty <= 0}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded text-[10px] font-bold"
                            >
                              Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

