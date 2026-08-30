import { BaseEntity } from './base'

export type PorterTaskCategory =
  | 'patient_transfer'
  | 'lab_specimen'
  | 'blood_bank'
  | 'pharmacy_run'
  | 'gas_equipment'
  | 'mortuary'
  | 'medical_records'
  | 'cssd_linen'

export type PorterUrgency = 'stat' | 'urgent' | 'routine'

export type PorterJobStatus =
  | 'draft'
  | 'broadcasting'
  | 'accepted'
  | 'at_pickup'
  | 'in_transit'
  | 'at_destination'
  | 'pending_receiver_confirmation'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type PorterStaffStatus = 'available' | 'in_job' | 'on_break' | 'offline'

export type PatientMobility = 'walking' | 'wheelchair' | 'stretcher' | 'bed'

export type ShiftType = 'morning' | 'evening' | 'night' | 'off'

export interface ClinicalPatientPayload {
  patient_rn?: string
  patient_name?: string
  patient_ic?: string
  patient_gender?: 'Lelaki' | 'Perempuan'
  patient_age?: number
  current_bed_no?: string
  destination_bed_no?: string
  mobility_type?: PatientMobility
  o2_dependent?: boolean
  o2_flow_rate_lpm?: number
  fall_risk?: boolean
  isolation_precautions?: 'NONE' | 'CONTACT' | 'DROPLET' | 'AIRBORNE'
  nurse_escort_required?: boolean
  doctor_escort_required?: boolean
  diagnosis?: string
}

export interface SpecimenPayload {
  specimen_type?: string
  tube_count?: number
  lab_request_no?: string
  cold_chain_required?: boolean
  temperature_target?: string
  biohazard_level?: string
  is_urgent_abg?: boolean
}

export interface BloodBankPayload {
  blood_group?: string
  rhesus?: string
  unit_numbers?: string[]
  product_type?: 'PRBC' | 'PLATELET' | 'FFP' | 'CRYOPRECIPITATE' | 'MTP_BOX'
  coolbox_temperature?: number
  compatibility_slip_matched?: boolean
}

export interface PharmacyPayload {
  prescription_no?: string
  is_dangerous_drug?: boolean
  dd_register_no?: string
  tamper_seal_no?: string
  is_cytotoxic?: boolean
  is_tpn?: boolean
  carton_count?: number
}

export interface EquipmentPayload {
  gas_type?: 'oxygen' | 'medical_air' | 'nitrous_oxide'
  cylinder_size?: 'E' | 'G' | 'J'
  cylinder_status?: 'PENUH' | 'KOSONG'
  cylinder_count?: number
  equipment_name?: string
  serial_no?: string
  bme_tag_no?: string
}

export interface MortuaryPayload {
  deceased_name?: string
  deceased_rn?: string
  deceased_ic?: string
  death_certificate_no?: string
  time_of_death?: string
  body_tag_verified?: boolean
  is_infectious_deceased?: boolean
}

export interface MedicalRecordsPayload {
  file_count?: number
  clinic_destination?: string
  bht_numbers?: string[]
}

export interface HandoverProof {
  proof_type: 'signature' | 'photo' | 'pin' | 'qr_scan'
  signature_url?: string
  photo_url?: string
  recipient_name: string
  recipient_staff_id: string
  recipient_jawatan?: string
  recipient_ic?: string
  timestamp: string
  notes?: string
}

export interface PorterRating {
  rating_stars: number // 1-5
  timeliness_score: number // 1-5
  feedback_tags: string[] // e.g. ['Pantas', 'Cermat', 'Sopan', 'Patuh SOP']
  comments?: string
  rated_by_user_id: string
  rated_at: string
}

export interface PorterJobRequest extends BaseEntity {
  no_rujukan: string // e.g. 'PTR-2026-0001'
  category: PorterTaskCategory
  sub_category?: string
  urgency: PorterUrgency
  status: PorterJobStatus
  
