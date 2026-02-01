"use client";

import { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    Trash2,
    Save,
    Package,
    Building2,
    Calendar,
    ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import {
    getDepartmentsWithCatalog,
    createIntrafacilityRequest
} from '@/services/pharmacy/intrafacilityTransferService';
import { searchCatalogItems } from '@/services/pharmacy/unitCatalogItemService';
import { Button, IconButton, Input, Textarea, CustomSelect, Card, Badge, Spinner } from '@/components/ui';
import { toast } from 'sonner';

import type { UnitCatalogItemWithRelations, TransferRequestFormData } from '@/types/pharmacy';

interface DepartmentOption {
    id: string;
    catalog_id: string;
    department_name: string;
    department_code: string;
}

interface RequestItem {
    item_id: string;
    item_type: 'drug' | 'non_drug';
    item_code: string;
    item_name: string;
    quantity: number;
    batch_no?: string;
    expiry_date?: string;
    notes?: string;
}

interface IntrafacilityRequestFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const IntrafacilityRequestForm: React.FC<IntrafacilityRequestFormProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    // -- Form State --
    const [targetDepartmentId, setTargetDepartmentId] = useState<string>("");
    const [requiredDate, setRequiredDate] = useState<string>("");
    const [priority, setPriority] = useState<string>("normal");
    const [requestNotes, setRequestNotes] = useState<string>("");
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);

    // -- Item Search & Selection --
    const [selectedItemType, setSelectedItemType] = useState<'drug' | 'non_drug'>('drug');
    const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UnitCatalogItemWithRelations[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Temporary selection state before adding to "cart"
    const [selectedCatalogItem, setSelectedCatalogItem] = useState<UnitCatalogItemWithRelations | null>(null);
    const [itemQuantity, setItemQuantity] = useState<number>(1);
    const [itemBatch, setItemBatch] = useState<string>("");
    const [itemExpiry, setItemExpiry] = useState<string>("");
    const [itemNote, setItemNote] = useState<string>("");

    // -- Derived State --
    const selectedDepartment = useMemo(() =>
        departments.find(d => d.id === targetDepartmentId),
        [departments, targetDepartmentId]
    );

    // -- Effects --
    useEffect(() => {
        if (!user?.hospital_id) return;
        getDepartmentsWithCatalog(user.hospital_id).then(res => {
            if (res.data) setDepartments(res.data as unknown as DepartmentOption[]);
        });
    }, [user?.hospital_id]);

    useEffect(() => {
        async function doSearch() {
            if (!user?.hospital_id || !debouncedSearchTerm.trim() || !selectedDepartment) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            const res = await searchCatalogItems(
                user.hospital_id,
                debouncedSearchTerm,
                selectedItemType,
                selectedDepartment.catalog_id
            );
            setIsSearching(false);

            if (res.data) setSearchResults(res.data);
            else setSearchResults([]);
        }
        doSearch();
    }, [debouncedSearchTerm, user?.hospital_id, selectedDepartment, selectedItemType]);

    // -- Handlers --
    const handleAddItem = () => {
        if (!selectedCatalogItem || itemQuantity <= 0) return;

        const isDrug = selectedCatalogItem.item_type === 'drug';
        const name = isDrug
            ? (selectedCatalogItem.drug?.drug_name || selectedCatalogItem.contract?.item_name || 'Unknown Drug')
            : (selectedCatalogItem.non_drug?.item_name || selectedCatalogItem.contract?.item_name || 'Unknown Item');

        const code = isDrug
            ? (selectedCatalogItem.drug?.drug_code || selectedCatalogItem.contract?.item_code || 'N/A')
            : (selectedCatalogItem.non_drug?.item_code || selectedCatalogItem.contract?.item_code || 'N/A');

        const newItem: RequestItem = {
            item_id: selectedCatalogItem.id,
            item_type: selectedCatalogItem.item_type,
            item_code: code,
            item_name: name,
            quantity: itemQuantity,
            batch_no: itemBatch,
            expiry_date: itemExpiry,
            notes: itemNote
        };

        setRequestItems(prev => [...prev, newItem]);

        // Reset Item Form
        setSelectedCatalogItem(null);
        setSearchTerm("");
        setItemQuantity(1);
        setItemBatch("");
        setItemExpiry("");
        setItemNote("");
    };

    const handleRemoveItem = (index: number) => {
        setRequestItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user?.hospital_id || !user.id || !targetDepartmentId || requestItems.length === 0) {
            toast.error("Please fill in all required fields and add items.");
            return;
        }

        setSubmitting(true);
        const payload: TransferRequestFormData = {
            transfer_type: 'intra_facility',
            to_department_id: targetDepartmentId,
            required_date: requiredDate || new Date().toISOString(),
            priority: priority as any,
            notes: requestNotes,
            items: requestItems.map(i => ({
                item_id: i.item_id,
                item_type: i.item_type,
                quantity: i.quantity,
                // Append Batch/Expiry to notes if provided since backend type doesn't support them yet
                notes: [
                    i.notes,
                    i.batch_no ? `Batch: ${i.batch_no}` : null,
                    i.expiry_date ? `Exp: ${i.expiry_date}` : null
                ].filter(Boolean).join(' | ')
            }))
        };

        const res = await createIntrafacilityRequest(user.hospital_id, user.id, payload);
        setSubmitting(false);

        if (res.data) {
            toast.success("Request submitted successfully");
            onSuccess();
        } else {
            toast.error(res.error || "Failed to submit request");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1">
            {/* -- LEFT PANEL: Form & Input -- */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                {/* 1. Request Details Section */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Request Details
                    </h2>
                    <Card className="p-5 border-slate-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <CustomSelect
                                    label="Requesting From (Department)"
                                    placeholder="Select Source Department"
                                    options={departments.map(d => ({
                                        value: d.id,
                                        label: d.department_name,
                                        subLabel: d.department_code
                                    }))}
                                    value={targetDepartmentId}
                                    onValueChange={(val) => {
                                        setTargetDepartmentId(val);
                                        // Reset everything if dept changes as catalog differs
                                        setRequestItems([]);
                                        setSearchResults([]);
                                        setSelectedCatalogItem(null);
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Required Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        className="pl-10 h-11"
                                        value={requiredDate}
                                        onChange={e => setRequiredDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <CustomSelect
                                    label="Priority"
                                    value={priority}
                                    onValueChange={setPriority}
                                    options={[
                                        { value: 'low', label: 'Low', subLabel: 'Routine replenish' },
                                        { value: 'normal', label: 'Normal', subLabel: 'Standard request' },
                                        { value: 'high', label: 'High', subLabel: 'Urgent need' },
                                        { value: 'urgent', label: 'Urgent', subLabel: 'Immediate attention' }
                                    ]}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Notes</label>
                                <Textarea
                                    placeholder="Reason for request..."
                                    value={requestNotes}
                                    onChange={e => setRequestNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>
                    </Card>
                </section>

                {/* 2. Add Items Section */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                        Add Items
                    </h2>
                    <Card className="p-5 border-slate-200 shadow-sm">
                        {!selectedDepartment ? (
                            <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <Building2 className="w-10 h-10 text-slate-300 mb-3" />
                                <p className="text-slate-600 font-bold">Select a department first</p>
                                <p className="text-slate-400 text-xs mt-1">You need to choose a source department to search its catalog.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Item Type Toggle */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Item Type</label>
                                    <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                                        <button
                                            onClick={() => {
                                                setSelectedItemType('drug');
                                                setSelectedCatalogItem(null);
                                                setSearchTerm("");
                                            }}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${selectedItemType === 'drug'
                                                ? 'bg-white text-purple-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            Drug Items
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedItemType('non_drug');
                                                setSelectedCatalogItem(null);
                                                setSearchTerm("");
                                            }}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${selectedItemType === 'non_drug'
                                                ? 'bg-white text-purple-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            Non-Drug Items
                                        </button>
                                    </div>
                                </div>

                                {/* Search Input */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                                        Search {selectedItemType === 'drug' ? 'Drug' : 'Non-Drug'} Catalog
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Search by name, code..."
                                            className="pl-10 h-11 bg-white"
                                            value={searchTerm}
                                            onChange={e => {
                                                setSearchTerm(e.target.value);
                                                if (selectedCatalogItem) setSelectedCatalogItem(null);
                                            }}
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Spinner className="w-4 h-4 text-purple-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Results Dropdown */}
                                    {searchTerm && !selectedCatalogItem && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
                                            {searchResults.map(item => {
                                                const name = item.item_type === 'drug'
                                                    ? (item.drug?.drug_name || item.contract?.item_name || "Unknown")
                                                    : (item.non_drug?.item_name || item.contract?.item_name || "Unknown");
                                                return (
                                                    <button
                                                        key={item.id}
                                                        className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-slate-100 last:border-0 transition-colors"
                                                        onClick={() => {
                                                            setSelectedCatalogItem(item);
                                                            setSearchTerm(name);
                                                        }}
                                                    >
                                                        <div className="font-bold text-slate-900 text-sm">{name}</div>
                                                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                                            CODE: {item.item_type === 'drug' ? item.drug?.drug_code : item.non_drug?.item_code} • TYPE: {item.item_type.toUpperCase()}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Item Configuration */}
                                {selectedCatalogItem && (
                                    <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full mb-1 inline-block">selected item</span>
                                                <h4 className="font-black text-slate-900 text-lg leading-tight mt-1">
                                                    {selectedCatalogItem.item_type === 'drug'
                                                        ? (selectedCatalogItem.drug?.drug_name || selectedCatalogItem.contract?.item_name)
                                                        : (selectedCatalogItem.non_drug?.item_name || selectedCatalogItem.contract?.item_name)}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 mt-1 font-mono uppercase tracking-tighter">
                                                    SYSTEM CODE: {selectedCatalogItem.item_type === 'drug' ? selectedCatalogItem.drug?.drug_code : selectedCatalogItem.non_drug?.item_code}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Quantity</label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    className="bg-white h-11 border-slate-200"
                                                    value={itemQuantity}
                                                    onChange={e => setItemQuantity(parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Batch No (Opt)</label>
                                                <Input
                                                    placeholder="Batch No"
                                                    className="bg-white h-11 border-slate-200"
                                                    value={itemBatch}
                                                    onChange={e => setItemBatch(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Expiry Date</label>
                                                <Input
                                                    type="date"
                                                    className="bg-white h-11 border-slate-200"
                                                    value={itemExpiry}
                                                    onChange={e => setItemExpiry(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Notes (Opt)</label>
                                                <Input
                                                    placeholder="e.g. urgent"
                                                    className="bg-white h-11 border-slate-200"
                                                    value={itemNote}
                                                    onChange={e => setItemNote(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5 flex justify-end">
                                            <Button onClick={handleAddItem} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-purple-200">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add to List
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </section>
            </div>

            {/* -- RIGHT PANEL: Summary / Cart -- */}
            <div className="lg:col-span-12 xl:col-span-5">
                <div className="sticky top-0 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-slate-500" />
                        Request Summary
                    </h2>

                    <Card className="flex flex-col border-slate-200 shadow-xl overflow-hidden rounded-2xl min-h-[500px]">
                        {/* Cart Header */}
                        <div className="p-5 bg-slate-50 border-b border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Total Items</span>
                                <Badge variant="info" className="px-3 py-1 font-black rounded-full bg-purple-100 text-purple-700 border-0 leading-none">
                                    {requestItems.length}
                                </Badge>
                            </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white min-h-[300px]">
                            {requestItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-12">
                                    <Package className="w-16 h-16 text-slate-300 mb-4" />
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">List is empty</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tighter">Add items from the catalog search</p>
                                </div>
                            ) : (
                                requestItems.map((item, idx) => (
                                    <div key={idx} className="group relative bg-white border border-slate-100 rounded-2xl p-4 hover:border-purple-200 hover:shadow-md hover:shadow-purple-50 transition-all duration-300">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-900 leading-tight truncate" title={item.item_name}>
                                                    {item.item_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">{item.item_code}</p>

                                                {/* Meta Row */}
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {item.batch_no && (
                                                        <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                            BATCH: {item.batch_no}
                                                        </span>
                                                    )}
                                                    {item.expiry_date && (
                                                        <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                            EXP: {item.expiry_date}
                                                        </span>
                                                    )}
                                                    {item.notes && (
                                                        <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                            NOTE: {item.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-slate-900 leading-none">
                                                    {item.quantity}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Qty</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveItem(idx)}
                                            className="absolute -top-2 -right-2 bg-white text-slate-300 hover:text-red-500 hover:border-red-200 border border-slate-100 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart Footer & Action */}
                        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                                <div className="text-[10px] text-amber-800 font-bold leading-tight">
                                    TARGETING: <span className="uppercase">{selectedDepartment?.department_name || 'NOT SELECTED'}</span>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]"
                                onClick={handleSubmit}
                                disabled={submitting || requestItems.length === 0}
                            >
                                {submitting ? (
                                    <>
                                        <Spinner className="w-5 h-5 mr-3 text-white" />
                                        PROCESSING...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-3" />
                                        SUBMIT REQUEST
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                    Double-check items before submission
                                </p>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
