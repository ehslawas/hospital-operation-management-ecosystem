/**
 * Pharmacy Settings Service
 * Handles configurable settings for pharmacy module (e.g., PO signatures)
 */

import { supabase } from '../supabase'
import type { ApiResponse } from '@/types'

export interface PharmacyPOSignatures {
  // Officer who applies (Pegawai yang Memohon)
  applicantName: string
  applicantPosition: string

  // Head of Department (Ketua Bahagian)
  headName: string
  headPosition: string
}

const DEFAULT_SIGNATURES: PharmacyPOSignatures = {
  applicantName: 'KAMRIAH BINTI MAIL',
  applicantPosition: 'PEN. PEGAWAI FARMASI U 6',
  headName: 'TAN YUAN ZHANG',
  headPosition: 'PEGAWAI FARMASI UF 32',
}

const SUPABASE_SETTING_KEY = 'pharmacy_po_signatures'

export const AUTHORIZED_SIGNATURE_DEPARTMENTS = [
  'pharmacy_logistics',
  'Pharmacy Logistic',
  'pharmacy',
  'Pharmacy',
  'PHARMACY',
  'pathology',
  'Pathology',
  'PATHOLOGY',
  'hospital_admin',
  'Hospital Administrator'
]

export const DEPT_CODE_MAPPING: Record<string, string> = {
  'Pharmacy Logistic': 'pharmacy_logistics',
  'Pharmacy': 'pharmacy',
  'PHARMACY': 'pharmacy',
  'pharmacy': 'pharmacy',
  'Pathology': 'pathology',
  'PATHOLOGY': 'pathology',
  'pathology': 'pathology',
  'Hospital Administrator': 'hospital_admin'
}

/**
 * Get pharmacy PO signature settings
 */
export async function getPharmacyPOSignatures(
  hospitalId?: string,
  departmentId?: string
): Promise<ApiResponse<PharmacyPOSignatures>> {
  try {
    if (hospitalId) {
      // Normalize department ID if possible
      const normalizedDeptId = departmentId && DEPT_CODE_MAPPING[departmentId] ? DEPT_CODE_MAPPING[departmentId] : departmentId

      // Try to get from Supabase pharmacy_settings table
      let query = supabase
        .from('pharmacy_settings')
        .select('setting_value')
        .eq('setting_key', SUPABASE_SETTING_KEY)
        .eq('hospital_id', hospitalId)

      if (normalizedDeptId) {
        query = query.eq('department_id', normalizedDeptId)
      } else {
        // Fallback to pharmacy logistics if no department specified (backward compatibility)
        query = query.or(`department_id.is.null,department_id.eq.pharmacy_logistics`)
      }

      const { data, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching pharmacy PO signatures from Supabase:', error.message)
      }

      if (data?.setting_value) {
        const val = data.setting_value as Partial<PharmacyPOSignatures>
        return {
          data: {
            applicantName: val.applicantName || DEFAULT_SIGNATURES.applicantName,
            applicantPosition: val.applicantPosition || DEFAULT_SIGNATURES.applicantPosition,
            headName: val.headName || DEFAULT_SIGNATURES.headName,
            headPosition: val.headPosition || DEFAULT_SIGNATURES.headPosition,
          },
          error: null,
        }
      }
    }

    // Return defaults
    return {
      data: DEFAULT_SIGNATURES,
      error: null,
    }
  } catch (error) {
    console.error('Error getting pharmacy PO signatures:', error)
    return {
      data: DEFAULT_SIGNATURES,
      error: error instanceof Error ? error.message : 'Failed to get signatures',
    }
  }
}

/**
 * Update pharmacy PO signature settings
 */
export async function updatePharmacyPOSignatures(
  signatures: Partial<PharmacyPOSignatures>,
  hospitalId: string,
  userId?: string,
  departmentId?: string
): Promise<ApiResponse<PharmacyPOSignatures>> {
  try {
    // Normalize department ID
    const normalizedDeptId = departmentId && DEPT_CODE_MAPPING[departmentId] ? DEPT_CODE_MAPPING[departmentId] : (departmentId || 'pharmacy_logistics')

    // Get current signatures
    const currentResult = await getPharmacyPOSignatures(hospitalId, normalizedDeptId)
    const current = currentResult.data || DEFAULT_SIGNATURES

    // Merge with updates
    const updated: PharmacyPOSignatures = {
      applicantName: signatures.applicantName ?? current.applicantName,
      applicantPosition: signatures.applicantPosition ?? current.applicantPosition,
      headName: signatures.headName ?? current.headName,
      headPosition: signatures.headPosition ?? current.headPosition,
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('pharmacy_settings')
      .upsert(
        {
          setting_key: SUPABASE_SETTING_KEY,
          setting_value: updated,
          hospital_id: hospitalId,
          department_id: normalizedDeptId,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        // We dropped the old constraint and added a new one including department_id
        { onConflict: 'hospital_id,setting_key,department_id' }
      )
      .select('setting_value')
      .single()

    if (error) {
      console.warn('Error saving pharmacy PO signatures to Supabase:', error.message)
      return { data: updated, error: error.message }
    }

    if (data) {
      return {
        data: data.setting_value as PharmacyPOSignatures,
        error: null,
      }
    }

    return {
      data: updated,
      error: null,
    }
  } catch (error) {
    console.error('Error updating pharmacy PO signatures:', error)
    return {
      data: DEFAULT_SIGNATURES,
      error: error instanceof Error ? error.message : 'Failed to update signatures',
    }
  }
}

/**
 * Reset pharmacy PO signature settings to defaults
 */
export async function resetPharmacyPOSignatures(
  hospitalId: string
): Promise<ApiResponse<PharmacyPOSignatures>> {
  return updatePharmacyPOSignatures(DEFAULT_SIGNATURES, hospitalId)
}
