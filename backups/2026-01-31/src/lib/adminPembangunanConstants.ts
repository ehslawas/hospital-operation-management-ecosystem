/**
 * Admin Pembangunan Constants
 * Defines the budget hierarchy for P42 Pembangunan
 * 
 * Hierarchy:
 * Program (P42) -> Objek (Full String) -> Kategori
 */

// ==========================================
// PROGRAMS (Aktiviti)
// ==========================================

export const ADMIN_PEMBANGUNAN_PROGRAMS = [
    { code: 'P42', label: 'Pembangunan', description: 'Development Program' },
] as const

export type AdminPembangunanProgramCode = typeof ADMIN_PEMBANGUNAN_PROGRAMS[number]['code']

// ==========================================
// OBJEKS (by Program)
// ==========================================

export const ADMIN_PEMBANGUNAN_OBJEKS: Record<AdminPembangunanProgramCode, Array<{ code: string; label: string; description: string }>> = {
    'P42': [
        { code: '01100 117 4002', label: 'Sewaan Peralatan Perubatan', description: 'Medical Equipment Rental' },
        { code: '01200 117 1002', label: 'Perkhidmatan Sokongan Hospital (PSH)', description: 'Hospital Support Services' },
    ]
}

// ==========================================
// KATEGORIS (by Program + Objek)
// ==========================================

export interface AdminPembangunanKategoriConfig {
    code: string
    label: string
    description?: string
    isSharedBudget: boolean
}

export const ADMIN_PEMBANGUNAN_KATEGORIS: Record<AdminPembangunanProgramCode, Record<string, AdminPembangunanKategoriConfig[]>> = {
    'P42': {
        // Objek: 01100 117 4002
        '01100 117 4002': [
            {
                code: '24000',
                label: 'Sewaan Peralatan Perubatan',
                description: 'Medical Equipment Rental',
                isSharedBudget: false
            },
        ],
        // Objek: 01200 117 1002
        '01200 117 1002': [
            {
                code: '28000',
                label: 'Penyelenggaraan',
                description: 'Maintenance',
                isSharedBudget: false
            },
            {
                code: '29000',
                label: 'Perkhidmatan Sokongan Hospital',
                description: 'Hospital Support Services',
                isSharedBudget: false
            },
        ]
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export const getPembangunanObjeks = (programCode: AdminPembangunanProgramCode) => {
    return ADMIN_PEMBANGUNAN_OBJEKS[programCode] || []
}

export const getPembangunanKategoris = (programCode: AdminPembangunanProgramCode, objekCode: string) => {
    return ADMIN_PEMBANGUNAN_KATEGORIS[programCode]?.[objekCode] || []
}

export const getPembangunanKategoriDetails = (
    programCode: AdminPembangunanProgramCode,
    objekCode: string,
    kategoriCode: string
): AdminPembangunanKategoriConfig | undefined => {
    const kategoris = getPembangunanKategoris(programCode, objekCode)
    return kategoris.find(k => k.code === kategoriCode)
}

// ==========================================
// COLOR THEMES (Emerald/Teal for Pembangunan)
// ==========================================

export const ADMIN_PEMBANGUNAN_GRADIENT = {
    primary: 'from-emerald-600 to-teal-600',
    secondary: 'from-teal-500 to-cyan-600',
    header: 'bg-gradient-to-r from-emerald-50 to-emerald-100',
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100',
    badges: {
        '24000': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        '28000': 'bg-teal-50 text-teal-700 border-teal-200',
        '29000': 'bg-cyan-50 text-cyan-700 border-cyan-200'
    }
}
