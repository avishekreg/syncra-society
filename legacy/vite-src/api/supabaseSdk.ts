/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!rawUrl || !ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
}

// supabase-js expects the project URL (not the /rest/v1 path). Strip rest/v1 if present.
const PROJECT_URL = rawUrl.replace(/\/rest\/v1\/?$/i, '')

const supabase: SupabaseClient = createClient(PROJECT_URL, ANON_KEY)

export default supabase
