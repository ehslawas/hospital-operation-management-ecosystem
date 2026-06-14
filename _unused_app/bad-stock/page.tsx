import { getItems, getBatches, getBadStock, logBadStock } from '@/features/pharmacy-logistics/services/dataStore';

export const dynamic = 'force-dynamic';

async function logBadStockAction(formData: FormData) {
  'use server';
  const itemId = String(formData.get('itemId') || '');
  const quantity = Number(formData.get('quantity') || 0);
  const reason = String(formData.get('reason') || '') as 'DAMAGED' | 'EXPIRED' | 'QUARANTINED';
  if (!itemId || !quantity || !reason) return;
  logBadStock({ itemId, quantity, reason });
}

export default async function BadStockPage() {
  const items = getItems();
  const batches = getBatches();
  const badStock = getBadStock();

  // Calculate on-hand per item
  const onHandByItem = new Map<string, number>();
  for (const b of batches) {
    onHandByItem.set(b.itemId, (onHandByItem.get(b.itemId) || 0) + b.quantity);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Bad Stock Management</h1>
        <button className="inline-flex items-center rounded-md bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700">Log Incident</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Log Bad Stock Incident</h2>
          <form action={logBadStockAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
              <select name="itemId" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-200">
                <option value="">Select item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (On-hand: {onHandByItem.get(item.id) || 0})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input name="quantity" type="number" min={1} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <select name="reason" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-200">
                <option value="">Select reason</option>
                <option value="DAMAGED">Damaged</option>
                <option value="EXPIRED">Expired</option>
                <option value="QUARANTINED">Quarantined</option>
              </select>
            </div>
            <button type="submit" className="w-full rounded-md bg-rose-600 px-4 py-2 text-white hover:bg-rose-700">Log Incident</button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Bad Stock Records</h2>
          <div className="space-y-3">
            {badStock.length === 0 ? (
              <div className="text-sm text-slate-500">No bad stock incidents recorded</div>
            ) : (
              badStock.map(incident => {
                const item = items.find(i => i.id === incident.itemId);
                return (
                  <div key={incident.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-800">{item?.name || incident.itemId}</div>
                      <div className="text-sm text-slate-500">Qty: {incident.quantity} • {incident.when}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      incident.reason === 'DAMAGED' ? 'bg-red-50 text-red-700' :
                      incident.reason === 'EXPIRED' ? 'bg-orange-50 text-orange-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {incident.reason}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



