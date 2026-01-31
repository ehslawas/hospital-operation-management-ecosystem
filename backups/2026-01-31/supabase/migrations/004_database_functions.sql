-- System Admin Module - Database Functions & Triggers
-- Phase 2: Automation & Helpers

-- ============================================
-- 1. Auto-create Alert on Critical Health Check
-- ============================================
CREATE OR REPLACE FUNCTION auto_alert_on_critical_health()
RETURNS TRIGGER AS $$
BEGIN
  -- If health check is critical, create an alert
  IF NEW.status = 'critical' THEN
    INSERT INTO system_alerts (
      alert_type,
      category,
      title,
      message,
      metadata
    ) VALUES (
      'critical',
      'system',
      'Critical System Health Issue: ' || NEW.check_type,
      NEW.message || ' (Value: ' || NEW.value || ' ' || NEW.unit || ')',
      jsonb_build_object(
        'check_type', NEW.check_type,
        'value', NEW.value,
        'unit', NEW.unit,
        'health_log_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create alerts
DROP TRIGGER IF EXISTS trigger_alert_on_critical_health ON system_health_logs;
CREATE TRIGGER trigger_alert_on_critical_health
  AFTER INSERT ON system_health_logs
  FOR EACH ROW
  WHEN (NEW.status = 'critical')
  EXECUTE FUNCTION auto_alert_on_critical_health();

-- ============================================
-- 2. Auto-create Alert on Backup Failure
-- ============================================
CREATE OR REPLACE FUNCTION auto_alert_on_backup_failure()
RETURNS TRIGGER AS $$
BEGIN
  -- If backup failed, create an alert
  IF NEW.status = 'failed' THEN
    INSERT INTO system_alerts (
      alert_type,
      category,
      title,
      message,
      metadata
    ) VALUES (
      'error',
      'backup',
      'Backup Failed: ' || NEW.backup_type,
      COALESCE(NEW.error_message, 'Backup operation failed'),
      jsonb_build_object(
        'backup_id', NEW.id,
        'backup_type', NEW.backup_type,
        'initiated_by', NEW.initiated_by
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create alerts on backup failure
DROP TRIGGER IF EXISTS trigger_alert_on_backup_failure ON system_backups;
CREATE TRIGGER trigger_alert_on_backup_failure
  AFTER UPDATE ON system_backups
  FOR EACH ROW
  WHEN (NEW.status = 'failed' AND OLD.status != 'failed')
  EXECUTE FUNCTION auto_alert_on_backup_failure();

-- ============================================
-- 3. Function to Get System Statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_system_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_hospitals', (SELECT COUNT(*) FROM hospitals),
    'active_hospitals', (SELECT COUNT(*) FROM hospitals WHERE status = 'active'),
    'inactive_hospitals', (SELECT COUNT(*) FROM hospitals WHERE status = 'inactive'),
    'pending_setup_hospitals', (
      SELECT COUNT(*) FROM hospitals 
      WHERE status = 'active' AND admin_id IS NULL
    ),
    'total_users', (SELECT COUNT(*) FROM users),
    'active_users', (SELECT COUNT(*) FROM users WHERE status = 'active'),
    'pending_users', (SELECT COUNT(*) FROM users WHERE status = 'pending'),
    'suspended_users', (SELECT COUNT(*) FROM users WHERE status = 'suspended'),
    'inactive_users', (SELECT COUNT(*) FROM users WHERE status = 'inactive'),
    'module_usage', (
      SELECT jsonb_object_agg(
        module_code,
        jsonb_build_object(
          'count', COUNT(*),
          'percentage', ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM hospitals WHERE status = 'active'), 0), 2)
        )
      )
      FROM hospital_modules
      WHERE is_enabled = true
    ),
    'system_health', (
      SELECT jsonb_build_object(
        'overall_status', (
          CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'critical') > 0 THEN 'critical'
            WHEN COUNT(*) FILTER (WHERE status = 'warning') > 0 THEN 'warning'
            ELSE 'healthy'
          END
        ),
        'checks', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', id,
              'check_type', check_type,
              'status', status,
              'value', value,
              'unit', unit,
              'message', message,
              'checked_at', checked_at
            )
          )
          FROM (
            SELECT DISTINCT ON (check_type) *
            FROM system_health_logs
            ORDER BY check_type, checked_at DESC
          ) latest_checks
        )
      )
      FROM system_health_logs
      WHERE checked_at > NOW() - INTERVAL '1 hour'
    ),
    'recent_alerts', (
      SELECT jsonb_build_object(
        'critical', COUNT(*) FILTER (WHERE alert_type = 'critical' AND is_resolved = false),
        'warning', COUNT(*) FILTER (WHERE alert_type = 'warning' AND is_resolved = false),
        'info', COUNT(*) FILTER (WHERE alert_type = 'info' AND is_resolved = false)
      )
      FROM system_alerts
      WHERE created_at > NOW() - INTERVAL '24 hours'
    ),
    'last_backup', (
      SELECT jsonb_build_object(
        'id', id,
        'backup_type', backup_type,
        'status', status,
        'file_path', file_path,
        'file_size', file_size,
        'completed_at', completed_at
      )
      FROM system_backups
      WHERE status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_system_statistics() TO authenticated;

-- ============================================
-- 4. Function to Clean Old Health Logs
-- ============================================
CREATE OR REPLACE FUNCTION clean_old_health_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete health logs older than 30 days (configurable)
  DELETE FROM system_health_logs
  WHERE checked_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Function to Clean Old Alerts
-- ============================================
CREATE OR REPLACE FUNCTION clean_old_alerts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete resolved alerts older than 90 days
  DELETE FROM system_alerts
  WHERE is_resolved = true
    AND resolved_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Function to Get Module Usage Statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_module_usage_stats()
RETURNS TABLE (
  module_code TEXT,
  enabled_count BIGINT,
  total_hospitals BIGINT,
  usage_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.module_code,
    COUNT(*) FILTER (WHERE m.is_enabled = true) as enabled_count,
    (SELECT COUNT(*) FROM hospitals WHERE status = 'active') as total_hospitals,
    ROUND(
      COUNT(*) FILTER (WHERE m.is_enabled = true) * 100.0 / 
      NULLIF((SELECT COUNT(*) FROM hospitals WHERE status = 'active'), 0),
      2
    ) as usage_percentage
  FROM hospital_modules m
  GROUP BY m.module_code
  ORDER BY m.module_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_module_usage_stats() TO authenticated;

