import { Plus, Trash2, GripVertical, Building, User, Users } from 'lucide-react';
import type { StepFormData } from '../../types/rbac.types';
import { Button } from '../ui/Button';

interface ApprovalStepsBuilderProps {
    steps: StepFormData[];
    onChange: (steps: StepFormData[]) => void;
    roles: { id: string; role_name: string }[];
    departments: { id: string; department_name: string }[];
    users: { id: string; full_name: string }[];
}

export function ApprovalStepsBuilder({
    steps,
    onChange,
    roles,
    departments,
    users,
}: ApprovalStepsBuilderProps) {
    const addStep = () => {
        onChange([
            ...steps,
            {
                step_order: steps.length + 1,
                approver_role_id: '', // Default to role-based
                is_requester_department: false,
                is_required: true,
                can_reject: true,
            },
        ]);
    };

    const removeStep = (index: number) => {
        const newSteps = steps.filter((_, i) => i !== index);
        // Reorder steps
        const reorderedSteps = newSteps.map((step, i) => ({
            ...step,
            step_order: i + 1,
        }));
        onChange(reorderedSteps);
    };

    const updateStep = (index: number, updates: Partial<StepFormData>) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], ...updates };
        onChange(newSteps);
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === steps.length - 1)
        ) {
            return;
        }

        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];

        // Reassign orders
        newSteps.forEach((step, i) => {
            step.step_order = i + 1;
        });

        onChange(newSteps);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Approval Chain
                </label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                    className="text-xs"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Step
                </Button>
            </div>

            <div className="space-y-3">
                {steps.map((step, index) => {
                    // Determine approver type based on which ID field is set
                    let type: 'role' | 'department' | 'user' = 'role';
                    if (step.approver_user_id) type = 'user';
                    else if (step.approver_department_id) type = 'department';

                    return (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm group hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                        >
                            <div className="flex flex-col items-center gap-2 mt-2 text-slate-400">
                                <GripVertical className="w-5 h-5 cursor-move" />
                                <div className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {step.step_order}
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Approver Type Selector */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            Approver Type
                                        </label>
                                        <div className="flex rounded-md shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => updateStep(index, {
                                                    approver_role_id: '',
                                                    approver_department_id: undefined,
                                                    approver_user_id: undefined
                                                })}
                                                className={`flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium border border-r-0 rounded-l-md ${type === 'role'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 z-10'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Users className="w-3 h-3 mr-1" /> Role
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateStep(index, {
                                                    approver_department_id: '',
                                                    approver_role_id: undefined,
                                                    approver_user_id: undefined
                                                })}
                                                className={`flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium border border-r-0 ${type === 'department'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 z-10'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Building className="w-3 h-3 mr-1" /> Dept
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateStep(index, {
                                                    approver_user_id: '',
                                                    approver_role_id: undefined,
                                                    approver_department_id: undefined
                                                })}
                                                className={`flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium border rounded-r-md ${type === 'user'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 z-10'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <User className="w-3 h-3 mr-1" /> User
                                            </button>
                                        </div>
                                    </div>

                                    {/* Approver Value Selector */}
                                    <div>
                                        {type === 'role' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                                        Select Role
                                                    </label>
                                                    <select
                                                        value={step.approver_role_id || ''}
                                                        onChange={(e) => updateStep(index, { approver_role_id: e.target.value })}
                                                        className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    >
                                                        <option value="">Select a role...</option>
                                                        {roles.map((role) => (
                                                            <option key={role.id} value={role.id}>
                                                                {role.role_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                                        Department Scope
                                                    </label>
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateStep(index, { is_requester_department: false, approver_department_id: undefined })}
                                                                className={`flex-1 px-2 py-1 text-[10px] font-semibold border rounded ${!step.is_requester_department && !step.approver_department_id ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                                            >
                                                                Any Dept
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateStep(index, { is_requester_department: true, approver_department_id: undefined })}
                                                                className={`flex-1 px-2 py-1 text-[10px] font-semibold border rounded ${step.is_requester_department ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                                            >
                                                                Requester's
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateStep(index, { is_requester_department: false, approver_department_id: '' })}
                                                                className={`flex-1 px-2 py-1 text-[10px] font-semibold border rounded ${!step.is_requester_department && step.approver_department_id !== undefined ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                                            >
                                                                Specific
                                                            </button>
                                                        </div>

                                                        {!step.is_requester_department && step.approver_department_id !== undefined && (
                                                            <select
                                                                value={step.approver_department_id || ''}
                                                                onChange={(e) => updateStep(index, { approver_department_id: e.target.value })}
                                                                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                            >
                                                                <option value="">Select department...</option>
                                                                {departments.map((dept) => (
                                                                    <option key={dept.id} value={dept.id}>
                                                                        {dept.department_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {type === 'department' && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                                    Select Department
                                                </label>
                                                <select
                                                    value={step.approver_department_id || ''}
                                                    onChange={(e) => updateStep(index, { approver_department_id: e.target.value })}
                                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                >
                                                    <option value="">Select a department...</option>
                                                    {departments.map((dept) => (
                                                        <option key={dept.id} value={dept.id}>
                                                            {dept.department_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {type === 'user' && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                                    Select User
                                                </label>
                                                <select
                                                    value={step.approver_user_id || ''}
                                                    onChange={(e) => updateStep(index, { approver_user_id: e.target.value })}
                                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                >
                                                    <option value="">Select a user...</option>
                                                    {users.map((user) => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.full_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step Options */}
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={step.is_required}
                                            onChange={(e) => updateStep(index, { is_required: e.target.checked })}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Required Step</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={step.can_reject}
                                            onChange={(e) => updateStep(index, { can_reject: e.target.checked })}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Can Reject</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => moveStep(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-30"
                                >
                                    ▲
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeStep(index)}
                                    className="p-1 text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveStep(index, 'down')}
                                    disabled={index === steps.length - 1}
                                    className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-30"
                                >
                                    ▼
                                </button>
                            </div>
                        </div>
                    );
                })}

                {steps.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-center bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No approval steps defined. Click "Add Step" to configure the flow.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
