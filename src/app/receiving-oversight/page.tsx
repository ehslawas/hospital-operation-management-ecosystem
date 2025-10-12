'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconSearch, IconCheck, IconClock, IconPackage } from '@/components/ui/Icons';

type Item = {
  id: string;
  name: string;
  sku: string;
  ordered: number;
  received: number;
  receipts?: { qty: number; expiry: string; batch: string; date: string }[];
};

type ReceivingPO = {
  id: string;
  poNumber: string;
  lpoNumber: string;
  supplier: string;
  deliveryDate?: string; // last arrival date
  items: Item[];
  doFiles: string[]; // uploaded DOs for reference
};

function generateMock(): ReceivingPO[] {
  const data: ReceivingPO[] = [];
  const suppliers = ['PharmaCorp Sdn Bhd', 'CarePlus Medical', 'MediSupply Malaysia'];
  for (let i = 1; i <= 100; i++) {
    const ordered1 = 500 + (i % 5) * 200;
    const received1 = (i % 3) * 200; // 0,200,400 pattern
    const ordered2 = 300 + (i % 4) * 100;
    const received2 = (i % 2) * 100; // 0,100 pattern

    const dateStr = `2025-10-${String((i % 27) + 1).padStart(2, '0')}`;
    const exp1 = `2026-${String(((i % 11) + 1)).padStart(2, '0')}-28`;
    const exp2 = `2027-${String(((i % 11) + 1)).padStart(2, '0')}-15`;
    // create multi-part receipts to demonstrate partial receiving
    const partSplit = (total: number) => {
      if (total <= 0) return [] as { qty: number; expiry: string; batch: string; date: string }[];
      if (total <= 100) return [{ qty: total, expiry: exp1, batch: `B-${i}-A`, date: dateStr }];
      const first = Math.floor(total * 0.4);
      const second = Math.min(total - first, total);
      const third = total - first - second;
      const arr = [
        { qty: first, expiry: exp1, batch: `B-${i}-A`, date: dateStr },
        { qty: second, expiry: exp2, batch: `B-${i}-B`, date: `2025-10-${String(((i+2) % 27) + 1).padStart(2,'0')}` },
      ] as { qty: number; expiry: string; batch: string; date: string }[];
      if (third > 0) arr.push({ qty: third, expiry: exp1, batch: `B-${i}-C`, date: `2025-10-${String(((i+5) % 27) + 1).padStart(2,'0')}` });
      return arr;
    };
    const items: Item[] = [
      {
        id: `i${i}-1`,
        name: i % 2 ? 'Paracetamol 500mg' : 'Surgical Gloves (M)',
        sku: i % 2 ? 'PAR-500' : 'GLOV-M',
        ordered: ordered1,
        received: received1,
        receipts: partSplit(received1),
      },
      {
        id: `i${i}-2`,
        name: i % 2 ? 'Ibuprofen 400mg' : 'Syringe 5ml',
        sku: i % 2 ? 'IBU-400' : 'SYR-5',
        ordered: ordered2,
        received: received2,
        receipts: partSplit(received2),
      },
    ];
    data.push({
      id: String(i),
      poNumber: `PO-${1000 + i}`,
      lpoNumber: `LPO-2025-${String(i).padStart(3, '0')}`,
      supplier: suppliers[i % suppliers.length],
      deliveryDate: `2025-10-${String((i % 27) + 1).padStart(2, '0')}`,
      items,
      doFiles: i % 3 === 0 ? [`DO-${2000 + i}.pdf`] : [],
    });
  }
  return data;
}

