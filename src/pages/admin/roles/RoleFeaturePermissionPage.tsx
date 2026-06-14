import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Save, ArrowLeft, Users, Loader2, Box, CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, LoadingOverlay } from '@/components/ui';
import { useToastStore } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';
import { getAllRoles } from '@/services/roleService';
import { getAllFeatures } from '@/services/permissionService';
import {
    getRoleFeaturePermissions,
    saveRoleFeaturePermissions,
    getUserCountByRole
} from '@/services/roleFeaturePermissionService';
import type { Feature } from '@/types/rbac.types';

const EMPTY_ARRAY: any[] = [];

export const RoleFeaturePermissionPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { error: showError, success: showSuccess } = useToastStore();
    const { user } = useAuthStore();

    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [draftPermissions, setDraftPermissions] = useState<Record<string, boolean>>({});

    // Fetch all roles
    const { data: roles = EMPTY_ARRAY, isLoading: loadingRoles } = useQuery({
        queryKey: ['roles'],
        queryFn: () => getAllRoles(),
    });

    // Fetch all features
    const { data: allFeatures = EMPTY_ARRAY } = useQuery<Feature[]>({
        queryKey: ['features'],
        queryFn: () => getAllFeatures(),
    });

    // Get selected role
    const selectedRole = roles.find((r: any) => r.id === selectedRoleId);

    // Fetch existing role feature permissions
    const { data: roleFeaturePermissions = EMPTY_ARRAY, isLoading: loadingPermissions } = useQuery({
        queryKey: ['role-feature-permissions', selectedRoleId],
        queryFn: () => getRoleFeaturePermissions(selectedRoleId),
        enabled: !!selectedRoleId,
    });

    // Fetch user count for selected role
    const { data: userCount = 0 } = useQuery({
        queryKey: ['role-user-count', selectedRoleId],
        queryFn: () => getUserCountByRole(selectedRoleId),
        enabled: !!selectedRoleId,
    });

    // Initialize draft permissions when role or permissions change
    React.useEffect(() => {
        if (!selectedRoleId) {
            setDraftPermissions({});
            return;
        }

        const initialDraft: Record<string, boolean> = {};
        roleFeaturePermissions.forEach((rp: any) => {
            initialDraft[rp.feature_id] = rp.is_enabled;
        });

        setDraftPermissions(initialDraft);
    }, [selectedRoleId, roleFeaturePermissions]);

    // Group features by module
    const groupedFeatures = React.useMemo(() => {
        const groups = new Map<string, { module: any; features: any[] }>();
        allFeatures.forEach((feature: any) => {
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
    }, [allFeatures]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (updates: { feature_id: string; is_enabled: boolean }[]) =>
            saveRoleFeaturePermissions(selectedRoleId, updates, user?.id || ''),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['role-feature-permissions', selectedRoleId] });
            showSuccess('Success', 'Role feature permissions updated successfully');
        },
        onError: (error: any) => {
            showError('Error', error.message || 'Failed to save permissions');
        },
    });

    const handleFeatureToggle = (featureId: string, isEnabled: boolean) => {
        setDraftPermissions(prev => ({
            ...prev,
            [featureId]: isEnabled
        }));
    };

    const hasUnsavedChanges = React.useMemo(() => {
        if (!selectedRoleId) return false;

        const current: Record<string, boolean> = {};
        roleFeaturePermissions.forEach((rp: any) => {
            current[rp.feature_id] = rp.is_enabled;
        });

        const changedIds = Object.keys(draftPermissions);
        for (const id of changedIds) {
            if (draftPermissions[id] !== (current[id] || false)) return true;
        }

        return false;
    }, [draftPermissions, roleFeaturePermissions, selectedRoleId]);

    const handleSave = () => {
        const updates = allFeatures.map((feature: any) => ({
            feature_id: feature.id,
            is_enabled: !!draftPermissions[feature.id]
        }));

        saveMutation.mutate(updates);
    };

    if (loadingRoles) {
        return <LoadingOverlay fullScreen message="Loading roles..." />;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/roles')}
                            leftIcon={<ArrowLeft className="w-5 h-5" />}
                        >
                            Back to Roles
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Role Feature Permissions</h1>
                            <p className="text-sm text-slate-600 mt-1">Configure which features are enabled for each role</p>
                        </div>
                    </div>
                    {selectedRoleId && (
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges || saveMutation.isPending}
                            leftIcon={saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        >
                            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                </div>

                {/* Role Selection */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Select Role to Configure
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {roles.map((role: any) => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRoleId(role.id)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedRoleId === role.id
                                        ? 'bg-blue-50 border-blue-600 shadow-md'
                                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <Shield className={`w-5 h-5 ${selectedRoleId === role.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                    {selectedRoleId === role.id && (
                                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                    )}
                                </div>
                                <div className="font-semibold text-slate-900">{role.role_name}</div>
                                <div className="text-xs text-slate-500 font-mono mt-1">{role.role_code}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feature Permissions */}
                {!selectedRoleId ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Role</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Choose a role from above to configure which features are available to users with that role.
                        </p>
                    </div>
                ) : loadingPermissions ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <p className="text-sm text-slate-500">Loading permissions...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Info Banner */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-blue-900">
                                    Editing permissions for: {selectedRole.role_name}
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    {userCount} {userCount === 1 ? 'user has' : 'users have'} this role. Changes will affect all of them.
                                </p>
                            </div>
                            {hasUnsavedChanges && (
                                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                    Unsaved Changes
                                </span>
                            )}
                        </div>

                        {/* Features Grouped by Module */}
                        {groupedFeatures.map(({ module, features }) => {
                            const totalFeatures = features.length;
                            const enabledFeatures = features.filter((f: any) => !!draftPermissions[f.id]).length;
                            const isAllEnabled = totalFeatures > 0 && totalFeatures === enabledFeatures;

                            return (
                                <div key={module?.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    {/* Module Header */}
                                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Box className="w-5 h-5 text-slate-600" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{module?.module_name || 'General Features'}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {enabledFeatures} / {totalFeatures} enabled
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold text-slate-500">Enable All</span>
                                            <button
                                                onClick={() => {
                                                    const newState = !isAllEnabled;
                                                    features.forEach((f: any) => handleFeatureToggle(f.id, newState));
                                                }}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAllEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                                    }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAllEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Features List */}
                                    <div className="divide-y divide-slate-100">
                                        {features.map((feature: any) => {
                                            const isEnabled = !!draftPermissions[feature.id];
                                            return (
                                                <div
                                                    key={feature.id}
                                                    className={`px-6 py-3 flex items-center justify-between transition-colors ${isEnabled ? 'bg-blue-50/30' : 'hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-medium ${isEnabled ? 'text-blue-900' : 'text-slate-700'}`}>
                                                                {feature.feature_name}
                                                            </span>
                                                            {isEnabled && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                        </div>
                                                        <code className="text-xs text-slate-400 font-mono">{feature.feature_code}</code>
                                                    </div>
                                                    <button
                                                        onClick={() => handleFeatureToggle(feature.id, !isEnabled)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                                                            }`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                            }`} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleFeaturePermissionPage;
