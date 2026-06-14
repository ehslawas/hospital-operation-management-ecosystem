/**
 * Module Management Page
 * Standardized professional interface for system module configuration
 */

import React, { useState, useMemo } from 'react';
import {
    Shield, BarChart3, ClipboardList, ShoppingCart,
    Building2, Package, Building, DollarSign,
    UserPlus, FileText, Truck, Wind, Settings,
    ChevronRight, ArrowLeft, LayoutGrid, Database,
    Plus, Search, Edit, Trash2, CheckCircle2, XCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllModules, createModule, updateModule, deleteModule } from '@/services/permissionService';
import type { Module } from '@/types/rbac.types';
import { PermissionGate } from '@/components/PermissionGates';

// --- Icon Mapping Helper ---
const DynamicIcon = ({ name, className }: { name: string | null; className?: string }) => {
    const icons: Record<string, React.ElementType> = {
        'Shield': Shield,
        'BarChart3': BarChart3,
        'ClipboardList': ClipboardList,
        'ShoppingCart': ShoppingCart,
        'Building2': Building2,
        'Package': Package,
        'Building': Building,
        'DollarSign': DollarSign,
        'UserPlus': UserPlus,
        'FileText': FileText,
        'Truck': Truck,
        'Wind': Wind,
        'Settings': Settings,
        'Database': Database,
        'LayoutGrid': LayoutGrid,
    };

    const IconComponent = name ? icons[name] : null;
    return IconComponent ? <IconComponent className={className} /> : <LayoutGrid className={className} />;
};

export default function ModuleManagementPage() {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'portal' | 'pharmacy_logistic' | 'administration'>('portal');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all modules
    const { data: modules = [], isLoading } = useQuery({
        queryKey: ['modules'],
        queryFn: getAllModules,
    });

    // Filter modules based on viewMode
    const filteredModules = useMemo(() => {
        const prefix = viewMode === 'pharmacy_logistic' ? 'pharmacy' : 'admin';
        return modules
            .filter(m =>
                m.module_code?.startsWith(prefix) &&
                (m.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.module_code.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .sort((a, b) => a.display_order - b.display_order);
    }, [modules, searchTerm, viewMode]);

    const deleteMutation = useMutation({
        mutationFn: deleteModule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules'] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-200 opacity-25 animate-ping"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
            </div>
        );
    }

    // --- Portal View (Landing) ---
    if (viewMode === 'portal') {
        const pharmacyCount = modules.filter(m => m.module_code?.startsWith('pharmacy')).length;

        return (
            <div className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-800">Module Management Portal</h1>
                        <p className="text-slate-600 text-sm mt-1">Select a domain to configure system modules and routing.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pharmacy Logistic Card - Compact Professional Style */}
                        <div
                            onClick={() => setViewMode('pharmacy_logistic')}
                            className="bg-white border border-slate-200 rounded-lg p-6 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-800">Pharmacy Logistic</h2>
                                        <p className="text-xs text-slate-500 mt-1">Inventory, Procurement, Distribution</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500">Active Modules</span>
                                <span className="font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{pharmacyCount}</span>
                            </div>
                        </div>

                        {/* System Administration Card */}
                        <div
                            onClick={() => setViewMode('administration')}
                            className="bg-white border border-slate-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-800">System Administration</h2>
                                        <p className="text-xs text-slate-500 mt-1">Users, Roles, Permissions, Settings</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500">Active Modules</span>
                                <span className="font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {modules.filter(m => m.module_code?.startsWith('admin')).length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Module Detail Table View ---
    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Compact Header */}
                <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode('portal')}
                            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-500 border border-transparent hover:border-slate-200"
                            title="Back to Portal"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-indigo-600" />
                                {viewMode === 'pharmacy_logistic' ? 'Pharmacy Logistic Modules' : 'System Administration Modules'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <PermissionGate module="administration.modules" action="create">
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
                                <Plus className="w-4 h-4" />
                                Add Module
                            </button>
                        </PermissionGate>
                    </div>
                </div>

                {/* Dense Toolbar */}
                <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter modules by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* High Density Table */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-xs font-semibold text-slate-500 border-b border-slate-200 uppercase tracking-tighter">
                                    <th className="px-4 py-3 w-12 text-center">Icon</th>
                                    <th className="px-4 py-3 w-1/4">Module Name</th>
                                    <th className="px-4 py-3 w-1/4">Code</th>
                                    <th className="px-4 py-3 w-1/6">Route Path</th>
                                    <th className="px-4 py-3 w-1/12 text-center">Status</th>
                                    <th className="px-4 py-3 w-1/12 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredModules.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                                            No modules found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredModules.map((module) => (
                                        <tr key={module.id} className="hover:bg-slate-50 group transition-colors">
                                            <td className="px-4 py-2 align-middle text-center">
                                                <div className="flex items-center justify-center">
                                                    <DynamicIcon name={module.icon_name} className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <div className="font-medium text-slate-800">{module.module_name}</div>
                                                <div className="text-slate-500 text-xs truncate max-w-xs">{module.description}</div>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs border border-slate-200 font-mono">
                                                    {module.module_code}
                                                </code>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <span className="text-slate-500 font-mono text-xs">/{module.route_path}</span>
                                            </td>
                                            <td className="px-4 py-2 align-middle text-center">
                                                {module.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50  text-emerald-700 border border-emerald-100">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PermissionGate module="administration.modules" action="edit">
                                                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-100 transition-all">
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                    </PermissionGate>
                                                    <PermissionGate module="administration.modules" action="delete">
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Delete module "${module.module_name}"?`)) {
                                                                    deleteMutation.mutate(module.id);
                                                                }
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </PermissionGate>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-xs text-slate-400 text-center">
                    Showing {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} in {viewMode === 'pharmacy_logistic' ? 'Pharmacy Logistics' : 'System Administration'}
                </div>
            </div>
        </div>
    );
}
