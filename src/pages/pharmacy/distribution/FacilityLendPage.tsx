import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    HandHelping,
    Save,
    Calendar,
    Search,
    Plus,
    ShoppingCart,
    Package,
    Trash2,
    BriefcaseMedical,
    Loader2,
    X,
    AlertCircle,
    CheckCircle2,
    FileText
} from 'lucide-react';
import {
    Button,
    IconButton,
    Card,
    Badge,
    Input,
    Spinner,
    Textarea
} from '@/components/ui';
import { createLoanRecord } from '@/services/pharmacy/interfacilityLoanService';
import { searchCatalogItems } from '@/services/pharmacy/unitCatalogItemService';
import { getStockBatches } from '@/services/pharmacy/inventoryService';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import FacilitySelectionModal from '@/components/pharmacy/distribution/FacilitySelectionModal';
import { useDebounce } from '@/hooks/useDebounce';
import type { UnitCatalogItemWithRelations, StockBatchWithRelations } from '@/types/pharmacy';

interface LoanItem {
    id: string;
    name: string;
    code: string;
    item_type: 'drug' | 'non_drug';
    quantity: number;
    unit: string;
    batch_no?: string;
    expiry_date?: string;
    notes?: string;
}

const FacilityLendPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // -- State --
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<{
        id: string;
        name: string;
        type: 'hospital' | 'clinic';
        state?: string;
        city?: string
    } | null>(null);

    const [items, setItems] = useState<LoanItem[]>([]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedItemType, setSelectedItemType] = useState<'drug' | 'non_drug'>('drug');
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UnitCatalogItemWithRelations[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCatalogItem, setSelectedCatalogItem] = useState<UnitCatalogItemWithRelations | null>(null);

    const [availableBatches, setAvailableBatches] = useState<StockBatchWithRelations[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [currentStock, setCurrentStock] = useState<number | null>(null);

    const [itemQuantity, setItemQuantity] = useState<number>(1);
    const [itemBatch, setItemBatch] = useState<string>("");
    const [itemExpiry, setItemExpiry] = useState<string>("");
    const [itemNote, setItemNote] = useState<string>("");
    const [isManualBatch, setIsManualBatch] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 400);

    // -- Effects --
    useEffect(() => {
        async function fetchItems() {
            if (!debouncedSearch || debouncedSearch.length < 2 || !user?.hospital_id) {
                setSearchResults([]);
                return;
            }
            if (selectedCatalogItem) {
                const name = selectedCatalogItem.item_type === 'drug'
                    ? (selectedCatalogItem.drug?.drug_name || selectedCatalogItem.contract?.item_name)
                    : (selectedCatalogItem.non_drug?.item_name || selectedCatalogItem.contract?.item_name);
                if (searchTerm === name) return;
            }
            setIsSearching(true);
            try {
                const { data, error } = await searchCatalogItems(
                    user.hospital_id,
                    debouncedSearch,
                    selectedItemType
                );
                if (!error) setSearchResults(data || []);
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setIsSearching(false);
            }
        }
        fetchItems();
    }, [debouncedSearch, user?.hospital_id, selectedItemType, selectedCatalogItem, searchTerm]);

    useEffect(() => {
        async function fetchBatches() {
            if (!selectedCatalogItem) {
                setAvailableBatches([]);
                setCurrentStock(null);
                return;
            }
            setLoadingBatches(true);
            try {
                const itemType = selectedCatalogItem.item_type;
                const itemId = itemType === 'drug'
                    ? (selectedCatalogItem.drug_id || selectedCatalogItem.appl_drug_id || selectedCatalogItem.lp_drug_id || selectedCatalogItem.contract_id)
                    : (selectedCatalogItem.non_drug_id || selectedCatalogItem.appl_non_drug_id || selectedCatalogItem.lp_non_drug_id);

                if (itemId) {
                    const { data, error } = await getStockBatches(itemId, itemType as 'drug' | 'non_drug');
                    if (!error && data) {
                        setAvailableBatches(data);
                        const total = data.reduce((acc, b) => acc + (b.quantity_on_hand || 0), 0);
                        setCurrentStock(total);

                        // Default selection logic: existing code...
                        if (data.length === 1) {
                            setItemBatch(data[0].batch_number);
                            if (data[0].expiry_date) setItemExpiry(data[0].expiry_date);
                            setIsManualBatch(false);
                        } else if (data.length === 0) {
                            setIsManualBatch(true);
                        } else {
                            setIsManualBatch(false);
                        }
                    }
                }
            } catch (err) {
                console.error("Batch fetch error", err);
            } finally {
                setLoadingBatches(false);
            }
        }
        fetchBatches();
    }, [selectedCatalogItem]);

    // -- Handlers --
    const handleAddItem = () => {
        if (!selectedCatalogItem) return;
        if (items.some(i => i.id === selectedCatalogItem.id)) {
            toast.error("Item already in loan list");
            return;
        }

        const name = selectedCatalogItem.item_type === 'drug'
            ? (selectedCatalogItem.drug?.drug_name || selectedCatalogItem.contract?.item_name || "Unknown")
            : (selectedCatalogItem.non_drug?.item_name || selectedCatalogItem.contract?.item_name || "Unknown");
        const code = selectedCatalogItem.item_type === 'drug'
            ? (selectedCatalogItem.drug?.drug_code || selectedCatalogItem.contract?.item_code || "N/A")
            : (selectedCatalogItem.non_drug?.item_code || selectedCatalogItem.contract?.item_code || "N/A");
        const unit = selectedCatalogItem.item_type === 'drug'
            ? (selectedCatalogItem.drug?.unit_of_measure || "Unit")
            : (selectedCatalogItem.non_drug?.unit_of_measure || "Unit");

        setItems(prev => [...prev, {
            id: selectedCatalogItem.id,
            name, code, item_type: selectedCatalogItem.item_type as any,
            quantity: itemQuantity, unit,
            batch_no: itemBatch, expiry_date: itemExpiry, notes: itemNote
        }]);

        toast.success("Added to loan list");
        setSelectedCatalogItem(null);
        setSearchTerm("");
        setItemQuantity(1);
        setItemBatch("");
        setItemExpiry("");
        setItemNote("");
    };

    const handleRemoveItem = (idx: number) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!user?.id || !user?.hospital_id || !selectedFacility) return;
        setIsSubmitting(true);
        try {
            const res = await createLoanRecord(user.hospital_id, user.id, {
                loan_type: 'lent',
                counterparty_facility_id: selectedFacility.id,
                counterparty_name: selectedFacility.name,
                notes,
                items: items.map(i => ({
                    item_id: i.id,
                    item_type: i.item_type,
                    quantity: i.quantity,
                    notes: [i.notes, i.batch_no ? `Batch: ${i.batch_no}` : '', i.expiry_date ? `Exp: ${i.expiry_date}` : ''].filter(Boolean).join(' | ')
                }))
            });

            if (!res.error) {
                toast.success("Loan successfully issued");
                navigate(ROUTES.PHARMACY_INTER_FACILITY_LIST);
            } else {
                toast.error(res.error);
            }
        } catch (e) {
            toast.error("Failed to submit loan");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm/50 backdrop-blur-md bg-white/90">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <IconButton onClick={() => navigate(-1)} variant="ghost" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                            <ArrowLeft className="w-5 h-5" />
                        </IconButton>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <HandHelping className="w-5 h-5 text-emerald-600" />
                                Lend Items
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Record outgoing stock loan</p>
                        </div>
                    </div>
                    {/* Date/Status display */}
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: Main Inputs */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* 1. Target Facility */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Recipient Details</h2>
                            </div>

                            <Card className="p-0 border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                                {!selectedFacility ? (
                                    <div
                                        onClick={() => setIsFacilityModalOpen(true)}
                                        className="p-8 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-slate-50 transition-colors border-2 border-dashed border-slate-100 m-2 rounded-lg"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Building2 className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">
                                            Select Target Facility
                                        </span>
                                        <p className="text-xs text-slate-400 mt-1">Which facility is borrowing?</p>
                                    </div>
                                ) : (
                                    <div className="p-5 bg-white">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                    <Building2 className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedFacility.name}</h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant={selectedFacility.type === 'hospital' ? 'default' : 'secondary'} className="rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider">
                                                            {selectedFacility.type}
                                                        </Badge>
                                                        {selectedFacility.city && (
                                                            <span className="text-xs text-slate-500 font-medium">
                                                                {selectedFacility.city}, {selectedFacility.state}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setIsFacilityModalOpen(true)} className="text-xs hover:bg-slate-50 h-8">
                                                Change
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* 2. Add Items */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Add Inventory Items</h2>
                            </div>

                            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                                {/* Type Toggle */}
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex p-1 bg-slate-200/60 rounded-lg w-fit">
                                        <button
                                            onClick={() => { setSelectedItemType('drug'); setSelectedCatalogItem(null); setSearchTerm(""); }}
                                            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${selectedItemType === 'drug' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Drug Items
                                        </button>
                                        <button
                                            onClick={() => { setSelectedItemType('non_drug'); setSelectedCatalogItem(null); setSearchTerm(""); }}
                                            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${selectedItemType === 'non_drug' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Non-Drug Items
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Search */}
                                    <div className="relative mb-6">
                                        <div className="relative group">
                                            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input
                                                placeholder={`Type to search ${selectedItemType === 'drug' ? 'drug' : 'item'}...`}
                                                className="pl-11 h-12 text-base border-slate-200 shadow-sm bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all rounded-xl"
                                                value={searchTerm}
                                                onChange={e => { setSearchTerm(e.target.value); if (selectedCatalogItem) setSelectedCatalogItem(null); }}
                                            />
                                            {isSearching && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Spinner className="w-4 h-4 text-emerald-600" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Dropdown Results */}
                                        {searchTerm && !selectedCatalogItem && searchResults.length > 0 && (
                                            <div className="absolute top-14 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[320px] overflow-y-auto z-20 animate-in fade-in zoom-in-95 duration-150">
                                                {searchResults.map(item => {
                                                    const name = item.item_type === 'drug' ? (item.drug?.drug_name || item.contract?.item_name) : (item.non_drug?.item_name || item.contract?.item_name);
                                                    const code = item.item_type === 'drug' ? item.drug?.drug_code : item.non_drug?.item_code;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            className="w-full text-left px-5 py-3.5 hover:bg-emerald-50 border-b border-slate-50 last:border-0 transition-colors group"
                                                            onClick={() => { setSelectedCatalogItem(item); setSearchTerm(name || ""); }}
                                                        >
                                                            <div className="font-semibold text-slate-800 text-sm group-hover:text-emerald-800">{name}</div>
                                                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{code}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Configuration Panel */}
                                    {selectedCatalogItem ? (
                                        <div className="bg-slate-50/80 rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 ring-1 ring-slate-900/5">
                                            <div className="p-5 border-b border-slate-200/60 bg-white">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg leading-snug">
                                                            {selectedItemType === 'drug'
                                                                ? (selectedCatalogItem.drug?.drug_name || selectedCatalogItem.contract?.item_name)
                                                                : (selectedCatalogItem.non_drug?.item_name || selectedCatalogItem.contract?.item_name)}
                                                        </h4>
                                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-slate-500 font-medium">Balance:</span>
                                                                {loadingBatches ? (
                                                                    <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin" />
                                                                ) : (
                                                                    <Badge variant="outline" className={`${(currentStock || 0) > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                                                        {currentStock !== null ? currentStock : '--'} units
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-slate-300">|</span>
                                                            <span className="text-slate-400 font-mono text-xs">
                                                                {selectedItemType === 'drug' ? selectedCatalogItem.drug?.drug_code : selectedCatalogItem.non_drug?.item_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedCatalogItem(null); setSearchTerm(""); }} className="text-slate-400 hover:text-slate-600">
                                                        <X className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="p-5 grid grid-cols-12 gap-5">
                                                <div className="col-span-12 sm:col-span-3">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Quantity</label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={itemQuantity}
                                                            onChange={e => setItemQuantity(parseInt(e.target.value) || 1)}
                                                            className="h-11 text-center font-bold text-lg bg-white shadow-sm border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-span-12 sm:col-span-5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Batch No</label>
                                                        {availableBatches.length > 0 && (
                                                            <button
                                                                onClick={() => setIsManualBatch(!isManualBatch)}
                                                                className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                                                            >
                                                                {isManualBatch ? "Use List" : "Manual Type"}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {!isManualBatch && availableBatches.length > 0 ? (
                                                        <div className="relative">
                                                            <select
                                                                className="w-full h-11 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm appearance-none cursor-pointer"
                                                                value={itemBatch}
                                                                onChange={(e) => {
                                                                    const batch = availableBatches.find(b => b.batch_number === e.target.value);
                                                                    setItemBatch(batch?.batch_number || "");
                                                                    if (batch?.expiry_date) setItemExpiry(batch.expiry_date);
                                                                }}
                                                            >
                                                                <option value="">Select Batch ({availableBatches.length})</option>
                                                                {availableBatches.map(b => (
                                                                    <option key={b.id} value={b.batch_number}>
                                                                        {b.batch_number} (Qty: {b.quantity_on_hand})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Input
                                                            placeholder="Type Batch No"
                                                            value={itemBatch}
                                                            onChange={e => setItemBatch(e.target.value)}
                                                            className="h-11 bg-white shadow-sm border-slate-200"
                                                        />
                                                    )}
                                                </div>

                                                <div className="col-span-12 sm:col-span-4">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Expiry Date</label>
                                                    <Input
                                                        type="date"
                                                        value={itemExpiry}
                                                        onChange={e => setItemExpiry(e.target.value)}
                                                        className={`h-11 shadow-sm border-slate-200 ${!isManualBatch && itemBatch ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                                                        readOnly={!isManualBatch && availableBatches.length > 0 && !!itemBatch}
                                                    />
                                                </div>

                                                <div className="col-span-12">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Item Remarks</label>
                                                    <Input
                                                        placeholder="Add specific notes for this item..."
                                                        value={itemNote}
                                                        onChange={e => setItemNote(e.target.value)}
                                                        className="h-11 bg-white shadow-sm border-slate-200"
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                                                <Button
                                                    onClick={handleAddItem}
                                                    disabled={itemQuantity < 1}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-6 h-11 text-sm font-bold tracking-wide transition-all transform hover:-translate-y-0.5"
                                                >
                                                    <Plus className="w-5 h-5 mr-2" />
                                                    ADD ITEM TO LIST
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Empty/Placeholder State
                                        !searchTerm && (
                                            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                                    <Search className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-900 font-medium">Search Catalog</p>
                                                <p className="text-slate-500 text-sm mt-1">Find items by name or code to lend</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sticky Summary */}
                    <div className="lg:col-span-5 relative">
                        {/* 
                            This container uses sticky positioning.
                            We use 'max-h' and 'overflow-auto' for the inner list if it gets too long,
                            but 'min-h' is small ensuring it shrinks to fit content when empty/short.
                            No forced large height = no empty void.
                        */}
                        <div className="sticky top-24 space-y-3">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 px-1">
                                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                Loan Summary
                            </h2>

                            <Card className="border-slate-200 shadow-xl overflow-hidden bg-white ring-1 ring-slate-900/5 flex flex-col">
                                {/* Header */}
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Review List</h3>
                                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-600">
                                        {items.length} Items Selected
                                    </Badge>
                                </div>

                                {/* Items List - Auto height, scrolling if needed */}
                                <div className="flex-1 max-h-[55vh] overflow-y-auto min-h-[120px] bg-white p-2 space-y-2">
                                    {items.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
                                            <Package className="w-10 h-10 text-slate-200 mb-3" />
                                            <p className="text-slate-500 text-sm font-medium">List is empty</p>
                                            <p className="text-xs text-slate-400">Items you add will appear here</p>
                                        </div>
                                    ) : (
                                        items.map((item, idx) => (
                                            <div key={idx} className="group relative bg-white border border-slate-100 rounded-lg p-3 hover:border-emerald-200 hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-500 mt-0.5">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800 leading-tight">{item.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.code}</p>
                                                            </div>
                                                        </div>
                                                        {(item.batch_no || item.expiry_date || item.notes) && (
                                                            <div className="mt-2 ml-9 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                                                                {item.batch_no && <span><span className="font-bold text-[9px] uppercase text-slate-400">Batch:</span> {item.batch_no}</span>}
                                                                {item.expiry_date && <span className={new Date(item.expiry_date) < new Date() ? "text-red-500 font-bold" : ""}><span className="font-bold text-[9px] uppercase text-slate-400">Exp:</span> {item.expiry_date}</span>}
                                                                {item.notes && <span className="text-amber-600 bg-amber-50 px-1 rounded block w-fit mt-1"><AlertCircle className="w-3 h-3 inline mr-1" />{item.notes}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-slate-900">{item.quantity}</div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase">{item.unit}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 border border-slate-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer Section with Global Notes & Action */}
                                <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText className="w-3 h-3" />
                                            General Remarks
                                        </label>
                                        <Textarea
                                            placeholder="Optional notes for this entire transaction..."
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            className="bg-white border-slate-200 min-h-[80px] text-sm resize-none focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            size="lg"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || items.length === 0}
                                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg tracking-wide flex justify-between items-center px-6"
                                        >
                                            <span>CONFIRM LOAN</span>
                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-300">
                                                {items.reduce((acc, i) => acc + i.quantity, 0)} Units
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                <FacilitySelectionModal
                    isOpen={isFacilityModalOpen}
                    onClose={() => setIsFacilityModalOpen(false)}
                    onSelect={(fac) => { setSelectedFacility(fac); setIsFacilityModalOpen(false); }}
                    title="Select Receiving Facility"
                />
            </main>
        </div>
    );
};
export default FacilityLendPage;
