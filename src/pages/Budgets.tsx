import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Eye, Mic, Share2, Download, UploadCloud, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';
import useSpeechToText from "@/hooks/use-speech-to-text";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjs from 'pdfjs-dist';

// Configura o worker do pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [materialBudgetPdfFile, setMaterialBudgetPdfFile] = React.useState<File | null>(null);
  const [materialBudgetPdfFileName, setMaterialBudgetPdfFileName] = React.useState<string | null>(null);
  const [materialBudgetPdfDisplayUrl, setMaterialBudgetPdfDisplayUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPdfViewer, setShowPdfViewer] = React.useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = React.useState<string | null>(null);
  const pdfContentRef = React.useRef<HTMLDivElement>(null);

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

  const sanitizeFileName = (fileName: string) => {
    let sanitized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    sanitized = sanitized.replace(/\s+/g, "-");
    sanitized = sanitized.replace(/[^a-zA-Z0-9-._]/g, "");
    sanitized = sanitized.replace(/--+/g, "-");
    sanitized = sanitized.replace(/^-+|-+$/g, "");
    return sanitized;
  };

  const handleMaterialBudgetPdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file) {
        if (file.type !== "application/pdf") {
          toast.error("Por favor, selecione um arquivo PDF.");
          setMaterialBudgetPdfFile(null);
          setMaterialBudgetPdfFileName(null);
          setMaterialBudgetPdfDisplayUrl(null);
          return;
        }
        setMaterialBudgetPdfFile(file);
        setMaterialBudgetPdfFileName(sanitizeFileName(file.name));
        setMaterialBudgetPdfDisplayUrl(URL.createObjectURL(file));
      } else {
        setMaterialBudgetPdfFile(null);
        setMaterialBudgetPdfFileName(null);
        setMaterialBudgetPdfDisplayUrl(null);
      }
    }
  };

  const handleRemoveMaterialBudgetPdf = () => {
    setMaterialBudgetPdfFile(null);
    setMaterialBudgetPdfFileName(null);
    setMaterialBudgetPdfDisplayUrl(null);
    const fileInput = document.getElementById("material-budget-pdf-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
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

  const formatCurrency = (value: string | number) => {
    const num = parseFloat(String(value));
    if (isNaN(num)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const generateMainPdfContent = async () => {
    if (!pdfContentRef.current) {
      throw new Error("Erro: Conteúdo do PDF não encontrado.");
    }

    // Temporarily remove the material-pdf-section content for html2canvas,
    // as we will add PDF pages directly later.
    const materialPdfSection = pdfContentRef.current.querySelector('#material-pdf-section');
    let originalMaterialPdfSectionContent = '';
    if (materialPdfSection) {
      originalMaterialPdfSectionContent = materialPdfSection.innerHTML;
      materialPdfSection.innerHTML = materialBudgetPdfFile ? '<h3 class="text-xl font-semibold mb-2">Anexo de Materiais</h3>' : '';
    }

    const canvas = await html2canvas(pdfContentRef.current, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');

    // Restore original content if needed (though it's hidden, good practice)
    if (materialPdfSection) {
      materialPdfSection.innerHTML = originalMaterialPdfSectionContent;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
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

    return pdf; // Return the jsPDF instance
  };

  const handleSaveAndGeneratePdf = async () => {
    setLoading(true);
    setCurrentPdfUrl(null);
    setShowPdfViewer(true);
    try {
      let uploadedMaterialPdfUrl: string | null = null;
      if (materialBudgetPdfFile && materialBudgetPdfFileName) {
        const materialPdfPath = `material_budgets/${formData.budgetNumber}-${Date.now()}-${materialBudgetPdfFileName}`;
        uploadedMaterialPdfUrl = await uploadFile(materialBudgetPdfFile, "material_budget_pdfs", materialPdfPath);
      }

      const pdf = await generateMainPdfContent(); // Get the jsPDF instance with main content

      if (materialBudgetPdfFile) {
        // Load and embed material budget PDF pages
        const materialPdfData = await materialBudgetPdfFile.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: materialPdfData });
        const materialPdfDoc = await loadingTask.promise;

        for (let i = 1; i <= materialPdfDoc.numPages; i++) {
          const page = await materialPdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale as needed
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport: viewport }).promise;

          const imgData = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller size
          const imgWidth = 210; // A4 width in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addPage(); // Add a new page for each material PDF page
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        }
      }

      const finalPdfBlob = pdf.output('blob');
      const finalPdfFile = new File([finalPdfBlob], `orcamento-${formData.budgetNumber}.pdf`, { type: 'application/pdf' });

      const pdfPath = `budgets/${formData.budgetNumber}-${Date.now()}.pdf`;
      const uploadedPdfUrl = await uploadFile(finalPdfFile, "budget_pdfs", pdfPath);

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
          material_budget_pdf_url: uploadedMaterialPdfUrl,
          material_budget_pdf_name: materialBudgetPdfFileName,
        },
      ]);

      if (error) {
        throw error;
      }

      toast.success("Orçamento salvo e PDF gerado com sucesso!");
      setCurrentPdfUrl(uploadedPdfUrl);

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
      setMaterialBudgetPdfFile(null);
      setMaterialBudgetPdfFileName(null);
      setMaterialBudgetPdfDisplayUrl(null);

    } catch (error: any) {
      toast.error("Erro ao salvar orçamento: " + error.message);
      console.error("Erro ao salvar orçamento:", error);
      setCurrentPdfUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (currentPdfUrl) {
      const clientNameForFileName = formData.clientName.replace(/[^a-zA-Z0-9]/g, '_') || 'cliente';
      const dateForFileName = date ? format(date, "yyyyMMdd") : "data_desconhecida";
      const fileName = `Orcamento_${clientNameForFileName}_${dateForFileName}.pdf`;

      const link = document.createElement('a');
      link.href = currentPdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download do PDF iniciado!");
    } else {
      toast.error("Nenhum PDF disponível para download.");
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
            <div>
              <Label htmlFor="material-budget-pdf-upload">Orçamento de Materiais (PDF da Loja)</Label>
              <div className="flex items-center space-x-2 mt-2">
                {materialBudgetPdfDisplayUrl ? (
                  <>
                    <a href={materialBudgetPdfDisplayUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:underline">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm truncate max-w-[150px]">{materialBudgetPdfFileName}</span>
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveMaterialBudgetPdf}
                      title="Remover PDF"
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                ) : (
                  <Input
                    id="material-budget-pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleMaterialBudgetPdfChange}
                    className="flex-grow"
                  />
                )}
              </div>
              {!materialBudgetPdfDisplayUrl && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Opcional: Anexe um PDF de orçamento de materiais da loja.
                </p>
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

      {/* Hidden content for PDF generation */}
      <div ref={pdfContentRef} className="p-8 bg-white text-gray-900 w-[210mm] min-h-[297mm] mx-auto" style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center">
            {companySettings.logo_url ? (
              <img src={companySettings.logo_url} alt="Logo da Empresa" className="h-20 mr-4 object-contain" />
            ) : (
              <div className="h-20 w-20 bg-gray-200 flex items-center justify-center rounded-md mr-4 text-gray-500">
                <UploadCloud className="h-10 w-10" />
              </div>
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
              <p><strong>Valor com Material:</strong> {formatCurrency(formData.valueWithMaterial || "0")}</p>
              <p><strong>Valor sem Material:</strong> {formatCurrency(formData.valueWithoutMaterial || "0")}</p>
            </div>
          </div>
        </div>

        {/* Section for dynamically injected material budget PDF title */}
        <div id="material-pdf-section" className="mb-8">
          {materialBudgetPdfFile && (
            <h3 className="text-xl font-semibold mb-2">Anexo de Materiais</h3>
          )}
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Observações Adicionais</h3>
          <p className="whitespace-pre-wrap">{formData.additionalNotes || "N/A"}</p>
        </div>

        <div className="text-center mt-12 pt-4 border-t">
          <p className="text-sm text-gray-600">Agradecemos a preferência!</p>
        </div>
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Prévia do Orçamento {formData.budgetNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow relative">
            {loading && !currentPdfUrl ? (
              <div className="flex items-center justify-center h-full text-lg text-gray-700 dark:text-gray-300">
                Gerando PDF, aguarde...
              </div>
            ) : currentPdfUrl ? (
              <iframe src={currentPdfUrl} className="w-full h-full border-none rounded-md" title="Prévia do Orçamento"></iframe>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Não foi possível carregar o PDF.
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => setShowPdfViewer(false)} variant="outline">Fechar</Button>
            <Button onClick={handleDownloadPdf} disabled={!currentPdfUrl}>
              <Download className="mr-2 h-4 w-4" /> Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budgets;