  // Locations
  origin_department_id: string
  origin_department_name: string
  origin_location_details: string
  destination_department_id: string
  destination_department_name: string
  destination_location_details: string
  
  // Stakeholders
  requester_id: string
  requester_name: string
  requester_role?: string
  requester_phone?: string
  
  assigned_porter_id?: string
  assigned_porter_name?: string
  assigned_porter_phone?: string
  assigned_porter_badge?: string
  
  recipient_id?: string
  recipient_name?: string
  recipient_role?: string
  
  // Categorical Data Payload
  patient_data?: ClinicalPatientPayload
  specimen_data?: SpecimenPayload
  blood_data?: BloodBankPayload
  pharmacy_data?: PharmacyPayload
  equipment_data?: EquipmentPayload
  mortuary_data?: MortuaryPayload
  records_data?: MedicalRecordsPayload
  
  notes?: string
  special_precautions?: string[]
  
  // Timestamps
  requested_at: string
  assigned_at?: string
  pickup_started_at?: string
  arrived_at_pickup_at?: string
  in_transit_at?: string
  arrived_at_destination_at?: string
  delivered_at?: string
  completed_at?: string
  cancelled_at?: string
  
  // SLA Performance
  target_sla_minutes: number
  actual_tat_minutes?: number
  is_sla_breached?: boolean
  
  // Handover & Rating
  handover_proof?: HandoverProof
  rating?: PorterRating
  cancellation_reason?: string
  dispute_reason?: string
  
  hospital_id: string
}

export interface PorterProfile {
  id: string
  user_id: string
  staff_no: string
  full_name: string
  gred: string // U11, U14, U16, U29
  phone_number: string
  assigned_zone: string
  current_status: PorterStaffStatus
  active_job_id?: string
  current_location?: string
  last_heartbeat_at?: string
  certifications?: {
    bls_certified?: boolean
    cytotoxic_certified?: boolean
    dangerous_drug_authorized?: boolean
    mortuary_trained?: boolean
    heavy_equipment_trained?: boolean
  }
  total_completed_today: number
  average_rating: number
  avatar_url?: string
}

export interface PorterRosterShift {
  id: string
  porter_id: string
  porter_name: string
  date: string // YYYY-MM-DD
  shift: ShiftType
  zone: string
  hours?: number // e.g. morning=8, evening=8, night=10, off=0
  is_standby?: boolean
  status: 'scheduled' | 'on_duty' | 'completed' | 'absent' | 'leave'
}

export interface ShiftExchangeRequest {
  id: string
  requester_porter_id: string
  requester_porter_name: string
  requester_date: string
  requester_shift: ShiftType
  target_porter_id: string
  target_porter_name: string
  target_date: string
  target_shift: ShiftType
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  approved_at?: string
  approved_by?: string
}

export interface WeeklyWorkHourSummary {
  porter_id: string
  porter_name: string
  week_start_date: string
  week_end_date: string
  total_hours_scheduled: number // Standard Max Cap: 43 Hours
  max_allowed_hours: number // 43
  hour_difference: number // scheduled - 43
  deficit_carried_forward: number // If < 43h, to be added onto upcoming week
  status: 'optimum_43h' | 'deficit_addon_required' | 'over_cap'
}

export interface PorterActivityLog {
  id: string
  job_id: string
  from_status?: PorterJobStatus
  to_status: PorterJobStatus
  actor_id: string
  actor_name: string
  actor_role: string
  timestamp: string
  description: string
  notes?: string
}

export interface PorterAggregateStats {
  totalJobsToday: number
  activeBroadcasting: number
  inProgress: number
  inTransit: number
  pendingReceiverConfirmation: number
  completedToday: number
  cancelledToday: number
  statJobsCount: number
  averageTATMinutes: number
  slaCompliancePercentage: number
  availablePortersCount: number
  totalPortersOnDuty: number
}
