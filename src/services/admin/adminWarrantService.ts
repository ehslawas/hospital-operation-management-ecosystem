import { supabase } from '../supabase';
import {
    AdminWarrant,
    AdminWarrantFormData,
    AdminWarrantProgram,
    AdminWarrantObjek,
    AdminWarrantKategori,
    AdminWarrantBudgetGroup,
    AdminWarrantAllocation,
    AdminWarrantAllocationFormData,
    AdminWarrantSummary
} from '../../types/adminOperations.types';
import {
    ADMIN_WARRANT_PROGRAMS,
    ADMIN_WARRANT_OBJEKS,
    ADMIN_WARRANT_BUDGET_GROUPS,
    getKategoriDetails,
    AdminWarrantProgramCode
} from '../../lib/adminWarrantConstants';

export const adminWarrantService = {
    // ==========================================
    // WARRANTS - CRUD Operations
    // ==========================================

    async getAdminWarrants(
        hospitalId: string,
        filters?: {
            fiscalYear?: number;
            programCode?: string;
            objekCode?: string;
            kategoriCode?: string;
        }
    ): Promise<AdminWarrant[]> {
        let query = supabase
            .from('admin_warrants')
            .select(`
                *,
                created_by_user:users!admin_warrants_created_by_fkey(full_name, email)
            `)
            .eq('hospital_id', hospitalId)
            .order('warrant_date', { ascending: false });

        if (filters?.fiscalYear) {
            query = query.eq('fiscal_year', filters.fiscalYear);
        }
        if (filters?.programCode) {
            query = query.eq('program_code', filters.programCode);
        }
        if (filters?.objekCode) {
            query = query.eq('objek_code', filters.objekCode);
        }
        if (filters?.kategoriCode) {
            query = query.eq('kategori_code', filters.kategoriCode);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as AdminWarrant[];
    },

    async getAdminWarrantById(id: string): Promise<AdminWarrant> {
        const { data, error } = await supabase
            .from('admin_warrants')
            .select(`
                *,
                created_by_user:users!admin_warrants_created_by_fkey(full_name, email)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as AdminWarrant;
    },

    async createAdminWarrant(
        hospitalId: string,
        userId: string,
        formData: AdminWarrantFormData
    ): Promise<AdminWarrant> {
        const fiscalYear = formData.fiscal_year || new Date().getFullYear();

        // Get kategori details to determine if it uses shared budget
        const kategoriDetails = getKategoriDetails(
            formData.program_code as AdminWarrantProgramCode,
            formData.objek_code,
            formData.kategori_code
        );

        // Find budget group ID if this is a shared budget kategori
        let budgetGroupId: string | null = null;
        if (kategoriDetails?.isSharedBudget && kategoriDetails.budgetGroupCode) {
            const { data: groupData } = await supabase
                .from('admin_warrant_budget_groups')
                .select('id')
                .eq('hospital_id', hospitalId)
                .eq('group_code', kategoriDetails.budgetGroupCode)
                .eq('fiscal_year', fiscalYear)
                .single();

            budgetGroupId = groupData?.id || null;
        }

        const { data, error } = await supabase
            .from('admin_warrants')
            .insert({
                hospital_id: hospitalId,
                warrant_date: formData.warrant_date,
                document_no: formData.document_no,
                // Legacy fields (for backward compatibility, using program/objek)
                vote_code: formData.program_code,
                vote_activity: formData.objek_code,
                category: formData.kategori_code,
                // New hierarchy fields
                program_code: formData.program_code,
                objek_code: formData.objek_code,
                kategori_code: formData.kategori_code,
                budget_group_id: budgetGroupId,
                fiscal_year: fiscalYear,
                amount: formData.amount,
                description: formData.description,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data as AdminWarrant;
    },

    async updateAdminWarrant(
        id: string,
        formData: Partial<AdminWarrantFormData>
    ): Promise<AdminWarrant> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (formData.warrant_date) updateData.warrant_date = formData.warrant_date;
        if (formData.document_no) updateData.document_no = formData.document_no;
        if (formData.program_code) {
            updateData.program_code = formData.program_code;
            updateData.vote_code = formData.program_code;
        }
        if (formData.objek_code) {
            updateData.objek_code = formData.objek_code;
            updateData.vote_activity = formData.objek_code;
        }
        if (formData.kategori_code) {
            updateData.kategori_code = formData.kategori_code;
            updateData.category = formData.kategori_code;
        }
        if (formData.amount !== undefined) updateData.amount = formData.amount;
        if (formData.description !== undefined) updateData.description = formData.description;

        const { data, error } = await supabase
            .from('admin_warrants')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as AdminWarrant;
    },

    async deleteAdminWarrant(id: string): Promise<void> {
        const { error } = await supabase
            .from('admin_warrants')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ==========================================
    // BUDGET GROUPS (Shared Allocations)
    // ==========================================

    async getBudgetGroups(
        hospitalId: string,
        fiscalYear: number
    ): Promise<AdminWarrantBudgetGroup[]> {
        const { data, error } = await supabase
            .from('admin_warrant_budget_groups')
            .select('*')
            .eq('hospital_id', hospitalId)
            .eq('fiscal_year', fiscalYear);

        if (error) throw error;

        // Calculate spent amounts for each group
        const groupsWithSpent = await Promise.all(
            (data || []).map(async (group) => {
                const spent = await this.getBudgetGroupSpent(hospitalId, group.group_code, fiscalYear);
                return {
                    ...group,
                    spent_amount: spent,
                    remaining_amount: group.allocated_amount - spent
                } as AdminWarrantBudgetGroup;
            })
        );

        return groupsWithSpent;
    },

    async upsertBudgetGroup(
        hospitalId: string,
        data: {
            programCode: string;
            objekCode: string;
            groupCode: string;
            groupName: string;
            fiscalYear: number;
            allocatedAmount: number;
        }
    ): Promise<AdminWarrantBudgetGroup> {
        const { data: result, error } = await supabase
            .from('admin_warrant_budget_groups')
            .upsert({
                hospital_id: hospitalId,
                program_code: data.programCode,
                objek_code: data.objekCode,
                group_code: data.groupCode,
                group_name: data.groupName,
                fiscal_year: data.fiscalYear,
                allocated_amount: data.allocatedAmount,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'hospital_id,program_code,objek_code,group_code,fiscal_year'
            })
            .select()
            .single();

        if (error) throw error;
        return result as AdminWarrantBudgetGroup;
    },

    async getBudgetGroupSpent(
        hospitalId: string,
        groupCode: string,
        fiscalYear: number
    ): Promise<number> {
        // Get all kategoris in this group
        const groupConfig = ADMIN_WARRANT_BUDGET_GROUPS[groupCode];
        if (!groupConfig) return 0;

        const { data, error } = await supabase
            .from('admin_warrants')
            .select('amount')
            .eq('hospital_id', hospitalId)
            .eq('fiscal_year', fiscalYear)
            .in('kategori_code', groupConfig.kategoris);

        if (error) throw error;
        return (data || []).reduce((sum, w) => sum + Number(w.amount), 0);
    },

    // ==========================================
    // INDIVIDUAL ALLOCATIONS (Non-shared)
    // ==========================================

    async getAllocations(
        hospitalId: string,
        fiscalYear: number
    ): Promise<AdminWarrantAllocation[]> {
        const { data, error } = await supabase
            .from('admin_warrant_allocations')
            .select('*')
            .eq('hospital_id', hospitalId)
            .eq('fiscal_year', fiscalYear);

        if (error) throw error;

        // Calculate spent amounts
        const allocationsWithSpent = await Promise.all(
            (data || []).map(async (alloc) => {
                const spent = await this.getKategoriSpent(
                    hospitalId,
                    alloc.program_code,
                    alloc.objek_code,
                    alloc.kategori_code,
                    fiscalYear
                );
                return {
                    ...alloc,
                    spent_amount: spent,
                    remaining_amount: alloc.allocated_amount - spent
                } as AdminWarrantAllocation;
            })
        );

        return allocationsWithSpent;
    },

    async upsertAllocation(
        hospitalId: string,
        userId: string,
        data: AdminWarrantAllocationFormData
    ): Promise<AdminWarrantAllocation> {
        const { data: result, error } = await supabase
            .from('admin_warrant_allocations')
            .upsert({
                hospital_id: hospitalId,
                program_code: data.program_code,
                objek_code: data.objek_code,
                kategori_code: data.kategori_code,
                fiscal_year: data.fiscal_year,
                allocated_amount: data.allocated_amount,
                created_by: userId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'hospital_id,program_code,objek_code,kategori_code,fiscal_year'
            })
            .select()
            .single();

        if (error) throw error;
        return result as AdminWarrantAllocation;
    },

    async getKategoriSpent(
        hospitalId: string,
        programCode: string,
        objekCode: string,
        kategoriCode: string,
        fiscalYear: number
    ): Promise<number> {
        const { data, error } = await supabase
            .from('admin_warrants')
            .select('amount')
            .eq('hospital_id', hospitalId)
            .eq('program_code', programCode)
            .eq('objek_code', objekCode)
            .eq('kategori_code', kategoriCode)
            .eq('fiscal_year', fiscalYear);

        if (error) throw error;
        return (data || []).reduce((sum, w) => sum + Number(w.amount), 0);
    },

    // ==========================================
    // SUMMARY & ANALYTICS
    // ==========================================

    async getAdminWarrantSummary(
        hospitalId: string,
        fiscalYear: number
    ): Promise<AdminWarrantSummary> {
        // Fetch all data in parallel
        const [warrants] = await Promise.all([
            this.getAdminWarrants(hospitalId, { fiscalYear })
        ]);

        // In this system, Warrants represent the Allocation (incoming funds)
        const totalAllocation = warrants.reduce((sum, w) => sum + Number(w.amount), 0);

        // Expenses will come from actual spending records (Purchase Orders, etc.)
        // User confirmed there are 0 expenses for now.
        const totalExpenses = 0;

        const totalBalance = totalAllocation - totalExpenses;
        const usagePercentage = totalAllocation > 0 ? (totalExpenses / totalAllocation) * 100 : 0;

        // Build breakdown by program
        const byProgram = ADMIN_WARRANT_PROGRAMS.map(prog => {
            const progWarrants = warrants.filter(w => w.program_code === prog.code);
            const progAllocated = progWarrants.reduce((sum, w) => sum + Number(w.amount), 0);
            const progExpenses = 0; // Placeholder for actual spending

            return {
                program_code: prog.code,
                program_name: prog.label,
                allocated: progAllocated,
                spent: progExpenses,
                balance: progAllocated - progExpenses,
                percentage: progAllocated > 0 ? (progExpenses / progAllocated) * 100 : 0
            };
        });

        // Build breakdown by objek
        const byObjek: AdminWarrantSummary['by_objek'] = [];
        for (const prog of ADMIN_WARRANT_PROGRAMS) {
            const objeks = ADMIN_WARRANT_OBJEKS[prog.code as AdminWarrantProgramCode];
            for (const objek of objeks) {
                const objekWarrants = warrants.filter(
                    w => w.program_code === prog.code && w.objek_code === objek.code
                );
                const objekAllocated = objekWarrants.reduce((sum, w) => sum + Number(w.amount), 0);
                const objekExpenses = 0; // Placeholder for actual spending

                byObjek.push({
                    program_code: prog.code,
                    objek_code: objek.code,
                    objek_name: objek.label,
                    allocated: objekAllocated,
                    spent: objekExpenses,
                    balance: objekAllocated - objekExpenses,
                    percentage: objekAllocated > 0 ? (objekExpenses / objekAllocated) * 100 : 0
                });
            }
        }

        return {
            total_allocation: totalAllocation,
            total_expenses: totalExpenses,
            total_balance: totalBalance,
            usage_percentage: usagePercentage,
            fiscal_year: fiscalYear,
            by_program: byProgram,
            by_objek: byObjek,
            budget_groups: [], // Simplified as user removed manual allocation
            individual_allocations: [], // Simplified as user removed manual allocation
            recent_warrants: warrants.slice(0, 10),
            total_count: warrants.length
        };
    },

    // ==========================================
    // REFERENCE DATA
    // ==========================================

    async getPrograms(): Promise<AdminWarrantProgram[]> {
        const { data, error } = await supabase
            .from('admin_warrant_programs')
            .select('*')
            .eq('is_active', true)
            .order('program_code');

        if (error) throw error;
        return data as AdminWarrantProgram[];
    },

    async getObjeks(programCode: string): Promise<AdminWarrantObjek[]> {
        const { data, error } = await supabase
            .from('admin_warrant_objeks')
            .select('*')
            .eq('program_code', programCode)
            .eq('is_active', true)
            .order('objek_code');

        if (error) throw error;
        return data as AdminWarrantObjek[];
    },

    async getKategoris(programCode: string, objekCode: string): Promise<AdminWarrantKategori[]> {
        const { data, error } = await supabase
            .from('admin_warrant_kategoris')
            .select('*')
            .eq('program_code', programCode)
            .eq('objek_code', objekCode)
            .eq('is_active', true)
            .order('kategori_code');

        if (error) throw error;
        return data as AdminWarrantKategori[];
    }
};
