/**
 * Upload Service for Pharmacy Catalog
 * Handles file upload tracking and duplicate detection
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse } from '@/types'
import { calculateFileHash } from '@/lib/utils'

export interface UploadedFile {
  id: string
  hospital_id: string
  file_name: string
  file_hash: string
  file_size: number
  file_type: 'excel' | 'pdf' | 'image'
  catalog_type: 'drug' | 'non_drug'
  upload_status: 'pending' | 'processing' | 'completed' | 'failed'
  items_imported: number
  errors_count: number
  error_details?: any
  uploaded_by?: string
  uploaded_at: string
  created_at: string
  updated_at: string
}

export interface CheckDuplicateResult {
  isDuplicate: boolean
  existingFile?: UploadedFile
  error?: string
}

/**
 * Check if a file has been uploaded before (duplicate detection)
 */
export async function checkFileDuplicate(
  hospitalId: string,
  fileHash: string
): Promise<ApiResponse<CheckDuplicateResult>> {
  try {
    if (!isSupabaseConfigured()) {
      // For local development, check localStorage
      const stored = localStorage.getItem(`uploaded_files_${hospitalId}`)
      if (stored) {
        const files: UploadedFile[] = JSON.parse(stored)
        const existing = files.find(f => f.file_hash === fileHash && f.upload_status === 'completed')
        if (existing) {
          return {
            data: {
              isDuplicate: true,
              existingFile: existing,
            },
            error: null,
          }
        }
      }
      return {
        data: { isDuplicate: false },
        error: null,
      }
    }

    // Check in Supabase
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('file_hash', fileHash)
      .eq('upload_status', 'completed')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      throw error
    }

    if (data) {
      return {
        data: {
          isDuplicate: true,
          existingFile: data as UploadedFile,
        },
        error: null,
      }
    }

    return {
      data: { isDuplicate: false },
      error: null,
    }
  } catch (error) {
    console.error('Error checking file duplicate:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to check file duplicate',
    }
  }
}

/**
 * Record file upload in database
 */
export async function recordFileUpload(
  hospitalId: string,
  file: File,
  fileHash: string,
  catalogType: 'drug' | 'non_drug',
  uploadedBy?: string
): Promise<ApiResponse<UploadedFile>> {
  try {
    const fileType = file.name.toLowerCase().endsWith('.pdf')
      ? 'pdf'
      : file.type.startsWith('image/')
      ? 'image'
      : 'excel'

    const uploadRecord: Partial<UploadedFile> = {
      hospital_id: hospitalId,
      file_name: file.name,
      file_hash: fileHash,
      file_size: file.size,
      file_type: fileType,
      catalog_type: catalogType,
      upload_status: 'processing',
      items_imported: 0,
      errors_count: 0,
      uploaded_by: uploadedBy,
    }

    if (!isSupabaseConfigured()) {
      // For local development, store in localStorage
      const stored = localStorage.getItem(`uploaded_files_${hospitalId}`) || '[]'
      const files: UploadedFile[] = JSON.parse(stored)
      const newFile: UploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...uploadRecord,
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as UploadedFile
      files.push(newFile)
      localStorage.setItem(`uploaded_files_${hospitalId}`, JSON.stringify(files))
      return { data: newFile, error: null }
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('uploaded_files')
      .insert(uploadRecord)
      .select()
      .single()

    if (error) {
      // 23505 = unique_violation on (hospital_id, file_hash)
      if ((error as any).code === '23505') {
        console.warn(
          '[recordFileUpload] Duplicate uploaded_files entry detected, reusing existing record'
        )

        // Fetch existing record for this hospital + file hash
        const { data: existing, error: existingError } = await supabase
          .from('uploaded_files')
          .select('*')
          .eq('hospital_id', hospitalId)
          .eq('file_hash', fileHash)
          .single()

        if (existingError) {
          console.error(
            '[recordFileUpload] Failed to fetch existing uploaded_files record after duplicate:',
            existingError
          )
          throw error
        }

        // If the previous upload was completed, treat this as a true duplicate
        if (existing.upload_status === 'completed') {
          return {
            data: null,
            error:
              'This file has already been uploaded successfully. Duplicate uploads are not allowed for the same file content.',
          }
        }

        // For pending/processing/failed statuses, reset and reuse the same record
        const resetData: Partial<UploadedFile> = {
          ...uploadRecord,
          upload_status: 'processing',
          items_imported: 0,
          errors_count: 0,
          error_details: null,
          uploaded_at: new Date().toISOString(),
        }

        const { data: updated, error: updateError } = await supabase
          .from('uploaded_files')
          .update(resetData)
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError || !updated) {
          console.error(
            '[recordFileUpload] Failed to reset existing uploaded_files record:',
            updateError
          )
          throw updateError || error
        }

        return {
          data: updated as UploadedFile,
          error: null,
        }
      }

      throw error
    }

    return {
      data: data as UploadedFile,
      error: null,
    }
  } catch (error) {
    console.error('Error recording file upload:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to record file upload',
    }
  }
}

/**
 * Update upload record with results
 */
export async function updateUploadRecord(
  uploadId: string,
  hospitalId: string,
  status: 'completed' | 'failed',
  itemsImported: number,
  errorsCount: number,
  errorDetails?: any
): Promise<ApiResponse<void>> {
  try {
    const updates: Partial<UploadedFile> = {
      upload_status: status,
      items_imported: itemsImported,
      errors_count: errorsCount,
      error_details: errorDetails,
    }

    if (!isSupabaseConfigured()) {
      // For local development, update localStorage
      const stored = localStorage.getItem(`uploaded_files_${hospitalId}`) || '[]'
      const files: UploadedFile[] = JSON.parse(stored)
      const index = files.findIndex(f => f.id === uploadId)
      if (index !== -1) {
        files[index] = { ...files[index], ...updates, updated_at: new Date().toISOString() }
        localStorage.setItem(`uploaded_files_${hospitalId}`, JSON.stringify(files))
      }
      return { data: undefined, error: null }
    }

    // Update in Supabase
    const { error } = await supabase
      .from('uploaded_files')
      .update(updates)
      .eq('id', uploadId)

    if (error) throw error

    return { data: undefined, error: null }
  } catch (error) {
    console.error('Error updating upload record:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update upload record',
    }
  }
}

