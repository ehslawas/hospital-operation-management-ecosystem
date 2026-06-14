import React from 'react';
import { Calendar, RefreshCw, Layers, ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';

interface UsageLedgerRow {
  combo_id: string;
  display_name: string;
  opening: number;
  received: number;
  issued: number;
  returned: number;
  closing: number;
}

interface StoreUsageBalanceTableProps {
  data: UsageLedgerRow[];
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  isLoading: boolean;
}

export const StoreUsageBalanceTable: React.FC<StoreUsageBalanceTableProps> = ({
  data,
  startDate,
  endDate,
  onDateChange,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-800 font-bold text-sm block">Movement Period</span>
            <span className="text-slate-400 text-xs font-semibold">Select date range for cylinder ledger</span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:flex-initial">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateChange(e.target.value, endDate)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">to</span>
          <div className="relative flex-1 md:flex-initial">
            <input
              type="date"
              value={endDate}
              onChange={(e) => onDateChange(startDate, e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Usage Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Updating Ledger...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="py-4.5 px-6">Cylinder Type</th>
                <th className="py-4.5 px-6 text-center">Opening Balance</th>
                <th className="py-4.5 px-6 text-center">Refills Received</th>
                <th className="py-4.5 px-6 text-center">Issued to Units</th>
                <th className="py-4.5 px-6 text-center">Returned to Supplier</th>
                <th className="py-4.5 px-6 text-center">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold text-sm">
              {data.map((row) => (
                <tr
                  key={row.combo_id}
                  className="hover:bg-slate-50/40 transition-colors duration-150"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50/50 rounded-xl border border-indigo-100/30 text-indigo-600">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{row.display_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-bold text-slate-600">
                    {row.opening}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {row.received > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{row.received}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-100">
                        0
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {row.issued > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        -{row.issued}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-100">
                        0
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {row.returned > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        <RotateCcw className="w-3.5 h-3.5" />
                        -{row.returned}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-100">
                        0
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-extrabold bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200/60 shadow-sm min-w-[3rem] justify-center">
                      {row.closing}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
