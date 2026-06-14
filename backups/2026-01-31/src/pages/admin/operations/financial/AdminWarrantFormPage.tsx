import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Calendar,
    Check,
    ArrowLeft,
    Wallet,
    Info
} from 'lucide-react';
import { useAuthStore, useIsSessionReady } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Label } from '@/components/ui/label';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';
import { adminWarrantService } from '@/services/admin/adminWarrantService';
import type { AdminWarrantFormData } from '@/types/adminOperations.types';
import {
    ADMIN_WARRANT_PROGRAMS,
    ADMIN_WARRANT_OBJEKS,
    AdminWarrantProgramCode,
    getKategorisForObjek
} from '@/lib/adminWarrantConstants';
import { ROUTES } from '@/lib/constants';

const AdminWarrantFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isSessionReady = useIsSessionReady();
    const hospitalId = user?.hospital_id;

    const isEditing = !!id;

    // ========== STATE MANAGEMENT ==========
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<AdminWarrantFormData>({
        warrant_date: new Date().toISOString().split('T')[0],
        document_no: '',
        program_code: '',
        objek_code: '',
        kategori_code: '',
        amount: 0,
        description: '',
        fiscal_year: new Date().getFullYear()
    });

    // ========== COMPUTED VALUES ==========
    const availableObjeks = useMemo(() => {
        if (!formData.program_code) return [];
        return ADMIN_WARRANT_OBJEKS[formData.program_code as AdminWarrantProgramCode] || [];
    }, [formData.program_code]);

    const availableKategoris = useMemo(() => {
        if (!formData.program_code || !formData.objek_code) return [];
        return getKategorisForObjek(formData.program_code as AdminWarrantProgramCode, formData.objek_code);
    }, [formData.program_code, formData.objek_code]);


    const programOptions = useMemo(() => {
        return ADMIN_WARRANT_PROGRAMS.map(prog => ({
            value: prog.code,
            label: prog.code,
            subLabel: prog.label
        }));
    }, []);

    const objekOptions = useMemo(() => {
        return availableObjeks.map(obj => ({
            value: obj.code,
            label: obj.code,
            subLabel: obj.label
        }));
    }, [availableObjeks]);

    const kategoriOptions = useMemo(() => {
        return availableKategoris.map(kat => ({
            value: kat.code,
            label: kat.code === '27000' ? kat.label : `${kat.code} - ${kat.label}${kat.isSharedBudget ? ' (Shared)' : ''}`,
            subLabel: kat.description || kat.label,
            isShared: kat.isSharedBudget
        }));
    }, [availableKategoris]);

    // ========== DATA FETCHING ==========
    useEffect(() => {
        const fetchWarrant = async () => {
            if (!id) return;
            try {
                const warrant = await adminWarrantService.getAdminWarrantById(id);
                setFormData({
                    warrant_date: warrant.warrant_date,
                    document_no: warrant.document_no || '',
                    program_code: warrant.program_code || '',
                    objek_code: warrant.objek_code || '',
                    kategori_code: warrant.kategori_code || '',
                    amount: warrant.amount,
                    description: warrant.description || '',
                    fiscal_year: warrant.fiscal_year || new Date().getFullYear()
                });
            } catch (err) {
                console.error('Failed to fetch warrant:', err);
                toast.error('Failed to load warrant details');
                navigate(ROUTES.ADMIN_OPERATIONS_WARRANT);
            } finally {
                setIsLoading(false);
            }
        };

        if (isEditing && isSessionReady) {
            fetchWarrant();
        }
    }, [id, isEditing, isSessionReady, navigate]);

    // ========== FORM HANDLERS ==========
    const handleFormChange = (field: keyof AdminWarrantFormData, value: string | number) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            // Reset dependent fields
            if (field === 'program_code') {
                updated.objek_code = '';
                updated.kategori_code = '';
            } else if (field === 'objek_code') {
                updated.kategori_code = '';
            }
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hospitalId || !user) return;

        // Validation
        if (!formData.program_code || !formData.objek_code || !formData.kategori_code) {
            toast.error('Please select Program, Objek, and Kategori');
            return;
        }
        if (!formData.amount || formData.amount <= 0) {
            toast.error('Amount must be greater than zero');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing && id) {
                await adminWarrantService.updateAdminWarrant(id, formData);
                toast.success('Warrant updated successfully');
            } else {
                await adminWarrantService.createAdminWarrant(hospitalId, user.id, formData);
                toast.success('Warrant created successfully');
            }
            navigate(ROUTES.ADMIN_OPERATIONS_WARRANT);
        } catch (err) {
            console.error('Failed to save warrant:', err);
            toast.error(isEditing ? 'Failed to update warrant' : 'Failed to create warrant');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isSessionReady || isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="w-8 h-8 text-violet-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-4">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_WARRANT)}
                        className="text-slate-500 hover:text-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            {isEditing ? 'Edit Warrant Record' : 'Create New Warrant'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isEditing ? 'Update the details of the selected warrant record.' : 'Enter details to issue a new budget warrant.'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border-violet-100 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 py-2.5">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                                    <span className="w-1.5 h-4 bg-violet-600 rounded-full"></span>
                                    Core Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="warrant_date" className="text-sm font-medium text-slate-700">Issue Date</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                                            <Input
                                                id="warrant_date"
                                                type="date"
                                                value={formData.warrant_date}
                                                onChange={(e) => handleFormChange('warrant_date', e.target.value)}
                                                className="pl-10 h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="document_no" className="text-sm font-medium text-slate-700">Document No.</Label>
                                        <Input
                                            id="document_no"
                                            value={formData.document_no}
                                            onChange={(e) => handleFormChange('document_no', e.target.value)}
                                            className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500 font-mono text-lg"
                                            placeholder="e.g. WA/2025/001"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-sm font-medium text-slate-700">Warrant Amount (RM)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">RM</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.amount || ''}
                                            onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
                                            className="pl-12 h-12 text-2xl font-bold text-violet-700 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        className="min-h-[80px] text-base border-slate-200 focus:border-violet-500 focus:ring-violet-500 resize-none p-3"
                                        placeholder="What is this warrant for?"
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-100 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 py-2.5">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                                    <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                                    Budget Classification
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <CustomSelect
                                        label="Program (Aktiviti)"
                                        value={formData.program_code}
                                        options={programOptions}
                                        onValueChange={(v) => handleFormChange('program_code', v)}
                                        placeholder="Choose Program..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <CustomSelect
                                            label="Objek"
                                            value={formData.objek_code}
                                            options={objekOptions}
                                            onValueChange={(v) => handleFormChange('objek_code', v)}
                                            disabled={!formData.program_code}
                                            placeholder="Choose Objek..."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <CustomSelect
                                            label="Kategori"
                                            value={formData.kategori_code}
                                            options={kategoriOptions}
                                            onValueChange={(v) => handleFormChange('kategori_code', v)}
                                            disabled={!formData.objek_code}
                                            placeholder="Choose Kategori..."
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar / Info Card */}
                    <div className="space-y-4">
                        <Card className="border-slate-200 shadow-sm sticky top-4">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-slate-800">Summary & Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div className="p-3 rounded-xl bg-violet-50 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-violet-600 font-semibold uppercase">
                                        <span>Current Status</span>
                                        <span className="px-2 py-0.5 rounded-full bg-violet-100">Draft</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-lg bg-violet-500 text-white">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Proposed Amount</p>
                                            <p className="text-xl font-bold text-slate-900">
                                                RM {formData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full h-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <Spinner className="w-4 h-4 mr-2" />
                                        ) : (
                                            <Check className="w-4 h-4 mr-2" />
                                        )}
                                        {isEditing ? 'Update Warrant' : 'Create Warrant'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-10 border-slate-200 text-slate-600 hover:bg-slate-50"
                                        onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_WARRANT)}
                                    >
                                        Cancel
                                    </Button>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 text-amber-800 text-xs">
                                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                        <p>
                                            Double check the <b>Classification</b> before submitting.
                                            Changing these after creation may affect budget reporting.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminWarrantFormPage;
