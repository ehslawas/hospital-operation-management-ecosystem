import { getDepartmentById } from '@/services/departmentService'

import { ApprovalRouteType } from '@/types'

export interface RoutingDecision {
    routeType: ApprovalRouteType
    requiresExternalApproval: boolean
    nextStep: number
    message: string
}

/**
 * Authority Interceptor
 * Intercepts a purchase request to determine its approval route
 * Enforces the "Dual-Track Conditional Purchasing Workflow"
 */
export async function determineApprovalRouting(
    departmentId: string
): Promise<RoutingDecision> {
    try {
        // 1. Fetch Department Details to check approval_type
        const department = await getDepartmentById(departmentId)

        if (!department) {
            throw new Error('Department not found')
        }

        // 2. Determine Route Type
        // Defaults to 'standard' (Route A) if not specified
        const routeType: ApprovalRouteType = department.approval_type || 'standard'

        if (routeType === 'exempt') {
            // Route B: Exempt (Admin / Pathology)
            // Workflow: Requester -> Internal Dept Head Approval -> Auto-Finalized (Internal)
            // Bypasses Pharmacy Logistics
            return {
                routeType: 'exempt',
                requiresExternalApproval: false,
                nextStep: 1, // Goes to Internal Head
                message: 'Routing to Internal Department Head (Exempt Track)'
            }
        } else {
            // Route A: Standard (Clinical)
            // Workflow: Requester -> Head of Dept -> Pharmacy Logistics (Final)
            return {
                routeType: 'standard',
                requiresExternalApproval: true,
                nextStep: 1, // Goes to Head of Dept first
                message: 'Routing to Department Head then Pharmacy Logistics (Standard Track)'
            }
        }

    } catch (error) {
        console.error('Authority Interceptor Error:', error)
        // Fail safe to standard route with strict checking
        return {
            routeType: 'standard',
            requiresExternalApproval: true,
            nextStep: 1,
            message: 'Error determining route, defaulting to Standard Track'
        }
    }
}
