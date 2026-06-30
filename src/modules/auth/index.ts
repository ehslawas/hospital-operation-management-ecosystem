/**
 * @module Auth
 * 
 * Handles all authentication and user session management:
 * - Login Page
 * - Reset Password Flow
 * - Password policies and encryption validation
 * 
 * Key files:
 * - pages/LoginPage.tsx â€” User login interface
 * - pages/ResetPasswordPage.tsx â€” Reset password interface
 * - services/authService.ts â€” Supabase auth integration
 * - services/authUserService.ts â€” Auth user queries
 * - services/passwordService.ts â€” Encryption and password utilities
 */

// @ts-nocheck
export { default as LoginPage } from './pages/LoginPage'


export * from './types'
