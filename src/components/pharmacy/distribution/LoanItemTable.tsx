import React from 'react';
import {
    Trash2,
    Plus,
    AlertTriangle,
    Minus,
    MessageSquare,
    Package,
    Disc
} from 'lucide-react';
import {
    IconButton,
    Input,
    Badge,
} from '@/components/ui';
import type { UnitCatalogItemWithRelations } from '@/types/pharmacy';
import ItemSearchSelect from './ItemSearchSelect';

export interface LoanItem {
    id: string; // unit_catalog_item_id
    name: string;
    code: string;
    type: 'drug' | 'non_drug';
    quantity: number;
    unit: string;
    current_stock: number;
    remarks: string;
}

interface LoanItemTableProps {
    items: LoanItem[];
    onAddItem: (item: UnitCatalogItemWithRelations) => void;
    onRemoveItem: (id: string) => void;
    onUpdateQuantity: (id: string, quantity: number) => void;
    onUpdateRemarks: (id: string, remarks: string) => void;
    mode: 'borrow' | 'lend';
}

const LoanItemTable: React.FC<LoanItemTableProps> = ({
    items,
    onAddItem,
    onRemoveItem,
    onUpdateQuantity,
    onUpdateRemarks,
    mode
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Requested Items</h3>
                    <p className="text-xs text-slate-500 font-medium">Add products by searching below</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="info" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-100">
                        {items.length} Items Selected
                    </Badge>
                </div>
            </div>

            <ItemSearchSelect onSelect={onAddItem} />

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">Quantity</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic font-medium">
                                    No items added to the list yet.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 flex-shrink-0">
                                                {item.type === 'drug' ? (
                                                    <Disc className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <Package className="w-4 h-4 text-indigo-600" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                    {item.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="gray" size="sm" className="font-mono text-[9px] uppercase tracking-tighter py-0">
                                                        {item.code}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.unit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 ring-1 ring-inset ring-transparent focus-within:ring-blue-500/10 focus-within:border-blue-500/30 transition-all">
                                                <IconButton
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                    className="h-7 w-7 rounded-md hover:bg-white hover:text-blue-600 text-slate-400 shadow-none border-none"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </IconButton>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                                                    className="w-16 h-7 text-center border-none bg-transparent font-black text-slate-900 focus-visible:ring-0 p-0 text-sm"
                                                />
                                                <IconButton
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                    className="h-7 w-7 rounded-md hover:bg-white hover:text-blue-600 text-slate-400 shadow-none border-none"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </IconButton>
                                            </div>
                                            {mode === 'lend' && item.current_stock < item.quantity && (
                                                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-tight animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Insuff. Stock ({item.current_stock})
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="relative group/note max-w-[240px]">
                                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/note:text-blue-500 transition-colors" />
                                            <Input
                                                value={item.remarks}
                                                onChange={(e) => onUpdateRemarks(item.id, e.target.value)}
                                                placeholder="Add remarks..."
                                                className="pl-9 h-9 text-xs border-slate-200 bg-slate-50/50 focus:bg-white rounded-lg"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <IconButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemoveItem(item.id)}
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </IconButton>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {items.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 border-dashed rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <AlertTriangle className="w-4 h-4 text-slate-400" />
                        Please verify quantities before completing the request
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Qty</div>
                            <div className="text-lg font-black text-slate-900 tracking-tighter">
                                {items.reduce((acc, item) => acc + item.quantity, 0)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanItemTable;
