import { supabase, isSupabaseConfigured } from './supabase'
import { mockInquiries } from './mockData'
import type { Inquiry } from '@/types'
import type { InquiryFormData } from '@/lib/validators'
import { generateId } from '@/lib/utils'

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
    if (isSupabaseConfigured()) {
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
    } else {
      // Mock - simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newInquiry: Inquiry = {
        id: generateId(),
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        inquiry_type: data.inquiryType || 'general',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Add to mock data (in memory only)
      mockInquiries.push(newInquiry)

      return { success: true, inquiry: newInquiry }
    }
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
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get inquiries error:', error)
      return []
    }

    return data
  } else {
    return [...mockInquiries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }
}

