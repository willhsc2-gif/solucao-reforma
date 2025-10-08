import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, UploadCloud, Building2 } from "lucide-react";
import { supabase, DEFAULT_SETTINGS_ID } from "@/integrations/supabase/client"; // Importar DEFAULT_SETTINGS_ID
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from "@/utils/file";
import { useCompanySettings } from "@/hooks/useCompanySettings"; // Import the updated hook

interface CompanySettings {
  id: string;
  company_name: string;
  phone: string;
  email: string;
  cnpj: string;
  address: string;
  logo_url: string;
}

const Settings = () => {
  const { companySettings, loadingCompanySettings, errorCompanySettings, fetchCompanySettings } = useCompanySettings();
  const [localSettings, setLocalSettings] = React.useState<Partial<CompanySettings>>({});
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (companySettings) {
      setLocalSettings(companySettings);
      if (companySettings.logo_url) {
        setLogoPreviewUrl(companySettings.logo_url);
      }
    }
  }, [companySettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setLocalSettings((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) {
      throw error;
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Não precisamos mais verificar o usuário, pois não há login
      // const { data: { user }, error: authError } = await supabase.auth.getUser();
      // if (authError || !user) {
      //   toast.error("Você precisa estar logado para salvar as configurações da empresa.");
      //   setSaving(false);
      //   return;
      // }

      const settingsId = DEFAULT_SETTINGS_ID; // Usar o ID padrão

      let newLogoUrl = localSettings.logo_url;

      if (logoFile) {
        const sanitizedLogoFileName = sanitizeFileName(logoFile.name);
        // Usar o settingsId para o caminho do arquivo no storage
        const filePath = `${settingsId}/${uuidv4()}-${sanitizedLogoFileName}`;
        newLogoUrl = await uploadFile(logoFile, "logos", filePath);
      }

      const { data, error } = await supabase
        .from("company_settings")
        .upsert(
          {
            id: settingsId, // Usar o ID padrão
            company_name: localSettings.company_name || "",
            phone: localSettings.phone || "",
            email: localSettings.email || "",
            cnpj: localSettings.cnpj || "",
            address: localSettings.address || "",
            logo_url: newLogoUrl || "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      setLocalSettings(data);
      setLogoPreviewUrl(data.logo_url);
      setLogoFile(null);
      toast.success("Configurações da empresa salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar configurações da empresa: " + error.message);
      console.error("Erro ao salvar configurações da empresa:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loadingCompanySettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
        <p>Carregando configurações da empresa...</p>
      </div>
    );
  }

  // Não há mais erro de autenticação, apenas de carregamento geral
  if (errorCompanySettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
        <p className="text-red-500">{errorCompanySettings}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-6 w-6" /> Configurações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={localSettings.company_name || ""}
                onChange={handleInputChange}
                placeholder="Nome da sua empresa"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={localSettings.phone || ""}
                onChange={handleInputChange}
                placeholder="(XX) XXXX-XXXX"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={localSettings.email || ""}
                onChange={handleInputChange}
                placeholder="contato@suaempresa.com"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={localSettings.cnpj || ""}
                onChange={handleInputChange}
                placeholder="XX.XXX.XXX/XXXX-XX"
              />
            </div>
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                value={localSettings.address || ""}
                onChange={handleInputChange}
                placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="logo-upload">Logo da Empresa</Label>
              <div className="flex items-center space-x-4 mt-2">
                {logoPreviewUrl ? (
                  <img src={logoPreviewUrl} alt="Logo Preview" className="h-24 w-24 object-contain rounded-md border dark:border-gray-700 p-1" />
                ) : (
                  <div className="h-24 w-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400">
                    <UploadCloud className="h-10 w-10" />
                  </div>
                )}
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md shadow-sm transition-all duration-300 font-medium">
                  {logoPreviewUrl ? "Alterar Logo" : "Adicionar Logo"}
                </Label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving} className="px-6 py-3 text-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700">
                {saving ? "Salvando..." : <><Save className="mr-2 h-5 w-5" /> Salvar Configurações</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;