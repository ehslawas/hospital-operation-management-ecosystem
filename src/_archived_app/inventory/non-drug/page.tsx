import { getItems, getBatches, getLocations, issueGoods } from '@/features/pharmacy-logistics/services/dataStore';
import InventoryTable from '@/components/InventoryTable';

export const dynamic = 'force-dynamic';

async function issueAction(formData: FormData) {
  'use server';
  const itemId = String(formData.get('itemId') || '');
  const quantity = Number(formData.get('quantity') || 0);
  const destinationId = String(formData.get('destinationId') || '');
  if (!itemId || !quantity || !destinationId) return;
  issueGoods({ itemId, quantity, destinationId, fefo: true });
}

export default async function NonDrugInventoryPage() {
  const items = getItems().filter(item => item.category === 'Non-drug').sort((a, b) => a.name.localeCompare(b.name));
  const batches = getBatches();
  const locations = getLocations();

  // Calculate on-hand per item
  const onHandByItem = new Map<string, number>();
  for (const b of batches) {
    onHandByItem.set(b.itemId, (onHandByItem.get(b.itemId) || 0) + b.quantity);
  }

  // Get batches by item for expiry info
  const batchesByItem = new Map<string, typeof batches>();
  for (const b of batches) {
    if (!batchesByItem.has(b.itemId)) batchesByItem.set(b.itemId, []);
    batchesByItem.get(b.itemId)!.push(b);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Non-Drug Inventory</h1>
            <p className="mt-2 text-slate-600">Manage medical supplies and equipment inventory</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="text-sm font-semibold text-amber-800 mb-2">Low Stock Alerts</div>
              <div className="text-3xl font-bold text-amber-900">
                {items.filter(it => (onHandByItem.get(it.id) || 0) < it.minLevel).length}
              </div>
              <div className="text-xs text-amber-700 mt-1">Requires attention</div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-200 to-pink-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="text-sm font-semibold text-rose-800 mb-2">Near Expiry</div>
              <div className="text-3xl font-bold text-rose-900">
                {batches.filter(b => {
                  const daysLeft = Math.ceil((new Date(b.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return daysLeft <= 90 && daysLeft > 0;
                }).length}
              </div>
              <div className="text-xs text-rose-700 mt-1">Within 90 days</div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="text-sm font-semibold text-blue-800 mb-2">Item Batches</div>
              <div className="text-3xl font-bold text-blue-900">{batches.length}</div>
              <div className="text-xs text-blue-700 mt-1">Total batches</div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="text-sm font-semibold text-emerald-800 mb-2">Item Types</div>
              <div className="text-3xl font-bold text-emerald-900">{items.length}</div>
              <div className="text-xs text-emerald-700 mt-1">Unique items</div>
            </div>
          </div>
        </div>

        <InventoryTable 
          items={items}
          batches={batches}
          placeholder="Search item name, code, batch..."
          title="Non-Drug Stock List"
          description="Medical supplies and equipment inventory"
        />
      </div>
    </div>
  );
}
