// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import type { ApiResponse } from '@/types';
import type {
  CylinderDispatchRequest,
  CylinderDispatchRequestWithRelations,
  CylinderDispatchKPI
} from '@/types/pharmacy';

export const ALLOWED_OXYGEN_CLINICAL_DEPARTMENTS = [
  { name: 'Emergency and trauma', code: 'ETD' },
  { name: 'General ward', code: 'GW' },
  { name: 'Paediatric ward', code: 'PAED' },
  { name: 'Maternity ward', code: 'MAT' },
  { name: 'Operation Theater', code: 'OT' },
  { name: 'Radiology and radiography', code: 'RAD' },
  { name: 'Nephrology', code: 'NEPH' },
];

/**
 * Fetch the 7 authorized oxygen requesting clinical departments without triggering RLS 403 Forbidden errors
 */
export async function getClinicalDepartments(hospitalId: string): Promise<{ id: string; department_name: string; department_code: string }[]> {
  try {
    if (!isSupabaseConfigured() || !hospitalId) {
      return ALLOWED_OXYGEN_CLINICAL_DEPARTMENTS.map((d, i) => ({
        id: `dept-local-${i}`,
        department_name: d.name,
        department_code: d.code
      }));
    }

    const { data: existing } = await supabase
      .from('departments')
      .select('id, department_name, department_code')
      .eq('hospital_id', hospitalId);

    const deptList: any[] = existing || [];
    const result: { id: string; department_name: string; department_code: string }[] = [];

    for (const target of ALLOWED_OXYGEN_CLINICAL_DEPARTMENTS) {
      const found = deptList.find(d => {
        const name = (d.department_name || '').toLowerCase().trim();
        return name === target.name.toLowerCase().trim() || name.includes(target.name.toLowerCase().split(' ')[0]);
      });

      if (found) {
        result.push({
          id: found.id,
          department_name: found.department_name,
          department_code: found.department_code || target.code
        });
      } else {
        // Pure in-memory fallback ID without POST request to avoid RLS 403 Forbidden
        result.push({
          id: `dept-auto-${target.code.toLowerCase()}`,
          department_name: target.name,
          department_code: target.code
        });
      }
    }

    return result;
  } catch (err) {
    console.warn('Error getting clinical departments:', err);
    return ALLOWED_OXYGEN_CLINICAL_DEPARTMENTS.map((d, i) => ({
      id: `dept-fallback-${i}`,
      department_name: d.name,
      department_code: d.code
    }));
  }
}

/**
 * Helper to flexibly resolve cylinder_size_id from database sizes list
 */
function resolveCylinderSizeId(sizeCode: string, sizes: any[]): string {
  if (!sizes || sizes.length === 0) return '332911a0-9e8c-4c0e-980a-9df3d0197dce';

  const clean = (sizeCode || '').toUpperCase().trim();

  // 1. Direct match (e.g. 101-F-BN === 101-F-BN or 101-F === 101-F)
  let found = sizes.find((s) => s.code?.toUpperCase() === clean);
  if (found) return found.id;

  // 2. Strip 'P' prefix (e.g. P101-F-BN -> 101-F-BN, P101-F -> 101-F)
  const normClean = clean.replace(/^P/, '');
  found = sizes.find((s) => (s.code || '').toUpperCase().replace(/^P/, '') === normClean);
  if (found) return found.id;

  // 3. Match 1.4m³ variants (101-F-BN, P101-F-BN, 101-F-PI, P101-F-PI) to 101-F / P101-F in DB
  if (clean.includes('101-F')) {
    found = sizes.find((s) => (s.code || '').toUpperCase().includes('101-F'));
    if (found) return found.id;
  }

  // 4. Match 8.0m³ variants (101-N, P101-N) to 101-N in DB
  if (clean.includes('101-N')) {
    found = sizes.find((s) => (s.code || '').toUpperCase().includes('101-N'));
    if (found) return found.id;
  }

  // 5. Fallback to first available size in DB
  return sizes[0]?.id || '332911a0-9e8c-4c0e-980a-9df3d0197dce';
}

/**
 * Mapper function to translate the database model to the UI type
 */
