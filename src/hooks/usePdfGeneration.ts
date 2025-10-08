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
  resetForm: () => void, // Callback to reset the form after successful save
  setMaterialPdfPageImages: React.Dispatch<React.SetStateAction<string[]>> // Novo prop para atualizar as imagens
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

    const canvas = await html2canvas(pdfContentRef.current, {
      scale: 2, // Aumentar a escala para melhor qualidade
      useCORS: true,
      logging: false, // Desativar logs do html2canvas
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.9); // Usar JPEG para menor tamanho de arquivo

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // Largura A4 em mm
    const pageHeight = 297; // Altura A4 em mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf; // Retorna a instância jsPDF
  }, [pdfContentRef]);

  const handleSaveAndGeneratePdf = useCallback(async () => {
    setLoadingPdf(true);
    setCurrentPdfUrl(null);
    let uploadedMaterialPdfUrl: string | null = null;
    let materialPdfImages: string[] = [];

    try {
      // 1. Upload material budget PDF if exists
      if (materialBudgetPdfFile && materialBudgetPdfFileName) {
        const materialPdfPath = `material_budgets/${formData.budgetNumber}-${Date.now()}-${materialBudgetPdfFileName}`;
        uploadedMaterialPdfUrl = await uploadFile(materialBudgetPdfFile, "material_budget_pdfs", materialPdfPath);

        // 2. Pre-process material budget PDF into images
        const materialPdfData = await materialBudgetPdfFile.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: materialPdfData });
        const materialPdfDoc = await loadingTask.promise;

        for (let i = 1; i <= materialPdfDoc.numPages; i++) {
          const page = await materialPdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 }); // Ajuste a escala conforme necessário
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            await page.render(renderContext).promise;
            materialPdfImages.push(canvas.toDataURL('image/jpeg', 0.8)); // Usar JPEG para menor tamanho
          }
        }
      }

      // 3. Update state to render material PDF images in BudgetPdfContent
      setMaterialPdfPageImages(materialPdfImages);

      // Give React a moment to render the images into the DOM
      await new Promise(resolve => setTimeout(resolve, 50));

      // 4. Generate the main PDF content (which now includes material PDF images)
      const pdf = await generateMainPdfContent();

      // 5. Convert the final jsPDF instance to a Blob and upload
      const finalPdfBlob = pdf.output('blob');
      const finalPdfFile = new File([finalPdfBlob], `orcamento-${formData.budgetNumber}.pdf`, { type: 'application/pdf' });

      const pdfPath = `budgets/${formData.budgetNumber}-${Date.now()}.pdf`;
      const uploadedPdfUrl = await uploadFile(finalPdfFile, "budget_pdfs", pdfPath);

      // 6. Insert budget data into Supabase
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
          // user_id: null, // Remover user_id
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
      setMaterialPdfPageImages([]); // Clean up images from hidden content
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
    setMaterialPdfPageImages,
  ]);

  return {
    loadingPdf,
    currentPdfUrl,
    handleSaveAndGeneratePdf,
  };
};