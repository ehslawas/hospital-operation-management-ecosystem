import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { SlowMovingItem } from '../services/slowMovingData';

type SlowMovingTableProps = {
  items: SlowMovingItem[];
};

export function SlowMovingTable({ items }: SlowMovingTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'Warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Monitor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Normal': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTurnoverColor = (rate: number) => {
    if (rate < 0.3) return 'text-red-600';
    if (rate < 0.6) return 'text-orange-600';
    if (rate < 1.0) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-800">Slow-Moving Stock</CardTitle>
        <p className="text-sm text-slate-600">Items with low movement requiring attention</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-slate-700">Item</th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">SKU</th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">Category</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Stock</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Days of Inventory</th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">Last Movement</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Turnover Rate</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Value</th>
                <th className="text-center py-3 px-2 font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="font-medium text-slate-900">{item.name}</div>
                  </td>
                  <td className="py-3 px-2 text-slate-600">{item.sku}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.category === 'Drug' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-slate-700">{item.currentStock}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={`font-medium ${
                      item.daysOfInventory > 180 ? 'text-red-600' : 
                      item.daysOfInventory > 120 ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {item.daysOfInventory}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-700">{formatDate(item.lastMovement)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={`font-medium ${getTurnoverColor(item.turnoverRate)}`}>
                      {item.turnoverRate.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-slate-900">
                    {formatCurrency(item.totalValue)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
