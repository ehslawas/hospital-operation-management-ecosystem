import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    Input,
    Spinner,
    Badge,
    Tabs,
    TabsList,
    TabsTrigger
} from '@/components/ui';
import { Search, Building2, Landmark, MapPin, Phone } from 'lucide-react';
import { getHospitalFacilities } from '@/services/pharmacy/hospitalFacilityCatalogService';
import { getClinicFacilities } from '@/services/pharmacy/clinicFacilityCatalogService';
import { useAuth } from '@/hooks/useAuth';
import type { HospitalFacilityWithRelations, ClinicFacilityWithRelations } from '@/types/pharmacy';

interface FacilitySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (facility: { id: string; name: string; type: 'hospital' | 'clinic'; state?: string; city?: string }) => void;
    title?: string;
}

const FacilitySelectionModal: React.FC<FacilitySelectionModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title = "Select External Facility"
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'hospital' | 'clinic'>('hospital');
    const [searchQuery, setSearchQuery] = useState('');
    const [hospitals, setHospitals] = useState<HospitalFacilityWithRelations[]>([]);
    const [clinics, setClinics] = useState<ClinicFacilityWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user?.hospital_id) {
            loadFacilities();
        }
    }, [isOpen, user?.hospital_id, activeTab]);

    const loadFacilities = async () => {
        if (!user?.hospital_id) return;
        setIsLoading(true);
        try {
            if (activeTab === 'hospital') {
                const response = await getHospitalFacilities(user.hospital_id, { status: 'active' });
                if (!response.error && response.data) {
                    setHospitals(response.data);
                }
            } else {
                const response = await getClinicFacilities(user.hospital_id, { status: 'active' });
                if (!response.error && response.data) {
                    setClinics(response.data);
                }
            }
        } catch (error) {
            console.error('Error loading facilities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFacilities = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'hospital') {
            return hospitals.filter(h =>
                h.name.toLowerCase().includes(query) ||
                h.state?.toLowerCase().includes(query) ||
                h.city?.toLowerCase().includes(query)
            );
        } else {
            return clinics.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.state?.toLowerCase().includes(query) ||
                c.city?.toLowerCase().includes(query)
            );
        }
    }, [activeTab, searchQuery, hospitals, clinics]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, state or city..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'hospital' | 'clinic')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="hospital" className="flex items-center gap-2">
                                    <Landmark className="w-4 h-4" />
                                    Hospitals
                                </TabsTrigger>
                                <TabsTrigger value="clinic" className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Clinics
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Spinner size="lg" className="mb-4" />
                                        <p className="text-slate-500 text-sm">Loading facilities...</p>
                                    </div>
                                ) : filteredFacilities.length > 0 ? (
                                    <div className="grid gap-3">
                                        {filteredFacilities.map((facility) => (
                                            <button
                                                key={facility.id}
                                                onClick={() => onSelect({
                                                    id: facility.id,
                                                    name: facility.name,
                                                    type: activeTab,
                                                    state: facility.state,
                                                    city: facility.city
                                                })}
                                                className="flex flex-col p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-semibold text-slate-900 line-clamp-1">{facility.name}</h3>
                                                    <Badge variant={activeTab === 'hospital' ? 'primary' : 'gray'} size="sm">
                                                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-500">
                                                    {(facility.city || facility.state) && (
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                                            <span className="truncate">{facility.city}{facility.city && facility.state ? ', ' : ''}{facility.state}</span>
                                                        </div>
                                                    )}
                                                    {facility.phone && (
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                                            <span className="truncate">{facility.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                            <Search className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-slate-900 font-medium">No facilities found</p>
                                        <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
                                    </div>
                                )}
                            </div>
                        </Tabs>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
};

export default FacilitySelectionModal;
