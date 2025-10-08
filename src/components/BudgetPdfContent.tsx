import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UploadCloud } from 'lucide-react';

interface BudgetFormData {
  budgetNumber: string;
  clientName: string;
  description: string;
  additionalNotes: string;
  duration: string;
  valueWithMaterial: string;
  valueWithoutMaterial: string;
  validityDays: string;
  paymentMethod: string;
}

interface CompanySettings {
  id: string;
  company_name: string;
  phone: string;
  email: string;
  cnpj: string;
  address: string;
  logo_url: string;
}

interface BudgetPdfContentProps {
  formData: BudgetFormData;
  date: Date | undefined;
  companySettings: Partial<CompanySettings>;
  materialBudgetPdfFile: File | null;
  materialBudgetPdfFileName: string | null;
  materialPdfPageImages: string[]; // Novo prop para as imagens do PDF de materiais
  formatCurrency: (value: string | number) => string;
  pdfContentRef: React.RefObject<HTMLDivElement>;
}

const BudgetPdfContent: React.FC<BudgetPdfContentProps> = ({
  formData,
  date,
  companySettings,
  materialBudgetPdfFile,
  materialBudgetPdfFileName,
  materialPdfPageImages, // Usar o novo prop
  formatCurrency,
  pdfContentRef,
}) => {
  return (
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

      {/* Section for dynamically injected material budget PDF title and images */}
      {materialPdfPageImages.length > 0 && (
        <div id="material-pdf-section" className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Anexo de Materiais ({materialBudgetPdfFileName})</h3>
          {materialPdfPageImages.map((imageDataUrl, index) => (
            <div key={`material-pdf-page-${index}`} className="mb-4 border border-gray-200 p-2 rounded-md">
              <p className="text-sm text-gray-600 mb-2">Página {index + 1}</p>
              <img src={imageDataUrl} alt={`Página ${index + 1} do orçamento de materiais`} className="w-full h-auto object-contain" />
            </div>
          ))}
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Observações Adicionais</h3>
        <p className="whitespace-pre-wrap">{formData.additionalNotes || "N/A"}</p>
      </div>

      <div className="text-center mt-12 pt-4 border-t">
        <p className="text-sm text-gray-600">Agradecemos a preferência!</p>
      </div>
    </div>
  );
};

export default BudgetPdfContent;