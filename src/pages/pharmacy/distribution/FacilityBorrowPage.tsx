import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Truck,
    Save,
    Calendar,
    FileText,
    CircleCheck
} from 'lucide-react';
import {
    Button,
    IconButton,
    Card,
    Badge,
    Input,
    Textarea,
    Spinner
} from '@/components/ui';
import { createLoanRecord } from '@/services/pharmacy/interfacilityLoanService';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import FacilitySelectionModal from '@/components/pharmacy/distribution/FacilitySelectionModal';
import LoanItemTable, { type LoanItem } from '@/components/pharmacy/distribution/LoanItemTable';
import type { UnitCatalogItemWithRelations } from '@/types/pharmacy';

const FacilityBorrowPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Facility Selection State
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<{
        id: string;
        name: string;
        type: 'hospital' | 'clinic';
        state?: string;
        city?: string
    } | null>(null);

    // Loan Details State
    const [items, setItems] = useState<LoanItem[]>([]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelectFacility = (facility: { id: string; name: string; type: 'hospital' | 'clinic'; state?: string; city?: string }) => {
        setSelectedFacility(facility);
        setIsFacilityModalOpen(false);
    };

    const handleAddItem = (catalogItem: UnitCatalogItemWithRelations) => {
        // Prevent duplicate items
        if (items.some(i => i.id === catalogItem.id)) {
            toast.error("Item already added to the list");
            return;
        }

        const name = catalogItem.drug?.drug_name ||
            catalogItem.non_drug?.item_name ||
            catalogItem.contract?.item_name ||
            catalogItem.appl_drug?.item_name ||
            catalogItem.lp_drug?.item_name ||
            "Unknown Item";

        const code = catalogItem.drug?.drug_code ||
            catalogItem.non_drug?.item_code ||
            catalogItem.contract?.item_code ||
            catalogItem.appl_drug?.item_code ||
            catalogItem.lp_drug?.item_code ||
            "N/A";

        const unit = catalogItem.drug?.unit_of_measure ||
            catalogItem.non_drug?.unit_of_measure ||
            catalogItem.contract?.item_name?.split(' ').pop() ||
            "Unit";

        const newItem: LoanItem = {
            id: catalogItem.id,
            name,
            code,
            type: catalogItem.item_type,
            quantity: 1,
            unit,
            current_stock: 0, // In borrow, we don't necessarily care about our stock
            remarks: ''
        };

        setItems(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleUpdateQuantity = (id: string, quantity: number) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    };

    const handleUpdateRemarks = (id: string, remarks: string) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, remarks } : i));
    };

    const handleSubmit = async () => {
        if (!user?.id || !user?.hospital_id || !selectedFacility) return;

        if (items.length === 0) {
            toast.error("Please add at least one item to borrow");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await createLoanRecord(user.hospital_id, user.id, {
                loan_type: 'borrowed',
                counterparty_facility_id: selectedFacility.id,
                counterparty_name: selectedFacility.name,
                notes,
                items: items.map(i => ({
                    item_id: i.id,
                    item_type: i.type,
                    quantity: i.quantity,
                    notes: i.remarks
                }))
            });

            if (!response.error) {
                toast.success("Borrow request created successfully");
                navigate(ROUTES.PHARMACY_INTER_FACILITY_LIST);
            } else {
                toast.error(response.error);
            }
        } catch (error) {
            console.error('Error creating borrow record:', error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(ROUTES.PHARMACY_INTER_FACILITY_LIST)}
                        className="rounded-full hover:bg-slate-100"
                        aria-label="Back to Distribution"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </IconButton>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Truck className="w-6 h-6 text-blue-600" />
                            Borrow Items
                        </h1>
                        <p className="text-slate-500 text-sm">Create a new borrowing record from an external facility</p>
                    </div>
                </div>

                {selectedFacility && items.length > 0 && (
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 min-w-[160px]"
                    >
                        {isSubmitting ? (
                            <Spinner size="sm" className="mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Complete Request
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Facility & Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-blue-50/50 -mr-4 -mt-4 transform rotate-12 transition-transform group-hover:scale-110">
                            <Building2 className="w-24 h-24" />
                        </div>

                        <div className="relative">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Source Facility</h3>

                            {!selectedFacility ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                                        <p className="text-sm text-slate-500 mb-4">No facility selected yet</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsFacilityModalOpen(true)}
                                            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                                        >
                                            Select Facility
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-black text-xl text-slate-900 leading-tight mb-1 uppercase tracking-tight">
                                                {selectedFacility.name}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={selectedFacility.type === 'hospital' ? 'info' : 'gray'} size="sm">
                                                    {selectedFacility.type === 'hospital' ? 'Hospital' : 'Clinic'}
                                                </Badge>
                                                {selectedFacility.city && (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <CircleCheck className="w-3 h-3 text-emerald-500" />
                                                        {selectedFacility.city}, {selectedFacility.state}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsFacilityModalOpen(true)}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto"
                                    >
                                        Change facility
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Additional Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Request Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        value={new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        disabled
                                        className="pl-10 bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Internal Notes</label>
                                <Textarea
                                    placeholder="Add any relevant information about this borrowing..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Items List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 min-h-[500px]">
                        {!selectedFacility ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-200">
                                    <Building2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">First, select a facility</h3>
                                <p className="text-slate-500 max-w-sm mb-6">
                                    You need to specify which hospital or clinic you are borrowing items from before adding any products.
                                </p>
                                <Button
                                    size="lg"
                                    onClick={() => setIsFacilityModalOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
                                >
                                    Select Source Facility
                                </Button>
                            </div>
                        ) : (
                            <LoanItemTable
                                items={items}
                                onAddItem={handleAddItem}
                                onRemoveItem={handleRemoveItem}
                                onUpdateQuantity={handleUpdateQuantity}
                                onUpdateRemarks={handleUpdateRemarks}
                                mode="borrow"
                            />
                        )}
                    </Card>
                </div>
            </div>

            <FacilitySelectionModal
                isOpen={isFacilityModalOpen}
                onClose={() => setIsFacilityModalOpen(false)}
                onSelect={handleSelectFacility}
                title="Select Facility to Borrow From"
            />
        </div>
    );
};

export default FacilityBorrowPage;
