/**
 * Feature Management Page
 * Premium modern interface for managing granular system features
 */

import React, { useState, useMemo } from 'react';
import {
    Plus, Edit, Trash2, Search, Filter,
    Shield, BarChart3, ClipboardList, ShoppingCart,
    Building2, Package, Building, DollarSign,
    UserPlus, FileText, Truck, Wind, Settings,
    Database, LayoutGrid, Check, X, ToggleLeft, ToggleRight,
    ChevronRight, ArrowLeft
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllFeatures, createFeature, updateFeature, deleteFeature, getAllModules } from '@/services/permissionService';
import type { Feature, Module } from '@/types/rbac.types';
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

export default function FeatureManagementPage() {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'portal' | 'pharmacy_logistic' | 'administration'>('portal');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState<string>('all');
    // Temporary state to simulate toggles until backend supports enablement directly on feature def if needed
    // In many RBAC systems, features exist and permissions are toggled on Roles. 
    // Here we might be toggling "Global Availability" or similar. For now, visual toggle.
    const [activeToggles, setActiveToggles] = useState<Set<string>>(new Set());

    // Fetch features and modules
    const { data: features = [], isLoading: isFeaturesLoading } = useQuery({
        queryKey: ['features'],
        queryFn: getAllFeatures,
    });

    const { data: modules = [], isLoading: isModulesLoading } = useQuery({
        queryKey: ['modules'],
        queryFn: getAllModules,
    });

    // Group features by module
    const groupedFeatures = useMemo(() => {
        // Filter modules based on viewMode
        const prefix = viewMode === 'pharmacy_logistic' ? 'pharmacy' : 'admin';
        const relevantModules = modules.filter(m =>
            (selectedModule === 'all' ? m.module_code?.startsWith(prefix) : m.id === selectedModule)
        );

        const groups = relevantModules.map(module => {
            const moduleFeatures = features.filter((f: any) =>
                f.module_id === module.id &&
                (f.feature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.feature_code.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            return {
                module,
                features: moduleFeatures
            };
        }).filter(group => group.features.length > 0 || selectedModule !== 'all');

        return groups.sort((a, b) => a.module.display_order - b.module.display_order);
    }, [features, modules, searchTerm, selectedModule]);

    const toggleFeature = (featureId: string) => {
        setActiveToggles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(featureId)) {
                newSet.delete(featureId);
            } else {
                newSet.add(featureId);
            }
            return newSet;
        });
    };

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: deleteFeature,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['features'] });
        },
    });

    if (isFeaturesLoading || isModulesLoading) {
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
        const pharmacyFeatureCount = features.filter((f: any) => f.module?.module_code?.startsWith('pharmacy')).length;
        const adminFeatureCount = features.filter((f: any) => f.module?.module_code?.startsWith('admin')).length;

        return (
            <div className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-800">Feature Management Portal</h1>
                        <p className="text-slate-600 text-sm mt-1">Select a domain to manage system capabilities and access controls.</p>
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
                                <span className="text-slate-500">Configured Features</span>
                                <span className="font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{pharmacyFeatureCount}</span>
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
                                <span className="text-slate-500">Configured Features</span>
                                <span className="font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{adminFeatureCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Detailed Feature List View (Table Layout) ---
    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Guidance Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">Looking to assign permissions?</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            This page is for defining system features. To grant users access to these features, please go to
                            <a href="/admin/roles/features" className="underline font-semibold ml-1 hover:text-blue-900">
                                Role Feature Permissions
                            </a>.
                        </p>
                    </div>
                </div>

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
                                {viewMode === 'pharmacy_logistic' ? 'Pharmacy Logistic Features' : 'System Administration Features'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <PermissionGate module="administration.features" action="create">
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
                                <Plus className="w-4 h-4" />
                                Add Feature
                            </button>
                        </PermissionGate>
                    </div>
                </div>

                {/* Dense Toolbar */}
                <div className="flex items-center gap-4 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div className="w-64">
                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="w-full pl-3 pr-8 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="all">All Modules</option>
                            {modules
                                .filter(m => m.module_code?.startsWith(viewMode === 'pharmacy_logistic' ? 'pharmacy' : 'admin'))
                                .map((module: Module) => (
                                    <option key={module.id} value={module.id}>
                                        {module.module_name}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* High Density Table Groups */}
                <div className="space-y-6">
                    {groupedFeatures.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
                            <p className="text-slate-500 text-sm">No features found matching your criteria.</p>
                        </div>
                    ) : (
                        groupedFeatures.map(({ module, features: moduleFeatures }) => (
                            <div key={module.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                {/* Module Header Bar */}
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <DynamicIcon name={module.icon_name} className="w-5 h-5 text-slate-500" />
                                        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">{module.module_name}</h3>
                                        <span className="text-slate-400 text-xs font-mono">({module.module_code})</span>
                                    </div>
                                    <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                        {moduleFeatures.length} features
                                    </span>
                                </div>

                                {/* Dense Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-xs font-semibold text-slate-500 border-b border-slate-200 uppercase tracking-tighter">
                                                <th className="px-4 py-2 w-1/3">Feature Name / Description</th>
                                                <th className="px-4 py-2 w-1/6">Code</th>
                                                <th className="px-4 py-2 w-1/6">Type</th>
                                                <th className="px-4 py-2 w-1/12 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {moduleFeatures.map((feature: any) => {
                                                const isActive = activeToggles.has(feature.id);
                                                return (
                                                    <tr key={feature.id} className="hover:bg-slate-50 group transition-colors">
                                                        <td className="px-4 py-2 align-middle">
                                                            <div className="font-medium text-slate-800">{feature.feature_name}</div>
                                                            <div className="text-slate-500 text-xs truncate max-w-xs">{feature.description}</div>
                                                        </td>
                                                        <td className="px-4 py-2 align-middle">
                                                            <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs border border-slate-200">
                                                                {feature.feature_code.split('.').pop()}
                                                            </code>
                                                        </td>
                                                        <td className="px-4 py-2 align-middle">
                                                            {feature.feature_code.includes('create') && <span className="inline-flex px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">Create</span>}
                                                            {feature.feature_code.includes('view') && <span className="inline-flex px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">View</span>}
                                                            {feature.feature_code.includes('edit') && <span className="inline-flex px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">Edit</span>}
                                                            {feature.feature_code.includes('delete') && <span className="inline-flex px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 uppercase">Delete</span>}
                                                        </td>
                                                        <td className="px-4 py-2 align-middle text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <PermissionGate module="administration.features" action="edit">
                                                                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-100 transition-all">
                                                                        <Edit className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </PermissionGate>
                                                                <PermissionGate module="administration.features" action="delete">
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm(`Delete feature "${feature.feature_name}"?`)) {
                                                                                deleteMutation.mutate(feature.id);
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

