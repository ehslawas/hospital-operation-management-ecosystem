// Re-export strictly from services/supabase to ensure singleton instance
// and avoid "Multiple GoTrueClient instances" warning.
export * from '@/services/supabase';
export { default } from '@/services/supabase';
