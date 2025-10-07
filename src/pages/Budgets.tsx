import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, UploadCloud, Save, Eye, Mic } from "lucide-react"; // Importar Mic icon
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // Importar o locale ptBR
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid'; // Importar uuidv4
import useSpeechToText from "@/hooks/use-speech-to-text"; // Importar o novo hook

const Budgets = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    budgetNumber: "",
    clientName: "", // Novo campo para o nome do cliente
    description: "",
    additionalNotes: "",
    duration: "",
    valueWithMaterial: "",
    valueWithoutMaterial: "",
    validityDays: "",
    paymentMethod: "",
  });
  const [loading, setLoading] = React.useState(false);

  // Speech-to-text hooks
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

  // Refs para armazenar o texto base antes de iniciar o reconhecimento
  const baseDescriptionTextRef = React.useRef('');
  const baseNotesTextRef = React.useRef('');

  const generateBudgetNumber = () => {
    return `ORC-${uuidv4().substring(0, 8).toUpperCase()}`; // Gera um número de orçamento único
  };

  React.useEffect(() => {
    setFormData((prev) => ({ ...prev, budgetNumber: generateBudgetNumber() })); // Gera o número do orçamento ao carregar
  }, []);

  // Efeito para atualizar a descrição com o texto reconhecido
  React.useEffect(() => {
    if (isDescriptionListening) {
      setFormData((prev) => ({
        ...prev,
        description: baseDescriptionTextRef.current + descriptionTranscript,
      }));
    } else if (descriptionTranscript) {
      // Quando a escuta para, garante que o texto final seja aplicado e limpa o transcript do hook
      setFormData((prev) => ({
        ...prev,
        description: baseDescriptionTextRef.current + descriptionTranscript,
      }));
      clearDescriptionTranscript();
    }
  }, [descriptionTranscript, isDescriptionListening, clearDescriptionTranscript]);

  // Efeito para atualizar as observações adicionais com o texto reconhecido
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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPdfFile(file);
      setPdfPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      setPdfFile(file);
      setPdfPreviewUrl(URL.createObjectURL(file));
    }
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

  const handleSaveAndGeneratePdf = async () => {
    setLoading(true);
    try {
      let uploadedLogoUrl: string | null = null;
      if (logoFile) {
        uploadedLogoUrl = await uploadFile(logoFile, "logos", `${Date.now()}-${logoFile.name}`);
      }

      let uploadedPdfUrl: string | null = null;
      if (pdfFile) {
        uploadedPdfUrl = await uploadFile(pdfFile, "budget_pdfs", `${Date.now()}-${pdfFile.name}`);
      }

      const { data, error } = await supabase.from("budgets").insert([
        {
          client_id: null, // Não vincula a um cliente existente por ID
          client_name_text: formData.clientName, // Salva o nome digitado
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
          logo_url: uploadedLogoUrl,
        },
      ]);

      if (error) {
        throw error;
      }

      toast.success("Orçamento salvo e PDF gerado com sucesso!");
      // Reset form
      setFormData({
        budgetNumber: generateBudgetNumber(), // Gera um novo número de orçamento
        clientName: "", // Limpa o nome do cliente
        description: "",
        additionalNotes: "",
        duration: "",
        valueWithMaterial: "",
        valueWithoutMaterial: "",
        validityDays: "",
        paymentMethod: "",
      });
      setDate(new Date());
      setLogoFile(null);
      setPdfFile(null);
      setLogoPreviewUrl(null);
      setPdfPreviewUrl(null);

    } catch (error: any) {
      toast.error("Erro ao salvar orçamento: " + error.message);
      console.error("Erro ao salvar orçamento:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers para os botões de microfone
  const handleToggleDescriptionListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Seu navegador não suporta a API de Reconhecimento de Voz.");
      return;
    }
    if (!isDescriptionListening) {
      baseDescriptionTextRef.current = formData.description; // Captura o texto atual do campo
    }
    toggleDescriptionListening();
  };

  const handleToggleNotesListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Seu navegador não suporta a API de Reconhecimento de Voz.");
      return;
    }
    if (!isNotesListening) {
      baseNotesTextRef.current = formData.additionalNotes; // Captura o texto atual do campo
    }
    toggleNotesListening();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-black text-white p-4 flex flex-col sm:flex-row items-center justify-between shadow-md">
        <div className="flex items-center mb-4 sm:mb-0">
          {logoPreviewUrl ? (
            <img src={logoPreviewUrl} alt="Logo" className="h-12 mr-4 rounded-md object-contain" />
          ) : (
            <div className="h-12 w-12 bg-gray-700 flex items-center justify-center rounded-md mr-4">
              <span className="text-sm">Logo</span>
            </div>
          )}
          <input
            type="file"
            id="logo-upload"
            className="hidden"
            accept="image/*"
            onChange={handleLogoChange}
          />
          <Label htmlFor="logo-upload" className="cursor-pointer text-orange-500 hover:text-orange-400">
            Alterar Logo
          </Label>
        </div>
        <div className="text-sm text-center sm:text-right">
          <p>Telefone: (XX) XXXX-XXXX</p>
          <p>E-mail: contato@solucaoreformas.com</p>
          <p>CNPJ: XX.XXX.XXX/XXXX-XX</p>
          <p>Endereço: Rua Exemplo, 123 - Bairro, Cidade/CEP</p>
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

            {/* PDF Upload Section */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center mt-6"
                 onDragOver={handleDragOver}
                 onDrop={handleDrop}>
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Arraste e solte seu PDF aqui, ou</p>
              <input
                type="file"
                id="pdf-upload"
                className="hidden"
                accept="application/pdf"
                onChange={handlePdfUpload}
              />
              <Label htmlFor="pdf-upload" className="cursor-pointer text-orange-500 hover:text-orange-400 font-medium">
                Selecionar PDF
              </Label>
              {pdfFile && (
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <p className="text-sm text-gray-500 dark:text-gray-300">Arquivo selecionado: {pdfFile.name}</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        <Eye className="mr-1 h-4 w-4" /> Visualizar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>Visualizar PDF</DialogTitle>
                      </DialogHeader>
                      {pdfPreviewUrl && (
                        <iframe src={pdfPreviewUrl} className="w-full h-full border-none" title="Prévia do PDF"></iframe>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Button onClick={handleSaveAndGeneratePdf} className="px-8 py-4 text-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-lg transition-all duration-300" disabled={loading}>
            {loading ? "Salvando..." : <><Save className="mr-2 h-5 w-5" /> Salvar e Gerar PDF</>}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Budgets;