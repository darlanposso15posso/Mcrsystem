import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://kokngsijyvfdtobvpswy.supabase.co';
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva25nc2lqeXZmZHRvYnZwc3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODI2MTQsImV4cCI6MjA4NzY1ODYxNH0.EzPCEh5panTyCcDvWnrBoOf3ANB3j7oHhA3rk7aqBLo';

export const supabase = createClient(supabaseUrl, supabaseKey);
