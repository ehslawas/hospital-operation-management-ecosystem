import Link from 'next/link';
import { useMemo } from 'react';

type POStatus = 'COMPLETED' | 'ACTIVE' | 'CANCELLED';
type Category = 'DRUG' | 'NON_DRUG';

export default function OfficeAdminDashboard() {
  // Lightweight mock generators (view-only summary)
  const purchaseOrders = useMemo(() => {
    const items: Array<{ status: POStatus; category: Category; createdAt: string; po: string; supplier: string; amount: number }>=[];
    const suppliers = ['MediSupply', 'PharmaCorp', 'HealthTech', 'CarePlus', 'BioMed'];
    for (let i = 1; i <= 100; i++) {
      const status: POStatus = (['COMPLETED','ACTIVE','CANCELLED'] as POStatus[])[Math.floor(Math.random()*3)];
      const category: Category = Math.random() < 0.55 ? 'DRUG' : 'NON_DRUG';
      items.push({
        status,
        category,
        createdAt: new Date(Date.now() - Math.random()*1000*60*60*24*30).toISOString().slice(0,10),
        po: `PO-2025-${String(i).padStart(3,'0')}`,
        supplier: suppliers[Math.floor(Math.random()*suppliers.length)],
        amount: Math.floor(Math.random()*50000)+5000
      });
    }
    return items;
  }, []);

  const lpos = useMemo(() => {
    const items: Array<{ status: 'RELEASED'|'PENDING'|'CANCELLED'; createdAt: string; lpo: string; supplier: string }>=[];
    const suppliers = ['MedEquip', 'MediCare', 'PharmaDirect', 'MediTech'];
    for (let i = 1; i <= 60; i++) {
      const status = (['RELEASED','PENDING','CANCELLED'] as const)[Math.floor(Math.random()*3)];
      items.push({
        status,
        createdAt: new Date(Date.now() - Math.random()*1000*60*60*24*20).toISOString().slice(0,10),
        lpo: `LPO-2025-${String(i).padStart(3,'0')}`,
        supplier: suppliers[Math.floor(Math.random()*suppliers.length)]
      });
    }
    return items;
  }, []);

  const receiving = useMemo(() => {
    const items: Array<{ status: 'pending'|'partial'|'completed'; po: string; supplier: string; date: string; category: Category }>=[];
    const suppliers = ['MediSupply','CarePlus','BioMed'];
    for (let i = 1; i <= 80; i++) {
      const status = (['pending','partial','completed'] as const)[Math.floor(Math.random()*3)];
      const category: Category = Math.random()<0.5?'DRUG':'NON_DRUG';
      items.push({ status, po:`PO-${1000+i}`, supplier: suppliers[Math.floor(Math.random()*suppliers.length)], date: new Date(Date.now()-Math.random()*1000*60*60*24*10).toISOString().slice(0,10), category });
    }
    return items;
  }, []);

  const poStats = useMemo(() => {
    const total = purchaseOrders.length;
    const completed = purchaseOrders.filter(p=>p.status==='COMPLETED').length;
    const active = purchaseOrders.filter(p=>p.status==='ACTIVE').length;
    const cancelled = purchaseOrders.filter(p=>p.status==='CANCELLED').length;
    const drug = purchaseOrders.filter(p=>p.category==='DRUG').length;
    const nonDrug = total - drug;
    const latest = purchaseOrders.slice(0,6);
    return { total, completed, active, cancelled, drug, nonDrug, latest };
  }, [purchaseOrders]);

  const lpoStats = useMemo(()=>{
    const total = lpos.length;
    const released = lpos.filter(l=>l.status==='RELEASED').length;
    const pending = lpos.filter(l=>l.status==='PENDING').length;
    const cancelled = lpos.filter(l=>l.status==='CANCELLED').length;
    const latest = lpos.slice(0,6);
    return { total, released, pending, cancelled, latest };
  },[lpos]);

  const recStats = useMemo(()=>{
    const total = receiving.length;
    const completed = receiving.filter(r=>r.status==='completed').length;
    const partial = receiving.filter(r=>r.status==='partial').length;
    const pending = receiving.filter(r=>r.status==='pending').length;
    const drug = receiving.filter(r=>r.category==='DRUG').length;
    const nonDrug = total - drug;
    const latest = receiving.slice(0,6);
    return { total, completed, partial, pending, drug, nonDrug, latest };
  },[receiving]);

  const kpi = (title: string, value: number|string, accent: string, sub?: string) => (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md ring-1 ring-slate-200 p-5 relative overflow-hidden">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} />
      <div className="space-y-1">
        <div className="text-sm text-slate-600">{title}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );

  const badge = (text: string, tone: string) => (
    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${tone}`}>{text}</span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl ring-1 ring-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Office Administration</h1>
              <p className="text-slate-600 mt-1">View-only overview for procurement workflows</p>
            </div>
            <div className="hidden md:flex gap-2 items-center">
              {badge('View only','bg-slate-100 text-slate-700')}
            </div>
          </div>
        </div>

        {/* Top KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {kpi('POs (Total)', poStats.total, 'bg-blue-600/90', 'All departments')}
          {kpi('POs Active', poStats.active, 'bg-amber-500/90')}
          {kpi('POs Completed', poStats.completed, 'bg-emerald-600/90')}
          {kpi('LPO Released', lpoStats.released, 'bg-indigo-600/90')}
          {kpi('Receiving Partial', recStats.partial, 'bg-orange-500/90')}
          {kpi('Receiving Pending', recStats.pending, 'bg-slate-500/90')}
        </div>

        {/* Split by Drug vs Non-Drug */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 rounded-2xl shadow-lg ring-1 ring-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Purchase Orders</h3>
              <Link href="/purchase-orders" className="text-sm text-blue-600 hover:underline">Open</Link>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {kpi('Drug', poStats.drug, 'bg-blue-600/90')}
              {kpi('Non-Drug', poStats.nonDrug, 'bg-purple-600/90')}
            </div>
            <div className="text-xs text-slate-500 mb-2">Latest activity</div>
            <div className="space-y-2 max-h-56 overflow-auto">
              {poStats.latest.map((p)=> (
                <div key={p.po} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{p.po}</div>
                    <div className="text-xs text-slate-500 truncate">{p.supplier} • {p.createdAt}</div>
                  </div>
                  {badge(p.status==='COMPLETED'?'Completed':p.status==='ACTIVE'?'Active':'Cancelled', p.status==='COMPLETED'?'bg-emerald-100 text-emerald-700':p.status==='ACTIVE'?'bg-blue-100 text-blue-700':'bg-rose-100 text-rose-700')}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 rounded-2xl shadow-lg ring-1 ring-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">LPO Oversight</h3>
              <Link href="/lpo-management" className="text-sm text-blue-600 hover:underline">Open</Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {kpi('Released', lpoStats.released, 'bg-emerald-600/90')}
              {kpi('Pending', lpoStats.pending, 'bg-amber-500/90')}
              {kpi('Cancelled', lpoStats.cancelled, 'bg-rose-500/90')}
            </div>
            <div className="text-xs text-slate-500 mb-2">Latest LPOs</div>
            <div className="space-y-2 max-h-56 overflow-auto">
              {lpoStats.latest.map((l)=> (
                <div key={l.lpo} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{l.lpo}</div>
                    <div className="text-xs text-slate-500 truncate">{l.supplier} • {l.createdAt}</div>
                  </div>
                  {badge(l.status==='RELEASED'?'Released':l.status==='PENDING'?'Pending':'Cancelled', l.status==='RELEASED'?'bg-emerald-100 text-emerald-700':l.status==='PENDING'?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700')}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 rounded-2xl shadow-lg ring-1 ring-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Receiving Oversight</h3>
              <Link href="/receiving-oversight" className="text-sm text-blue-600 hover:underline">Open</Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {kpi('Pending', recStats.pending, 'bg-slate-500/90')}
              {kpi('Partial', recStats.partial, 'bg-orange-500/90')}
              {kpi('Completed', recStats.completed, 'bg-emerald-600/90')}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {kpi('Drug', recStats.drug, 'bg-blue-600/90')}
              {kpi('Non-Drug', recStats.nonDrug, 'bg-purple-600/90')}
            </div>
            <div className="text-xs text-slate-500 mb-2">Latest receipts</div>
            <div className="space-y-2 max-h-56 overflow-auto">
              {recStats.latest.map((r)=> (
                <div key={r.po+r.date} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{r.po}</div>
                    <div className="text-xs text-slate-500 truncate">{r.supplier} • {r.date}</div>
                  </div>
                  {badge(r.status.charAt(0).toUpperCase()+r.status.slice(1), r.status==='completed'?'bg-emerald-100 text-emerald-700':r.status==='partial'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-700')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links removed as requested */}
      </div>
    </div>
  );
}

// Tiles removed


