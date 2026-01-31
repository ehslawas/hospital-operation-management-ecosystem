import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { adminProcurementService } from '@/services/admin/adminProcurementService';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';

interface Supplier {
    id: string;
    company_name: string;
}

const AdminPurchaseOrderCreatePage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        order_date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        notes: '',
        items: [] as {
            item_description: string;
            quantity: number;
            unit_price: number;
            specifications: string;
        }[]
    });

    useEffect(() => {
        const fetchSuppliers = async () => {
            if (!user?.hospital_id) return;
            const { data } = await supabase
                .from('suppliers')
                .select('id, company_name')
                .eq('hospital_id', user.hospital_id)
                .order('company_name');

            if (data) setSuppliers(data);
        };
        fetchSuppliers();
    }, [user?.hospital_id]);

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { item_description: '', quantity: 1, unit_price: 0, specifications: '' }
            ]
        }));
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.hospital_id || !user?.id) return;
        if (!formData.supplier_id) {
            toast.error('Please select a supplier');
            return;
        }
        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setSubmitting(true);
        try {
            await adminProcurementService.createAdminPurchaseOrder(
                user.hospital_id,
                user.id,
                formData
            );
            toast.success('Purchase Order created successfully');
            navigate(ROUTES.ADMIN_OPERATIONS_PROCUREMENT);
        } catch (error) {
            console.error(error);
            toast.error('Failed to create purchase order');
        } finally {
            setSubmitting(false);
        }
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Top Decoration */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />

            <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 group"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </Button>
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
                                Create Order
                            </h1>
                            <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500/50 inline-block" />
                                New Procurement Request
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/60 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-sm">
                        <span className="px-4 py-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase bg-slate-100/50 rounded-full">DRAFT</span>
                        <span className="px-3 text-xs font-medium text-slate-400">ID: #AUTO-GEN</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* General Information Section */}
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-1">
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Order Details</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Provide the essential details for this purchase order. Ensure the supplier is correct.
                            </p>
                        </div>

                        <Card className="lg:col-span-2 border-0 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/5 bg-white overflow-hidden rounded-2xl">
                            <CardContent className="p-8 grid gap-8 md:grid-cols-2">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Order Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.order_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                                        required
                                        className="h-12 bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 rounded-xl font-medium text-slate-700"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Supplier</Label>
                                    <Select
                                        value={formData.supplier_id}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, supplier_id: val }))}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 rounded-xl font-medium text-slate-700">
                                            <SelectValue placeholder="Select Supplier" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="py-3 rounded-lg focus:bg-indigo-50 cursor-pointer text-slate-700 font-medium">
                                                    {s.company_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Notes & Reference</Label>
                                    <div className="relative">
                                        <Textarea
                                            placeholder="Add any internal notes, reference numbers, or special instructions..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            className="min-h-[120px] bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 rounded-xl font-medium text-slate-700 resize-none p-4"
                                        />
                                        <div className="absolute bottom-3 right-3 pointer-events-none">
                                            <div className="w-4 h-4 rounded-full bg-slate-200/50" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="w-full h-px bg-slate-200/60" />

                    {/* Order Items Section */}
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-1 space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2">Order Items</h2>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                    List the items to be procured. Be specific with descriptions and specifications.
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={handleAddItem}
                                className="w-full justify-start h-12 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-200 shadow-sm transition-all duration-200 rounded-xl font-semibold group"
                            >
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Plus className="h-3.5 w-3.5" />
                                </div>
                                Add New Item
                            </Button>

                            {formData.items.length > 0 && (
                                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10 mt-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
                                    <div className="relative z-10">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Estimated Cost</p>
                                        <p className="text-3xl font-bold font-mono tracking-tight">
                                            RM <span className="text-indigo-400">{calculateTotal().toFixed(2)}</span>
                                        </p>
                                        <p className="text-slate-500 text-xs mt-4">
                                            {formData.items.length} item{formData.items.length !== 1 ? 's' : ''} in list
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            {formData.items.length === 0 ? (
                                <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-6 group transition-colors hover:bg-slate-50 hover:border-indigo-200">
                                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Plus className="h-6 w-6 text-slate-400 group-hover:text-indigo-500" />
                                    </div>
                                    <h3 className="text-slate-900 font-semibold text-lg">Empty List</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm">
                                        Click the "Add New Item" button to start building your purchase order.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] hover:border-indigo-100/50 transition-all duration-300">
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full p-0"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid gap-6">
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</Label>
                                                        <Input
                                                            placeholder="Product name, brand..."
                                                            value={item.item_description}
                                                            onChange={(e) => handleItemChange(index, 'item_description', e.target.value)}
                                                            className="border-0 border-b border-slate-200 rounded-none px-0 focus:ring-0 focus:border-indigo-500 font-medium text-slate-700 bg-transparent placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specs</Label>
                                                        <Input
                                                            placeholder="Size, color, etc..."
                                                            value={item.specifications}
                                                            onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                                                            className="border-0 border-b border-slate-200 rounded-none px-0 focus:ring-0 focus:border-indigo-500 text-slate-600 bg-transparent placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-end gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                                className="h-9 bg-white border-slate-200 rounded-lg text-center font-semibold text-slate-700"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Price</Label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">RM</span>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.unit_price}
                                                                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                    className="h-9 bg-white border-slate-200 rounded-lg pl-9 font-semibold text-slate-700"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right pl-4 border-l border-slate-200">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total</span>
                                                        <span className="text-lg font-bold text-indigo-600 font-mono">
                                                            {(item.quantity * item.unit_price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none p-6">
                        <div className="max-w-4xl mx-auto pointer-events-auto">
                            <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 pl-6 flex items-center justify-between ring-1 ring-slate-900/5">
                                <div className="text-sm font-medium text-slate-500">
                                    Ready to process?
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => navigate(-1)}
                                        className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl px-6"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : 'Create Order'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminPurchaseOrderCreatePage;
