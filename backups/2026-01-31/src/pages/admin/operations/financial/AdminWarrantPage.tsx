import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Wallet,
    FileDown,
    ChevronDown,
    ChevronRight,
    Search,
    Calendar,
    Trash2,
    Edit,
    PieChart,
    TrendingUp,
    Building2
} from 'lucide-react';
import { useAuthStore, useIsSessionReady } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectItem } from '@/components/ui/Select';
import { toast } from 'sonner';
import { adminWarrantService } from '@/services/admin/adminWarrantService';
import type { AdminWarrant, AdminWarrantSummary } from '@/types/adminOperations.types';
import {
    ADMIN_WARRANT_PROGRAMS,
    ADMIN_WARRANT_OBJEKS,
    ADMIN_WARRANT_OBJEK_COLORS,
    AdminWarrantProgramCode,
    getKategorisForObjek
} from '@/lib/adminWarrantConstants';
import { ROUTES } from '@/lib/constants';

// ============================================================================
// ADMIN WARRANT PAGE COMPONENT - Hospital Administrator Exclusive
// Theme: Purple/Violet to differentiate from Pharmacy modules
// ============================================================================

export const AdminWarrantPage: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const isSessionReady = useIsSessionReady();
    const hospitalId = user?.hospital_id;

    // ========== STATE MANAGEMENT ==========
    const [warrants, setWarrants] = useState<AdminWarrant[]>([]);
    const [summary, setSummary] = useState<AdminWarrantSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filterProgram, setFilterProgram] = useState<string>('all');
    const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set(['020200']));



    // ========== COMPUTED VALUES ==========
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    }, []);

    const filteredWarrants = useMemo(() => {
        return warrants.filter((warrant: AdminWarrant) => {
            const matchesSearch =
                searchQuery === '' ||
                warrant.document_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                warrant.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProgram = filterProgram === 'all' || warrant.program_code === filterProgram;
            return matchesSearch && matchesProgram;
        });
    }, [warrants, searchQuery, filterProgram]);



    // ========== DATA FETCHING ==========
    const fetchData = async () => {
        if (!hospitalId || !isSessionReady) return;
        setIsLoading(true);
        try {
            const [warrantsData, summaryData] = await Promise.all([
                adminWarrantService.getAdminWarrants(hospitalId, { fiscalYear: selectedYear }),
                adminWarrantService.getAdminWarrantSummary(hospitalId, selectedYear)
            ]);
            setWarrants(warrantsData);
            setSummary(summaryData);
        } catch (err) {
            console.error('Failed to fetch admin warrants:', err);
            toast.error('Failed to load warrant data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [hospitalId, isSessionReady, selectedYear]);

    // ========== HELPER FUNCTIONS ==========
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('ms-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('ms-MY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const toggleProgram = (code: string) => {
        setExpandedPrograms(prev => {
            const newSet = new Set(prev);
            if (newSet.has(code)) {
                newSet.delete(code);
            } else {
                newSet.add(code);
            }
            return newSet;
        });
    };

    // ========== FORM HANDLERS ==========
    const handleEdit = (warrant: AdminWarrant) => {
        navigate(ROUTES.ADMIN_OPERATIONS_WARRANT_EDIT.replace(':id', warrant.id));
    };

    const handleDelete = async (warrant: AdminWarrant) => {
        if (!window.confirm('Are you sure you want to delete this warrant?')) return;

        try {
            await adminWarrantService.deleteAdminWarrant(warrant.id);
            toast.success('Warrant deleted successfully');
            fetchData();
        } catch (err) {
            console.error('Failed to delete warrant:', err);
            toast.error('Failed to delete warrant');
        }
    };





    // ========== RENDER ==========
    if (!isSessionReady) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner className="w-8 h-8 text-violet-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        Admin Warrant Management
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage hospital administrative budget warrants and allocations
                    </p>
                </div>
                <div className="flex gap-2">

                    <Button
                        onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_WARRANT_CREATE)}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Warrant
                    </Button>
                </div>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                <span className="font-medium text-slate-700">Fiscal Year:</span>
                <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                    className="w-32 border-violet-200 focus:ring-violet-500"
                >
                    {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                </Select>
            </div>

            {/* Summary Cards */}
            {isLoading ? (
                <div className="flex items-center justify-center h-32">
                    <Spinner className="w-8 h-8 text-violet-600" />
                </div>
            ) : summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-violet-500 text-white">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm text-violet-600 font-medium truncate">Total Allocation</p>
                                    <p className="text-2xl font-bold text-violet-900 truncate">
                                        {formatCurrency(summary.total_allocation)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-purple-500 text-white">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm text-purple-600 font-medium truncate">Total Expenses</p>
                                    <p className="text-2xl font-bold text-purple-900 truncate">
                                        {formatCurrency(summary.total_expenses)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-500 text-white">
                                    <PieChart className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm text-emerald-600 font-medium truncate">Balance</p>
                                    <p className="text-2xl font-bold text-emerald-900 truncate">
                                        {formatCurrency(summary.total_balance)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-slate-500 text-white">
                                    <FileDown className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm text-slate-600 font-medium truncate">Warrants</p>
                                    <p className="text-2xl font-bold text-slate-900 truncate">
                                        {summary.total_count}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Program Breakdown */}
            {!isLoading && summary && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {ADMIN_WARRANT_PROGRAMS.map(prog => {
                        const progData = summary.by_program.find(p => p.program_code === prog.code);
                        const isExpanded = expandedPrograms.has(prog.code);
                        const objeks = ADMIN_WARRANT_OBJEKS[prog.code as AdminWarrantProgramCode];

                        return (
                            <Card key={prog.code} className="overflow-hidden border-violet-200">
                                <CardHeader
                                    className={`${prog.code === '020200'
                                        ? 'bg-gradient-to-r from-violet-50 to-violet-100'
                                        : 'bg-gradient-to-r from-purple-50 to-purple-100'
                                        }`}
                                >
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => toggleProgram(prog.code)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 text-violet-600" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-violet-600" />
                                                )}
                                                <div>
                                                    <CardTitle className="text-lg text-violet-900">
                                                        {prog.code} - {prog.label}
                                                    </CardTitle>
                                                    <p className="text-sm text-violet-600 mt-1">
                                                        {progData ? formatCurrency(progData.spent) : 'RM 0.00'} / {progData ? formatCurrency(progData.allocated) : 'RM 0.00'}
                                                    </p>
                                                </div>
                                            </div>
                                            {progData && (
                                                <div className="text-right">
                                                    <div className={`text-lg font-bold ${progData.percentage > 90 ? 'text-rose-600' :
                                                        progData.percentage > 75 ? 'text-amber-600' : 'text-emerald-600'
                                                        }`}>
                                                        {progData.percentage.toFixed(1)}%
                                                    </div>
                                                    <div className="text-xs text-slate-500">utilized</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <CardContent className="pt-4">
                                                <div className="space-y-3">
                                                    {objeks.map(objek => {
                                                        const objekData = summary.by_objek.find(
                                                            o => o.program_code === prog.code && o.objek_code === objek.code
                                                        );

                                                        return (
                                                            <div
                                                                key={objek.code}
                                                                className="p-3 rounded-lg bg-slate-50 border border-slate-200"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge className={ADMIN_WARRANT_OBJEK_COLORS[objek.code] || 'bg-slate-100'}>
                                                                            {objek.code}
                                                                        </Badge>
                                                                        <span className="font-medium text-slate-700">{objek.label}</span>
                                                                    </div>
                                                                    <div className="text-right text-sm">
                                                                        <div className="font-semibold text-slate-800">
                                                                            {objekData ? formatCurrency(objekData.spent) : 'RM 0.00'}
                                                                        </div>
                                                                        <div className="text-slate-400">
                                                                            of {objekData ? formatCurrency(objekData.allocated) : 'RM 0.00'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {objekData && objekData.allocated > 0 && (
                                                                    <div className="mt-2">
                                                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all ${objekData.percentage > 90 ? 'bg-rose-500' :
                                                                                    objekData.percentage > 75 ? 'bg-amber-500' : 'bg-violet-500'
                                                                                    }`}
                                                                                style={{ width: `${Math.min(objekData.percentage, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by document no or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-slate-200 focus:ring-violet-500"
                    />
                </div>
                <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-xl px-3 h-11">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <Select
                        value={filterProgram}
                        onValueChange={setFilterProgram}
                        className="w-48 border-none focus:ring-0 h-9"
                    >
                        <SelectItem value="all">All Programs</SelectItem>
                        {ADMIN_WARRANT_PROGRAMS.map(prog => (
                            <SelectItem key={prog.code} value={prog.code}>{prog.code} - {prog.label}</SelectItem>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Warrants Table */}
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-800">Warrant Records</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Spinner className="w-6 h-6 text-violet-600" />
                        </div>
                    ) : filteredWarrants.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No warrants found</p>
                            <p className="text-sm mt-1">Create a new warrant to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Document No</TableHead>
                                        <TableHead>Program</TableHead>
                                        <TableHead>Objek</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWarrants.map((warrant) => (
                                        <TableRow key={warrant.id} className="hover:bg-violet-50/50">
                                            <TableCell className="font-mono text-sm">
                                                {formatDate(warrant.warrant_date)}
                                            </TableCell>
                                            <TableCell className="font-medium">{warrant.document_no}</TableCell>
                                            <TableCell>
                                                <Badge variant="primary" size="sm">
                                                    {warrant.program_code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={ADMIN_WARRANT_OBJEK_COLORS[warrant.objek_code || ''] || 'bg-slate-100'} size="sm">
                                                    {warrant.objek_code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{warrant.kategori_code}</TableCell>
                                            <TableCell className="text-right font-semibold text-violet-700">
                                                {formatCurrency(warrant.amount)}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{warrant.description}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(warrant)}
                                                        className="text-violet-600 hover:text-violet-800 hover:bg-violet-100"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(warrant)}
                                                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>




        </div>
    );
};

export default AdminWarrantPage;
