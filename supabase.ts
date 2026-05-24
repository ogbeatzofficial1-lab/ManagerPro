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
  // Try reading standard Vite client-side environment variables first (populated on build or dev server)
  rawUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || ((import.meta as any).env?.SUPABASE_URL as string) || "";
  rawKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || ((import.meta as any).env?.SUPABASE_ANON_KEY as string) || "";
} catch (e) {
  // Ignore env access errors
}

// Fallback to process.env literal replacement.
// We must NOT use optional chaining (process.env?.SUPABASE_URL) because Vite's define plugin 
// strictly matches the exact string literal 'process.env.SUPABASE_URL'.
if (!rawUrl) {
  try {
    rawUrl = (process.env.SUPABASE_URL as string) || (process.env.VITE_SUPABASE_URL as string) || "";
  } catch (e) {}
}
if (!rawKey) {
  try {
    rawKey = (process.env.SUPABASE_ANON_KEY as string) || (process.env.VITE_SUPABASE_ANON_KEY as string) || "";
  } catch (e) {}
}

export let supabaseUrl = cleanEnvValue(rawUrl);
export let supabaseAnonKey = cleanEnvValue(rawKey);

// Fallback to active sandbox template if completely unconfigured
if (!supabaseUrl) {
  supabaseUrl = 'https://yqtkfpaauzpcwzaopzhl.supabase.co';
}
if (!supabaseAnonKey) {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGtmcGFhdXpwY3d6YW9wemhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDY5ODIsImV4cCI6MjA5NDQ4Mjk4Mn0.9BSnEHydxyVuQjNaOY1O7JR2xZMQt5lmfuaJLuSYteg';
}

// Export a reassignment-friendly client
export let supabase: any = null;

if (supabaseUrl) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("Failed to create Supabase client:", err);
  }
}

export async function getSupabaseClient() {
  return supabase;
}
