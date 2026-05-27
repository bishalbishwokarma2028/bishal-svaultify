import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://vdqblgmisqmnelwocids.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcWJsZ21pc3FtbmVsd29jaWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4ODIyOTAsImV4cCI6MjA5NTQ1ODI5MH0.HMbpcR_hm3-JrjW1UAf2Wk6gf1cfuanCCdw5tUsyQEw';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
