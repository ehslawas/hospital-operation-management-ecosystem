-- System Admin Schema Additions
-- Run this in Supabase SQL Editor

-- 1. Add License and Subscription fields to 'hospitals' table
-- Check if columns exist before adding to avoid errors (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'license_key') THEN
        ALTER TABLE hospitals ADD COLUMN license_key VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'subscription_status') THEN
        ALTER TABLE hospitals ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'trial';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'subscription_expires_at') THEN
        ALTER TABLE hospitals ADD COLUMN subscription_expires_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'metadata') THEN
        ALTER TABLE hospitals ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- 2. Create System Admin Audit Logs table
CREATE TABLE IF NOT EXISTS system_admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(50),
    target_hospital_id UUID REFERENCES hospitals(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_sa_audit_actor ON system_admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_sa_audit_hospital ON system_admin_audit_logs(target_hospital_id);
CREATE INDEX IF NOT EXISTS idx_sa_audit_action ON system_admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_sa_audit_created ON system_admin_audit_logs(created_at DESC);

-- 4. Set RLS Policies (Security)
ALTER TABLE system_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only System Admins can view these logs
CREATE POLICY "System Admins can view system logs" ON system_admin_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role_id IN (SELECT id FROM roles WHERE role_code = 'system_admin')
        )
    );

-- Policy: System Admins can insert logs (logging their own actions)
CREATE POLICY "System Admins can insert system logs" ON system_admin_audit_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role_id IN (SELECT id FROM roles WHERE role_code = 'system_admin')
        )
    );
