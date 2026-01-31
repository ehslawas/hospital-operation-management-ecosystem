import { supabase } from '../supabase';
import {
    AdminPembangunan,
    AdminPembangunanFormData,
    AdminPembangunanProgram,
    AdminPembangunanObjek,
    AdminPembangunanKategori,
    AdminPembangunanSummary
} from '../../types/adminOperations.types';
import {
    ADMIN_PEMBANGUNAN_PROGRAMS,
    ADMIN_PEMBANGUNAN_OBJEKS,
    AdminPembangunanProgramCode
} from '../../lib/adminPembangunanConstants';

export const adminPembangunanService = {
    // ==========================================
    // PEMBANGUNAN - CRUD Operations
    // ==========================================

    async getAdminPembangunan(
        hospitalId: string,
        filters?: {
            fiscalYear?: number;
            programCode?: string;
            objekCode?: string;
            kategoriCode?: string;
        }
    ): Promise<AdminPembangunan[]> {
        let query = supabase
            .from('admin_pembangunan')
            .select(`
                *,
                created_by_user:users!admin_pembangunan_created_by_fkey(full_name, email)
            `)
            .eq('hospital_id', hospitalId)
            .order('pembangunan_date', { ascending: false });

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
        return data as AdminPembangunan[];
    },

    async getAdminPembangunanById(id: string): Promise<AdminPembangunan> {
        const { data, error } = await supabase
            .from('admin_pembangunan')
            .select(`
                *,
                created_by_user:users!admin_pembangunan_created_by_fkey(full_name, email)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as AdminPembangunan;
    },

    async createAdminPembangunan(
        hospitalId: string,
        userId: string,
        formData: AdminPembangunanFormData
    ): Promise<AdminPembangunan> {
        const fiscalYear = formData.fiscal_year || new Date().getFullYear();

        const { data, error } = await supabase
            .from('admin_pembangunan')
            .insert({
                hospital_id: hospitalId,
                pembangunan_date: formData.pembangunan_date,
                document_no: formData.document_no,
                program_code: formData.program_code,
                objek_code: formData.objek_code,
                kategori_code: formData.kategori_code,
                fiscal_year: fiscalYear,
                amount: formData.amount,
                description: formData.description,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data as AdminPembangunan;
    },

    async updateAdminPembangunan(
        id: string,
        formData: Partial<AdminPembangunanFormData>
    ): Promise<AdminPembangunan> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (formData.pembangunan_date) updateData.pembangunan_date = formData.pembangunan_date;
        if (formData.document_no) updateData.document_no = formData.document_no;
        if (formData.program_code) updateData.program_code = formData.program_code;
        if (formData.objek_code) updateData.objek_code = formData.objek_code;
        if (formData.kategori_code) updateData.kategori_code = formData.kategori_code;
        if (formData.amount !== undefined) updateData.amount = formData.amount;
        if (formData.description !== undefined) updateData.description = formData.description;

        const { data, error } = await supabase
            .from('admin_pembangunan')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as AdminPembangunan;
    },

    async deleteAdminPembangunan(id: string): Promise<void> {
        const { error } = await supabase
            .from('admin_pembangunan')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ==========================================
    // REFERENCE DATA
    // ==========================================

    async getPrograms(): Promise<AdminPembangunanProgram[]> {
        const { data, error } = await supabase
            .from('admin_pembangunan_programs')
            .select('*')
            .eq('is_active', true)
            .order('program_code');

        if (error) throw error;
        return data as AdminPembangunanProgram[];
    },

    async getObjeks(programCode: string): Promise<AdminPembangunanObjek[]> {
        const { data, error } = await supabase
            .from('admin_pembangunan_objeks')
            .select('*')
            .eq('program_code', programCode)
            .eq('is_active', true)
            .order('objek_code');

        if (error) throw error;
        return data as AdminPembangunanObjek[];
    },

    async getKategoris(programCode: string, objekCode: string): Promise<AdminPembangunanKategori[]> {
        const { data, error } = await supabase
            .from('admin_pembangunan_kategoris')
            .select('*')
            .eq('program_code', programCode)
            .eq('objek_code', objekCode)
            .eq('is_active', true)
            .order('kategori_code');

        if (error) throw error;
        return data as AdminPembangunanKategori[];
    },

    // ==========================================
    // SUMMARY & ANALYTICS
    // ==========================================

    async getAdminPembangunanSummary(
        hospitalId: string,
        fiscalYear: number
    ): Promise<AdminPembangunanSummary> {
        // Fetch specific year data
        const warrants = await this.getAdminPembangunan(hospitalId, { fiscalYear });

        const totalAllocation = warrants.reduce((sum, w) => sum + Number(w.amount), 0);
        // Placeholder for expenses (no Expense table linked yet)
        const totalExpenses = 0;
        const totalBalance = totalAllocation - totalExpenses;
        const usagePercentage = totalAllocation > 0 ? (totalExpenses / totalAllocation) * 100 : 0;

        // Breakdown by program
        const byProgram = ADMIN_PEMBANGUNAN_PROGRAMS.map(prog => {
            const progWarrants = warrants.filter(w => w.program_code === prog.code);
            const progAllocated = progWarrants.reduce((sum, w) => sum + Number(w.amount), 0);
            const progExpenses = 0;

            return {
                program_code: prog.code,
                program_name: prog.label,
                allocated: progAllocated,
                spent: progExpenses,
                balance: progAllocated - progExpenses,
                percentage: progAllocated > 0 ? (progExpenses / progAllocated) * 100 : 0
            };
        });

        // Breakdown by objek
        const byObjek: AdminPembangunanSummary['by_objek'] = [];
        for (const prog of ADMIN_PEMBANGUNAN_PROGRAMS) {
            const objeks = ADMIN_PEMBANGUNAN_OBJEKS[prog.code as AdminPembangunanProgramCode] || [];
            for (const objek of objeks) {
                const objekWarrants = warrants.filter(
                    w => w.program_code === prog.code && w.objek_code === objek.code
                );
                const objekAllocated = objekWarrants.reduce((sum, w) => sum + Number(w.amount), 0);
                const objekExpenses = 0;

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
            recent_pembangunan: warrants.slice(0, 10),
            total_count: warrants.length
        };
    }
};