function mapToCylinderDispatchRequest(row: any, sizes: any[]): CylinderDispatchRequestWithRelations {
  const items = (row.items || []).map((itm: any) => {
    let sizeCode = itm.size_code || 
                   itm.size_info?.code || 
                   sizes.find(s => s.id === itm.cylinder_size_id)?.code || 
                   '101-N';

    const notes = itm.usage_notes || '';
    if ((sizeCode === '101-F' || sizeCode === 'P101-F') && (notes.includes('Bullnose') || notes.includes('BN'))) {
      sizeCode = '101-F-BN';
    }

    return {
      id: itm.id,
      dispatch_request_id: itm.request_id,
      size_code: sizeCode,
      quantity_requested: itm.quantity,
      quantity_issued: itm.quantity_issued || 0,
      usage_notes: notes
    };
  });

  return {
    id: row.id,
    hospital_id: row.hospital_id,
    request_number: row.request_id,
    request_type: row.manual_requester_name ? 'manual_issue' : 'unit_request',
    department_id: row.department_id,
    requester_id: row.requested_by,
    issuer_id: row.approved_by,
    approver_id: row.approved_by,
    status: row.status || 'pending',
    priority: 'normal',
    request_date: row.created_at,
    approved_date: row.approved_at,
    issued_date: row.approved_at,
    completed_date: row.status === 'completed' ? row.updated_at : undefined,
    remarks: row.manual_requester_name || '',
    rejection_reason: row.rejection_reason || '',
    created_by: row.requested_by,
    department: row.department,
    requester: row.requester ? {
      id: row.requester.id,
      full_name: row.requester.full_name,
      jawatan: row.requester.jawatan
    } : undefined,
    issuer: row.approver ? {
      id: row.approver.id,
      full_name: row.approver.full_name,
      jawatan: row.approver.jawatan
    } : undefined,
    approver: row.approver ? {
      id: row.approver.id,
      full_name: row.approver.full_name,
      jawatan: row.approver.jawatan
    } : undefined,
    items: items
  };
}

/**
 * Helper to generate sequential request numbers matching database conventions
 */
export async function getNextRequestNumber(hospitalId: string): Promise<string> {
  try {
    if (isSupabaseConfigured()) {
      const year = new Date().getFullYear();
      const { count, error } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId)
        .like('request_id', `OC-${year}-%`);

      if (error) throw error;
      const nextSeq = (count || 0) + 1;
      return `OC-${year}-${String(nextSeq).padStart(4, '0')}`;
    }
  } catch (err) {
    console.error('Error generating next request number:', err);
  }
  const year = new Date().getFullYear();
  return `OC-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Fetch all cylinder dispatch requests from live tables
 */
export async function getCylinderDispatchRequests(
  hospitalId: string,
  filters?: {
    status?: string;
    departmentId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<CylinderDispatchRequestWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('pharmacy_oxygen_dept_requests')
        .select(`
          *,
          department:departments(id, department_name, department_code),
          requester:users!pharmacy_oxygen_dept_requests_requested_by_fkey(id, full_name, jawatan),
          approver:users!pharmacy_oxygen_dept_requests_approved_by_fkey(id, full_name, jawatan),
          items:pharmacy_oxygen_dept_request_items(
            id,
            request_id,
            cylinder_size_id,
            quantity,
            quantity_issued,
            usage_notes,
            size_info:pharmacy_oxygen_cylinder_sizes(id, code)
          )
        `)
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.departmentId && filters.departmentId !== 'all') {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      let { data, error } = await query;
      if (error) throw error;

      // Clean out any legacy mock test rows from database table
      if (data && data.some((r: any) => r.request_id?.startsWith('OC-2026-000') || r.request_id?.startsWith('OC-2026-010'))) {
        try {
          await supabase.from('pharmacy_oxygen_dept_requests').delete().or('request_id.like.OC-2026-000%,request_id.like.OC-2026-010%');
          const reFetch = await query;
          data = reFetch.data || [];
        } catch (cleanErr) {
          console.warn('Could not clean mock request rows:', cleanErr);
        }
      }

      // Load all sizes for mapping fallback
      const { data: sizes } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('id, code');

      const mapped = (data || []).map((row) => mapToCylinderDispatchRequest(row, sizes || []));

      let filteredData = mapped;
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((req) => {
          return (
            req.request_number.toLowerCase().includes(searchLower) ||
            req.department?.department_name?.toLowerCase().includes(searchLower) ||
            req.requester?.full_name?.toLowerCase().includes(searchLower) ||
            req.issuer?.full_name?.toLowerCase().includes(searchLower) ||
            req.remarks.toLowerCase().includes(searchLower)
          );
        });
      }

      return { data: filteredData, error: null };
    }
    return { data: [], error: null };
  } catch (error) {
    console.error('Error fetching cylinder dispatch requests:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch dispatch requests'
    };
  }
}

/**
 * Fetch a single request by ID with relations
 */
export async function getCylinderDispatchRequestById(
  requestId: string
): Promise<ApiResponse<CylinderDispatchRequestWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .select(`
          *,
          department:departments(id, department_name, department_code),
          requester:users!pharmacy_oxygen_dept_requests_requested_by_fkey(id, full_name, jawatan),
          approver:users!pharmacy_oxygen_dept_requests_approved_by_fkey(id, full_name, jawatan),
          items:pharmacy_oxygen_dept_request_items(
            id,
            request_id,
            cylinder_size_id,
            quantity,
            quantity_issued,
            usage_notes,
            size_info:pharmacy_oxygen_cylinder_sizes(id, code)
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;

      const { data: sizes } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('id, code');
      return { data: mapToCylinderDispatchRequest(data, sizes || []), error: null };
    }
    return { data: null, error: 'Supabase not configured' };
  } catch (error) {
    console.error('Error fetching cylinder dispatch request detail:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch request detail'
    };
  }
}

