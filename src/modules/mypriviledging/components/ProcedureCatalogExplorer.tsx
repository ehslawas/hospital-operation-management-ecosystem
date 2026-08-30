// src/modules/mypriviledging/components/ProcedureCatalogExplorer.tsx
// Professional Modern Government Clinical Procedure Catalog Explorer

import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Stethoscope,
  Layers,
  HeartPulse,
  Eye,
  Activity,
  Syringe,
  Truck,
  Bone,
  Baby,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COMMON_CATEGORIES,
  NURSES_ONLY_CATEGORIES,
  AMO_ONLY_CATEGORIES,
  CATALOG_METRICS
} from '../data/procedureCatalogData';
import type { ProcedureCategory, ProcedureItem, CredentialRole } from '../types/priviledgingTypes';

interface ProcedureCatalogExplorerProps {
  onLogProcedure?: (category: ProcedureCategory, item: ProcedureItem) => void;
  selectedRoleFilter?: CredentialRole;
}

export const ProcedureCatalogExplorer: React.FC<ProcedureCatalogExplorerProps> = ({
  onLogProcedure,
  selectedRoleFilter = 'both'
}) => {
  const [activeTab, setActiveTab] = useState<'shared' | 'nurses' | 'amos'>('shared');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const tabConfig = {
    shared: {
      title: 'Kategori Bersama (Kedua-dua Peranan)',
      subtitle: 'Prosedur asas dan teras yang digunapakai oleh Jururawat dan Penolong Pegawai Perubatan.',
      categories: COMMON_CATEGORIES,
      badge: `${COMMON_CATEGORIES.length} Kategori`
    },
    nurses: {
      title: 'Kategori Khusus Jururawat',
      subtitle: 'Kompetensi klinikal dan pos-basik kejururawatan khusus (ICU, Paediatrik, Neonatal).',
      categories: NURSES_ONLY_CATEGORIES,
      badge: `${NURSES_ONLY_CATEGORIES.length} Kategori`
    },
    amos: {
      title: 'Kategori Khusus Penolong Pegawai Perubatan (PPP)',
      subtitle: 'Prosedur khusus dan lanjutan bagi Penolong Pegawai Perubatan (Perfusion, Bius, PAC).',
      categories: AMO_ONLY_CATEGORIES,
      badge: `${AMO_ONLY_CATEGORIES.length} Kategori`
    }
  };

  const currentTabInfo = tabConfig[activeTab];

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    currentTabInfo.categories.forEach((cat) => {
      allExpanded[cat.id] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Filtered categories and procedures based on search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentTabInfo.categories;

    return currentTabInfo.categories
      .map((cat) => {
        const catMatch = cat.name.toLowerCase().includes(q) || cat.summary.toLowerCase().includes(q);

        const filteredGroups = cat.groups
          .map((grp) => {
            const grpMatch = grp.label.toLowerCase().includes(q);
            const filteredItems = grp.items.filter(
              (item) => grpMatch || catMatch || item.label.toLowerCase().includes(q)
            );

            if (filteredItems.length > 0) {
              return { ...grp, items: filteredItems };
            }
            return null;
          })
          .filter(Boolean) as typeof cat.groups;

        if (filteredGroups.length > 0) {
          return { ...cat, groups: filteredGroups };
        }
        return null;
      })
      .filter(Boolean) as ProcedureCategory[];
  }, [currentTabInfo.categories, searchQuery]);

  // Category Icon helper
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'peri-operative-care':
        return <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'ophthalmology-care':
        return <Eye className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'emergency-medicine':
      case 'pre-hospital-care':
        return <Truck className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'dialysis-care':
        return <Syringe className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'endoscopy-services':
        return <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'orthopaedic-services':
        return <Bone className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
      case 'peri-anaesthesia-care':
      case 'amo-peri-anaesthesia':
        return <HeartPulse className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'intensive-care-nursing':
        return <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'general-paediatric-nursing':
      case 'neonatal-nursing':
        return <Baby className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'cardiovascular-perfusion':
      case 'amo-anaesthesia':
        return <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Category Filter Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Katalog Prosedur Klinikal Bertauliah (AHP Logbook)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rujuk senarai prosedur bertauliah KKM mengikut peranan dan kategori klinikal.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-semibold px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl self-start md:self-auto">
            Jumlah Prosedur: <strong className="text-emerald-700 dark:text-emerald-400">{CATALOG_METRICS.totalProcedures}</strong>
          </span>
        </div>

        {/* Role Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('shared')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
              activeTab === 'shared'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            <span>Kategori Bersama (Kedua-dua Peranan)</span>
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', activeTab === 'shared' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}>
              {COMMON_CATEGORIES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nurses')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
              activeTab === 'nurses'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            <span>Khusus Jururawat</span>
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', activeTab === 'nurses' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}>
              {NURSES_ONLY_CATEGORIES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('amos')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
              activeTab === 'amos'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            <span>Khusus Penolong Pegawai Perubatan (PPP)</span>
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', activeTab === 'amos' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}>
              {AMO_ONLY_CATEGORIES.length}
            </span>
          </button>
        </div>

        {/* Section Heading info */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
              {currentTabInfo.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {currentTabInfo.subtitle}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button onClick={expandAll} className="hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline">
              Buka Semua
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button onClick={collapseAll} className="hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline">
              Tutup Semua
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3.5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama prosedur, kategori, atau kata kunci klinikal..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Accordion Cards */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tiada Prosedur Dijumpai
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Tiada hasil carian untuk "{searchQuery}". Sila cuba kata kunci lain.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Kosongkan Carian
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredCategories.map((cat) => {
            const isExpanded = searchQuery ? true : !!expandedCategories[cat.id];
            const catTotalProcedures = cat.groups.reduce((acc, g) => acc + g.items.length, 0);

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Category Header */}
                <div
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors select-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 mt-0.5">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                          {cat.name}
                        </h4>
                        <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-bold">
                          {catTotalProcedures} Prosedur
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md text-[10px]">
                          {cat.groups.length} Kumpulan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cat.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Groups & Procedures */}
                {isExpanded && (
                  <div className="px-4 pb-4 md:px-5 md:pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
                    <div className="space-y-3.5">
                      {cat.groups.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 md:p-4 shadow-2xs"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                              {group.label}
                            </h5>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {group.items.length} item
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="group flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-emerald-400/80 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                    {item.label}
                                  </span>
                                </div>

                                {onLogProcedure && (
                                  <button
                                    type="button"
                                    onClick={() => onLogProcedure(cat, item)}
                                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition-all active:scale-95"
                                    title="Log Prosedur Ini"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Log</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
