import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSpeechToText from "@/hooks/use-speech-to-text";
import { toast } from 'sonner';
import { sanitizeFileName } from "@/utils/file"; // Importar a função de sanitização

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

interface UseBudgetFormResult {
  formData: BudgetFormData;
  setFormData: React.Dispatch<React.SetStateAction<BudgetFormData>>;
  date: Date | undefined;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  materialBudgetPdfFile: File | null;
  materialBudgetPdfFileName: string | null;
  materialBudgetPdfDisplayUrl: string | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleMaterialBudgetPdfChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveMaterialBudgetPdf: () => void;
  isDescriptionListening: boolean;
  toggleDescriptionListening: () => void;
  isNotesListening: boolean;
  toggleNotesListening: () => void;
  browserSupportsSpeechRecognition: boolean;
  resetForm: () => void;
}

const generateBudgetNumber = () => {
  return `ORC-${uuidv4().substring(0, 8).toUpperCase()}`;
};

// A função sanitizeFileName foi movida para src/utils/file.ts e importada.
// A versão local foi removida para evitar duplicação e garantir consistência.

export const useBudgetForm = (): UseBudgetFormResult => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState<BudgetFormData>({
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
  const [materialBudgetPdfFile, setMaterialBudgetPdfFile] = useState<File | null>(null);
  const [materialBudgetPdfFileName, setMaterialBudgetPdfFileName] = useState<string | null>(null);
  const [materialBudgetPdfDisplayUrl, setMaterialBudgetPdfDisplayUrl] = useState<string | null>(null);

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

  const baseDescriptionTextRef = useRef('');
  const baseNotesTextRef = useRef('');

  useEffect(() => {
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

  useEffect(() => {
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id.replace(/-/g, "")]: value }));
  }, []);

  const handleMaterialBudgetPdfChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const handleRemoveMaterialBudgetPdf = useCallback(() => {
    setMaterialBudgetPdfFile(null);
    setMaterialBudgetPdfFileName(null);
    setMaterialBudgetPdfDisplayUrl(null);
    const fileInput = document.getElementById("material-budget-pdf-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }, []);

  const handleToggleDescriptionListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Seu navegador não suporta a API de Reconhecimento de Voz.");
      return;
    }
    if (!isDescriptionListening) {
      baseDescriptionTextRef.current = formData.description;
    }
    toggleDescriptionListening();
  }, [browserSupportsSpeechRecognition, isDescriptionListening, formData.description, toggleDescriptionListening]);

  const handleToggleNotesListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Seu navegador não suporta a API de Reconhecimento de Voz.");
      return;
    }
    if (!isNotesListening) {
      baseNotesTextRef.current = formData.additionalNotes;
    }
    toggleNotesListening();
  }, [browserSupportsSpeechRecognition, isNotesListening, formData.additionalNotes, toggleNotesListening]);

  const resetForm = useCallback(() => {
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
  }, []);

  return {
    formData,
    setFormData,
    date,
    setDate,
    materialBudgetPdfFile,
    materialBudgetPdfFileName,
    materialBudgetPdfDisplayUrl,
    handleInputChange,
    handleMaterialBudgetPdfChange,
    handleRemoveMaterialBudgetPdf,
    isDescriptionListening,
    toggleDescriptionListening: handleToggleDescriptionListening,
    isNotesListening,
    toggleNotesListening: handleToggleNotesListening,
    browserSupportsSpeechRecognition,
    resetForm,
  };
};