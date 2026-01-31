import { supabase } from '../supabase';
import {
    AdminPurchaseOrder,
    AdminPurchaseOrderFormData,
    AdminLPO,
    AdminLPOFormData,
    AdminReceivingRecord,
    AdminReceivingFormData,
    AdminPayment,
    AdminPaymentFormData
} from '../../types/adminOperations.types';
import { checkApprovalNeeded, createApprovalRequest } from '../approvalService';

export const adminProcurementService = {
    // ==========================================
    // PURCHASE ORDERS
    // ==========================================

    async getAdminPurchaseOrders(hospitalId: string) {
        const { data, error } = await supabase
            .from('admin_purchase_orders')
            .select(`
        *,
        supplier:suppliers(id, company_name),
        items:admin_purchase_order_items(count)
      `)
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AdminPurchaseOrder[];
    },

    async getAdminPurchaseOrderById(id: string) {
        const { data, error } = await supabase
            .from('admin_purchase_orders')
            .select(`
        *,
        supplier:suppliers(id, company_name),
        items:admin_purchase_order_items(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as AdminPurchaseOrder;
    },

    async createAdminPurchaseOrder(hospitalId: string, userId: string, formData: AdminPurchaseOrderFormData) {
        // 1. Generate Order Number (Simple auto-increment-like logic or timestamp based)
        // For robust implementation, use a running number service. Here we use a simple timestamp format for demo.
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = `APO-${dateStr}-${randomSuffix}`;

        const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        const { data: po, error: poError } = await supabase
            .from('admin_purchase_orders')
            .insert({
                hospital_id: hospitalId,
                order_number: orderNumber,
                supplier_id: formData.supplier_id,
                order_date: formData.order_date,
                expected_delivery_date: formData.expected_delivery_date,
                total_amount: totalAmount,
                status: 'draft',
                created_by: userId,
                notes: formData.notes
            })
            .select()
            .single();

        if (poError) throw poError;

        // 2. Insert Items
        if (formData.items.length > 0) {
            const itemsToInsert = formData.items.map(item => ({
                purchase_order_id: po.id,
                item_description: item.item_description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                specifications: item.specifications
            }));

            const { error: itemsError } = await supabase
                .from('admin_purchase_order_items')
                .insert(itemsToInsert);

            if (itemsError) {
                // Cleanup PO if items fail
                await supabase.from('admin_purchase_orders').delete().eq('id', po.id);
                throw itemsError;
            }
        }

        return po;
    },

    async updateAdminPurchaseOrder(id: string, formData: AdminPurchaseOrderFormData) {
        const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // Update PO details
        const { data: po, error: poError } = await supabase
            .from('admin_purchase_orders')
            .update({
                supplier_id: formData.supplier_id,
                order_date: formData.order_date,
                expected_delivery_date: formData.expected_delivery_date,
                total_amount: totalAmount,
                notes: formData.notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (poError) throw poError;

        // Replace Items (Delete all and re-insert)
        // In a real app, you might want diffing, but for simplicity we replace.
        const { error: deleteError } = await supabase
            .from('admin_purchase_order_items')
            .delete()
            .eq('purchase_order_id', id);

        if (deleteError) throw deleteError;

        if (formData.items.length > 0) {
            const itemsToInsert = formData.items.map(item => ({
                purchase_order_id: id,
                item_description: item.item_description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                specifications: item.specifications
            }));

            const { error: itemsError } = await supabase
                .from('admin_purchase_order_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return po;
    },

    async deleteAdminPurchaseOrder(id: string) {
        const { error } = await supabase
            .from('admin_purchase_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async submitForApproval(id: string, userId: string) {
        // 1. Check if approval is needed
        // We assume it is needed for all Admin POs as per our workflow setup
        const { workflow_id } = await checkApprovalNeeded('admin_po_submit', {});

        if (workflow_id) {
            // Create approval request
            await createApprovalRequest(
                workflow_id,
                userId,
                { purchase_order_id: id }, // Request data
                'admin_purchase_order', // Entity type
                id // Entity ID
            );

            // Update PO status
            const { error } = await supabase
                .from('admin_purchase_orders')
                .update({ status: 'pending_approval' })
                .eq('id', id);

            if (error) throw error;

            return { status: 'pending_approval', message: 'Submitted for approval' };
        } else {
            // Auto-approve if no workflow (unlikely given our setup, but safe fallback)
            const { error } = await supabase
                .from('admin_purchase_orders')
                .update({ status: 'approved', approved_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            return { status: 'approved', message: 'Auto-approved (No workflow)' };
        }
    },

    // ==========================================
    // LPO MANAGEMENT
    // ==========================================

    async getAdminLPOs(hospitalId: string) {
        const { data, error } = await supabase
            .from('admin_lpos')
            .select(`
                *,
                purchase_order:admin_purchase_orders(
                    *,
                    supplier:suppliers(company_name)
                )
            `)
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AdminLPO[];
    },

    async getAdminLPOById(id: string) {
        const { data, error } = await supabase
            .from('admin_lpos')
            .select(`
                *,
                purchase_order:admin_purchase_orders(
                    *,
                    supplier:suppliers(company_name),
                    items:admin_purchase_order_items(*)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as AdminLPO;
    },

    async createAdminLPO(hospitalId: string, purchaseOrderId: string, userId: string) {
        // Generate LPO Number (Simple timestamp based for now)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const lpoNumber = `LPO-${dateStr}-${randomSuffix}`;

        const { data, error } = await supabase
            .from('admin_lpos')
            .insert({
                hospital_id: hospitalId,
                purchase_order_id: purchaseOrderId,
                lpo_number: lpoNumber,
                lpo_date: new Date().toISOString(),
                status: 'pending',
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateAdminLPOStatus(id: string, status: string) {
        const { error } = await supabase
            .from('admin_lpos')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    // ==========================================
    // RECEIVING
    // ==========================================

    async getAdminReceivingRecords(hospitalId: string) {
        const { data, error } = await supabase
            .from('admin_receiving_records')
            .select(`
                *,
                lpo:admin_lpos(lpo_number)
            `)
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AdminReceivingRecord[];
    },

    async createAdminReceivingRecord(hospitalId: string, userId: string, formData: AdminReceivingFormData) {
        const { data: record, error: recordError } = await supabase
            .from('admin_receiving_records')
            .insert({
                hospital_id: hospitalId,
                lpo_id: formData.lpo_id,
                do_number: formData.do_number,
                received_date: formData.received_date,
                received_by: userId,
                status: 'pending',
                notes: formData.notes
            })
            .select()
            .single();

        if (recordError) throw recordError;

        if (formData.items.length > 0) {
            const itemsToInsert = formData.items.map(item => ({
                receiving_id: record.id,
                item_description: item.item_description,
                ordered_quantity: item.ordered_quantity,
                received_quantity: item.received_quantity
            }));

            const { error: itemsError } = await supabase
                .from('admin_receiving_items')
                .insert(itemsToInsert);

            if (itemsError) {
                // Cleanup
                await supabase.from('admin_receiving_records').delete().eq('id', record.id);
                throw itemsError;
            }
        }

        return record;
    },

    // ==========================================
    // PAYMENT
    // ==========================================

    async getAdminPayments(hospitalId: string) {
        const { data, error } = await supabase
            .from('admin_payments')
            .select(`
                *,
                lpo:admin_lpos(lpo_number)
            `)
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AdminPayment[];
    },

    async createAdminPayment(hospitalId: string, userId: string, formData: AdminPaymentFormData) {
        const { data, error } = await supabase
            .from('admin_payments')
            .insert({
                hospital_id: hospitalId,
                lpo_id: formData.lpo_id,
                payment_date: formData.payment_date,
                payment_reference: formData.payment_voucher_number, // Mapping voucher number to reference for now or usage specific column
                amount: formData.amount,
                created_by: userId,
                status: 'pending',
                // Add any other fields if schema supports them, or mapped correctly
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
