/**
 * Example: Purchase Order with Approval Integration
 * Demonstrates how to integrate approval workflow into an existing feature
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { checkApprovalNeeded, createApprovalRequest } from '@/services/approvalService';

interface PurchaseOrderData {
    supplier: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    amount: number;
    item_type: string;
}

export default function CreatePurchaseOrderPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<PurchaseOrderData>({
        supplier: '',
        items: [],
        amount: 0,
        item_type: '',
    });

    // Create PO mutation
    const createPOMutation = useMutation({
        mutationFn: async (data: PurchaseOrderData) => {
            // Step 1: Check if approval is needed
            const approvalCheck = await checkApprovalNeeded('purchase_order', {
                amount: data.amount.toString(),
                item_type: data.item_type,
            });

            if (approvalCheck.needs_approval && approvalCheck.workflow_id) {
                // Step 2a: Create approval request instead of direct creation
                await createApprovalRequest(
                    approvalCheck.workflow_id,
                    user!.id,
                    data,
                    'purchase_order'
                );

                return {
                    success: true,
                    requiresApproval: true,
                    message: 'Purchase order sent for approval',
                };
            } else {
                // Step 2b: Create PO directly (no approval needed)
                const response = await fetch('/api/purchase-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                return {
                    success: true,
                    requiresApproval: false,
                    message: 'Purchase order created successfully',
                };
            }
        },
        onSuccess: (result) => {
            if (result.requiresApproval) {
                alert(result.message + '. You will be notified when it is approved.');
                navigate('/approvals'); // Redirect to approval dashboard
            } else {
                alert(result.message);
                navigate('/pharmacy/purchase-orders');
            }
        },
        onError: (error) => {
            alert('Error creating purchase order: ' + error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Calculate total amount
        const amount = formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

        createPOMutation.mutate({
            ...formData,
            amount,
        });
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Create Purchase Order</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Supplier</label>
                        <input
                            type="text"
                            value={formData.supplier}
                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            className="w-full px-4 py-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Item Type</label>
                        <select
                            value={formData.item_type}
                            onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                            className="w-full px-4 py-2 border rounded"
                            required
                        >
                            <option value="">Select type</option>
                            <option value="medical_cylinder">Medical Cylinders</option>
                            <option value="medication">Medication</option>
                            <option value="supplies">Supplies</option>
                        </select>
                    </div>

                    {/* Items would be added here with dynamic form */}

                    <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-medium">Total Amount:</span>
                            <span className="text-2xl font-bold">
                                RM {formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}
                            </span>
                        </div>

                        {/* Approval indicator */}
                        {formData.amount > 5000 && formData.item_type === 'medical_cylinder' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ This purchase order will require approval (Amount exceeds RM 5,000)
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={createPOMutation.isPending}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {createPOMutation.isPending ? 'Processing...' : 'Submit Purchase Order'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
