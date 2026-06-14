/**
 * Permission Management Page
 * Department-based permission control with user-level feature toggles
 */

import React, { useState } from 'react';
import {
    Building2, Users, Search, Shield,
    CheckCircle2, Loader2, Box
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllFeatures,
    getRoleFeaturePermissions,
    getStaffCustomPermissions,
    saveStaffCustomPermissionsBulk,
    getUsersByDepartment,
} from '@/services/permissionService';
import { getAllDepartments } from '@/services/departmentService';
import type { Feature } from '@/types/rbac.types';

const EMPTY_ARRAY: any[] = [];

export default function PermissionManagementPage() {
    const queryClient = useQueryClient();
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [draftPermissions, setDraftPermissions] = useState<Record<string, boolean>>({});
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    // Fetch departments - Fixed argument passing
    const { data: departments = EMPTY_ARRAY, isLoading: loadingDepts } = useQuery({
        queryKey: ['departments'],
        queryFn: () => getAllDepartments(),
    });

    // Fetch users in selected department
    const { data: users = EMPTY_ARRAY, isLoading: loadingUsers } = useQuery({
        queryKey: ['department-users', selectedDepartmentId],
        queryFn: () => getUsersByDepartment(selectedDepartmentId),
        enabled: !!selectedDepartmentId,
    });

    // Fetch all features
    const { data: allFeatures = EMPTY_ARRAY } = useQuery<Feature[]>({
        queryKey: ['features'],
        queryFn: () => getAllFeatures(),
    });

    // Get selected user
    const selectedUser = users.find((u: any) => u.id === selectedUserId);

    // Fetch role feature permissions for selected user's role
    const { data: roleFeaturePermissions = EMPTY_ARRAY, isLoading: loadingRolePermissions } = useQuery({
        queryKey: ['role-feature-permissions', selectedUser?.role?.id],
        queryFn: () => getRoleFeaturePermissions(selectedUser.role.id),
        enabled: !!selectedUser?.role?.id,
    });

    // Fetch custom overrides for selected user
    const { data: customPermissions = EMPTY_ARRAY, isLoading: loadingCustomPermissions } = useQuery({
        queryKey: ['staff-custom-permissions', selectedUserId],
        queryFn: () => getStaffCustomPermissions(selectedUserId),
        enabled: !!selectedUserId,
    });

    const loadingPermissions = loadingRolePermissions || loadingCustomPermissions;

    // Initialize/Reset draft permissions when user or base permissions change
    React.useEffect(() => {
        if (!selectedUserId) {
            setDraftPermissions({});
            return;
        }

        const initialDraft: Record<string, boolean> = {};

        // Start with role permissions
        roleFeaturePermissions.forEach((rp: any) => {
            initialDraft[rp.feature_id] = rp.is_enabled;
        });

        // Apply custom overrides
        customPermissions.forEach((cp: any) => {
            if (cp.feature_id) {
                initialDraft[cp.feature_id] = cp.permission_type === 'grant';
            }
        });

        setDraftPermissions(initialDraft);
    }, [selectedUserId, roleFeaturePermissions, customPermissions]);

    // Group features by module
    const groupedFeatures = React.useMemo(() => {
        const filtered = allFeatures.filter((feature: any) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                feature.feature_name.toLowerCase().includes(searchLower) ||
                feature.feature_code.toLowerCase().includes(searchLower)
            );
        });

        const groups = new Map<string, { module: any; features: any[] }>();
        filtered.forEach((feature: any) => {
            const moduleId = feature.module_id;
            if (!groups.has(moduleId)) {
                groups.set(moduleId, {
                    module: feature.module,
                    features: [],
                });
            }
            groups.get(moduleId)!.features.push(feature);
        });

        return Array.from(groups.values()).map(group => ({
            module: group.module,
            features: group.features,
        }));
    }, [allFeatures, searchTerm]);


    // Save staff custom permissions mutation
    const saveStaffPermissionsMutation = useMutation({
        mutationFn: (updates: any) => saveStaffCustomPermissionsBulk(selectedUserId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-custom-permissions', selectedUserId] });
            setIsSaveModalOpen(false);
            window.alert('Permissions saved successfully!'); // Use alert for immediate feedback as requested, or replace with toast library if available
        },
        onError: (error) => {
            console.error('Save failed:', error);
            window.alert(`Failed to save permissions: ${error}`);
        }
    });

    const handleFeatureToggle = (featureId: string, isEnabled: boolean) => {
        setDraftPermissions(prev => ({
            ...prev,
            [featureId]: isEnabled
        }));
    };

    // Check if there are unsaved changes
    const hasUnsavedChanges = React.useMemo(() => {
        if (!selectedUserId) return false;

        // Current effective permissions (Role + Custom)
        const currentEffective: Record<string, boolean> = {};
        roleFeaturePermissions.forEach((rp: any) => {
            currentEffective[rp.feature_id] = rp.is_enabled;
        });
        customPermissions.forEach((cp: any) => {
            if (cp.feature_id) {
                currentEffective[cp.feature_id] = cp.permission_type === 'grant';
            }
        });

        // Compare with draft
        const changedIds = Object.keys(draftPermissions);
        for (const id of changedIds) {
            if (draftPermissions[id] !== currentEffective[id]) return true;
        }

        return false;
    }, [draftPermissions, roleFeaturePermissions, customPermissions, selectedUserId]);

    const handleSave = () => {
        const updates = Object.keys(draftPermissions).map(featureId => {
            const isEnabled = draftPermissions[featureId];
            const roleBaseline = roleFeaturePermissions.find((rp: any) => rp.feature_id === featureId)?.is_enabled || false;

            return {
                feature_id: featureId,
                is_enabled: isEnabled,
                role_baseline: roleBaseline
            };
        }).filter(update => {
            // Only send if it differs from current stored state (Role + Custom)
            const currentStored = customPermissions.find((cp: any) => cp.feature_id === update.feature_id);
            const currentStatus = currentStored ? (currentStored.permission_type === 'grant') : update.role_baseline;
            return update.is_enabled !== currentStatus;
        });

        if (updates.length > 0) {
            saveStaffPermissionsMutation.mutate(updates);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loadingDepts) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-slate-500">Loading permission system...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans text-slate-900">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Permission Management</h1>
                        <p className="text-slate-500 mt-1">Configure access rights and feature toggles for department staff</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-6 lg:gap-8 h-[calc(100vh-12rem)] min-h-[600px]">

                    {/* 1. Department Selection (Left Panel) */}
                    <div className="col-span-12 md:col-span-3 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" />
                                Departments
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {departments.map((dept: any) => (
                                <button
                                    key={dept.id}
                                    onClick={() => {
                                        setSelectedDepartmentId(dept.id);
                                        setSelectedUserId('');
                                    }}
                                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative ${selectedDepartmentId === dept.id
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${selectedDepartmentId === dept.id
                                            ? 'bg-white/10 text-white'
                                            : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-500'
                                            } transition-colors`}>
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm truncate">{dept.department_name}</div>
                                            <div className={`text-xs font-mono mt-0.5 truncate ${selectedDepartmentId === dept.id ? 'text-blue-100' : 'text-slate-400'
                                                }`}>
                                                {dept.department_code}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. User Selection (Middle Panel) */}
                    <div className="col-span-12 md:col-span-3 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" />
                                Staff Members
                            </h3>
                            {users.length > 0 && (
                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {users.length}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-3">
                            {!selectedDepartmentId ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                    <Building2 className="w-12 h-12 text-slate-200 mb-3" />
                                    <p className="text-sm">Select a department to view staff</p>
                                </div>
                            ) : loadingUsers ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <p className="text-xs text-slate-400">Loading users...</p>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Users className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">No users found</p>
                                    <p className="text-xs mt-1 text-slate-400">There are no registered staff members in this department yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {users.map((user: any) => (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUserId(user.id)}
                                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${selectedUserId === user.id
                                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedUserId === user.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {getInitials(user.full_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-semibold text-sm truncate ${selectedUserId === user.id ? 'text-blue-900' : 'text-slate-700'
                                                        }`}>
                                                        {user.full_name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 truncate mt-0.5">
                                                        {user.role?.role_name || 'No Role'}
                                                    </div>
                                                </div>
                                                {selectedUserId === user.id && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Permissions (Right Panel) */}
                    <div className="col-span-12 md:col-span-6 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {!selectedUserId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <Shield className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Configure Permissions</h3>
                                <p className="text-slate-500 max-w-xs mx-auto">Select a staff member from the list to view and manage their specific feature access rights.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                Feature Access
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Managing for <span className="font-semibold text-slate-700">{selectedUser.full_name}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end mr-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baseline Role</span>
                                                <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-mono font-medium text-slate-600 border border-slate-200 mt-0.5">
                                                    {selectedUser.role?.role_code || 'NO_ROLE'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsSaveModalOpen(true)}
                                                disabled={!hasUnsavedChanges || saveStaffPermissionsMutation.isPending}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${hasUnsavedChanges
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                                                    : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                                                    }`}
                                            >
                                                {saveStaffPermissionsMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Shield className="w-4 h-4" />
                                                )}
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search and Global Actions */}
                                    <div className="flex flex-col gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search features..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const newDraft = { ...draftPermissions };
                                                    allFeatures.forEach((f: any) => {
                                                        const match = searchTerm ? (
                                                            f.feature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            f.feature_code.toLowerCase().includes(searchTerm.toLowerCase())
                                                        ) : true;
                                                        if (match) newDraft[f.id] = true;
                                                    });
                                                    setDraftPermissions(newDraft);
                                                }}
                                                className="flex-1 py-1.5 px-3 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Enable All {searchTerm ? 'Matching' : 'Features'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newDraft = { ...draftPermissions };
                                                    allFeatures.forEach((f: any) => {
                                                        newDraft[f.id] = false;
                                                    });
                                                    setDraftPermissions(newDraft);
                                                }}
                                                className="flex-1 py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-lg transition-all"
                                            >
                                                Disable All
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                    {loadingPermissions ? (
                                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <p className="text-sm text-slate-500">Loading permissions...</p>
                                        </div>
                                    ) : groupedFeatures.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                            <p className="text-slate-500 italic">No matching features found</p>
                                        </div>
                                    ) : (
                                        groupedFeatures.map(({ module, features }) => {
                                            // Calculate module-level stats
                                            const totalFeatures = features.length;
                                            const enabledFeaturesInDraft = features.filter((f: any) => !!draftPermissions[f.id]).length;
                                            const isAllEnabled = totalFeatures > 0 && totalFeatures === enabledFeaturesInDraft;
                                            const isIndeterminate = enabledFeaturesInDraft > 0 && enabledFeaturesInDraft < totalFeatures;

                                            // Check if any feature in this module has unsaved changes
                                            const hasModuleChanges = features.some((f: any) => {
                                                const roleBaseline = roleFeaturePermissions.find((rp: any) => rp.feature_id === f.id)?.is_enabled || false;
                                                const currentCustom = customPermissions.find((cp: any) => cp.feature_id === f.id);
                                                const currentStatus = currentCustom ? currentCustom.permission_type === 'grant' : roleBaseline;
                                                return draftPermissions[f.id] !== currentStatus;
                                            });

                                            return (
                                                <div
                                                    key={module?.id || 'unknown'}
                                                    className={`bg-white border rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all ${hasModuleChanges ? 'border-orange-200 ring-4 ring-orange-50/50' : 'border-slate-200'
                                                        }`}
                                                >
                                                    {/* Module Header */}
                                                    <div className={`px-4 py-3 flex items-center justify-between border-b ${hasModuleChanges ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50/80 border-slate-100'
                                                        }`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-1.5 border rounded-lg shadow-sm ${hasModuleChanges ? 'bg-white border-orange-100' : 'bg-white border-slate-100'
                                                                }`}>
                                                                <Box className={`w-4 h-4 ${hasModuleChanges ? 'text-orange-500' : 'text-slate-500'}`} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-semibold text-slate-800 text-sm">
                                                                        {module?.module_name || 'General Features'}
                                                                    </h4>
                                                                    {hasModuleChanges && (
                                                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full uppercase truncate max-w-[80px]">
                                                                            Unsaved
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-medium">
                                                                    {enabledFeaturesInDraft} / {totalFeatures} Active
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Module Toggle (Enable All) */}
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enable All</span>
                                                            <button
                                                                onClick={() => {
                                                                    const newState = !isAllEnabled;
                                                                    features.forEach((f: any) => handleFeatureToggle(f.id, newState));
                                                                }}
                                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isAllEnabled ? 'bg-blue-600' : isIndeterminate ? 'bg-blue-400' : 'bg-slate-200'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isAllEnabled || isIndeterminate ? 'translate-x-4.5' : 'translate-x-0.5'
                                                                        }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Features List (Table-like) */}
                                                    <div className="divide-y divide-slate-50">
                                                        {features.map((feature: any) => {
                                                            const isEnabled = !!draftPermissions[feature.id];

                                                            // Calculate background and status
                                                            const roleBaseline = roleFeaturePermissions.find((rp: any) => rp.feature_id === feature.id)?.is_enabled || false;
                                                            const currentCustom = customPermissions.find((cp: any) => cp.feature_id === feature.id);
                                                            const isOverridden = isEnabled !== roleBaseline;
                                                            const isDraftModified = currentCustom
                                                                ? (isEnabled !== (currentCustom.permission_type === 'grant'))
                                                                : (isEnabled !== roleBaseline);

                                                            return (
                                                                <div
                                                                    key={feature.id}
                                                                    className={`px-4 py-3 flex items-center justify-between transition-colors ${isDraftModified ? 'bg-orange-50/30' :
                                                                        isEnabled ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <div className="flex-1 min-w-0 pr-6">
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            <span className={`text-sm font-medium ${isEnabled ? 'text-blue-900' : 'text-slate-600'}`}>
                                                                                {feature.feature_name}
                                                                            </span>
                                                                            {isEnabled && !isDraftModified && (
                                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                            )}
                                                                            {isDraftModified && (
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <code className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                                                                {feature.feature_code}
                                                                            </code>
                                                                            {isOverridden && !isDraftModified && (
                                                                                <span className="text-[9px] font-bold text-blue-500 bg-blue-100 px-1 py-0.5 rounded uppercase">Custom Override</span>
                                                                            )}
                                                                            {isDraftModified && (
                                                                                <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1 py-0.5 rounded uppercase">Modified</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => handleFeatureToggle(feature.id, !isEnabled)}
                                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isEnabled ? 'bg-emerald-500' : 'bg-slate-200 shadow-inner'
                                                                            }`}
                                                                    >
                                                                        <span
                                                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                                                                                }`}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Confirmation Modal */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSaveModalOpen(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Permission Changes</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                You are about to update individual feature access for <span className="font-semibold text-slate-700">{selectedUser.full_name}</span>.
                                These changes will override the default role permissions for this specific user.
                            </p>

                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 items-start mb-6">
                                <div className="mt-0.5">
                                    <Shield className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Security Notice</p>
                                    <p className="text-xs text-amber-700 leading-relaxed mt-1">
                                        Granting additional permissions may expose sensitive data or actions. Please ensure the user actually requires these overrides.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saveStaffPermissionsMutation.isPending}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {saveStaffPermissionsMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Apply Changes Now'
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsSaveModalOpen(false)}
                                    disabled={saveStaffPermissionsMutation.isPending}
                                    className="w-full bg-white hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-xl transition-all border border-slate-200"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
