import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check your .env file.");
  // Fallback or throw an error to prevent app from crashing
  // For now, we'll use placeholder values to allow the app to load, but operations will fail.
  // In a real app, you might want to display an error message to the user.
  // For this exercise, we'll proceed with the assumption that the user will set them up.
}

export const supabase = createClient(supabaseUrl || 'YOUR_SUPABASE_URL', supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY');