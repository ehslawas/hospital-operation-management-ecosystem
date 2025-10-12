export type Department =
  | 'Pharmacy Logistic'
  | 'Pharmacy Sub Store'
  | 'Pharmacy Counter'
  | 'Emergency & Trauma'
  | 'General Ward'
  | 'Laboratory'
  | 'Radiology'
  | 'Haemodialysis'
  | 'Paediatric Ward'
  | 'Maternity Ward'
  | 'Front Desk'
  | 'Office Admin';

const departmentLandingMap: Record<Department, string> = {
  'Pharmacy Logistic': '/pharmacy/logistics',
  'Pharmacy Sub Store': '/issuing',
  'Pharmacy Counter': '/dispensing',
  'Emergency & Trauma': '/emergency',
  'General Ward': '/general-ward',
  'Laboratory': '/laboratory',
  'Radiology': '/radiology',
  'Haemodialysis': '/haemodialysis',
  'Paediatric Ward': '/paediatric',
  'Maternity Ward': '/maternity',
  'Front Desk': '/front-desk',
  'Office Admin': '/office-admin',
};

export function getLandingPathForDepartment(department: string | null | undefined): string {
  if (!department) return '/login';
  const normalized = department.trim() as Department;
  return departmentLandingMap[normalized] || '/distribution';
}


