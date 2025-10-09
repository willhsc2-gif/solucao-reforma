import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner'; // Importar toast para notificações

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL or Anon Key is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file (for local development) and in your Vercel project environment variables (for production)."
  );
  // Adicionar um toast para alertar o usuário na UI
  toast.error("Erro de configuração: Chaves do Supabase ausentes. Verifique suas variáveis de ambiente.");
}

export const supabase = createClient(supabaseUrl || 'YOUR_SUPABASE_URL', supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY');