import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Mic, UploadCloud, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Import the new modular components and hooks
import { useBudgetForm } from "@/hooks/useBudgetForm";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePdfGeneration } from "@/hooks/usePdfGeneration";
import BudgetPdfContent from "@/components/BudgetPdfContent";
import PdfViewerDialog from "@/components/PdfViewerDialog";

// Import the worker for pdfjs-dist
import * as pdfjs from 'pdfjs-dist';
// Configura o worker do pdf.js para carregar o script localmente
// O arquivo pdf.worker.min.js será copiado para public/workers/ durante o build.
pdfjs.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js';

const Budgets = () => {
  const {
    formData,
    date,
    setDate,
    materialBudgetPdfFile,
    materialBudgetPdfFileName,
    materialBudgetPdfDisplayUrl,
    handleInputChange,
    handleMaterialBudgetPdfChange,
    handleRemoveMaterialBudgetPdf,
    isDescriptionListening,
    toggleDescriptionListening,
    isNotesListening,
    toggleNotesListening,
    browserSupportsSpeechRecognition,
    resetForm,
  } = useBudgetForm();

  const { companySettings, loadingCompanySettings, errorCompanySettings } = useCompanySettings();

  const pdfContentRef = React.useRef<HTMLDivElement>(null);
  const [showPdfViewer, setShowPdfViewer] = React.useState(false);
  const [materialPdfPageImages, setMaterialPdfPageImages] = React.useState<string[]>([]); // Novo estado

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

  const { loadingPdf, currentPdfUrl, handleSaveAndGeneratePdf } = usePdfGeneration(
    formData,
    date,
    companySettings,
    materialBudgetPdfFile,
    materialBudgetPdfFileName,
    pdfContentRef,
    formatCurrency,
    resetForm,
    setMaterialPdfPageImages // Passar o setter do novo estado
  );

  const handleGeneratePdfClick = async () => {
    setShowPdfViewer(true); // Open the dialog immediately
    await handleSaveAndGeneratePdf(); // Start PDF generation and saving
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="bg-black text-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-md">
        <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-0">
          {companySettings.logo_url ? (
            <img src={companySettings.logo_url} alt="Logo" className="h-12 mr-4 rounded-md object-contain" />
          ) : (
            <div className="h-12 w-12 bg-gray-700 flex items-center justify-center rounded-md mr-4">
              <span className="text-sm">Logo</span>
            </div>
          )}
          <h1 className="text-xl font-bold hidden sm:block">{companySettings.company_name || "Sua Empresa"}</h1>
        </div>
        <div className="text-sm text-center sm:text-right">
          <p className="font-bold sm:hidden">{companySettings.company_name || "Sua Empresa"}</p>
          <p>Telefone: {companySettings.phone || "(XX) XXXX-XXXX"}</p>
          <p>E-mail: {companySettings.email || "contato@suaempresa.com"}</p>
          <p>CNPJ: {companySettings.cnpj || "XX.XXX.XXX/XXXX-XX"}</p>
          <p>Endereço: {companySettings.address || "Rua Exemplo, 123 - Bairro, Cidade/CEP"}</p>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6">
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
                  onClick={toggleDescriptionListening}
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
                  onClick={toggleNotesListening}
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
          <Button onClick={handleGeneratePdfClick} className="px-8 py-4 text-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-lg transition-all duration-300" disabled={loadingPdf}>
            {loadingPdf ? "Salvando..." : <><Save className="mr-2 h-5 w-5" /> Salvar e Gerar PDF</>}
          </Button>
        </div>
      </main>

      {/* Hidden content for PDF generation */}
      <BudgetPdfContent
        formData={formData}
        date={date}
        companySettings={companySettings}
        materialBudgetPdfFile={materialBudgetPdfFile}
        materialBudgetPdfFileName={materialBudgetPdfFileName}
        materialPdfPageImages={materialPdfPageImages} // Passar o novo estado
        formatCurrency={formatCurrency}
        pdfContentRef={pdfContentRef}
      />

      {/* PDF Viewer Dialog */}
      <PdfViewerDialog
        showPdfViewer={showPdfViewer}
        setShowPdfViewer={setShowPdfViewer}
        currentPdfUrl={currentPdfUrl}
        budgetNumber={formData.budgetNumber}
        clientName={formData.clientName}
        date={date}
      />
    </div>
  );
};

export default Budgets;