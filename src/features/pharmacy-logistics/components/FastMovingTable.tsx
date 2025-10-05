export type FastMovingItem = {
  id: string;
  name: string;
  sku: string;
  category: 'Drug' | 'Non-drug';
  totalMovement: number;
  rank: number;
};

type FastMovingTableProps = {
  items: FastMovingItem[];
};

function getCategoryBadge(category: string) {
  switch (category) {
    case 'Drug':
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-800 border border-blue-500/20 backdrop-blur-sm shadow-sm" suppressHydrationWarning>
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" suppressHydrationWarning></div>
          Drug
        </span>
      );
    case 'Non-drug':
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-800 border border-green-500/20 backdrop-blur-sm shadow-sm" suppressHydrationWarning>
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" suppressHydrationWarning></div>
          Non-drug
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-800 border border-gray-500/20 backdrop-blur-sm shadow-sm" suppressHydrationWarning>
          <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" suppressHydrationWarning></div>
          {category}
        </span>
      );
  }
}

export function FastMovingTable({ items }: FastMovingTableProps) {
  // Use items directly without any client-side processing to avoid hydration mismatches
  const paddedItems = [...items];
  
  // Ensure exactly 5 rows by padding with empty rows if needed
  while (paddedItems.length < 5) {
    paddedItems.push({
      id: `empty-${paddedItems.length}`,
      name: '',
      sku: '',
      category: 'Drug' as const,
      totalMovement: 0,
      rank: paddedItems.length + 1
    });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-white/90 via-blue-50/20 to-indigo-50/30 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500" suppressHydrationWarning>
      <table className="min-w-full divide-y divide-white/40">
        <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/60 backdrop-blur-sm">
          <tr>
            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Item Name</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SKU</th>
            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total Movement</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/40 bg-gradient-to-br from-white/70 via-blue-50/10 to-indigo-50/20 backdrop-blur-sm">
          {paddedItems.map((item, index) => (
            <tr key={item.id} className="group hover:bg-white/90 transition-all duration-300 hover:shadow-lg" suppressHydrationWarning>
              <td className="px-6 py-4 text-center" suppressHydrationWarning>
                {item.name ? (
                  <div className="relative" suppressHydrationWarning>
                    <div className={`absolute inset-0 rounded-full blur-md opacity-60 ${
                      item.rank <= 3 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                        : item.rank <= 5 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : 'bg-gradient-to-br from-gray-500 to-slate-600'
                    }`} suppressHydrationWarning></div>
                    <span className={`relative inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold shadow-xl ${
                      item.rank <= 3 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                        : item.rank <= 5 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                        : 'bg-gradient-to-br from-gray-500 to-slate-600 text-white'
                    }`} suppressHydrationWarning>
                      {item.rank}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold bg-white/60 text-gray-400 border border-gray-200/50" suppressHydrationWarning>
                    {index + 1}
                  </span>
                )}
              </td>
              <td className="px-6 py-4" suppressHydrationWarning>
                <div className="text-sm font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200" suppressHydrationWarning>
                  {item.name || '-'}
                </div>
              </td>
              <td className="px-6 py-4" suppressHydrationWarning>
                <div className="inline-flex items-center px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm" suppressHydrationWarning>
                  <span className="text-xs text-gray-600 font-mono font-medium" suppressHydrationWarning>
                    {item.sku || '-'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-center" suppressHydrationWarning>
                {item.name ? getCategoryBadge(item.category) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100/80 text-gray-500 border border-gray-200/50" suppressHydrationWarning>
                    -
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right" suppressHydrationWarning>
                <div className="text-sm font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200" suppressHydrationWarning>
                  {item.totalMovement > 0 ? (
                    <span className="inline-flex items-center gap-1" suppressHydrationWarning>
                      <span className="text-lg" suppressHydrationWarning>{item.totalMovement.toLocaleString()}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" suppressHydrationWarning>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </span>
                  ) : '-'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
