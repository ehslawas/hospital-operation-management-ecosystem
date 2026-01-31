import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { ConditionFormData } from '../../types/rbac.types';
import { Button } from '../ui/Button';

interface ConditionBuilderProps {
    conditions: ConditionFormData[];
    onChange: (conditions: ConditionFormData[]) => void;
    departments?: { id: string; department_name: string }[];
}

const OPERATORS = [
    { value: '=', label: 'Equals (=)' },
    { value: '!=', label: 'Not Equals (!=)' },
    { value: '>', label: 'Greater Than (>)' },
    { value: '<', label: 'Less Than (<)' },
    { value: '>=', label: 'Greater or Equal (>=)' },
    { value: '<=', label: 'Less or Equal (<=)' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'in', label: 'In List' },
    { value: 'not_in', label: 'Not In List' },
] as const;

const COMMON_FIELDS = [
    { value: 'total_amount', label: 'Total Amount' },
    { value: 'department_id', label: 'Department' },
    { value: 'category', label: 'Category' },
    { value: 'is_emergency', label: 'Is Emergency' },
    { value: 'item_count', label: 'Item Count' },
];

export function ConditionBuilder({ conditions, onChange, departments = [] }: ConditionBuilderProps) {
    const addCondition = () => {
        onChange([
            ...conditions,
            { field_name: '', operator: '=', field_value: '' },
        ]);
    };

    const removeCondition = (index: number) => {
        const newConditions = [...conditions];
        newConditions.splice(index, 1);
        onChange(newConditions);
    };

    const updateCondition = (
        index: number,
        field: keyof ConditionFormData,
        value: string
    ) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        onChange(newConditions);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Trigger Conditions
                </label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCondition}
                    className="text-xs"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Condition
                </Button>
            </div>

            {conditions.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-center bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No conditions defined. Workflow will match all requests of this type.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {conditions.map((condition, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
                        >
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Field Name */}
                                <div>
                                    <select
                                        value={condition.field_name}
                                        onChange={(e) => updateCondition(index, 'field_name', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Field...</option>
                                        {COMMON_FIELDS.map((field) => (
                                            <option key={field.value} value={field.value}>
                                                {field.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Operator */}
                                <div>
                                    <select
                                        value={condition.operator}
                                        onChange={(e) => updateCondition(index, 'operator', e.target.value as any)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {OPERATORS.map((op) => (
                                            <option key={op.value} value={op.value}>
                                                {op.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Value */}
                                <div>
                                    {condition.field_name === 'department_id' ? (
                                        <select
                                            value={condition.field_value}
                                            onChange={(e) => updateCondition(index, 'field_value', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Department...</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.department_name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={condition.field_value}
                                            onChange={(e) => updateCondition(index, 'field_value', e.target.value)}
                                            placeholder="Value (e.g. 5000)"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeCondition(index)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {conditions.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>All conditions must be met for this workflow to trigger (AND logic).</p>
                </div>
            )}
        </div>
    );
}