/**
 * Fetch aggregated KPI statistics for cylinder dispatch requests
 */
export async function getCylinderDispatchKPI(hospitalId: string): Promise<ApiResponse<CylinderDispatchKPI>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .select('status, created_at, approved_at, updated_at')
        .eq('hospital_id', hospitalId);

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let total_requests = 0;
      let pending_count = 0;
      let approved_count = 0;
      let issued_count = 0;
      let completed_count = 0;
      let rejected_count = 0;
      let cancelled_count = 0;
      let this_month_count = 0;

      let totalFulfillmentHours = 0;
      let fulfilledCount = 0;

      (data || []).forEach((req) => {
        total_requests++;
        const reqDate = new Date(req.created_at);
        if (reqDate >= startOfMonth) {
          this_month_count++;
        }

        switch (req.status) {
          case 'pending':
            pending_count++;
            break;
          case 'approved':
            approved_count++;
            break;
          case 'issued':
            issued_count++;
            break;
          case 'completed':
            completed_count++;
            break;
          case 'rejected':
            rejected_count++;
            break;
          case 'cancelled':
            cancelled_count++;
            break;
        }

        if (req.status === 'completed' && req.approved_at && req.created_at) {
          const hours = (new Date(req.updated_at).getTime() - new Date(req.created_at).getTime()) / (1000 * 60 * 60);
          totalFulfillmentHours += hours;
          fulfilledCount++;
        }
      });

      const avg_fulfillment_hours = fulfilledCount > 0 ? parseFloat((totalFulfillmentHours / fulfilledCount).toFixed(1)) : 0;

      return {
        data: {
          total_requests,
          pending_count,
          approved_count,
          issued_count,
          completed_count,
          rejected_count,
          cancelled_count,
          this_month_count,
          avg_fulfillment_hours
        },
        error: null
      };
    }

    return {
      data: {
        total_requests: 0,
        pending_count: 0,
        approved_count: 0,
        issued_count: 0,
        completed_count: 0,
        rejected_count: 0,
        cancelled_count: 0,
        this_month_count: 0,
        avg_fulfillment_hours: 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error calculating cylinder dispatch KPIs:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate KPIs'
    };
  }
}

/**
 * Path A: Create Manual Issue (issued immediately)
 */
