import { WarrantCategory, WarrantDepartment } from '@/types/pharmacy'

export const CATEGORY_COLORS: Record<WarrantCategory, string> = {
    drug: 'bg-blue-100 text-blue-700 border-blue-200',
    non_drug: 'bg-purple-100 text-purple-700 border-purple-200',
    non_standard: 'bg-amber-100 text-amber-700 border-amber-200',
    reagent: 'bg-teal-100 text-teal-700 border-teal-200',
    vaccine: 'bg-green-100 text-green-700 border-green-200',
    insulin: 'bg-rose-100 text-rose-700 border-rose-200',
    hepc: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    medical_oxygen: 'bg-cyan-100 text-cyan-700 border-cyan-200',
}

export const DEPARTMENT_COLORS: Record<WarrantDepartment, string> = {
    pharmacy: 'bg-emerald-100 text-emerald-700',
    nephrology: 'bg-blue-100 text-blue-700',
    radiology_radiography: 'bg-violet-100 text-violet-700',
    emergency_trauma: 'bg-red-100 text-red-700',
    cssu_cssd: 'bg-orange-100 text-orange-700',
    operation_theater: 'bg-pink-100 text-pink-700',
    laboratory_pathology: 'bg-teal-100 text-teal-700',
    general_ward: 'bg-sky-100 text-sky-700',
    wound_care: 'bg-amber-100 text-amber-700',
    rehabilitation: 'bg-lime-100 text-lime-700',
    anaesthesiology: 'bg-fuchsia-100 text-fuchsia-700',
}
