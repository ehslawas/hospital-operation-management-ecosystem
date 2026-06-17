/**
 * @module Auth
 * 
 * Handles all authentication and user session management:
 * - Login Page
 * - Reset Password Flow
 * - Password policies and encryption validation
 * 
 * Key files:
 * - pages/LoginPage.tsx — User login interface
 * - pages/ResetPasswordPage.tsx — Reset password interface
 * - services/authService.ts — Supabase auth integration
 * - services/authUserService.ts — Auth user queries
 * - services/passwordService.ts — Encryption and password utilities
 */

export { default as LoginPage } from './pages/LoginPage'
export { default as ResetPasswordPage } from './pages/ResetPasswordPage'

export * from './services'
export * from './types'
