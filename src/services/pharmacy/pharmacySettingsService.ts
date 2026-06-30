// @ts-nocheck
/**
 * Pharmacy Settings Service
 * Handles configurable settings for pharmacy module (e.g., PO signatures)
 */

import { supabase, isSupabaseConfigured } from '../supabase'
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
  applicantName: 'KAMRIAH BT HAJI MAIL',
  applicantPosition: 'PENOLONG PEGAWAI FARMASI U7 TBK 2',
  headName: 'TAN YUANG ZHANG',
  headPosition: 'PEGAWAI FARMASI UF 12',
}

const STORAGE_KEY = 'pharmacy_po_signatures'
const SUPABASE_SETTING_KEY = 'pharmacy_po_signatures'

/**
 * Get pharmacy PO signature settings
 */
export async function getPharmacyPOSignatures(
  hospitalId?: string,
  departmentId?: string
): Promise<ApiResponse<PharmacyPOSignatures>> {
  try {
    if (isSupabaseConfigured() && hospitalId) {
      // Try to get from Supabase pharmacy_settings table
      const query = supabase
        .from('pharmacy_settings')
        .select('setting_value')
        .eq('setting_key', SUPABASE_SETTING_KEY)
        .eq('hospital_id', hospitalId)

      if (departmentId) {
        query.eq('department_id', departmentId)
      } else {
        query.is('department_id', null)
      }

      const { data, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching pharmacy PO signatures from Supabase:', error.message)
      }

      if (data?.setting_value) {
        return {
          data: data.setting_value as PharmacyPOSignatures,
          error: null,
        }
      }
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PharmacyPOSignatures
        return {
          data: {
            applicantName: parsed.applicantName || DEFAULT_SIGNATURES.applicantName,
            applicantPosition: parsed.applicantPosition || DEFAULT_SIGNATURES.applicantPosition,
            headName: parsed.headName || DEFAULT_SIGNATURES.headName,
            headPosition: parsed.headPosition || DEFAULT_SIGNATURES.headPosition,
          },
          error: null,
        }
      } catch (e) {
        console.warn('Error parsing stored signatures:', e)
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
  hospitalId?: string,
  userId?: string,
  departmentId?: string
): Promise<ApiResponse<PharmacyPOSignatures>> {
  try {
    // Get current signatures
    const currentResult = await getPharmacyPOSignatures(hospitalId, departmentId)
    const current = currentResult.data || DEFAULT_SIGNATURES

    // Merge with updates
    const updated: PharmacyPOSignatures = {
      applicantName: signatures.applicantName ?? current.applicantName,
      applicantPosition: signatures.applicantPosition ?? current.applicantPosition,
      headName: signatures.headName ?? current.headName,
      headPosition: signatures.headPosition ?? current.headPosition,
    }

    if (isSupabaseConfigured() && hospitalId) {
      // Try to save to Supabase
      const { data, error } = await supabase
        .from('pharmacy_settings')
        .upsert(
          {
            setting_key: SUPABASE_SETTING_KEY,
            setting_value: updated,
            hospital_id: hospitalId,
            department_id: departmentId || null,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'hospital_id,setting_key,department_id' }
        )
        .select('setting_value')
        .single()

      if (error) {
        console.warn('Error saving pharmacy PO signatures to Supabase:', error.message)
        // Fall through to localStorage
      } else if (data) {
        return {
          data: data.setting_value as PharmacyPOSignatures,
          error: null,
        }
      }
    }

    // Fallback to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

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
  hospitalId?: string,
  departmentId?: string
): Promise<ApiResponse<PharmacyPOSignatures>> {
  return updatePharmacyPOSignatures(DEFAULT_SIGNATURES, hospitalId, undefined, departmentId)
}

