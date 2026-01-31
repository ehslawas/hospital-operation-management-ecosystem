/**
 * Hospital Administrator Warrant Constants
 * Defines the complete budget hierarchy for Programs, Objeks, and Kategoris
 */

// ==========================================
// PROGRAMS (Aktiviti)
// ==========================================

export const ADMIN_WARRANT_PROGRAMS = [
    { code: '020200', label: 'Pengurusan Hospital', description: 'Hospital Management operational expenses' },
    { code: '022300', label: 'Dietetik Dan Sajian', description: 'Dietetics and Food Service expenses' },
] as const

export type AdminWarrantProgramCode = typeof ADMIN_WARRANT_PROGRAMS[number]['code']

// ==========================================
// OBJEKS (by Program)
// ==========================================

export const ADMIN_WARRANT_OBJEKS: Record<AdminWarrantProgramCode, Array<{ code: string; label: string; description: string }>> = {
    '020200': [
        { code: '22000', label: 'Pengangkutan', description: 'Transportation expenses' },
        { code: '24000', label: 'Sewaan', description: 'Rental expenses' },
        { code: '27000', label: 'Bekalan dan Bahan Lain', description: 'Supplies and other materials' },
        { code: '28000', label: 'Penyelenggaraan', description: 'Maintenance expenses' },
        { code: '29000', label: 'Perkhidmatan Iktisas Yang Lain', description: 'Other professional services' },
    ],
    '022300': [
        { code: '25000', label: 'Bahan Makanan dan Minuman', description: 'Food and beverage supplies' },
        { code: '27000', label: 'Bekalan dan Bahan Lain', description: 'Supplies and other materials' },
        { code: '29000', label: 'Perkhidmatan', description: 'Services' },
    ],
}

// ==========================================
// KATEGORIS (by Program + Objek)
// ==========================================

export interface AdminWarrantKategoriConfig {
    code: string
    label: string
    description?: string
    isSharedBudget: boolean
    budgetGroupCode?: string // For shared budget categories
}

export interface BudgetGroupConfig {
    groupCode: string
    groupName: string
    kategoris: string[] // List of kategori codes in this group
}

// Budget groups for shared allocations
export const ADMIN_WARRANT_BUDGET_GROUPS: Record<string, BudgetGroupConfig> = {
    // 020200 - Pengurusan Hospital
    'percetakan_020200_29000': {
        groupCode: 'percetakan_020200_29000',
        groupName: 'Perkhidmatan Percetakan',
        kategoris: ['29201', '29202', '29299'],
    },
    'makanan_020200_29000': {
        groupCode: 'makanan_020200_29000',
        groupName: 'Perkhidmatan Persediaan Makanan',
        kategoris: ['29126', '29401', '29411'],
    },
    // 022300 - Dietetik Dan Sajian
    'makanan_022300_25000': {
        groupCode: 'makanan_022300_25000',
        groupName: 'Bahan Makanan dan Minuman',
        kategoris: ['25100', '25200', '25300', '25400', '25500', '25600'],
    },
}

