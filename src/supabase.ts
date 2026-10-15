import { createClient } from '@supabase/supabase-js';

// Using your new environment variable names
const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);