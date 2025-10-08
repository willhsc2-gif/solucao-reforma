import React, { useState, useEffect } from 'react';
import { supabase, DEFAULT_SETTINGS_ID } from "@/integrations/supabase/client"; // Importar DEFAULT_SETTINGS_ID
import { toast } from "sonner";

interface CompanySettings {
  id: string;
  company_name: string;
  phone: string;
  email: string;
  cnpj: string;
  address: string;
  logo_url: string;
}

interface UseCompanySettingsResult {
  companySettings: Partial<CompanySettings>;
  loadingCompanySettings: boolean;
  errorCompanySettings: string | null;
  fetchCompanySettings: () => Promise<void>;
  // userId não é mais exposto, pois não há login
}

export const useCompanySettings = (): UseCompanySettingsResult => {
  const [companySettings, setCompanySettings] = useState<Partial<CompanySettings>>({});
  const [loadingCompanySettings, setLoadingCompanySettings] = useState(true);
  const [errorCompanySettings, setErrorCompanySettings] = useState<string | null>(null);

  // Remover o useEffect que obtinha a sessão do usuário
  /*
  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        setUserId(null);
        setLoadingCompanySettings(false);
        setErrorCompanySettings("Usuário não autenticado. Faça login para gerenciar as configurações da empresa.");
        toast.error("Faça login para gerenciar as configurações da empresa.");
      }
    };
    getSession();
  }, []);
  */

  const fetchCompanySettings = async () => {
    setLoadingCompanySettings(true);
    setErrorCompanySettings(null);
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("id", DEFAULT_SETTINGS_ID) // Usar o ID padrão
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        throw error;
      }

      if (data) {
        setCompanySettings(data);
      } else {
        // Se não houver configurações para este ID padrão, inicialize com valores padrão
        setCompanySettings({ id: DEFAULT_SETTINGS_ID, company_name: "Sua Empresa", phone: "(XX) XXXX-XXXX", email: "contato@suaempresa.com", cnpj: "XX.XXX.XXX/XXXX-XX", address: "Seu Endereço" });
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
    // Buscar configurações assim que o componente montar, sem depender de userId
    fetchCompanySettings();
  }, []); // Array de dependências vazio para rodar apenas uma vez

  return {
    companySettings,
    loadingCompanySettings,
    errorCompanySettings,
    fetchCompanySettings,
    // userId não é mais retornado
  };
};