import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Used for user-scoped queries (respects Row Level Security)
export const supabase = createClient(url, anonKey);

// Used for admin operations (bypasses RLS) — never expose this to the client
export const supabaseAdmin = createClient(url, serviceKey);
