import { supabase } from './supabase'
import type { Inquiry, InquiryFormData } from '@/types'

export interface SubmitInquiryResult {
  success: boolean
  inquiry?: Inquiry
  error?: string
}

/**
 * Submit a new inquiry
 */
export async function submitInquiry(data: InquiryFormData): Promise<SubmitInquiryResult> {
  try {
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        inquiry_type: data.inquiryType,
        status: 'new',
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, inquiry }
  } catch (error) {
    console.error('Submit inquiry error:', error)
    return {
      success: false,
      error: 'Failed to submit inquiry. Please try again.',
    }
  }
}

/**
 * Get all inquiries (for admin)
 */
export async function getInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get inquiries error:', error)
    return []
  }

  return data
}

