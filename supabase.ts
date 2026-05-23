import { createClient } from '@supabase/supabase-js';

function cleanEnvValue(val: any): string {
  if (!val) return "";
  let s = String(val).trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("'") && s.endsWith("'")) {
    s = s.slice(1, -1).trim();
  }
  if (s === "" || s === "undefined" || s === "null") {
    return "";
  }
  return s;
}

// Get URL and Key robustly across environments (Node server, Vite dev, Vite production)
let rawUrl = "";
let rawKey = "";

try {
  // Vite replaces these with literal strings during build/dev compile-time.
  // Node reads them natively on the backend.
  rawUrl = (process.env.SUPABASE_URL as string) || "";
  rawKey = (process.env.SUPABASE_ANON_KEY as string) || "";
} catch (e) {
  // Ignore env access errors
}

let supabaseUrl = cleanEnvValue(rawUrl);
let supabaseAnonKey = cleanEnvValue(rawKey);

// Ensure fallback to current credential values
if (!supabaseUrl) {
  supabaseUrl = 'https://yqtkfpaauzpcwzaopzhl.supabase.co';
}
if (!supabaseAnonKey) {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGtmcGFhdXpwY3d6YW9wemhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDY5ODIsImV4cCI6MjA5NDQ4Mjk4Mn0.9BSnEHydxyVuQjNaOY1O7JR2xZMQt5lmfuaJLuSYteg';
}

// Export a reassignment-friendly client
export let supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        let fetchedUrl = cleanEnvValue(data.supabaseUrl);
        let fetchedKey = cleanEnvValue(data.supabaseAnonKey);
        
        if (fetchedUrl && fetchedKey) {
          supabase = createClient(fetchedUrl, fetchedKey);
          return supabase;
        }
      }
    } catch (err) {
      console.warn("Could not load dynamic configuration, using static build-time credentials:", err);
    }
  }
  return supabase;
}
