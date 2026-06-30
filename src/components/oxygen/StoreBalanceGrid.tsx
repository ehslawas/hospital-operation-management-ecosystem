// @ts-nocheck
import React from 'react';
import { Database, AlertTriangle, Play, RefreshCw } from 'lucide-react';

interface ComboInventory {
  combo_id: string;
  display_name: string;
  available: number;
  in_use: number;
  empty: number;
  returned: number;
  total: number;
}

interface StoreBalanceGridProps {
  data: ComboInventory[];
}

export const StoreBalanceGrid: React.FC<StoreBalanceGridProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {data.map((combo) => {
        const isLoan = combo.display_name.toLowerCase().includes('loan');
        const isPinIndex = combo.display_name.toLowerCase().includes('pi') || combo.display_name.toLowerCase().includes('- d') || combo.display_name.toLowerCase().includes('- e');
        const connectionType = isPinIndex ? 'Pin Index (PI)' : 'Bullnose (BN)';
        
        // Percentages for progress bar
        const availPercent = combo.total > 0 ? (combo.available / combo.total) * 100 : 0;
        const inUsePercent = combo.total > 0 ? (combo.in_use / combo.total) * 100 : 0;
        const emptyPercent = combo.total > 0 ? (combo.empty / combo.total) * 100 : 0;
        const returnedPercent = combo.total > 0 ? (combo.returned / combo.total) * 100 : 0;

        return (
          <div
            key={combo.combo_id}
            className="group relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
          >
            {/* Soft decorative accent */}
            <div className={`absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r ${
              isLoan ? 'from-amber-400 to-orange-500' : 'from-blue-500 to-indigo-600'
            }`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
                  {combo.display_name}
                </h3>
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wide">
                  {connectionType}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase shadow-sm ${
                isLoan
                  ? 'bg-amber-100/60 text-amber-700 border-amber-300/40'
                  : 'bg-blue-100/60 text-blue-700 border-blue-300/40'
              }`}>
                {isLoan ? 'Loan' : 'Private'}
              </span>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Available */}
              <div className="bg-emerald-50/40 border border-emerald-100/40 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-emerald-700 font-bold text-xs">Available</span>
                  <span className="text-lg font-extrabold text-emerald-800">{combo.available}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* In Use */}
              <div className="bg-blue-50/40 border border-blue-100/40 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-blue-700 font-bold text-xs">In Use</span>
                  <span className="text-lg font-extrabold text-blue-800">{combo.in_use}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>

              {/* Empty */}
              <div className="bg-amber-50/40 border border-amber-100/40 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-amber-700 font-bold text-xs">Empty</span>
                  <span className="text-lg font-extrabold text-amber-800">{combo.empty}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>

              {/* Returned */}
              <div className="bg-slate-50/40 border border-slate-100/40 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-slate-700 font-bold text-xs">Returned</span>
                  <span className="text-lg font-extrabold text-slate-800">{combo.returned}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-slate-500" />
              </div>
            </div>

            {/* Multi-segment distribution progress bar */}
            {combo.total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                  <span>Stock Distribution</span>
                  <span>Total: {combo.total}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden shadow-inner border border-slate-200/50">
                  {combo.available > 0 && (
                    <div
                      style={{ width: `${availPercent}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                      title={`Available: ${combo.available}`}
                    />
                  )}
                  {combo.in_use > 0 && (
                    <div
                      style={{ width: `${inUsePercent}%` }}
                      className="bg-blue-500 h-full transition-all duration-500"
                      title={`In Use: ${combo.in_use}`}
                    />
                  )}
                  {combo.empty > 0 && (
                    <div
                      style={{ width: `${emptyPercent}%` }}
                      className="bg-amber-500 h-full transition-all duration-500"
                      title={`Empty: ${combo.empty}`}
                    />
                  )}
                  {combo.returned > 0 && (
                    <div
                      style={{ width: `${returnedPercent}%` }}
                      className="bg-slate-500 h-full transition-all duration-500"
                      title={`Returned: ${combo.returned}`}
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-slate-400 font-bold justify-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span>Available ({Math.round(availPercent)}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                    <span>In Use ({Math.round(inUsePercent)}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                    <span>Empty ({Math.round(emptyPercent)}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
                    <span>Returned ({Math.round(returnedPercent)}%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
