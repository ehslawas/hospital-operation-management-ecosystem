import React from 'react';
import { Calendar, RefreshCw, Layers } from 'lucide-react';

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
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="w-5 h-5 text-slate-500" />
          <span className="text-slate-700 font-bold text-sm whitespace-nowrap">Movement Period:</span>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="px-4 py-2 bg-white/50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="px-4 py-2 bg-white/50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
          />
        </div>
      </div>

      {/* Usage Table */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-20 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/50 bg-slate-50/20 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Cylinder Type</th>
                <th className="py-4 px-6 text-center">Opening Balance</th>
                <th className="py-4 px-6 text-center">Refills Received</th>
                <th className="py-4 px-6 text-center">Issued to Units</th>
                <th className="py-4 px-6 text-center">Returned to Supplier</th>
                <th className="py-4 px-6 text-center">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 text-slate-700 font-medium">
              {data.map((row) => (
                <tr
                  key={row.combo_id}
                  className="hover:bg-white/25 transition-colors duration-200"
                >
                  <td className="py-4 px-6 font-bold text-slate-800">{row.display_name}</td>
                  <td className="py-4 px-6 text-center font-bold text-slate-600">{row.opening}</td>
                  <td className="py-4 px-6 text-center font-bold text-emerald-600">+{row.received}</td>
                  <td className="py-4 px-6 text-center font-bold text-blue-600">-{row.issued}</td>
                  <td className="py-4 px-6 text-center font-bold text-slate-500">-{row.returned}</td>
                  <td className="py-4 px-6 text-center font-extrabold text-indigo-700">
                    <span className="bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl shadow-sm">
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