export async function createManualIssue(
  hospitalId: string,
  data: {
    department_id: string;
    items: { size_code: string; quantity: number; usage_notes?: string }[];
    remarks?: string;
    issuer_id: string;
    requested_by?: string;
    manual_requester_name?: string;
    cylinder_ids?: string[];
  }
): Promise<ApiResponse<CylinderDispatchRequest>> {
  try {
    if (isSupabaseConfigured()) {
      const request_id = await getNextRequestNumber(hospitalId);

      // Insert Request
      const { data: request, error: reqError } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .insert({
          hospital_id: hospitalId,
          request_id,
          department_id: data.department_id,
          requested_by: data.requested_by || data.issuer_id,
          status: 'completed',
          approved_by: data.issuer_id,
          approved_at: new Date().toISOString(),
          manual_requester_name: data.manual_requester_name || data.remarks || 'MANUAL ISSUE'
        })
        .select('*')
        .single();

      if (reqError) throw reqError;

      // Fetch sizes for mapping
      const { data: sizes } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('id, code');

      // Insert Items
      const itemRows = data.items.map((item) => {
        const sizeId = resolveCylinderSizeId(item.size_code, sizes || []);
        let notes = item.usage_notes || '';
        if (item.size_code === '101-F-BN' || item.size_code === 'P101-F-BN') {
          if (!notes.includes('BN') && !notes.includes('Bullnose')) {
            notes = notes ? `[Bullnose BN] ${notes}` : '[Bullnose BN]';
          }
        } else if (item.size_code === '101-F' || item.size_code === 'P101-F' || item.size_code === '101-F-PI') {
          if (!notes.includes('PI') && !notes.includes('Pin Index')) {
            notes = notes ? `[Pin Index PI] ${notes}` : '[Pin Index PI]';
          }
        }

        return {
          request_id: request.id,
          cylinder_size_id: sizeId,
          quantity: item.quantity,
          quantity_issued: item.quantity,
          usage_notes: notes
        };
      });

      const { error: itemsError } = await supabase
        .from('pharmacy_oxygen_dept_request_items')
        .insert(itemRows);

      if (itemsError) throw itemsError;

      // Log movement and update cylinder inventory if specific cylinders were assigned
      if (data.cylinder_ids && data.cylinder_ids.length > 0) {
        for (const cid of data.cylinder_ids) {
          // Update status in inventory
          await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .update({
              status: 'issued',
              current_location: 'Department',
              department_id: data.department_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', cid);

          // Insert movement log
          await supabase
            .from('pharmacy_oxygen_cylinder_movements')
            .insert({
              hospital_id: hospitalId,
              cylinder_id: cid,
              movement_type: 'issued',
              from_location: 'Pharmacy Store',
              to_location: 'Department',
              department_id: data.department_id,
              moved_by: data.issuer_id,
              moved_at: new Date().toISOString(),
              remarks: `Dispatched via manual issue ${request_id}`
            });
        }
      }

      return { data: mapToCylinderDispatchRequest(request, sizes || []), error: null };
    }
    return { data: null, error: 'Supabase not configured' };
  } catch (error) {
    console.error('Error creating manual issue:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create manual issue'
    };
  }
}

/**
 * Path B: Create Unit Request (pending approval)
 */
export async function createUnitRequest(
  hospitalId: string,
  data: {
    department_id: string;
    items: { size_code: string; quantity: number; usage_notes?: string }[];
    remarks?: string;
    requester_id: string;
    priority: 'normal' | 'urgent' | 'emergency';
  }
): Promise<ApiResponse<CylinderDispatchRequest>> {
  try {
    if (isSupabaseConfigured()) {
      const request_id = await getNextRequestNumber(hospitalId);

      // Insert Request
      const { data: request, error: reqError } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .insert({
          hospital_id: hospitalId,
          request_id,
          department_id: data.department_id,
          requested_by: data.requester_id,
          status: 'pending',
          rejection_reason: data.remarks || null
        })
        .select('*')
        .single();

      if (reqError) throw reqError;

      // Fetch sizes for mapping
      const { data: sizes } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('id, code');

      // Insert Items
      const itemRows = data.items.map((item) => {
        const sizeId = resolveCylinderSizeId(item.size_code, sizes || []);
        let notes = item.usage_notes || '';
        if (item.size_code === '101-F-BN' || item.size_code === 'P101-F-BN') {
          if (!notes.includes('BN') && !notes.includes('Bullnose')) {
            notes = notes ? `[Bullnose BN] ${notes}` : '[Bullnose BN]';
          }
        } else if (item.size_code === '101-F' || item.size_code === 'P101-F' || item.size_code === '101-F-PI') {
          if (!notes.includes('PI') && !notes.includes('Pin Index')) {
            notes = notes ? `[Pin Index PI] ${notes}` : '[Pin Index PI]';
          }
        }

        return {
          request_id: request.id,
          cylinder_size_id: sizeId,
          quantity: item.quantity,
          quantity_issued: 0,
          usage_notes: notes
        };
      });

      const { error: itemsError } = await supabase
        .from('pharmacy_oxygen_dept_request_items')
        .insert(itemRows);

      if (itemsError) throw itemsError;

      return { data: mapToCylinderDispatchRequest(request, sizes || []), error: null };
    }
    return { data: null, error: 'Supabase not configured' };
  } catch (error) {
    console.error('Error creating unit request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create unit request'
    };
  }
}

/**
 * Approve Request
 */
export async function approveRequest(requestId: string, approverId: string): Promise<ApiResponse<void>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      return { data: undefined, error: null };
    }
    return { data: undefined, error: 'Supabase not configured' };
  } catch (error) {
    console.error('Error approving request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to approve request'
    };
  }
}

