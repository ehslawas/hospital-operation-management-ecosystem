-- Update Admin Operations RLS for Hospital Administrator

-- Admin Purchase Orders
DROP POLICY IF EXISTS "admin_po_hospital_admin_only" ON admin_purchase_orders;
CREATE POLICY "admin_po_hospital_admin_only" ON admin_purchase_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.role_code IN ('hospital_admin', 'hospital_administrator')
            AND u.hospital_id = admin_purchase_orders.hospital_id
        )
    );

-- Admin Warrants
DROP POLICY IF EXISTS "admin_warrant_hospital_admin_only" ON admin_warrants;
CREATE POLICY "admin_warrant_hospital_admin_only" ON admin_warrants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.role_code IN ('hospital_admin', 'hospital_administrator')
            AND u.hospital_id = admin_warrants.hospital_id
        )
    );

-- Admin Purchase Order Items
DROP POLICY IF EXISTS "admin_po_items_hospital_admin_only" ON admin_purchase_order_items;
-- Also attempt to drop other likely names to ensure cleanup
DROP POLICY IF EXISTS "admin_purchase_order_items_policy" ON admin_purchase_order_items;

CREATE POLICY "admin_po_items_hospital_admin_only" ON admin_purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_purchase_orders apo
            JOIN users u ON u.hospital_id = apo.hospital_id
            JOIN roles r ON u.role_id = r.id
            WHERE apo.id = admin_purchase_order_items.purchase_order_id
            AND u.id = auth.uid()
            AND r.role_code IN ('hospital_admin', 'hospital_administrator')
        )
    );
