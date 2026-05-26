import { createClient } from '@supabase/supabase-js';

// Retrieve from environment variables if present safely
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Create a conditional client
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const hasSupabaseConfig = () => {
  // Check both ENV and runtime custom overrides saved in localStorage
  const localUrl = localStorage.getItem('VAULTIFY_CUSTOM_SUPABASE_URL');
  const localKey = localStorage.getItem('VAULTIFY_CUSTOM_SUPABASE_KEY');
  return !!((supabaseUrl && supabaseAnonKey) || (localUrl && localKey));
};

export const getActiveSupabase = () => {
  const localUrl = localStorage.getItem('VAULTIFY_CUSTOM_SUPABASE_URL');
  const localKey = localStorage.getItem('VAULTIFY_CUSTOM_SUPABASE_KEY');
  
  if (localUrl && localKey) {
    return createClient(localUrl, localKey);
  }
  
  return supabase;
};
