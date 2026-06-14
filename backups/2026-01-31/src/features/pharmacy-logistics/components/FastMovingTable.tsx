export type FastMovingItem = {
  id: string;
  name: string;
  sku: string;
  category: 'Drug' | 'Non-drug';
  totalMovement: number;
  rank: number;
  usagePerMonth: number;
  onHand: number;
  minLevel: number;
  location?: string;
};

type FastMovingTableProps = {
  items: FastMovingItem[];
  bare?: boolean; // when true, render rows without outer card container
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

export function FastMovingTable({ items, bare = false }: FastMovingTableProps) {
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
      rank: paddedItems.length + 1,
      usagePerMonth: 0,
      onHand: 0,
      minLevel: 0
    });
  }

  function colorsFor(category: 'Drug' | 'Non-drug') {
    return category === 'Drug'
      ? { bg: 'bg-blue-50', border: 'border-blue-200', chip: 'bg-blue-100 text-blue-700', circle: 'bg-blue-500' }
      : { bg: 'bg-green-50', border: 'border-green-200', chip: 'bg-green-100 text-green-700', circle: 'bg-green-500' };
  }

  const Rows = (
      <div className="space-y-2" suppressHydrationWarning>
        {paddedItems.map((item, index) => {
          const color = colorsFor(item.category);
          return (
            <div key={item.id} className={`flex items-center justify-between p-2.5 xs:p-3 sm:p-3 rounded-lg border ${color.border} ${color.bg} min-h-[44px] touch-target cursor-pointer hover:opacity-90 transition-opacity`} suppressHydrationWarning>
              <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1" suppressHydrationWarning>
                <span className="inline-flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 rounded-full text-[10px] xs:text-xs font-bold bg-slate-100 text-slate-700 flex-shrink-0" suppressHydrationWarning>
                  {item.name ? item.rank : index + 1}
                </span>
                <div className="min-w-0 flex-1 pr-2" suppressHydrationWarning>
                  <p className="text-xs xs:text-sm font-medium text-gray-900 truncate leading-tight" suppressHydrationWarning>{item.name || '-'}</p>
                  <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 flex-wrap" suppressHydrationWarning>
                    <span className="text-[10px] xs:text-xs text-gray-600 font-mono truncate" suppressHydrationWarning>{item.sku || '-'}</span>
                    <span className={`inline-flex items-center px-1.5 xs:px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] font-medium ${color.chip} flex-shrink-0`} suppressHydrationWarning>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[10px] xs:text-xs text-gray-600 truncate mt-0.5" suppressHydrationWarning>
                    Balance: {(item.onHand - item.minLevel) || 0} | Min: {item.minLevel > 0 ? item.minLevel.toLocaleString() : '-'}
                  </p>
                  <p className="text-[10px] xs:text-xs text-gray-600 truncate" suppressHydrationWarning>
                    Location: {item.location || '-'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center justify-center h-9 w-9 xs:h-10 xs:w-10 ${color.circle} rounded-full text-white text-xs font-bold flex-shrink-0 ml-2 touch-target`} suppressHydrationWarning>
                {item.usagePerMonth > 0 ? item.usagePerMonth : '-'}
              </div>
            </div>
          );
        })}
      </div>
  );

  if (bare) {
    return Rows;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-3" suppressHydrationWarning>
      {Rows}
    </div>
  );
}
