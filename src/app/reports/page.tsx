import { getItems, getBatches, getMovements, getBadStock, getInvoices } from '@/features/pharmacy-logistics/services/dataStore';

export const dynamic = 'force-dynamic';

function generateCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

async function exportMovementsAction() {
  'use server';
  const movements = getMovements();
  return generateCSV(movements, 'movements.csv');
}

async function exportLowStockAction() {
  'use server';
  const items = getItems();
  const batches = getBatches();
  
  const onHandByItem = new Map<string, number>();
  for (const b of batches) {
    onHandByItem.set(b.itemId, (onHandByItem.get(b.itemId) || 0) + b.quantity);
  }
  
  const lowStock = items
    .map(item => ({
      itemId: item.id,
      name: item.name,
      sku: item.sku,
      onHand: onHandByItem.get(item.id) || 0,
      minLevel: item.minLevel,
      deficit: Math.max(0, item.minLevel - (onHandByItem.get(item.id) || 0))
    }))
    .filter(item => item.deficit > 0);
    
  return generateCSV(lowStock, 'low-stock.csv');
}

async function exportBadStockAction() {
  'use server';
  const badStock = getBadStock();
  return generateCSV(badStock, 'bad-stock.csv');
}

async function exportInvoicesAction() {
  'use server';
  const invoices = getInvoices();
  return generateCSV(invoices, 'invoices.csv');
}

// Mock transaction data for the modern dashboard
const mockTransactions = [
  { id: 1, date: '2024-01-15', documentNo: 'APPL-001', codeNo: '990102', voteNo: '27401', category: 'APPL Drug', department: 'Pharmacy', amount: 50000 },
  { id: 2, date: '2024-01-14', documentNo: 'APPL-002', codeNo: '990102', voteNo: '27499', category: 'APPL Non Drug', department: 'Pharmacy', amount: 25000 },
  { id: 3, date: '2024-01-13', documentNo: 'FARM-001', codeNo: '080702', voteNo: '27401', category: 'CC Drug', department: 'Pharmacy', amount: 30000 },
  { id: 4, date: '2024-01-12', documentNo: 'VAKS-001', codeNo: '990102', voteNo: '27404', category: 'APPL Vaccine', department: 'Pharmacy', amount: 5000 },
  { id: 5, date: '2024-01-11', documentNo: 'OKSIG-001', codeNo: '080702', voteNo: '27402', category: 'Oxygen', department: 'Pharmacy', amount: 15000 },
  { id: 6, date: '2024-01-10', documentNo: 'ETU-001', codeNo: '080702', voteNo: '27499', category: 'Non Standards', department: 'Emergency Department', amount: 45000 },
  { id: 7, date: '2024-01-09', documentNo: 'GW-001', codeNo: '080702', voteNo: '27499', category: 'Non Standards', department: 'General Ward', amount: 38000 },
  { id: 8, date: '2024-01-08', documentNo: 'ANAES-001', codeNo: '080702', voteNo: '27499', category: 'Non Standards', department: 'Anesthesiology', amount: 42000 },
  { id: 9, date: '2024-01-07', documentNo: 'REHAB-001', codeNo: '080702', voteNo: '27499', category: 'Non Standards', department: 'Rehabilitation Services', amount: 35000 },
  { id: 10, date: '2024-01-06', documentNo: 'NEPHRO-001', codeNo: '080702', voteNo: '27401', category: 'CC Drug', department: 'Nephrology', amount: 78500 },
  { id: 11, date: '2024-01-05', documentNo: 'NEPHRO-002', codeNo: '080702', voteNo: '27499', category: 'CC Non Drug', department: 'Nephrology', amount: 46500 },
  { id: 12, date: '2024-01-04', documentNo: 'PATOLOGI-001', codeNo: '080702', voteNo: '27403', category: 'Patologi', department: 'Pathology Laboratory', amount: 72000 },
  { id: 13, date: '2024-01-03', documentNo: 'XRAY-001', codeNo: '080702', voteNo: '27501', category: 'Xray', department: 'Radiologi', amount: 10000 },
  { id: 14, date: '2024-01-02', documentNo: 'WOUND-001', codeNo: '080702', voteNo: '27500', category: 'WoundCare', department: 'Wound Care', amount: 15000 },
  { id: 15, date: '2024-01-01', documentNo: 'CSSU-001', codeNo: '080702', voteNo: '27499', category: 'CSSU/CSSD', department: 'Central Sterile Services', amount: 6000 },
  { id: 16, date: '2023-12-31', documentNo: 'INSULIN-001', codeNo: '080702', voteNo: '27401', category: 'CC Drug', department: 'Pharmacy', amount: 2000 },
];

