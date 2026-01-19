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

/**
 * Get pharmacy PO signature settings
 */
export async function getPharmacyPOSignatures(
  hospitalId?: string
): Promise<ApiResponse<PharmacyPOSignatures>> {
  try {
    if (hospitalId) {
      // Try to get from Supabase pharmacy_settings table
      const { data, error } = await supabase
        .from('pharmacy_settings')
        .select('setting_value')
        .eq('setting_key', SUPABASE_SETTING_KEY)
        .eq('hospital_id', hospitalId)
        .maybeSingle()

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
  userId?: string
): Promise<ApiResponse<PharmacyPOSignatures>> {
  try {
    // Get current signatures
    const currentResult = await getPharmacyPOSignatures(hospitalId)
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
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'hospital_id,setting_key' }
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
