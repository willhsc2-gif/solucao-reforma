import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/components/SessionContextProvider"; // Importar useSession

interface CompanySettings {
  id: string;
  user_id: string; // Adicionar user_id
  company_name: string;
  phone: string;
  email: string;
  cnpj: string;
  address: string;
  logo_url: string;
}

// O SETTINGS_ID fixo não será mais usado para identificar configurações de usuário.
// Em vez disso, usaremos o user_id.

interface UseCompanySettingsResult {
  companySettings: Partial<CompanySettings>;
  loadingCompanySettings: boolean;
  errorCompanySettings: string | null;
  fetchCompanySettings: () => Promise<void>;
}

export const useCompanySettings = (): UseCompanySettingsResult => {
  const { user, loading: loadingUser } = useSession(); // Obter o usuário e o estado de carregamento da sessão
  const [companySettings, setCompanySettings] = useState<Partial<CompanySettings>>({});
  const [loadingCompanySettings, setLoadingCompanySettings] = useState(true);
  const [errorCompanySettings, setErrorCompanySettings] = useState<string | null>(null);

  const fetchCompanySettings = async () => {
    if (!user) {
      setCompanySettings({});
      setLoadingCompanySettings(false);
      return;
    }

    setLoadingCompanySettings(true);
    setErrorCompanySettings(null);
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id) // Filtrar por user_id
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        throw error;
      }

      if (data) {
        setCompanySettings(data);
      } else {
        // Se nenhuma configuração for encontrada, inicializar com valores padrão e o user_id
        setCompanySettings({ 
          user_id: user.id,
          company_name: "Sua Empresa", 
          phone: "(XX) XXXX-XXXX", 
          email: "contato@suaempresa.com", 
          cnpj: "XX.XXX.XXX/XXXX-XX", 
          address: "Seu Endereço" 
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações da empresa:", error);
      setErrorCompanySettings("Erro ao carregar dados da empresa. Verifique as configurações.");
      toast.error("Erro ao carregar dados da empresa. Verifique as configurações.");
    } finally {
      setLoadingCompanySettings(false);
    }
  };

  useEffect(() => {
    if (!loadingUser) { // Só tenta buscar as configurações depois que o estado do usuário for carregado
      fetchCompanySettings();
    }
  }, [user, loadingUser]);

  return {
    companySettings,
    loadingCompanySettings,
    errorCompanySettings,
    fetchCompanySettings,
  };
};