export default function ReceivingOversightPage() {
  const [records, setRecords] = useState<ReceivingPO[]>(generateMock());
  const [department, setDepartment] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tab, setTab] = useState<'all' | 'pending' | 'partial' | 'completed'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [activePO, setActivePO] = useState<ReceivingPO | null>(null);
  const [activeItemId, setActiveItemId] = useState<string>('');
  const [receivedDate, setReceivedDate] = useState<string>('');
  const [receiveForm, setReceiveForm] = useState<Record<string, { qty: number; expiry: string; batch: string }>>({});
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewPO, setViewPO] = useState<ReceivingPO | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<Record<string, boolean>>({});

  const hasLabelsToPrint = useMemo(() => Object.values(receiveForm).some(v => (v?.qty || 0) > 0), [receiveForm]);

  function handlePrintLabels() {
    if (!activePO) return;
    const rows = activePO.items
      .map(it => ({ it, row: receiveForm[it.id] }))
      .filter(({ row }) => row && row.qty > 0) as { it: Item; row: { qty: number; expiry: string; batch: string } }[];
    if (rows.length === 0) {
      alert('No quantities entered to print labels.');
      return;
    }
    const w = window.open('', '_blank');
    if (!w) return;
    const styles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      @page { margin: 5mm; size: landscape; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 6px; background: #f8fafc; }
      .grid { display: flex; flex-wrap: wrap; gap: 6px; }
      .label { 
        width: 90mm; 
        height: 50mm; 
        border: 2px solid #0f172a; 
        background: #fff; 
        display: flex; 
        padding: 8px; 
        gap: 8px; 
        page-break-inside: avoid; 
      }
      .qr-section { 
        flex-shrink: 0; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        gap: 4px; 
        padding: 4px; 
        background: #f8fafc; 
        border-radius: 4px; 
      }
      .info-section { 
        flex: 1; 
        display: flex; 
        flex-direction: column; 
        justify-content: space-between; 
        min-width: 0; 
      }
      .item-name { 
        font-size: 16px; 
        font-weight: 700; 
        color: #0f172a; 
        line-height: 1.2; 
        margin-bottom: 2px; 
        overflow: hidden; 
        text-overflow: ellipsis; 
        display: -webkit-box; 
        -webkit-line-clamp: 2; 
        -webkit-box-orient: vertical; 
      }
      .sku { 
        font-size: 10px; 
        color: #64748b; 
        font-weight: 600; 
        letter-spacing: 0.5px; 
      }
      .details { 
        display: grid; 
        grid-template-columns: auto 1fr; 
        gap: 4px 8px; 
        margin-top: 6px; 
        padding: 6px; 
        background: #f8fafc; 
        border-radius: 4px; 
      }
      .detail-label { 
        font-size: 9px; 
        font-weight: 700; 
        color: #475569; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
      }
      .detail-value { 
        font-size: 11px; 
        font-weight: 600; 
        color: #0f172a; 
      }
      .qty-badge { 
        background: #0f172a; 
        color: #fff; 
        padding: 2px 8px; 
        border-radius: 4px; 
        font-weight: 700; 
      }
      .footer-info { 
        font-size: 8px; 
        color: #64748b; 
        margin-top: 4px; 
        padding-top: 4px; 
        border-top: 1px solid #e2e8f0; 
      }
      .qr-label { 
        font-size: 7px; 
        color: #64748b; 
        font-weight: 600; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
      }
    `;
    const htmlCards = rows.map(({ it, row }, idx) => {
      const payload = btoa(JSON.stringify({
        itemName: it.name,
        sku: it.sku,
        batch: row.batch,
        expiry: row.expiry,
        qty: row.qty,
        po: activePO.poNumber,
        lpo: activePO.lpoNumber,
        date: receivedDate
      }));
      const poTxt = it.poNumber ? it.poNumber : activePO.poNumber;
      const lpoTxt = activePO.lpoNumber || '-';
      const doTxt = '-';
      return `
      <div class="label"> 
        <div class="qr-section">
          <div id="qr-${idx}" style="width:80px;height:80px"></div>
          <div class="qr-label">SCAN ME</div>
        </div>
        <div class="info-section">
          <div>
            <div class="item-name">${it.name}</div>
            <div class="sku">${it.packaging ? it.packaging : it.sku}</div>
            <div class="details">
              <span class="detail-label">Batch</span>
              <span class="detail-value">${row.batch || '-'}</span>
              <span class="detail-label">Expiry</span>
              <span class="detail-value">${row.expiry || '-'}</span>
              <span class="detail-label">Quantity</span>
              <span class="detail-value"><span class="qty-badge">${row.qty} units</span></span>
              <span class="detail-label">Location</span>
              <span class="detail-value">${it.location || '-'}</span>
            </div>
          </div>
          <div class="footer-info">${poTxt} • ${lpoTxt} • ${doTxt} • Date Receive: ${receivedDate}</div>
        </div>
        <div data-qrpayload="${payload}" id="qr-data-${idx}" style="display:none"></div>
      </div>`;
    }).join('\n');
    w.document.write(`<!doctype html><html><head><meta charset='utf-8'><title>Labels</title><style>${styles}</style></head><body><div class="grid">${htmlCards}</div><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script><script>(function(){var nodes=document.querySelectorAll('[id^=qr-]');nodes.forEach(function(n,i){var data=document.getElementById('qr-data-'+i).getAttribute('data-qrpayload');new QRCode(n,{text:atob(data)?atob(data):data,width:80,height:80});}); window.onload=()=>{window.print();};})();</script></body></html>`);
    w.document.close();
  }

  function handlePrintLabelsFromView() {
    if (!viewPO) return;
    const rows: { name: string; sku: string; qty: number; expiry: string; batch: string; date: string }[] = [];
    viewPO.items.forEach(it => {
      (it.receipts || []).forEach((rc, idx) => {
        const key = `${it.id}-${idx}`;
        if (selectedLabels[key]) {
          rows.push({ name: it.name, sku: it.sku, qty: rc.qty, expiry: rc.expiry, batch: rc.batch, date: rc.date });
        }
      });
    });
    if (rows.length === 0) {
      alert('No receipts to print labels.');
      return;
    }
    const w = window.open('', '_blank');
    if (!w) return;
    const styles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      @page { margin: 5mm; size: landscape; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 6px; background: #f8fafc; }
      .grid { display: flex; flex-wrap: wrap; gap: 6px; }
      .label { 
        width: 90mm; 
        height: 50mm; 
        border: 2px solid #0f172a; 
        background: #fff; 
        display: flex; 
        padding: 8px; 
        gap: 8px; 
        page-break-inside: avoid; 
      }
      .qr-section { 
        flex-shrink: 0; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        gap: 4px; 
        padding: 4px; 
        background: #f8fafc; 
        border-radius: 4px; 
      }
      .info-section { 
        flex: 1; 
        display: flex; 
        flex-direction: column; 
        justify-content: space-between; 
        min-width: 0; 
      }
      .item-name { 
        font-size: 16px; 
        font-weight: 700; 
        color: #0f172a; 
        line-height: 1.2; 
        margin-bottom: 2px; 
        overflow: hidden; 
        text-overflow: ellipsis; 
        display: -webkit-box; 
        -webkit-line-clamp: 2; 
        -webkit-box-orient: vertical; 
      }
      .sku { 
        font-size: 10px; 
        color: #64748b; 
        font-weight: 600; 
        letter-spacing: 0.5px; 
      }
      .details { 
        display: grid; 
        grid-template-columns: auto 1fr; 
        gap: 4px 8px; 
        margin-top: 6px; 
        padding: 6px; 
        background: #f8fafc; 
        border-radius: 4px; 
      }
      .detail-label { 
        font-size: 9px; 
        font-weight: 700; 
        color: #475569; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
      }
      .detail-value { 
        font-size: 11px; 
        font-weight: 600; 
        color: #0f172a; 
      }
      .qty-badge { 
        background: #0f172a; 
        color: #fff; 
        padding: 2px 8px; 
        border-radius: 4px; 
        font-weight: 700; 
      }
      .footer-info { 
        font-size: 8px; 
        color: #64748b; 
        margin-top: 4px; 
        padding-top: 4px; 
        border-top: 1px solid #e2e8f0; 
      }
      .qr-label { 
        font-size: 7px; 
        color: #64748b; 
        font-weight: 600; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
      }
    `;
    const htmlCards = rows.map((r, idx) => {
      const payload = btoa(JSON.stringify({
        itemName: r.name,
        sku: r.sku,
        batch: r.batch,
        expiry: r.expiry,
        qty: r.qty,
        po: viewPO.poNumber,
        lpo: viewPO.lpoNumber,
        date: r.date
      }));
      return `
      <div class=\"label\"> 
        <div class=\"qr-section\">
          <div id=\"qr-${idx}\" style=\"width:80px;height:80px\"></div>
          <div class=\"qr-label\">SCAN ME</div>
        </div>
        <div class=\"info-section\">
          <div>
            <div class=\"item-name\">${r.name}</div>
            <div class=\"sku\">${r.packaging ? r.packaging : r.sku}</div>
            <div class=\"details\">
              <span class=\"detail-label\">Batch</span>
              <span class=\"detail-value\">${r.batch || '-'}</span>
              <span class=\"detail-label\">Expiry</span>
              <span class=\"detail-value\">${r.expiry || '-'}</span>
              <span class=\"detail-label\">Quantity</span>
              <span class=\"detail-value\"><span class=\"qty-badge\">${r.qty} units</span></span>
              <span class="detail-label">Location</span>
              <span class="detail-value">${r.location || '-'}</span>
            </div>
          </div>
          <div class=\"footer-info\">${viewPO.poNumber} • ${viewPO.lpoNumber || '-'} • - • Date Receive: ${r.date}</div>
        </div>
        <div data-qrpayload=\"${payload}\" id=\"qr-data-${idx}\" style=\"display:none\"></div>
      </div>`;
    }).join('\n');
    w.document.write(`<!doctype html><html><head><meta charset='utf-8'><title>Labels</title><style>${styles}</style></head><body><div class=\"grid\">${htmlCards}</div><script src=\"https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js\"></script><script>(function(){var nodes=document.querySelectorAll('[id^=qr-]');nodes.forEach(function(n,i){var data=document.getElementById('qr-data-'+i).getAttribute('data-qrpayload');new QRCode(n,{text:atob(data)?atob(data):data,width:80,height:80});}); window.onload=()=>{window.print();};})();</script></body></html>`);
    w.document.close();
  }

  const annotated = useMemo(() => {
    return records.map(r => {
      const totalOrdered = r.items.reduce((s, it) => s + it.ordered, 0);
      const totalReceived = r.items.reduce((s, it) => s + Math.min(it.ordered, it.received), 0);
      const pct = totalOrdered ? Math.round((totalReceived / totalOrdered) * 100) : 0;
      const status: 'pending' | 'partial' | 'completed' = pct === 0 ? 'pending' : pct >= 100 ? 'completed' : 'partial';
      return { ...r, _totalOrdered: totalOrdered, _totalReceived: totalReceived, _pct: pct, _status: status } as any;
    });
  }, [records]);

  const kpis = useMemo(() => {
    const total = annotated.length;
    const pending = annotated.filter((r: any) => r._status === 'pending').length;
    const partial = annotated.filter((r: any) => r._status === 'partial').length;
    const completed = annotated.filter((r: any) => r._status === 'completed').length;
    return { total, pending, partial, completed };
  }, [annotated]);

  const filtered = useMemo(() => {
    return (annotated as any[]).filter(r => {
      const matchQ = !search || [r.poNumber, r.lpoNumber, r.supplier].some(x => x.toLowerCase().includes(search.toLowerCase()));
      const d = r.deliveryDate ?? '';
      const matchFrom = !dateFrom || d >= dateFrom;
      const matchTo = !dateTo || d <= dateTo;
      const matchTab = tab === 'all' ? true : r._status === tab;
      return matchQ && matchFrom && matchTo && matchTab;
    });
  }, [annotated, search, dateFrom, dateTo, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);

  function openReceive(po: ReceivingPO) {
    setActivePO(po);
    setActiveItemId(po.items[0]?.id ?? '');
    const init: Record<string, { qty: number; expiry: string; batch: string }> = {};
    po.items.forEach(it => { init[it.id] = { qty: 0, expiry: '', batch: '' }; });
    setReceiveForm(init);
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  }

  function saveReceive() {
    if (!activePO) return;
    // validate rows with qty > 0 must have expiry and batch
    for (const it of activePO.items) {
      const row = receiveForm[it.id];
      if (row && row.qty > 0 && (!row.expiry || !row.batch)) {
        alert('Please provide Expiry Date and Batch Number for items with quantity.');
        return;
      }
    }
    setRecords(prev => prev.map(r => {
      if (r.id !== activePO.id) return r;
      const items = r.items.map(it => {
        const row = receiveForm[it.id];
        if (!row || row.qty <= 0) return it;
        const updated = { ...it, received: Math.min(it.ordered, it.received + row.qty) } as Item;
        const receipt = { qty: row.qty, expiry: row.expiry, batch: row.batch, date: receivedDate };
        updated.receipts = [...(it.receipts || []), receipt];
        return updated;
      });
      return { ...r, items, deliveryDate: receivedDate || r.deliveryDate };
    }));
    setModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-4 space-y-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-slate-200 p-6">
          <div className="flex items-center gap-4">
            <Link href="/procurement" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <IconArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Receiving Oversight</h1>
              <p className="text-sm text-slate-600 mt-1">Monitor received quantities by PO/LPO and record partial receipts.</p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-200 p-5 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-600/80" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Total POs</div>
                <div className="text-2xl font-bold text-slate-900">{kpis.total}</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 grid place-content-center">
                <IconPackage className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-200 p-5 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-600/80" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Completed</div>
                <div className="text-2xl font-bold text-green-700">{kpis.completed}</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-content-center">
                <IconCheck className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-200 p-5 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-500/90" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Partial</div>
                <div className="text-2xl font-bold text-amber-700">{kpis.partial}</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 grid place-content-center">
                <IconClock className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-200 p-5 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-slate-400/90" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Pending</div>
                <div className="text-2xl font-bold text-slate-700">{kpis.pending}</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 grid place-content-center">
                <IconClock className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PO/LPO/Supplier..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800" />
            <div className="flex items-center gap-2">
              <button onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); }} className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50">Reset</button>
            </div>
            <div className="flex items-center">
              <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                {['all','pending','partial','completed'].map(v => (
                  <button
                    key={v}
                    onClick={() => setTab(v as any)}
                    className={`px-3.5 py-2 text-xs font-semibold transition-colors ${tab===v?'bg-blue-600 text-white':'bg-white text-slate-700 hover:bg-slate-100'}`}
                  >
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60">
            <h2 className="text-lg font-bold text-slate-900">Purchase Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 backdrop-blur sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">PO / LPO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Last Received</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginated.map((po: any) => {
                  const totalOrdered = po._totalOrdered;
                  const totalReceived = po._totalReceived;
                  const pct = po._pct;
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">{po.poNumber}</div>
                        <div className="text-[11px] text-slate-500">{po.lpoNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-200 grid place-content-center text-[10px] font-bold text-slate-700">{po.supplier.split(' ').map((s:string)=>s[0]).join('').slice(0,2)}</div>
                          {po.supplier}
                        </div>
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => { 
                        setViewPO(po); 
                        const init: Record<string, boolean> = {}; 
                        po.items.forEach((it: Item) => (it.receipts || []).forEach((_, idx) => { init[`${it.id}-${idx}`] = false; }));
                        setSelectedLabels(init);
                        setViewModalOpen(true); 
                      }} title="View receiving records">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 w-12 text-right">{pct}%</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">{totalReceived}/{totalOrdered} units delivered</div>
                        {/* Details hidden here; click to view in modal */}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">{po.deliveryDate || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {department === 'Office Admin' ? (
                          <button className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-300 text-slate-600 cursor-not-allowed" aria-disabled title="View-only for Office Admin">Record Receiving</button>
                        ) : (
                          <button onClick={() => openReceive(po)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Record Receiving</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="text-sm text-slate-600">Page {currentPage} of {totalPages}</div>
            <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
              <button disabled={currentPage===1} onClick={() => setCurrentPage(p => Math.max(1, p-1))} className={`px-3 py-1.5 text-sm ${currentPage===1?'text-slate-400':'hover:bg-slate-100 text-slate-700'}`}>Prev</button>
              <button disabled={currentPage===totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} className={`px-3 py-1.5 text-sm border-l border-slate-200 ${currentPage===totalPages?'text-slate-400':'hover:bg-slate-100 text-slate-700'}`}>Next</button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalOpen && activePO && department !== 'Office Admin' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Record Receiving - {activePO.poNumber}</h3>
                  <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-sm text-slate-600">PO</div>
                    <div className="font-medium">{activePO.poNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">LPO</div>
                    <div className="font-medium">{activePO.lpoNumber}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Received Date</label>
                    <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Item</th>
                        <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Qty Purchased</th>
                        <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Qty Received</th>
                        <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Receive Now</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Expiry</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700">BN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activePO.items.map(it => {
                        const row = receiveForm[it.id] || { qty: 0, expiry: '', batch: '' };
                        const remaining = Math.max(0, it.ordered - it.received);
                        return (
                          <tr key={it.id}>
                            <td className="px-3 py-2 text-sm">
                              <div className="font-medium">{it.name}</div>
                              <div className="text-xs text-slate-500">{it.sku}</div>
                            </td>
                            <td className="px-3 py-2 text-sm text-right">{it.ordered.toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm text-right">{it.received.toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm text-right">
                              <input
                                type="number"
                                min={0}
                                max={remaining}
                                value={row.qty || ''}
                                onChange={(e) => setReceiveForm(prev => ({ ...prev, [it.id]: { ...row, qty: Math.max(0, Math.min(parseInt(e.target.value) || 0, remaining)) } }))}
                                className="w-24 px-2 py-1 border border-slate-200 rounded-md text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <input
                                type="date"
                                value={row.expiry}
                                onChange={(e) => setReceiveForm(prev => ({ ...prev, [it.id]: { ...row, expiry: e.target.value } }))}
                                className="px-2 py-1 border border-slate-200 rounded-md"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <input
                                type="text"
                                placeholder="Batch No"
                                value={row.batch}
                                onChange={(e) => setReceiveForm(prev => ({ ...prev, [it.id]: { ...row, batch: e.target.value } }))}
                                className="px-2 py-1 border border-slate-200 rounded-md"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700">Cancel</button>
                <button onClick={handlePrintLabels} disabled={!hasLabelsToPrint} className={`px-4 py-2 rounded-lg ${hasLabelsToPrint ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-white border border-slate-200 text-slate-400 cursor-not-allowed'}`}>Print Labels</button>
                <button onClick={saveReceive} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* View Records Modal - read only */}
        {viewModalOpen && viewPO && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Receiving Records - {viewPO.poNumber}</h3>
                  <button onClick={() => setViewModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">✕</button>
                </div>
              </div>
              <div className="p-5">
                {viewPO.items.every(it => (!it.receipts || it.receipts.length === 0) && (it.received || 0) === 0) ? (
                  <div className="text-sm text-slate-600">No receipts recorded yet.</div>
                ) : (
                  <div className="space-y-4">
                    {viewPO.items.map(it => (
                      <div key={it.id} className="border border-slate-200 rounded-lg">
                        <div className="px-3 py-2 bg-slate-50 text-sm font-medium text-slate-800">{it.name} <span className="text-slate-500 text-xs">({it.sku})</span></div>
                        <div className="p-3 space-y-1 text-sm">
                          {((it.receipts && it.receipts.length > 0) ? it.receipts : ((it.received || 0) > 0 ? [{ qty: it.received, expiry: '-', batch: '-', date: viewPO.deliveryDate || '-' }] : [])).map((rc, idx) => {
                            const key = `${it.id}-${idx}`;
                            return (
                              <label key={idx} className="flex items-center justify-between gap-2">
                                <input type="checkbox" className="h-4 w-4" checked={!!selectedLabels[key]} onChange={(e) => setSelectedLabels(prev => ({ ...prev, [key]: e.target.checked }))} />
                                <div className="flex-1 grid grid-cols-4 gap-2">
                                  <div className="text-slate-700">{rc.date}</div>
                                  <div className="text-slate-700">{rc.qty} units</div>
                                  <div className="text-slate-700">Exp {rc.expiry}</div>
                                  <div className="text-slate-700">BN {rc.batch}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-right space-x-2">
                <button onClick={handlePrintLabelsFromView} className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">Print Labels</button>
                <button onClick={() => setViewModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


