import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Badge,
    Spinner
} from '@/components/ui';
import {
    Package,
    CornerDownLeft,
    AlertCircle,
    Info,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { recordLoanReturn } from '@/services/pharmacy/interfacilityLoanService';
import { useAuth } from '@/hooks/useAuth';

interface LoanReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    loanId: string;
    loanNumber: string;
    loanType: 'borrowed' | 'lent';
    items: any[];
}

const LoanReturnModal: React.FC<LoanReturnModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    loanId,
    loanNumber,
    loanType,
    items: loanItems
}) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [returnItems, setReturnItems] = useState<Record<string, number>>({});
    const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

    const handleQuantityChange = (itemId: string, val: string, max: number) => {
        const num = parseInt(val) || 0;
        if (num < 0) return;
        if (num > max) {
            toast.error(`Cannot return more than remaining (${max})`);
            return;
        }
        setReturnItems(prev => ({ ...prev, [itemId]: num }));
    };

    const handleSubmit = async () => {
        const payload = Object.entries(returnItems)
            .filter(([_, qty]) => qty > 0)
            .map(([loan_item_id, quantity]) => ({
                loan_item_id,
                quantity,
                notes: itemNotes[loan_item_id] || ''
            }));

        if (payload.length === 0) {
            toast.error("Please enter quantity for at least one item");
            return;
        }

        setIsLoading(true);
        try {
            const response = await recordLoanReturn(user!.hospital_id, user!.id, loanId, payload);
            if (response.error) {
                toast.error(response.error);
            } else {
                toast.success("Return processed successfully");
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error submitting return:', error);
            toast.error("Failed to process return");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <CornerDownLeft className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                Process Return
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-bold">
                                <span className="uppercase">{loanNumber}</span>
                                <span className="text-slate-300">|</span>
                                <Badge variant={loanType === 'borrowed' ? 'warning' : 'info'} size="sm" className="uppercase text-[10px] py-0 px-2 leading-none">
                                    {loanType}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm italic">Inventory Note</h4>
                            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                                {loanType === 'lent'
                                    ? "Processing this return will INCREASE your current inventory as items are returned to your facility."
                                    : "Processing this return will DECREASE your current inventory as items are sent back to the source facility."
                                }
                            </p>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-5 py-3">Item Description</th>
                                    <th className="px-5 py-3 text-center">Remaining</th>
                                    <th className="px-5 py-3 w-[120px] text-right">Return Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loanItems.map((item) => {
                                    const details = item.catalog_item_details;
                                    const name = details?.drug?.drug_name || details?.non_drug?.item_name || "Unknown Item";
                                    const code = details?.drug?.drug_code || details?.non_drug?.item_code || "N/A";
                                    const returnedCount = Number(item.quantity_returned || 0);
                                    const remaining = Number(item.quantity_loaned) - returnedCount;

                                    if (remaining <= 0) return null;

                                    return (
                                        <React.Fragment key={item.id}>
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 mt-1">
                                                            <Package className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm tracking-tight">{name}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{code}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <Badge variant="gray" className="font-bold text-sm bg-slate-100 text-slate-700">
                                                        {remaining}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Input
                                                        type="number"
                                                        className="text-right font-black text-blue-600 focus:ring-blue-500"
                                                        placeholder="0"
                                                        value={returnItems[item.id] !== undefined ? returnItems[item.id] : ''}
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value, remaining)}
                                                        min={0}
                                                        max={remaining}
                                                    />
                                                </td>
                                            </tr>
                                            {(returnItems[item.id] || 0) > 0 && (
                                                <tr className="bg-blue-50/30">
                                                    <td colSpan={3} className="px-5 pb-3 pt-0">
                                                        <div className="flex items-center gap-2">
                                                            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                            <Input
                                                                size="sm"
                                                                placeholder="Add remarks for this item..."
                                                                className="h-8 text-[11px] bg-white border-blue-100 focus:border-blue-300"
                                                                value={itemNotes[item.id] || ''}
                                                                onChange={(e) => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading} className="font-bold text-slate-500">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 px-8"
                    >
                        {isLoading ? (
                            <><Spinner size="sm" className="mr-2" />Processing...</>
                        ) : (
                            <><CheckCircle2 className="w-4 h-4 mr-2" />Confirm Return</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LoanReturnModal;
