import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanySettings {
  id: string; // This will now be the user_id
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
  userId: string | null; // Expose userId
}

export const useCompanySettings = (): UseCompanySettingsResult => {
  const [companySettings, setCompanySettings] = useState<Partial<CompanySettings>>({});
  const [loadingCompanySettings, setLoadingCompanySettings] = useState(true);
  const [errorCompanySettings, setErrorCompanySettings] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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

  const fetchCompanySettings = async () => {
    if (!userId) {
      setLoadingCompanySettings(false);
      return;
    }

    setLoadingCompanySettings(true);
    setErrorCompanySettings(null);
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("id", userId) // Use userId as the primary key
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        throw error;
      }

      if (data) {
        setCompanySettings(data);
      } else {
        // If no settings found for this user, initialize with default values
        setCompanySettings({ id: userId, company_name: "Sua Empresa", phone: "(XX) XXXX-XXXX", email: "contato@suaempresa.com", cnpj: "XX.XXX.XXX/XXXX-XX", address: "Seu Endereço" });
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
    if (userId) {
      fetchCompanySettings();
    }
  }, [userId]); // Re-fetch when userId changes

  return {
    companySettings,
    loadingCompanySettings,
    errorCompanySettings,
    fetchCompanySettings,
    userId,
  };
};