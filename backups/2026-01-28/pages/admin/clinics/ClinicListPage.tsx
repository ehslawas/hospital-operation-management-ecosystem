// Clinic List Page - Uses same component as Hospital but with clinic context
import React from 'react'
import BaseListPage from '../hospitals/HospitalListPage'

export const ClinicListPage: React.FC = () => {
  // The HospitalListPage component will work for clinics too
  // It uses the same services and functionality
  return <BaseListPage />
}

export default ClinicListPage