// Full kategori configuration by program and objek
export const ADMIN_WARRANT_KATEGORIS: Record<AdminWarrantProgramCode, Record<string, AdminWarrantKategoriConfig[]>> = {
    '020200': {
        // Pengangkutan
        '22000': [
            { code: '22000', label: 'Pengangkutan Barang', isSharedBudget: false },
        ],
        // Sewaan - ALL OWN BUDGET
        '24000': [
            { code: '24699', label: 'Sewaan Mesin Penyalin', isSharedBudget: false },
            { code: '24999', label: 'Sewaan Gas Perubatan (Linde)', isSharedBudget: false },
            { code: '24202', label: 'Sewaan Bangunan Pejabat', isSharedBudget: false },
        ],
        // Bekalan - SHARED BUDGET
        '27000': [
            {
                code: '27000',
                label: '27100, 27200, 27300, 27600, 27700',
                description: 'Bekalan dan Bahan-bahan Lain',
                isSharedBudget: false
            },
        ],
        // Penyelenggaraan
        '28000': [
            { code: '28000', label: 'Penyelenggaraan', isSharedBudget: false },
        ],
        // Perkhidmatan - MIXED
        '29000': [
            {
                code: '29201',
                label: '29201, 29202, 29299',
                description: 'Perkhidmatan Percetakan',
                isSharedBudget: true,
                budgetGroupCode: 'percetakan_020200_29000'
            },
            // Combined - Persediaan Makanan
            {
                code: '29126',
                label: '29126, 29401, 29411',
                description: 'Perkhidmatan Persediaan Makanan',
                isSharedBudget: true,
                budgetGroupCode: 'makanan_020200_29000'
            },
            // Others
            { code: '29199', label: 'Perkhidmatan Yang Lain (Meter Reading)', isSharedBudget: false },
            { code: '29122', label: 'Perkhidmatan Kawalan Keselamatan', isSharedBudget: false },
        ],
    },
    '022300': {
        // Bahan Makanan - SHARED BUDGET
        '25000': [
            {
                code: '25000',
                label: '25100, 25200, 25300, 25400, 25500, 25600',
                description: 'Bahan Makanan dan Minuman',
                isSharedBudget: true,
                budgetGroupCode: 'makanan_022300_25000'
            },
        ],
        // Bekalan - SHARED BUDGET
        '27000': [
            {
                code: '27000',
                label: '27100, 27200, 27300, 27600, 27700',
                description: 'Bekalan dan Bahan-bahan Lain',
                isSharedBudget: false
            },
        ],
        // Perkhidmatan - OWN BUDGET
        '29000': [
            { code: '29126', label: 'Perkhidmatan Persediaan Makanan (Outsource)', isSharedBudget: false },
        ],
    },
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get objeks for a given program
 */
export const getObjeksForProgram = (programCode: AdminWarrantProgramCode) => {
    return ADMIN_WARRANT_OBJEKS[programCode] || []
}

/**
 * Get kategoris for a given program and objek
 */
export const getKategorisForObjek = (programCode: AdminWarrantProgramCode, objekCode: string) => {
    return ADMIN_WARRANT_KATEGORIS[programCode]?.[objekCode] || []
}

/**
 * Get kategori details by codes
 */
export const getKategoriDetails = (
    programCode: AdminWarrantProgramCode,
    objekCode: string,
    kategoriCode: string
): AdminWarrantKategoriConfig | undefined => {
    const kategoris = getKategorisForObjek(programCode, objekCode)
    return kategoris.find(k => k.code === kategoriCode)
}

/**
 * Get program label by code
 */
export const getProgramLabel = (programCode: string): string => {
    const program = ADMIN_WARRANT_PROGRAMS.find(p => p.code === programCode)
    return program?.label || programCode
}

/**
 * Get objek label by codes
 */
export const getObjekLabel = (programCode: AdminWarrantProgramCode, objekCode: string): string => {
    const objeks = ADMIN_WARRANT_OBJEKS[programCode]
    const objek = objeks?.find(o => o.code === objekCode)
    return objek?.label || objekCode
}

/**
 * Get kategori label by codes
 */
export const getKategoriLabel = (
    programCode: AdminWarrantProgramCode,
    objekCode: string,
    kategoriCode: string
): string => {
    const kategori = getKategoriDetails(programCode, objekCode, kategoriCode)
    return kategori?.label || kategoriCode
}

/**
 * Get budget group info
 */
export const getBudgetGroup = (groupCode: string): BudgetGroupConfig | undefined => {
    return ADMIN_WARRANT_BUDGET_GROUPS[groupCode]
}

/**
 * Check if a kategori uses shared budget
 */
export const isSharedBudgetKategori = (
    programCode: AdminWarrantProgramCode,
    objekCode: string,
    kategoriCode: string
): boolean => {
    const kategori = getKategoriDetails(programCode, objekCode, kategoriCode)
    return kategori?.isSharedBudget || false
}

// ==========================================
// COLOR THEMES (Purple/Violet for Admin)
// ==========================================

export const ADMIN_WARRANT_PROGRAM_COLORS: Record<AdminWarrantProgramCode, string> = {
    '020200': 'bg-violet-100 text-violet-800 border-violet-200',
    '022300': 'bg-purple-100 text-purple-800 border-purple-200',
}

export const ADMIN_WARRANT_OBJEK_COLORS: Record<string, string> = {
    '22000': 'bg-blue-50 text-blue-700 border-blue-200',
    '24000': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    '25000': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    '27000': 'bg-violet-50 text-violet-700 border-violet-200',
    '28000': 'bg-orange-50 text-orange-700 border-orange-200',
    '29000': 'bg-purple-50 text-purple-700 border-purple-200',
}

export const ADMIN_WARRANT_GRADIENT = {
    primary: 'from-violet-500 to-purple-600',
    secondary: 'from-purple-500 to-fuchsia-600',
    accent: 'from-indigo-500 to-violet-600',
}
