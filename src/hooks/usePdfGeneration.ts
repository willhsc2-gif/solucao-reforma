import React, { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjs from 'pdfjs-dist';
import { format } from 'date-fns';

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

interface UsePdfGenerationResult {
  loadingPdf: boolean;
  currentPdfUrl: string | null;
  handleSaveAndGeneratePdf: () => Promise<void>;
}

export const usePdfGeneration = (
  formData: BudgetFormData,
  date: Date | undefined,
  companySettings: Partial<CompanySettings>,
  materialBudgetPdfFile: File | null,
  materialBudgetPdfFileName: string | null,
  pdfContentRef: React.RefObject<HTMLDivElement>,
  formatCurrency: (value: string | number) => string,
  resetForm: () => void // Callback to reset the form after successful save
): UsePdfGenerationResult => {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      throw error;
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  }, []);

  const generateMainPdfContent = useCallback(async () => {
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
  }, [pdfContentRef, materialBudgetPdfFile]);

  const handleSaveAndGeneratePdf = useCallback(async () => {
    setLoadingPdf(true);
    setCurrentPdfUrl(null);
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
          canvas.width = viewport.width; // Ensure width is also set for proper rendering

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
          // user_id removido, pois não há autenticação
        },
      ]);

      if (error) {
        throw error;
      }

      toast.success("Orçamento salvo e PDF gerado com sucesso!");
      setCurrentPdfUrl(uploadedPdfUrl);
      resetForm(); // Reset the form after successful save

    } catch (error: any) {
      toast.error("Erro ao salvar orçamento: " + error.message);
      console.error("Erro ao salvar orçamento:", error);
      setCurrentPdfUrl(null);
    } finally {
      setLoadingPdf(false);
    }
  }, [
    formData,
    date,
    companySettings,
    materialBudgetPdfFile,
    materialBudgetPdfFileName,
    pdfContentRef,
    uploadFile,
    generateMainPdfContent,
    resetForm,
  ]);

  return {
    loadingPdf,
    currentPdfUrl,
    handleSaveAndGeneratePdf,
  };
};