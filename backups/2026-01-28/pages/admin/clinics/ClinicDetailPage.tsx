// Clinic Detail Page - Uses same component as Hospital but with clinic context
import React from 'react'
import { useParams } from 'react-router-dom'
import { HospitalDetailPage as BaseDetailPage } from '../hospitals/HospitalDetailPage'

export const ClinicDetailPage: React.FC = () => {
  // The HospitalDetailPage component will work for clinics too
  // It detects clinicId from useParams and adjusts labels accordingly
  return <BaseDetailPage />
}

export default ClinicDetailPage
