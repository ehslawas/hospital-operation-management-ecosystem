-- Add is_requester_department to approval_workflow_steps
ALTER TABLE public.approval_workflow_steps 
ADD COLUMN IF NOT EXISTS is_requester_department BOOLEAN DEFAULT false;

-- Update get_pending_approvals_for_staff with better logic
CREATE OR REPLACE FUNCTION public.get_pending_approvals_for_staff(
    p_staff_id UUID
) RETURNS TABLE(
    request_id UUID,
    workflow_name TEXT,
    requester_name TEXT,
    request_data JSONB,
    entity_type TEXT,
    entity_id UUID,
    current_step INTEGER,
    step_order INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id as request_id,
        aw.workflow_name,
        u_req.full_name as requester_name,
        ar.request_data,
        ar.entity_type,
        ar.entity_id,
        ar.current_step,
        aws.step_order,
        ar.created_at
    FROM public.approval_requests ar
    JOIN public.approval_workflows aw ON aw.id = ar.workflow_id
    JOIN public.users u_req ON u_req.id = ar.requester_id
    JOIN public.approval_workflow_steps aws ON aws.workflow_id = ar.workflow_id
    JOIN public.users u_staff ON u_staff.id = p_staff_id
    WHERE ar.status = 'pending'
        AND aws.step_order = ar.current_step
        -- Strict approach: Match User ID OR (Match Role AND Match Dept)
        AND (
            -- 1. Direct user match
            aws.approver_user_id = p_staff_id 
            OR 
            (
                -- 2. Role match (if required)
                (aws.approver_role_id IS NULL OR aws.approver_role_id = u_staff.role_id)
                AND
                -- 3. Department match (if required)
                (
                    CASE 
                        WHEN aws.is_requester_department = true THEN u_staff.department_id = u_req.department_id
                        WHEN aws.approver_department_id IS NOT NULL THEN u_staff.department_id = aws.approver_department_id
                        ELSE true -- Any department if both specific and requester flags are null/false
                    END
                )
                -- 4. Ensure at least something was specified (Role or Dept) to avoid "Everyone" approving
                AND (aws.approver_role_id IS NOT NULL OR aws.approver_department_id IS NOT NULL OR aws.is_requester_department = true)
            )
        )
        -- Ensure no action taken yet for this step
        AND NOT EXISTS (
            SELECT 1 FROM public.approval_actions aa
            WHERE aa.request_id = ar.id
                AND aa.step_order = aws.step_order
                AND aa.approver_id = p_staff_id
        )
    ORDER BY ar.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