/**
 * Reject Request with reason
 */
export async function rejectRequest(
  requestId: string,
  approverId: string,
  reason: string
): Promise<ApiResponse<void>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .update({
          status: 'rejected',
          rejected_by: approverId,
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      return { data: undefined, error: null };
    }
    return { data: undefined, error: 'Supabase not configured' };
  } catch (error) {
    console.error('Error rejecting request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to reject request'
    };
  }
}

/**
 * Issue cylinders (Pharmacy dispatches requested cylinders)
 */
export async function issueRequest(
  requestId: string,
  issuerId: string,
  items: { id: string; quantity_issued: number; cylinder_id?: string }[]
): Promise<ApiResponse<void>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Update quantities issued for each item
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('pharmacy_oxygen_dept_request_items')
          .update({
            quantity_issued: item.quantity_issued
          })
          .eq('id', item.id);

        if (itemError) throw itemError;

        // Log movement and update cylinder inventory if a specific cylinder was assigned
        if (item.cylinder_id) {
          const { data: request } = await supabase
            .from('pharmacy_oxygen_dept_requests')
            .select('department_id, request_id, hospital_id')
            .eq('id', requestId)
            .single();

          if (request) {
            await supabase
              .from('pharmacy_oxygen_cylinder_inventory')
              .update({
                status: 'issued',
                current_location: 'Department',
                department_id: request.department_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.cylinder_id);

            await supabase
              .from('pharmacy_oxygen_cylinder_movements')
              .insert({
                hospital_id: request.hospital_id,
                cylinder_id: item.cylinder_id,
                movement_type: 'issued',
                from_location: 'Pharmacy Store',
                to_location: 'Department',
                department_id: request.department_id,
                moved_by: issuerId,
                moved_at: new Date().toISOString(),
                remarks: `Dispatched via dept request ${request.request_id}`
              });
          }
        }
      }

      // 2. Update Request Status to 'completed' / 'issued'
      const { error: reqError } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .update({
          status: 'completed',
          approved_by: issuerId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (reqError) throw reqError;

      return { data: undefined, error: null };
    }
    return { data: undefined, error: 'Supabase not configured' };
  } catch (error) {
    console.error('Error issuing cylinders:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to issue cylinders'
    };
  }
}

/**
 * Complete Request (Acknowledge receipt)
 */
export async function completeRequest(requestId: string): Promise<ApiResponse<void>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      return { data: undefined, error: null };
    }
    return { data: undefined, error: 'Supabase not configured' };
  } catch (error) {
    console.error('Error completing request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to complete request'
    };
  }
}

/**
 * Cancel Request
 */
export async function cancelRequest(requestId: string): Promise<ApiResponse<void>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('pharmacy_oxygen_dept_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      return { data: undefined, error: null };
    }
    return { data: undefined, error: 'Supabase not configured' };
  } catch (error) {
    console.error('Error cancelling request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to cancel request'
    };
  }
}
