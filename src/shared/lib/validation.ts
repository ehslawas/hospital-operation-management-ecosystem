/**
 * API Validation Utilities
 * 
 * Simple validation helpers for API routes.
 * For more complex validation, consider using Zod or Yup.
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidMRN(mrn: string): boolean {
  // Adjust pattern based on your MRN format
  return mrn.length >= 6 && mrn.length <= 20;
}

export function isValidNRIC(nric: string): boolean {
  // Malaysian NRIC format: YYMMDD-PB-###G
  const nricRegex = /^\d{6}-\d{2}-\d{4}$/;
  return nricRegex.test(nric);
}

export function isValidPhone(phone: string): boolean {
  // Malaysian phone format (flexible)
  const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function sanitizeString(str: string): string {
  // Remove potentially harmful characters
  return str
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 1000); // Max length
}

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationErrors {
  private errors: ValidationError[] = [];

  add(field: string, message: string) {
    this.errors.push({ field, message });
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  toObject(): Record<string, string> {
    return this.errors.reduce((acc, err) => {
      acc[err.field] = err.message;
      return acc;
    }, {} as Record<string, string>);
  }
}

/**
 * Example usage in API route:
 * 
 * const validator = new ValidationErrors();
 * 
 * if (!data.name) {
 *   validator.add('name', 'Name is required');
 * }
 * 
 * if (!isValidEmail(data.email)) {
 *   validator.add('email', 'Invalid email format');
 * }
 * 
 * if (validator.hasErrors()) {
 *   return badRequestResponse('Validation failed', validator.toObject());
 * }
 */

