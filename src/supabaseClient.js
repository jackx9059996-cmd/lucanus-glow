import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const allowedEmails = (import.meta.env.VITE_ALLOWED_EMAILS || 'jack.x9059996@gmail.com')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)

export const sessionMaxAgeDays = Number(import.meta.env.VITE_SESSION_MAX_AGE_DAYS || 60)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

