/**
 * Password hashing and validation utilities
 * Uses Web Crypto API for secure password hashing (bcrypt-like functionality)
 */

/**
 * Hash a password using PBKDF2 (Web Crypto API)
 * This is a secure alternative to bcrypt in the browser
 * 
 * @param password - Plain text password
 * @returns Hashed password string (format: salt:iterations:hash)
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16))
  
  // Convert password to ArrayBuffer
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )
  
  // Derive key with PBKDF2 (100,000 iterations for security)
  const iterations = 100000
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  )
  
  // Convert to base64 strings for storage
  const saltBase64 = btoa(String.fromCharCode(...salt))
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
  
  // Return format: salt:iterations:hash
  return `${saltBase64}:${iterations}:${hashBase64}`
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain text password to verify
 * @param hash - Stored hash (format: salt:iterations:hash)
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltBase64, iterationsStr, hashBase64] = hash.split(':')
    const iterations = parseInt(iterationsStr, 10)
    
    // Decode salt and hash
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0))
    const storedHash = Uint8Array.from(atob(hashBase64), c => c.charCodeAt(0))
    
    // Convert password to ArrayBuffer
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    
    // Import password as key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    )
    
    // Derive key with same parameters
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    )
    
    // Compare hashes
    const computedHash = new Uint8Array(hashBuffer)
    
    // Constant-time comparison to prevent timing attacks
    if (computedHash.length !== storedHash.length) {
      return false
    }
    
    let result = 0
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i]
    }
    
    return result === 0
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

/**
 * Check password strength
 * Returns an object with strength level and feedback
 */
export function checkPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length checks
  if (password.length >= 8) score += 1
  else feedback.push('Use at least 8 characters')
  
  if (password.length >= 12) score += 1
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Add lowercase letters')
  
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Add uppercase letters')
  
  if (/[0-9]/.test(password)) score += 1
  else feedback.push('Add numbers')
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1
  else feedback.push('Add special characters')
  
  // Pattern checks (penalize weak patterns)
  if (/(.)\1{2,}/.test(password)) {
    score -= 1
    feedback.push('Avoid repeated characters')
  }
  
  if (/12345|abcde|qwerty|password/i.test(password)) {
    score -= 2
    feedback.push('Avoid common patterns')
  }
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  if (score <= 2) {
    strength = 'weak'
  } else if (score <= 4) {
    strength = 'medium'
  } else if (score <= 6) {
    strength = 'strong'
  } else {
    strength = 'very-strong'
  }
  
  return { strength, score, feedback }
}

