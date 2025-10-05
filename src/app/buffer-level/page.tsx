import { getItems, getBatches } from '@/features/pharmacy-logistics/services/dataStore';
import BufferLevelTable from '@/components/BufferLevelTable';

export const dynamic = 'force-dynamic';

export default async function BufferLevelPage() {
  const allItems = getItems().sort((a, b) => a.name.localeCompare(b.name));
  const batches = getBatches();

  // Calculate on-hand per item
  const onHandByItem = new Map<string, number>();
  for (const batch of batches) {
    onHandByItem.set(batch.itemId, (onHandByItem.get(batch.itemId) || 0) + batch.quantity);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Buffer Level Configuration</h1>
            <p className="mt-2 text-slate-600">Configure inventory levels, reorder points, and purchasing parameters</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="text-sm font-semibold text-blue-800 mb-2">Total Items</div>
              <div className="text-3xl font-bold text-blue-900">{allItems.length}</div>
              <div className="text-xs text-blue-700 mt-1">Configured items</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="text-sm font-semibold text-amber-800 mb-2">Low Stock Items</div>
              <div className="text-3xl font-bold text-amber-900">
                {allItems.filter(item => (onHandByItem.get(item.id) || 0) < item.minLevel).length}
              </div>
              <div className="text-xs text-amber-700 mt-1">Below minimum level</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-200 to-green-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="text-sm font-semibold text-emerald-800 mb-2">Drug Items</div>
              <div className="text-3xl font-bold text-emerald-900">
                {allItems.filter(item => item.category === 'Drug').length}
              </div>
              <div className="text-xs text-emerald-700 mt-1">Pharmaceutical items</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-violet-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="text-sm font-semibold text-purple-800 mb-2">Non-Drug Items</div>
              <div className="text-3xl font-bold text-purple-900">
                {allItems.filter(item => item.category === 'Non-drug').length}
              </div>
              <div className="text-xs text-purple-700 mt-1">Medical supplies</div>
            </div>
          </div>
        </div>

        {/* Buffer Level Configuration Table */}
        <BufferLevelTable 
          items={allItems}
          onHandByItem={onHandByItem}
          batches={batches}
        />
      </div>
    </div>
  );
}
