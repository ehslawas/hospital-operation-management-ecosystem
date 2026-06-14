import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    QrCode,
    Package,
    MapPin,
    Calendar,
    ArrowRight
} from 'lucide-react';
import {
    Button,
    Card,
    Input,
    Badge,
    Select,
    Skeleton,
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    toast
} from '@/components/ui';
import { getRegisteredItems, RegisteredItemWithRelations } from '@/services/pharmacy/itemRegistryService';
import { useHospitalId } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';

const ItemListPage: React.FC = () => {
    const navigate = useNavigate();
    const hospital_id = useHospitalId();
    const [items, setItems] = useState<RegisteredItemWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        item_type: '' as any,
        status: '' as any
    });

    const fetchItems = async () => {
        if (!hospital_id) return;
        setIsLoading(true);
        try {
            const { data, error } = await getRegisteredItems(hospital_id, {
                search: searchQuery,
                item_type: filters.item_type || undefined,
                status: filters.status || undefined
            });
            if (error) throw new Error(error);
            setItems(data || []);
        } catch (err: any) {
            toast.error('Failed to load items', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [hospital_id, filters]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchItems();
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'available': return 'success';
            case 'issued': return 'info';
            case 'consumed': return 'gray';
            case 'expired':
            case 'damaged': return 'error';
            default: return 'gray';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Physical Item Registry</h1>
                    <p className="text-sm text-gray-500">Manage and track individual serial-numbered items</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(ROUTES.PHARMACY_ITEM_REGISTRATION)}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Manual Register
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigate(ROUTES.PHARMACY_ITEM_QR_GEN)}
                    >
                        <QrCode className="h-4 w-4 mr-2" /> Bulk QR Generate
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by QR or Serial Number..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={filters.item_type}
                            onChange={(e) => setFilters({ ...filters, item_type: e.target.value })}
                            className="w-40"
                        >
                            <option value="">All Types</option>
                            <option value="drug">Drug</option>
                            <option value="non_drug">Non-Drug</option>
                        </Select>
                        <Select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-40"
                        >
                            <option value="">All Status</option>
                            <option value="available">Available</option>
                            <option value="issued">Issued</option>
                            <option value="consumed">Consumed</option>
                            <option value="damaged">Damaged</option>
                        </Select>
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                    </div>
                </form>
            </Card>

            {/* List */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item / Serial</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Scanned</TableHead>
                                <TableHead> </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                        <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        No registered items found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(ROUTES.PHARMACY_ITEM_DETAILS.replace(':id', item.id))}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <QrCode className="h-4 w-4 text-slate-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 truncate max-w-[200px]">
                                                        {item.item_details?.drug_name || item.item_details?.item_name || 'Unknown Item'}
                                                    </div>
                                                    <div className="text-xs font-mono text-gray-500">
                                                        {item.serial_number || 'No Serial'}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.item_type === 'drug' ? 'info' : 'success'} size="sm">
                                                {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <MapPin className="h-3 w-3" />
                                                {item.current_location}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(item.status)} size="sm">
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-gray-600">
                                                {item.last_scanned_at ? (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(item.last_scanned_at).toLocaleDateString()}
                                                    </span>
                                                ) : 'Never Scanned'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <ArrowRight className="h-4 w-4 text-gray-300" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default ItemListPage;
