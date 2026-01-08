-- Memos Table
-- This table stores hospital memos, announcements, policies, and communications
-- Part of the Hospital Admin Module

-- ============================================
-- 1. Create memos table
-- ============================================

CREATE TABLE IF NOT EXISTS memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  memo_type TEXT NOT NULL CHECK (memo_type IN ('announcement', 'policy', 'event', 'emergency', 'maintenance')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published', 'archived')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  target_departments UUID[] DEFAULT ARRAY[]::UUID[],
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_memos_hospital_id ON memos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_memos_created_by ON memos(created_by);
CREATE INDEX IF NOT EXISTS idx_memos_approved_by ON memos(approved_by);
CREATE INDEX IF NOT EXISTS idx_memos_status ON memos(status);
CREATE INDEX IF NOT EXISTS idx_memos_memo_type ON memos(memo_type);
CREATE INDEX IF NOT EXISTS idx_memos_priority ON memos(priority);
CREATE INDEX IF NOT EXISTS idx_memos_publish_date ON memos(publish_date);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);

-- Composite index for common queries (hospital + status + date)
CREATE INDEX IF NOT EXISTS idx_memos_hospital_status_date 
  ON memos(hospital_id, status, created_at DESC);

-- Index for filtering by publish date (for published memos)
CREATE INDEX IF NOT EXISTS idx_memos_published 
  ON memos(hospital_id, status, publish_date DESC) 
  WHERE status = 'published';

-- ============================================
-- 3. Add updated_at trigger
-- ============================================

DROP TRIGGER IF EXISTS update_memos_updated_at ON memos;
CREATE TRIGGER update_memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "system_admin_full_access_memos" ON memos;
DROP POLICY IF EXISTS "hospital_admin_view_own_memos" ON memos;
DROP POLICY IF EXISTS "hospital_admin_create_memos" ON memos;
DROP POLICY IF EXISTS "hospital_admin_update_own_memos" ON memos;
DROP POLICY IF EXISTS "hospital_admin_delete_own_draft_memos" ON memos;
DROP POLICY IF EXISTS "users_view_published_memos" ON memos;
DROP POLICY IF EXISTS "service_role_full_access_memos" ON memos;

-- System Admin: Full access to all memos
CREATE POLICY "system_admin_full_access_memos"
  ON memos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'system_admin'
        )
    )
  );

-- Hospital Admin: View memos for their hospital
CREATE POLICY "hospital_admin_view_own_memos"
  ON memos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'hospital_admin'
        )
    )
  );

-- Hospital Admin: Create memos for their hospital
CREATE POLICY "hospital_admin_create_memos"
  ON memos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'hospital_admin'
        )
        AND users.id = memos.created_by
    )
  );

-- Hospital Admin: Update memos they created (only draft or pending_approval)
CREATE POLICY "hospital_admin_update_own_memos"
  ON memos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'hospital_admin'
        )
        AND memos.created_by = auth.uid()
        AND memos.status IN ('draft', 'pending_approval')
    )
  );

-- Hospital Admin: Delete only draft memos they created
CREATE POLICY "hospital_admin_delete_own_draft_memos"
  ON memos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
        AND users.role_id IN (
          SELECT id FROM roles WHERE role_code = 'hospital_admin'
        )
        AND memos.created_by = auth.uid()
        AND memos.status = 'draft'
    )
  );

-- All authenticated users: View published memos for their hospital
CREATE POLICY "users_view_published_memos"
  ON memos
  FOR SELECT
  TO authenticated
  USING (
    memos.status = 'published'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.hospital_id = memos.hospital_id
    )
  );

-- Service role: Full access (for backend operations)
CREATE POLICY "service_role_full_access_memos"
  ON memos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Comments for documentation
-- ============================================

COMMENT ON TABLE memos IS 'Stores hospital memos, announcements, policies, and communications';
COMMENT ON COLUMN memos.hospital_id IS 'The hospital this memo belongs to';
COMMENT ON COLUMN memos.title IS 'Title of the memo';
COMMENT ON COLUMN memos.content IS 'Full content/body of the memo';
COMMENT ON COLUMN memos.memo_type IS 'Type of memo: announcement, policy, event, emergency, maintenance';
COMMENT ON COLUMN memos.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN memos.status IS 'Current status: draft, pending_approval, approved, rejected, published, archived';
COMMENT ON COLUMN memos.created_by IS 'User who created the memo';
COMMENT ON COLUMN memos.approved_by IS 'User who approved/rejected the memo';
COMMENT ON COLUMN memos.target_departments IS 'Array of department IDs this memo is targeted to (empty = all departments)';
COMMENT ON COLUMN memos.attachments IS 'Array of file URLs/paths for memo attachments';

