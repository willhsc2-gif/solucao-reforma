import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL or Anon Key is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file (for local development) and in your Vercel project environment variables (for production)."
  );
  // Fallback or throw an error to prevent app from crashing
  // For now, we'll use placeholder values to allow the app to load, but operations will fail.
  // In a real app, you might want to display an error message to the user.
  // For this exercise, we'll proceed with the assumption that the user will set them up.
}

export const supabase = createClient(supabaseUrl || 'YOUR_SUPABASE_URL', supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY');

// Define um ID padrão para as configurações da empresa, já que não haverá autenticação de usuário.
export const DEFAULT_SETTINGS_ID = '00000000-0000-0000-0000-000000000000'; // Um UUID fixo para configurações globais