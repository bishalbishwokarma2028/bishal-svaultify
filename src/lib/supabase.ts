import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  || 'https://qstylppeypeabeocqgtv.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdHlscHBleXBlYWJlb2NxZ3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MDE2MjIsImV4cCI6MjA5NzE3NzYyMn0.NwhRkY4WZLPfmb-HwaNeGtbDiSK4joqzFp8pII8ViBQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = true;
