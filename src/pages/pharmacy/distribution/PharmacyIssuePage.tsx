"use client";

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Search,
    Trash2,
    Save,
    AlertCircle,
    Package,
    Building2,
    Truck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import {
    getDepartmentsWithCatalog,
    createPharmacyIssue
} from '@/services/pharmacy/intrafacilityTransferService';
import { searchCatalogItems } from '@/services/pharmacy/unitCatalogItemService';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

import type { UnitCatalogItemWithRelations, TransferRequestFormData } from '@/types/pharmacy';

interface DepartmentOption {
    id: string;
    catalog_id: string;
    department_name: string;
    department_code: string;
}

interface IssueItem {
    item_id: string;
    item_type: 'drug' | 'non_drug';
    item_code: string;
    item_name: string;
    quantity: number;
    notes?: string;
}

export default function PharmacyIssuePage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form State
    const [targetDepartmentId, setTargetDepartmentId] = useState<string>("");
    const [issueNotes, setIssueNotes] = useState<string>("");

    // Data State
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Item Selection State
    const [issueItems, setIssueItems] = useState<IssueItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UnitCatalogItemWithRelations[]>([]);
    const [selectedResult, setSelectedResult] = useState<UnitCatalogItemWithRelations | null>(null);
    const [addQuantity, setAddQuantity] = useState<number>(1);
    const [addItemNotes, setAddItemNotes] = useState<string>("");

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Derived State
    const selectedDepartmentCallback = useMemo(() =>
        departments.find(d => d.id === targetDepartmentId),
        [departments, targetDepartmentId]
    );

    // Load Departments on Mount
    useEffect(() => {
        if (!user?.hospital_id) return;

        const fetchDepartments = async () => {
            const res = await getDepartmentsWithCatalog(user.hospital_id);
            if (res.data) {
                setDepartments(res.data as unknown as DepartmentOption[]);
            } else {
                toast.error(res.error || "Failed to load departments");
            }
        };

        fetchDepartments();
    }, [user?.hospital_id]);

    // Handle Item Search
    useEffect(() => {
        async function doSearch() {
            if (!user?.hospital_id) return;
            if (!debouncedSearchTerm.trim()) {
                setSearchResults([]);
                return;
            }
            if (!selectedDepartmentCallback) {
                return; // Wait for department selection
            }

            setIsSearching(true);
            const res = await searchCatalogItems(
                user.hospital_id,
                debouncedSearchTerm,
                undefined,
                selectedDepartmentCallback.catalog_id
            );

            setIsSearching(false);
            if (res.data) {
                setSearchResults(res.data);
            } else {
                console.error(res.error);
                setSearchResults([]);
            }
        }

        doSearch();
    }, [debouncedSearchTerm, user?.hospital_id, selectedDepartmentCallback]);

    const handleAddItem = () => {
        if (!selectedResult || addQuantity <= 0) return;

        const isDrug = selectedResult.item_type === 'drug';

        let itemName = "Unknown Item";
        let itemCode = "N/A";

        if (isDrug) {
            itemName = selectedResult.drug?.drug_name ||
                selectedResult.appl_drug?.item_name ||
                selectedResult.lp_drug?.item_name ||
                selectedResult.contract?.item_name ||
                "Unknown Drug";
            itemCode = selectedResult.drug?.drug_code ||
                selectedResult.appl_drug?.item_code ||
                selectedResult.lp_drug?.item_code ||
                selectedResult.contract?.item_code ||
                "N/A";
        } else {
            itemName = selectedResult.non_drug?.item_name ||
                selectedResult.appl_non_drug?.item_name ||
                selectedResult.lp_non_drug?.item_name ||
                selectedResult.contract?.item_name ||
                "Unknown Non-Drug";
            itemCode = selectedResult.non_drug?.item_code ||
                selectedResult.appl_non_drug?.item_code ||
                selectedResult.lp_non_drug?.item_code ||
                selectedResult.contract?.item_code ||
                "N/A";
        }

        const newItem: IssueItem = {
            item_id: selectedResult.id,
            item_type: selectedResult.item_type,
            quantity: addQuantity,
            item_code: itemCode,
            item_name: itemName,
            notes: addItemNotes
        };

        setIssueItems(prev => [...prev, newItem]);

        // Reset selection
        setSelectedResult(null);
        setSearchTerm("");
        setAddQuantity(1);
        setAddItemNotes("");
    };

    const handleRemoveItem = (index: number) => {
        setIssueItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user?.hospital_id || !user.id) return;
        if (!targetDepartmentId) {
            toast.error("Please select a target department");
            return;
        }
        if (issueItems.length === 0) {
            toast.error("Please add at least one item to issue");
            return;
        }

        setSubmitting(true);

        const payload: TransferRequestFormData = {
            transfer_type: 'intra_facility',
            to_department_id: targetDepartmentId,
            required_date: new Date().toISOString(), // Immediate
            priority: 'normal',
            notes: issueNotes,
            items: issueItems.map(item => ({
                item_id: item.item_id,
                item_type: item.item_type,
                quantity: item.quantity,
                notes: item.notes
            }))
        };

        const res = await createPharmacyIssue(user.hospital_id, user.id, payload);

        setSubmitting(false);

        if (res.data) {
            toast.success("Items issued successfully");
            navigate(`/pharmacy/distribution`);
        } else {
            toast.error(res.error || "Failed to create issue record");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="rounded-full"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </IconButton>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-6 h-6 text-emerald-600" />
                        New Intrafacility Issue
                    </h1>
                    <p className="text-slate-500 text-sm">Pharmacy Store pushing items to Department</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: Issue Details */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-5 space-y-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-500" />
                            Issue Destination
                        </h3>

                        <CustomSelect
                            label="Target Department"
                            placeholder="Select Department"
                            options={departments.map(d => ({
                                value: d.id,
                                label: d.department_name,
                                subLabel: d.department_code
                            }))}
                            value={targetDepartmentId}
                            onValueChange={(val) => {
                                setTargetDepartmentId(val);
                                setSearchResults([]);
                                setSelectedResult(null);
                            }}
                            required
                        />

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">
                                Internal Notes
                            </label>
                            <Textarea
                                placeholder="Purpose of this proactive issue..."
                                value={issueNotes}
                                onChange={e => setIssueNotes(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                            <strong>Note:</strong> Items issued via this form will be automatically approved and marked for preparation.
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Item Selection */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-5 flex flex-col min-h-[500px]">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                            <Package className="w-4 h-4 text-emerald-500" />
                            Items to Issue
                        </h3>

                        {/* Add Item Section */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mb-6">
                            {!selectedDepartmentCallback ? (
                                <div className="text-center py-4 text-slate-500 text-sm flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Please select a target department to search items in their catalog
                                </div>
                            ) : (
                                <>
                                    {/* Search Box */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Search items to issue..."
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={e => {
                                                setSearchTerm(e.target.value);
                                                if (selectedResult) setSelectedResult(null);
                                            }}
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                        {/* Search Results Dropdown */}
                                        {searchTerm && !selectedResult && searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                                {searchResults.map(item => {
                                                    const name = item.item_type === 'drug'
                                                        ? (item.drug?.drug_name || item.contract?.item_name || "Unknown")
                                                        : (item.non_drug?.item_name || item.contract?.item_name || "Unknown");
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                                            onClick={() => {
                                                                setSelectedResult(item);
                                                                setSearchTerm(name);
                                                            }}
                                                        >
                                                            <div className="font-medium text-slate-900 text-sm">{name}</div>
                                                            <div className="text-xs text-slate-500">
                                                                Code: {item.item_type === 'drug' ? item.drug?.drug_code : item.non_drug?.item_code} | Type: {item.item_type}
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity & Add Action */}
                                    {selectedResult && (
                                        <div className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">Issue Quantity</label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={addQuantity}
                                                    onChange={e => setAddQuantity(parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                            <div className="flex-[2]">
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">Remarks (Optional)</label>
                                                <Input
                                                    placeholder="e.g. Monthly replenishment"
                                                    value={addItemNotes}
                                                    onChange={e => setAddItemNotes(e.target.value)}
                                                />
                                            </div>
                                            <Button onClick={handleAddItem} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Item
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Items List */}
                        <div className="flex-1 flex flex-col">
                            {issueItems.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-8">
                                    <Package className="w-10 h-10 mb-2 opacity-50" />
                                    <p className="text-sm">No items added to issue</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {issueItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-emerald-200 transition-colors">
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-900">{item.item_name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                                    <Badge variant="gray" className="text-[10px] px-1.5 py-0 h-4">{item.item_type}</Badge>
                                                    <span>Code: {item.item_code}</span>
                                                    {item.notes && <span className="text-blue-600 italic">- {item.notes}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-900">{item.quantity} units</div>
                                            </div>
                                            <IconButton
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="text-slate-400 hover:text-red-500"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </IconButton>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleSubmit}
                                disabled={submitting || issueItems.length === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]"
                            >
                                {submitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Complete Issue
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
