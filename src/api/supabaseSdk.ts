/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!rawUrl || !ANON_KEY) {
  console.warn('[syncra-society] Missing Supabase env — auth features may be limited until .env is configured.')
}

// supabase-js expects the project URL (not the /rest/v1 path). Strip rest/v1 if present.
const PROJECT_URL = (rawUrl || 'https://placeholder.supabase.co').replace(/\/rest\/v1\/?$/i, '')

const supabase: SupabaseClient = createClient(PROJECT_URL, ANON_KEY || 'placeholder-anon-key')

export default supabase
