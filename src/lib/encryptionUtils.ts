/**
 * Simple encryption utilities for temporarily storing passwords
 * Uses Web Crypto API for AES-GCM encryption
 * 
 * Note: In production, use a proper key management system
 * This is a basic implementation for temporary password storage
 */

/**
 * Encrypt a password using AES-GCM
 * In production, the encryption key should come from environment variables
 * 
 * @param password - Plain text password to encrypt
 * @returns Encrypted password string (format: iv:encryptedData)
 */
export async function encryptPassword(password: string): Promise<string> {
  // In production, get this from environment variable or key management service
  // For now, we'll derive a key from a constant (NOT SECURE FOR PRODUCTION)
  // TODO: Use proper key management in production
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('hospital-system-encryption-key-change-in-production'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('hospital-system-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    new TextEncoder().encode(password)
  )

  // Convert to base64 for storage
  const ivBase64 = btoa(String.fromCharCode(...iv))
  const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)))

  return `${ivBase64}:${encryptedBase64}`
}

/**
 * Decrypt a password
 * 
 * @param encrypted - Encrypted password string (format: iv:encryptedData)
 * @returns Decrypted plain text password
 */
export async function decryptPassword(encrypted: string): Promise<string> {
  try {
    const [ivBase64, encryptedBase64] = encrypted.split(':')
    
    // Decode
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))
    const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))

    // Derive key (same as encryption)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('hospital-system-encryption-key-change-in-production'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('hospital-system-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    )

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error('Error decrypting password:', error)
    throw new Error('Failed to decrypt password')
  }
}

