import { createClient } from '@supabase/supabase-js';

// Access variables from process.env (set via Vite define for client-side or naturally for server-side)
const supabaseUrl = typeof process !== 'undefined' ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) : (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = typeof process !== 'undefined' ? (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) : (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
