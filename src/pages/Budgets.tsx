import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Eye, Mic, Share2 } from "lucide-react"; // Adicionado Share2
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';
import useSpeechToText from "@/hooks/use-speech-to-text";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const Budgets = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [companySettings, setCompanySettings] = React.useState<Partial<CompanySettings>>({});
  const [formData, setFormData] = React.useState({
    budgetNumber: "",
    clientName: "",
    description: "",
    additionalNotes: "",
    duration: "",
    valueWithMaterial: "",
    valueWithoutMaterial: "",
    validityDays: "",
    paymentMethod: "",
  });
  const [loading, setLoading] = React.useState(false);
  const pdfContentRef = React.useRef<HTMLDivElement>(null); // Ref para o conteúdo do PDF

  const {
    isListening: isDescriptionListening,
    transcript: descriptionTranscript,
    toggleListening: toggleDescriptionListening,
    browserSupportsSpeechRecognition,
    clearTranscript: clearDescriptionTranscript,
  } = useSpeechToText();

  const {
    isListening: isNotesListening,
    transcript: notesTranscript,
    toggleListening: toggleNotesListening,
    clearTranscript: clearNotesTranscript,
  } = useSpeechToText();

  const baseDescriptionTextRef = React.useRef('');
  const baseNotesTextRef = React.useRef('');

  const generateBudgetNumber = () => {
    return `ORC-${uuidv4().substring(0, 8).toUpperCase()}`;
  };

  React.useEffect(() => {
    setFormData((prev) => ({ ...prev, budgetNumber: generateBudgetNumber() }));
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("id", SETTINGS_ID)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCompanySettings(data);
      } else {
        setCompanySettings({ company_name: "Sua Empresa", phone: "(XX) XXXX-XXXX", email: "contato@suaempresa.com", cnpj: "XX.XXX.XXX/XXXX-XX", address: "Seu Endereço" });
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações da empresa para orçamento:", error);
      toast.error("Erro ao carregar dados da empresa. Verifique as configurações.");
    }
  };

  React.useEffect(() => {
    if (isDescriptionListening) {
      setFormData((prev) => ({
        ...prev,
        description: baseDescriptionTextRef.current + descriptionTranscript,
      }));
    } else if (descriptionTranscript) {
      setFormData((prev) => ({
        ...prev,
        description: baseDescriptionTextRef.current + descriptionTranscript,
      }));
      clearDescriptionTranscript();
    }
  }, [descriptionTranscript, isDescriptionListening, clearDescriptionTranscript]);

  React.useEffect(() => {
    if (isNotesListening) {
      setFormData((prev) => ({
        ...prev,
        additionalNotes: baseNotesTextRef.current + notesTranscript,
      }));
    } else if (notesTranscript) {
      setFormData((prev) => ({
        ...prev,
        additionalNotes: baseNotesTextRef.current + notesTranscript,
      }));
      clearNotesTranscript();
    }
  }, [notesTranscript, isNotesListening, clearNotesTranscript]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id.replace(/-/g, "")]: value }));
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      throw error;
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const generatePdf = async () => {
    if (!pdfContentRef.current) {
      toast.error("Erro: Conteúdo do PDF não encontrado.");
      return null;
    }

    // Use html2canvas to capture the content
    const canvas = await html2canvas(pdfContentRef.current, { 
      scale: 2, // Increase scale for better resolution
      useCORS: true, // Enable CORS for images like the company logo
    });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const pdfBlob = pdf.output('blob');
    return new File([pdfBlob], `orcamento-${formData.budgetNumber}.pdf`, { type: 'application/pdf' });
  };

  const handleSaveAndGeneratePdf = async () => {
    setLoading(true);
    try {
      // 1. Gerar o PDF
      const generatedPdfFile = await generatePdf();
      if (!generatedPdfFile) {
        throw new Error("Falha ao gerar o PDF.");
      }

      // 2. Fazer upload do PDF gerado
      const pdfPath = `budgets/${formData.budgetNumber}-${Date.now()}.pdf`;
      const uploadedPdfUrl = await uploadFile(generatedPdfFile, "budget_pdfs", pdfPath);

      // 3. Salvar dados do orçamento no Supabase
      const { error } = await supabase.from("budgets").insert([
        {
          client_id: null,
          client_name_text: formData.clientName,
          budget_number: formData.budgetNumber,
          description: formData.description,
          additional_notes: formData.additionalNotes,
          duration: formData.duration,
          budget_date: date ? format(date, "yyyy-MM-dd") : null,
          value_with_material: parseFloat(formData.valueWithMaterial) || 0,
          value_without_material: parseFloat(formData.valueWithoutMaterial) || 0,
          validity_days: parseInt(formData.validityDays) || 0,
          payment_method: formData.paymentMethod,
          pdf_url: uploadedPdfUrl,
          logo_url: companySettings.logo_url,
        },
      ]);

      if (error) {
        throw error;
      }

      toast.success("Orçamento salvo e PDF gerado com sucesso!", {
        action: {
          label: "Compartilhar no WhatsApp",
          onClick: () => {
            const whatsappMessage = `Olá ${formData.clientName || 'cliente'}! Segue o orçamento ${formData.budgetNumber}: ${uploadedPdfUrl}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
          },
        },
      });

      // Reset form
      setFormData({
        budgetNumber: generateBudgetNumber(),
        clientName: "",
        description: "",
        additionalNotes: "",
        duration: "",
        valueWithMaterial: "",
        valueWithoutMaterial: "",
        validityDays: "",
        paymentMethod: "",
      });
      setDate(new Date());

    } catch (error: any) {
      toast.error("Erro ao salvar orçamento: " + error.message);
      console.error("Erro ao salvar orçamento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDescriptionListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Seu navegador não suporta a API de Reconhecimento de Voz.");
      return;
    }
    if (!isDescriptionListening) {
      baseDescriptionTextRef.current = formData.description;
    }
    toggleDescriptionListening();
  };

  const handleToggleNotesListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Seu navegador não suporta a API de Reconhecimento de Voz.");
      return;
    }
    if (!isNotesListening) {
      baseNotesTextRef.current = formData.additionalNotes;
    }
    toggleNotesListening();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-black text-white p-4 flex flex-col sm:flex-row items-center justify-between shadow-md">
        <div className="flex items-center mb-4 sm:mb-0">
          {companySettings.logo_url ? (
            <img src={companySettings.logo_url} alt="Logo" className="h-12 mr-4 rounded-md object-contain" />
          ) : (
            <div className="h-12 w-12 bg-gray-700 flex items-center justify-center rounded-md mr-4">
              <span className="text-sm">Logo</span>
            </div>
          )}
        </div>
        <div className="text-sm text-center sm:text-right">
          <p>Telefone: {companySettings.phone || "(XX) XXXX-XXXX"}</p>
          <p>E-mail: {companySettings.email || "contato@suaempresa.com"}</p>
          <p>CNPJ: {companySettings.cnpj || "XX.XXX.XXX/XXXX-XX"}</p>
          <p>Endereço: {companySettings.address || "Rua Exemplo, 123 - Bairro, Cidade/CEP"}</p>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">Criar Orçamento</h1>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="budget-number">Número do Orçamento</Label>
              <Input id="budget-number" placeholder="Ex: ORC-001" value={formData.budgetNumber} readOnly />
            </div>
            <div>
              <Label htmlFor="client-name">Nome do Cliente</Label>
              <Input id="clientName" placeholder="Digite o nome do cliente" value={formData.clientName} onChange={handleInputChange} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="services-description">Descrição dos Serviços</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleDescriptionListening}
                  className={cn(
                    "ml-2",
                    isDescriptionListening && "bg-red-500 hover:bg-red-600 text-white"
                  )}
                  title={isDescriptionListening ? "Parar reconhecimento de voz" : "Iniciar reconhecimento de voz"}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Textarea id="description" placeholder="Detalhes dos serviços a serem realizados..." rows={5} value={formData.description} onChange={handleInputChange} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="additional-notes">Observações Adicionais</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleNotesListening}
                  className={cn(
                    "ml-2",
                    isNotesListening && "bg-red-500 hover:bg-red-600 text-white"
                  )}
                  title={isNotesListening ? "Parar reconhecimento de voz" : "Iniciar reconhecimento de voz"}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Textarea id="additionalNotes" placeholder="Qualquer observação relevante..." rows={3} value={formData.additionalNotes} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="duration">Duração da Obra</Label>
              <Input id="duration" placeholder="Ex: 30 dias úteis" value={formData.duration} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="budget-date">Data do Orçamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="value-with-material">Valor com Material (R$)</Label>
              <Input id="valueWithMaterial" type="number" placeholder="0.00" value={formData.valueWithMaterial} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="value-without-material">Valor sem Material (R$)</Label>
              <Input id="valueWithoutMaterial" type="number" placeholder="0.00" value={formData.valueWithoutMaterial} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="validity">Validade (dias)</Label>
              <Input id="validityDays" type="number" placeholder="Ex: 30" value={formData.validityDays} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="payment-method">Forma de Pagamento</Label>
              <Input id="paymentMethod" placeholder="Ex: 50% no início, 50% na entrega" value={formData.paymentMethod} onChange={handleInputChange} />
            </div>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Button onClick={handleSaveAndGeneratePdf} className="px-8 py-4 text-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-lg transition-all duration-300" disabled={loading}>
            {loading ? "Salvando..." : <><Save className="mr-2 h-5 w-5" /> Salvar e Gerar PDF</>}
          </Button>
        </div>
      </main>

      {/* Hidden content for PDF generation */}
      <div ref={pdfContentRef} className="p-8 bg-white text-gray-900 w-[210mm] min-h-[297mm] mx-auto" style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center">
            {companySettings.logo_url && (
              <img src={companySettings.logo_url} alt="Logo da Empresa" className="h-20 mr-4 object-contain" />
            )}
            <div>
              <h2 className="text-2xl font-bold">{companySettings.company_name || "Nome da Empresa"}</h2>
              <p className="text-sm">{companySettings.address || "Endereço da Empresa"}</p>
              <p className="text-sm">CNPJ: {companySettings.cnpj || "XX.XXX.XXX/XXXX-XX"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">ORÇAMENTO Nº: {formData.budgetNumber}</p>
            <p className="text-sm">Data: {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "N/A"}</p>
            <p className="text-sm">Telefone: {companySettings.phone || "(XX) XXXX-XXXX"}</p>
            <p className="text-sm">Email: {companySettings.email || "contato@empresa.com"}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Dados do Cliente</h3>
          <p>Nome: {formData.clientName || "N/A"}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Descrição dos Serviços</h3>
          <p className="whitespace-pre-wrap">{formData.description || "N/A"}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Detalhes do Orçamento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Duração Estimada:</strong> {formData.duration || "N/A"}</p>
              <p><strong>Validade do Orçamento:</strong> {formData.validityDays ? `${formData.validityDays} dias` : "N/A"}</p>
              <p><strong>Forma de Pagamento:</strong> {formData.paymentMethod || "N/A"}</p>
            </div>
            <div className="text-right">
              <p><strong>Valor com Material:</strong> R$ {parseFloat(formData.valueWithMaterial || "0").toFixed(2)}</p>
              <p><strong>Valor sem Material:</strong> R$ {parseFloat(formData.valueWithoutMaterial || "0").toFixed(2)}</p>
              <p className="text-xl font-bold mt-2">Total: R$ {(parseFloat(formData.valueWithMaterial || "0") + parseFloat(formData.valueWithoutMaterial || "0")).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Observações Adicionais</h3>
          <p className="whitespace-pre-wrap">{formData.additionalNotes || "N/A"}</p>
        </div>

        <div className="text-center mt-12 pt-4 border-t">
          <p className="text-sm text-gray-600">Agradecemos a preferência!</p>
        </div>
      </div>
    </div>
  );
};

export default Budgets;