import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
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

const SETTINGS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

interface UseCompanySettingsResult {
  companySettings: Partial<CompanySettings>;
  loadingCompanySettings: boolean;
  errorCompanySettings: string | null;
  fetchCompanySettings: () => Promise<void>;
}

export const useCompanySettings = (): UseCompanySettingsResult => {
  const [companySettings, setCompanySettings] = useState<Partial<CompanySettings>>({});
  const [loadingCompanySettings, setLoadingCompanySettings] = useState(true);
  const [errorCompanySettings, setErrorCompanySettings] = useState<string | null>(null);

  const fetchCompanySettings = async () => {
    setLoadingCompanySettings(true);
    setErrorCompanySettings(null);
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("id", SETTINGS_ID)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        throw error;
      }

      if (data) {
        setCompanySettings(data);
      } else {
        // If no settings found, initialize with default values
        setCompanySettings({ company_name: "Sua Empresa", phone: "(XX) XXXX-XXXX", email: "contato@suaempresa.com", cnpj: "XX.XXX.XXX/XXXX-XX", address: "Seu Endereço" });
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
    fetchCompanySettings();
  }, []);

  return {
    companySettings,
    loadingCompanySettings,
    errorCompanySettings,
    fetchCompanySettings,
  };
};