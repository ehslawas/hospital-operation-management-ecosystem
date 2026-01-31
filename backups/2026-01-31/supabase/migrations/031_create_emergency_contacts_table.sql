-- Migration: Create emergency_contacts table
-- This table stores emergency contact information for users

-- ============================================
-- 1. Emergency Contacts Table
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for emergency_contacts
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_phone_primary ON emergency_contacts(phone_primary);

-- ============================================
-- 2. Updated_at Trigger
-- ============================================
CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Enable RLS (Row Level Security)
-- ============================================
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Policy: Users can view their own emergency contacts
CREATE POLICY "users_view_own_emergency_contacts"
  ON emergency_contacts
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own emergency contacts
    user_id = auth.uid()
    OR
    -- System Admin can see all
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
    OR
    -- Hospital Admin can see emergency contacts for users in their hospital
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN users target_user ON target_user.id = emergency_contacts.user_id
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND u.hospital_id = target_user.hospital_id
        AND u.status = 'active'
    )
  );

-- Policy: System Admin can insert/update/delete any emergency contact
CREATE POLICY "system_admin_manage_emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'system_admin')
        AND u.status = 'active'
    )
  );

-- Policy: Hospital Admin can insert/update/delete emergency contacts for users in their hospital
CREATE POLICY "hospital_admin_manage_emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN users target_user ON target_user.id = emergency_contacts.user_id
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND u.hospital_id = target_user.hospital_id
        AND u.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN users target_user ON target_user.id = emergency_contacts.user_id
      WHERE u.id = auth.uid()
        AND u.role_id = (SELECT id FROM roles WHERE role_code = 'hospital_admin')
        AND u.hospital_id = target_user.hospital_id
        AND u.status = 'active'
    )
  );

-- Policy: Users can manage their own emergency contacts
CREATE POLICY "users_manage_own_emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "service_role_full_access_emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE emergency_contacts IS 'Emergency contact information for users';
COMMENT ON COLUMN emergency_contacts.relationship IS 'Relationship to the user (e.g., parent, spouse, sibling, other)';
COMMENT ON COLUMN emergency_contacts.phone_primary IS 'Primary phone number for emergency contact';
COMMENT ON COLUMN emergency_contacts.phone_secondary IS 'Secondary phone number (optional)';

