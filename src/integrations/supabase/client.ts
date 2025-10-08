import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL or Anon Key is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file (for local development) and in your Vercel project environment variables (for production)."
  );
  // Fallback or throw an error to prevent app from crashing
  // For now, we'll use placeholder values to allow the app to load, but operations will fail.
  // For this exercise, we'll proceed with the assumption that the user will set them up.
}

// Adicionado para depuração: Verifique se as chaves estão sendo carregadas
console.log("Supabase URL (loaded):", supabaseUrl ? "Loaded" : "Missing");
console.log("Supabase Anon Key (loaded):", supabaseAnonKey ? "Loaded" : "Missing");


export const supabase = createClient(supabaseUrl || 'YOUR_SUPABASE_URL', supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY');