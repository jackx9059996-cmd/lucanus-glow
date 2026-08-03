import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const loginAccount = (import.meta.env.VITE_LOGIN_ACCOUNT || 'jack.x9059996').trim().toLowerCase()
export const authEmail = (import.meta.env.VITE_AUTH_EMAIL || 'jack.x9059996@gmail.com').trim().toLowerCase()

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