function getCategoryBadge(category: string) {
  const categoryStyles = {
    'APPL Drug': 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-800 border-blue-500/20',
    'APPL Non Drug': 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-800 border-green-500/20',
    'CC Drug': 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-800 border-green-500/20',
    'APPL Vaccine': 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-800 border-purple-500/20',
    'Oxygen': 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-800 border-green-500/20',
    'Non Standards': 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-800 border-gray-500/20',
    'CC Non Drug': 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-800 border-gray-500/20',
    'Patologi': 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-800 border-gray-500/20',
    'Xray': 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-800 border-gray-500/20',
    'WoundCare': 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-800 border-gray-500/20',
    'CSSU/CSSD': 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-800 border-gray-500/20',
  };

  const getDotColor = (category: string) => {
    if (category.includes('Drug') && category.includes('APPL')) return 'bg-blue-500';
    if (category.includes('Non Drug') || category.includes('CC Drug') || category.includes('Oxygen')) return 'bg-green-500';
    if (category.includes('Vaccine')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-sm shadow-sm ${categoryStyles[category] || categoryStyles['Non Standards']}`} suppressHydrationWarning>
      <div className={`w-2 h-2 rounded-full mr-2 ${getDotColor(category)}`} suppressHydrationWarning></div>
      {category}
    </span>
  );
}

export default async function ReportsPage() {
  const items = getItems();
  const batches = getBatches();
  const badStock = getBadStock();
  const invoices = getInvoices();

  // Calculate stats
  const onHandByItem = new Map<string, number>();
  for (const b of batches) {
    onHandByItem.set(b.itemId, (onHandByItem.get(b.itemId) || 0) + b.quantity);
  }

  const lowStockCount = items.filter(it => (onHandByItem.get(it.id) || 0) < it.minLevel).length;
  const nearExpiryCount = batches.filter(b => {
    const daysLeft = Math.ceil((new Date(b.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 90 && daysLeft > 0;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden" suppressHydrationWarning>
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/5 to-blue-500/5 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-green-400/5 to-emerald-500/5 rounded-full filter blur-3xl animate-pulse" suppressHydrationWarning></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.05)_1px,transparent_0)] bg-[size:32px_32px]" suppressHydrationWarning></div>
        {/* Modern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20" suppressHydrationWarning></div>
      </div>

      <div className="relative z-10 p-6 space-y-8" suppressHydrationWarning>
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl border border-white/40 shadow-xl" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/3 to-purple-500/5" suppressHydrationWarning></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl" suppressHydrationWarning></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl" suppressHydrationWarning></div>
          
          <div className="relative px-8 py-10 sm:px-10" suppressHydrationWarning>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" suppressHydrationWarning>
              <div className="flex items-center gap-6" suppressHydrationWarning>
                <div className="relative group" suppressHydrationWarning>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                  <div className="relative h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300" suppressHydrationWarning>
                    <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div suppressHydrationWarning>
                  <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3">
                    Transaction Details
                  </h1>
                  <p className="text-xl text-gray-700 max-w-2xl font-medium">
                    Financial transaction records and audit trail
                  </p>
                </div>
              </div>
              
              {/* Search and Action Buttons */}
              <div className="flex items-center gap-4" suppressHydrationWarning>
                <div className="relative" suppressHydrationWarning>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" suppressHydrationWarning>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="w-64 pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 shadow-lg"
                    suppressHydrationWarning
                  />
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  Filter
                </button>
                <form action={exportInvoicesAction} suppressHydrationWarning>
                  <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Transaction Table */}
        <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
          
          <div className="relative overflow-hidden rounded-3xl" suppressHydrationWarning>
            <table className="min-w-full divide-y divide-white/40" suppressHydrationWarning>
              <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/60 backdrop-blur-sm" suppressHydrationWarning>
                <tr suppressHydrationWarning>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" suppressHydrationWarning>Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" suppressHydrationWarning>Document No</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" suppressHydrationWarning>Code No</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" suppressHydrationWarning>Vote No</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" suppressHydrationWarning>Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" suppressHydrationWarning>Department</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider" suppressHydrationWarning>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 bg-gradient-to-br from-white/70 via-blue-50/10 to-indigo-50/20 backdrop-blur-sm" suppressHydrationWarning>
                {mockTransactions.map((transaction) => (
                  <tr key={transaction.id} className="group/row hover:bg-white/90 transition-all duration-300 hover:shadow-lg" suppressHydrationWarning>
                    <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                      <div className="flex items-center" suppressHydrationWarning>
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-3" suppressHydrationWarning></div>
                        <span className="text-sm font-medium text-gray-900" suppressHydrationWarning>{transaction.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                      <span className="text-sm font-semibold text-gray-900" suppressHydrationWarning>{transaction.documentNo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                      <span className="text-sm text-gray-600 font-mono" suppressHydrationWarning>{transaction.codeNo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                      <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200" suppressHydrationWarning>
                        {transaction.voteNo}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                      {getCategoryBadge(transaction.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                      <span className="text-sm text-gray-700" suppressHydrationWarning>{transaction.department}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" suppressHydrationWarning>
                      <span className="text-sm font-bold text-gray-900" suppressHydrationWarning>
                        RM {transaction.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Reports Section */}
        <div className="group relative bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" suppressHydrationWarning></div>
          
          <div className="relative p-8" suppressHydrationWarning>
            <div className="flex items-center gap-6 mb-6" suppressHydrationWarning>
              <div className="relative group/icon" suppressHydrationWarning>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                <div className="relative h-14 w-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300" suppressHydrationWarning>
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
        </div>
              <div suppressHydrationWarning>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">Export Reports</h2>
                <p className="text-sm text-gray-600 mt-1">Generate and download comprehensive reports</p>
        </div>
      </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" suppressHydrationWarning>
              <form action={exportMovementsAction} suppressHydrationWarning>
                <button type="submit" className="w-full group/btn flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl text-sm font-semibold text-cyan-800 hover:text-cyan-900 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
                  <svg className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
              Export Movements CSV
            </button>
          </form>
              <form action={exportLowStockAction} suppressHydrationWarning>
                <button type="submit" className="w-full group/btn flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl text-sm font-semibold text-amber-800 hover:text-amber-900 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
                  <svg className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
              Export Low Stock CSV
            </button>
          </form>
              <form action={exportBadStockAction} suppressHydrationWarning>
                <button type="submit" className="w-full group/btn flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 border border-red-500/20 hover:border-red-500/40 rounded-2xl text-sm font-semibold text-red-800 hover:text-red-900 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
                  <svg className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              Export Bad Stock CSV
            </button>
          </form>
              <form action={exportInvoicesAction} suppressHydrationWarning>
                <button type="submit" className="w-full group/btn flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-500/10 to-gray-500/10 hover:from-slate-500/20 hover:to-gray-500/20 border border-slate-500/20 hover:border-slate-500/40 rounded-2xl text-sm font-semibold text-slate-800 hover:text-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl" suppressHydrationWarning>
                  <svg className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
              Export Invoices CSV
            </button>
          </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


