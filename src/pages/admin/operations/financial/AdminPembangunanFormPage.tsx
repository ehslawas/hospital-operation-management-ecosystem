import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Building2, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select, SelectItem } from '@/components/ui/Select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { adminPembangunanService } from '@/services/admin/adminPembangunanService';
import {
    ADMIN_PEMBANGUNAN_PROGRAMS,
    getPembangunanObjeks,
    getPembangunanKategoris,
    AdminPembangunanProgramCode,
    ADMIN_PEMBANGUNAN_GRADIENT
} from '@/lib/adminPembangunanConstants';
import { ROUTES } from '@/lib/constants';

// ============================================================================
// FORM SCHEMA
// ============================================================================

const formSchema = z.object({
    document_no: z.string().min(1, 'Document number is required'),
    pembangunan_date: z.string().min(1, 'Date is required'),
    program_code: z.string().min(1, 'Program is required'),
    objek_code: z.string().min(1, 'Objek is required'),
    kategori_code: z.string().min(1, 'Kategori is required'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    description: z.string().optional(),
    fiscal_year: z.number().int().min(2020)
});

type FormData = z.infer<typeof formSchema>;

export const AdminPembangunanFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form Setup
    const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            pembangunan_date: new Date().toISOString().split('T')[0],
            fiscal_year: new Date().getFullYear(),
            program_code: 'P42', // Default to P42
            amount: 0
        }
    });

    // Watch fields for cascading dropdowns
    const selectedProgram = watch('program_code');
    const selectedObjek = watch('objek_code');

    // Get available options based on selection
    const availableObjeks = selectedProgram ? getPembangunanObjeks(selectedProgram as AdminPembangunanProgramCode) : [];
    const availableKategoris = (selectedProgram && selectedObjek)
        ? getPembangunanKategoris(selectedProgram as AdminPembangunanProgramCode, selectedObjek)
        : [];

    // Fetch data if edit mode
    useEffect(() => {
        const fetchRecord = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const record = await adminPembangunanService.getAdminPembangunanById(id);
                if (record) {
                    reset({
                        document_no: record.document_no,
                        pembangunan_date: record.pembangunan_date,
                        program_code: record.program_code,
                        objek_code: record.objek_code,
                        kategori_code: record.kategori_code,
                        amount: record.amount,
                        description: record.description || '',
                        fiscal_year: record.fiscal_year
                    });
                }
            } catch (error) {
                console.error('Failed to fetch record:', error);
                toast.error('Failed to load record details');
                navigate(ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecord();
    }, [id, reset, navigate]);

    // Form Submission
    const onSubmit = async (data: FormData) => {
        if (!user?.hospital_id || !user?.id) {
            toast.error('Session invalid. Please refresh.');
            return;
        }

        setIsSaving(true);
        try {
            if (isEditMode && id) {
                await adminPembangunanService.updateAdminPembangunan(id, data);
                toast.success('Record updated successfully');
            } else {
                await adminPembangunanService.createAdminPembangunan(
                    user.hospital_id,
                    user.id,
                    data
                );
                toast.success('Record created successfully');
            }
            navigate(ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN);
        } catch (error: any) {
            console.error('Failed to save record:', error);
            if (error.code === '23505') {
                toast.error('Document number already exists');
            } else {
                toast.error('Failed to save record. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="w-8 h-8 text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN)}
                        className="text-slate-500 hover:text-emerald-600"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isEditMode ? 'Edit Allocation' : 'New Allocation'}
                        </h1>
                        <p className="text-slate-500">
                            {isEditMode ? 'Update existing Pembangunan record' : 'Create new Pembangunan P42 allocation'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-emerald-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-emerald-200 shadow-sm">
                                <Building2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-emerald-900">Allocation Details</CardTitle>
                                <CardDescription>Enter the P42 budget allocation details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">

                        {/* Top Row: Year, Date, Doc No */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Fiscal Year</Label>
                                <Input
                                    type="number"
                                    {...register('fiscal_year', { valueAsNumber: true })}
                                    className="border-emerald-200 focus:ring-emerald-500"
                                />
                                {errors.fiscal_year && <p className="text-sm text-red-500">{errors.fiscal_year.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Date</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    <Input
                                        type="date"
                                        {...register('pembangunan_date')}
                                        className="pl-10 border-emerald-200 focus:ring-emerald-500"
                                    />
                                </div>
                                {errors.pembangunan_date && <p className="text-sm text-red-500">{errors.pembangunan_date.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Document / Warrant No</Label>
                                <Input
                                    {...register('document_no')}
                                    placeholder="e.g. WQ/2026/01"
                                    className="border-emerald-200 focus:ring-emerald-500 uppercase"
                                />
                                {errors.document_no && <p className="text-sm text-red-500">{errors.document_no.message}</p>}
                            </div>
                        </div>

                        {/* Middle Row: Program, Objek, Kategori */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <Label className="text-emerald-900 font-semibold">Program / Aktiviti</Label>
                                <Select
                                    value={selectedProgram}
                                    onValueChange={(val) => {
                                        setValue('program_code', val);
                                        setValue('objek_code', ''); // Reset child fields
                                        setValue('kategori_code', '');
                                    }}
                                    className="border-emerald-200 focus:ring-emerald-500"
                                >
                                    {ADMIN_PEMBANGUNAN_PROGRAMS.map(prog => (
                                        <SelectItem key={prog.code} value={prog.code}>
                                            {prog.label} ({prog.code})
                                        </SelectItem>
                                    ))}
                                </Select>
                                {errors.program_code && <p className="text-sm text-red-500">{errors.program_code.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-emerald-900 font-semibold">Objek (Budget Line)</Label>
                                <Select
                                    value={selectedObjek}
                                    onValueChange={(val) => {
                                        setValue('objek_code', val);
                                        setValue('kategori_code', ''); // Reset child field
                                    }}
                                    disabled={!selectedProgram}
                                    className="border-emerald-200 focus:ring-emerald-500"
                                >
                                    {availableObjeks.map(obj => (
                                        <SelectItem key={obj.code} value={obj.code}>
                                            {obj.code} - {obj.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                                {errors.objek_code && <p className="text-sm text-red-500">{errors.objek_code.message}</p>}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-emerald-900 font-semibold">Kategori (Sub-Category)</Label>
                                <Select
                                    value={watch('kategori_code')}
                                    onValueChange={(val) => setValue('kategori_code', val)}
                                    disabled={!selectedObjek}
                                    className="border-emerald-200 focus:ring-emerald-500"
                                >
                                    {availableKategoris.map(kat => (
                                        <SelectItem key={kat.code} value={kat.code}>
                                            {kat.code} | {kat.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                                {errors.kategori_code && <p className="text-sm text-red-500">{errors.kategori_code.message}</p>}
                            </div>
                        </div>

                        {/* Bottom Row: Amount, Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <Label>Amount (MYR)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">RM</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register('amount', { valueAsNumber: true })}
                                        className="pl-12 text-lg font-semibold text-emerald-700 border-emerald-200 focus:ring-emerald-500"
                                    />
                                </div>
                                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Description / Remarks</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                                    <textarea
                                        {...register('description')}
                                        className="w-full pl-10 h-24 rounded-md border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent p-2 text-sm"
                                        placeholder="Optional description..."
                                    />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className={`bg-gradient-to-r ${ADMIN_PEMBANGUNAN_GRADIENT.primary} text-white hover:opacity-90`}
                    >
                        {isSaving ? (
                            <>
                                <Spinner className="w-4 h-4 mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Record
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminPembangunanFormPage;
