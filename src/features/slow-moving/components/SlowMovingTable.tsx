import { useState } from 'react';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SlowMovingItem } from '../services/slowMovingData';

type SlowMovingTableProps = {
  items: SlowMovingItem[];
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
};

export function SlowMovingTable({ items, categoryFilter, onCategoryFilterChange }: SlowMovingTableProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'Warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Monitor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Normal': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleBulkIssue = () => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id));
    // Pass all selected items as JSON in URL parameter
    const itemsJson = encodeURIComponent(JSON.stringify(selectedItemsData));
    const params = new URLSearchParams({
      bulkItems: itemsJson
    });
    window.open(`/issuing?${params.toString()}`, '_blank');
  };

  const handleBulkTransfer = () => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id));
    // Pass all selected items as JSON in URL parameter
    const itemsJson = encodeURIComponent(JSON.stringify(selectedItemsData));
    const params = new URLSearchParams({
      bulkItems: itemsJson
    });
    window.open(`/borrowing/transfer?${params.toString()}`, '_blank');
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

  const handleIssueAction = (item: SlowMovingItem) => {
    // Create a new request with the item pre-filled
    const params = new URLSearchParams({
      prefillItem: 'true',
      itemName: item.name,
      drugCode: item.sku,
      category: item.category,
      quantity: item.currentStock.toString(),
      batchNumber: item.batch,
      expiryDate: item.expiry,
      unitCost: item.unitCost.toString(),
      priority: item.status === 'Critical' ? 'URGENT' : item.status === 'Warning' ? 'HIGH' : 'MEDIUM'
    });
    window.open(`/issuing?${params.toString()}`, '_blank');
  };

  const handleTransferAction = (item: SlowMovingItem) => {
    // Create a new transfer with the item pre-filled
    const params = new URLSearchParams({
      prefillItem: 'true',
      itemName: item.name,
      drugCode: item.sku,
      category: item.category,
      quantity: item.currentStock.toString(),
      batchNumber: item.batch,
      expiryDate: item.expiry,
      unitCost: item.unitCost.toString(),
      priority: item.status === 'Critical' ? 'URGENT' : item.status === 'Warning' ? 'HIGH' : 'MEDIUM'
    });
    window.open(`/borrowing/transfer?${params.toString()}`, '_blank');
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">Slow-Moving Stock</CardTitle>
            <p className="text-sm text-slate-600">Items with low movement requiring attention</p>
          </div>
          <div className="flex items-center gap-4">
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">{selectedItems.size} selected</span>
                <button
                  onClick={handleBulkIssue}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  Bulk Issue
                </button>
                <button
                  onClick={handleBulkTransfer}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                >
                  Bulk Transfer
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Filter by Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Categories</option>
                <option value="Drug">Drug</option>
                <option value="Non-drug">Non-drug</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-center py-3 px-2 font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === items.length && items.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Item & SKU</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Category</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Batch</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Expiry</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-700">Stock</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-700">Days of Inventory</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Last Movement</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-700">Turnover Rate</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-700">Value</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-700">Actions</th>
                  </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-slate-600 font-mono text-xs mt-1">{item.sku}</div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.category === 'Drug' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-700 font-mono text-xs">{item.batch}</td>
                  <td className="py-3 px-2 text-slate-700">{formatDate(item.expiry)}</td>
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
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleIssueAction(item)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        title="Issue to Intra-Facility"
                      >
                        Issue
                      </button>
                      <button
                        onClick={() => handleTransferAction(item)}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                        title="Transfer to Inter-Facility"
                      >
                        Transfer
                      </button>
                    </div>
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


