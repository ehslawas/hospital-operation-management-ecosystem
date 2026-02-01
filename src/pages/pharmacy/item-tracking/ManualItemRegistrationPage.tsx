import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save,
    X,
    Package,
    Search,
    MapPin,
    Hash,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import {
    Button,
    Card,
    Input,
    Select,
    Spinner,
    toast,
    Label
} from '@/components/ui';
import { useHospitalId, useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import { registerItems } from '@/services/pharmacy/itemRegistryService';
import { getDrugCatalog } from '@/services/pharmacy/drugCatalogService';
import { getNonDrugCatalog } from '@/services/pharmacy/nonDrugCatalogService';
import { getStockBatches } from '@/services/pharmacy/inventoryService';

const ManualItemRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const hospital_id = useHospitalId();
    const { user } = useAuthStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [itemType, setItemType] = useState<'drug' | 'non_drug'>('drug');
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [batches, setBatches] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        serial_number: '',
        qr_code: '',
        batch_id: '',
        current_location: 'Main Store',
        quantity: 1
    });

    // Fetch Catalog Items
    useEffect(() => {
        const fetchCatalog = async () => {
            if (!hospital_id) return;
            setIsLoading(true);
            try {
                const { data, error } = itemType === 'drug'
                    ? await getDrugCatalog(hospital_id, { search: searchQuery })
                    : await getNonDrugCatalog(hospital_id, { search: searchQuery });

                if (error) throw new Error(error);
                setCatalogItems(data?.data || []);
            } catch (err: any) {
                toast.error('Failed to load catalog');
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchCatalog, 300);
        return () => clearTimeout(timer);
    }, [hospital_id, itemType, searchQuery]);

    // Fetch Batches for Selected Item
    useEffect(() => {
        const fetchBatches = async () => {
            if (!selectedItemId || !hospital_id) return;
            try {
                const { data, error } = await getStockBatches(selectedItemId, itemType);
                if (error) throw new Error(error);
                setBatches(data || []);
                if (data && data.length > 0) {
                    setFormData(prev => ({ ...prev, batch_id: data[0].id }));
                } else {
                    setFormData(prev => ({ ...prev, batch_id: '' }));
                }
            } catch (err: any) {
                toast.error('Failed to load batches');
            }
        };
        fetchBatches();
    }, [selectedItemId, hospital_id, itemType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hospital_id || !selectedItemId) {
            toast.error('Please select an item from the catalog');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = Array.from({ length: formData.quantity }).map((_, i) => ({
                item_id: selectedItemId,
                item_type: itemType,
                qr_code: formData.qr_code ? (formData.quantity > 1 ? `${formData.qr_code}-${i + 1}` : formData.qr_code) : `REG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                serial_number: formData.serial_number ? (formData.quantity > 1 ? `${formData.serial_number}-${i + 1}` : formData.serial_number) : undefined,
                batch_id: formData.batch_id || undefined,
                current_location: formData.current_location
            }));

            const { error } = await registerItems(hospital_id, payload, user?.id);
            if (error) throw new Error(error);

            toast.success(`Successfully registered ${formData.quantity} item(s)`);
            navigate(ROUTES.PHARMACY_ITEM_REGISTRY);
        } catch (err: any) {
            toast.error(`Registration failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manual Item Registration</h1>
                    <p className="text-sm text-gray-500">Add physical items to the registry without batch scanning</p>
                </div>
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-6 space-y-6">
                    <div className="space-y-4">
                        <Label>Select Item Category</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={itemType === 'drug' ? 'primary' : 'outline'}
                                className="flex-1"
                                onClick={() => { setItemType('drug'); setSelectedItemId(''); }}
                            >
                                <Package className="h-4 w-4 mr-2" /> Drug
                            </Button>
                            <Button
                                type="button"
                                variant={itemType === 'non_drug' ? 'primary' : 'outline'}
                                className="flex-1"
                                onClick={() => { setItemType('non_drug'); setSelectedItemId(''); }}
                            >
                                <AlertCircle className="h-4 w-4 mr-2" /> Non-Drug
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Search Catalog</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={`Search ${itemType === 'drug' ? 'drugs' : 'non-drugs'}...`}
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                            {isLoading ? (
                                <div className="text-center py-8"><Spinner size="sm" /></div>
                            ) : catalogItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">No items found</div>
                            ) : (
                                catalogItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItemId(item.id)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedItemId === item.id
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">
                                                    {item.drug_name || item.brand_name || item.item_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {item.drug_code || item.item_code || 'No Code'}
                                                </p>
                                            </div>
                                            {selectedItemId === item.id && (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Hash className="h-4 w-4" /> Identity Details
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="batch">Active Batch</Label>
                            <Select
                                id="batch"
                                value={formData.batch_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, batch_id: e.target.value }))}
                            >
                                <option value="">Select Batch (Optional)</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.batch_number} {b.expiry_date ? `(Exp: ${new Date(b.expiry_date).toLocaleDateString()})` : ''}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="serial">Serial Number (Optional)</Label>
                            <Input
                                id="serial"
                                placeholder="Mfg Serial Number"
                                value={formData.serial_number}
                                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="qr">Assign Custom QR (Optional)</Label>
                            <Input
                                id="qr"
                                placeholder="Auto-generated if blank"
                                value={formData.qr_code}
                                onChange={(e) => setFormData(prev => ({ ...prev, qr_code: e.target.value }))}
                            />
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Logistics
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="location">Initial Location</Label>
                            <Input
                                id="location"
                                value={formData.current_location}
                                onChange={(e) => setFormData(prev => ({ ...prev, current_location: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="qty">Quantity to Register</Label>
                            <Input
                                id="qty"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                            />
                        </div>
                    </Card>

                    <Button
                        className="w-full py-6 text-lg"
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting || !selectedItemId}
                    >
                        {isSubmitting ? <Spinner className="mr-2" /> : <Save className="mr-2" />}
                        Complete Registration
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ManualItemRegistrationPage;
