// Patient Portal Authentication Utilities
import { PatientAuth, PatientSession } from '../types/Patient';

/**
 * Validates Malaysian IC (NRIC) format
 * Format: YYMMDD-PB-###G
 * Example: 850615-10-5234
 */
export function validateMalaysianIC(nric: string): boolean {
  // Remove any spaces or dashes
  const cleaned = nric.replace(/[\s-]/g, '');
  
  // Check if it's 12 digits
  if (!/^\d{12}$/.test(cleaned)) {
    return false;
  }
  
  // Extract date parts
  const year = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const day = parseInt(cleaned.substring(4, 6));
  
  // Validate month and day
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  
  return true;
}

/**
 * Format IC number for display
 * Input: 850615105234
 * Output: 850615-10-5234
 */
export function formatIC(nric: string): string {
  const cleaned = nric.replace(/[\s-]/g, '');
  if (cleaned.length !== 12) return nric;
  
  return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 12)}`;
}

/**
 * Clean IC number (remove formatting)
 * Input: 850615-10-5234
 * Output: 850615105234
 */
export function cleanIC(nric: string): string {
  return nric.replace(/[\s-]/g, '');
}

/**
 * Validate date of birth format (YYYY-MM-DD)
 */
export function validateDOB(dob: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dob)) return false;
  
  const date = new Date(dob);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate PIN (6 digits)
 */
export function validatePIN(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Store patient session in localStorage
 */
export function storePatientSession(session: PatientSession): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('patient_session', JSON.stringify({
    ...session,
    patient: {
      ...session.patient,
      dob: session.patient.dob.toISOString()
    },
    expiresAt: session.expiresAt.toISOString()
  }));
}

/**
 * Get patient session from localStorage
 */
export function getPatientSession(): PatientSession | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('patient_session');
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    const session: PatientSession = {
      ...parsed,
      patient: {
        ...parsed.patient,
        dob: new Date(parsed.patient.dob)
      },
      expiresAt: new Date(parsed.expiresAt)
    };
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      clearPatientSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing patient session:', error);
    clearPatientSession();
    return null;
  }
}

/**
 * Clear patient session from localStorage
 */
export function clearPatientSession(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('patient_session');
}

/**
 * Check if patient is authenticated
 */
export function isPatientAuthenticated(): boolean {
  const session = getPatientSession();
  return session !== null;
}

/**
 * Get current patient from session
 */
export function getCurrentPatient(): PatientAuth | null {
  const session = getPatientSession();
  return session?.patient || null;
}

/**
 * Format date for display
 */
export function formatDate(date: Date, language: 'en' | 'ms' = 'en'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const locale = language === 'ms' ? 'ms-MY' : 'en-MY';
  return date.toLocaleDateString(locale, options);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date, language: 'en' | 'ms' = 'en'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const locale = language === 'ms' ? 'ms-MY' : 'en-MY';
  return date.toLocaleDateString(locale, options);
}

/**
 * Hash PIN for comparison (simple hashing - in production use bcrypt)
 * Note: This is a simple implementation. In production, use bcrypt on server side
 */
export function hashPIN(pin: string): string {
  // This is a placeholder - actual hashing should be done server-side
  // For demo purposes, we'll just return the pin (DO NOT USE IN PRODUCTION)
  return pin;
}

/**
 * Generate a random share token
 */
export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Get device info for logging
 */
export function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Unknown';
  
  const ua = navigator.userAgent;
  let device = 'Desktop';
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    device = 'Mobile';
  }
  
  return device;
}

/**
 * Get IP address (from headers if available)
 */
export function getIPAddress(): string | null {
  // This would typically come from request headers on the server side
  return null;
}

/**
 * Log portal access
 */
export async function logPortalAccess(patientId: string, accessType: string): Promise<void> {
  try {
    await fetch('/api/patient-portal/log-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        accessType,
        deviceInfo: getDeviceInfo(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      }),
    });
  } catch (error) {
    console.error('Failed to log portal access:', error);
  }
}

