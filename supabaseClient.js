import { createClient } from '@supabase/supabase-js';

// As chaves devem vir de variáveis de ambiente no Vite (.env)
// VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
