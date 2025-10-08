import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSpeechToText from "@/hooks/use-speech-to-text";
import { toast } from 'sonner';
import { sanitizeFileName } from "@/utils/file";

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
  budgetPdfFile: File | null;
  budgetPdfFileName: string | null;
  budgetPdfDisplayUrl: string | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBudgetPdfChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveBudgetPdf: () => void;
  isDescriptionListening: boolean;
  toggleDescriptionListening: () => void;
  isNotesListening: boolean;
  toggleNotesListening: () => void;
  browserSupportsSpeechRecognition: boolean;
  clearTranscript: () => void;
  resetForm: () => void;
}

const generateBudgetNumber = () => {
  return `ORC-${uuidv4().substring(0, 8).toUpperCase()}`;
};

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
  const [budgetPdfFile, setBudgetPdfFile] = useState<File | null>(null);
  const [budgetPdfFileName, setBudgetPdfFileName] = useState<string | null>(null);
  const [budgetPdfDisplayUrl, setBudgetPdfDisplayUrl] = useState<string | null>(null);

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

  const handleBudgetPdfChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file) {
        if (file.type !== "application/pdf") {
          toast.error("Por favor, selecione um arquivo PDF.");
          setBudgetPdfFile(null);
          setBudgetPdfFileName(null);
          setBudgetPdfDisplayUrl(null);
          return;
        }
        setBudgetPdfFile(file);
        setBudgetPdfFileName(sanitizeFileName(file.name));
        setBudgetPdfDisplayUrl(URL.createObjectURL(file));
      } else {
        setBudgetPdfFile(null);
        setBudgetPdfFileName(null);
        setBudgetPdfDisplayUrl(null);
      }
    }
  }, []);

  const handleRemoveBudgetPdf = useCallback(() => {
    setBudgetPdfFile(null);
    setBudgetPdfFileName(null);
    setBudgetPdfDisplayUrl(null);
    const fileInput = document.getElementById("budget-pdf-upload") as HTMLInputElement;
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
    setBudgetPdfFile(null);
    setBudgetPdfFileName(null);
    setBudgetPdfDisplayUrl(null);
  }, []);

  return {
    formData,
    setFormData,
    date,
    setDate,
    budgetPdfFile,
    budgetPdfFileName,
    budgetPdfDisplayUrl,
    handleInputChange,
    handleBudgetPdfChange,
    handleRemoveBudgetPdf,
    isDescriptionListening,
    toggleDescriptionListening: handleToggleDescriptionListening,
    isNotesListening,
    toggleNotesListening: handleToggleNotesListening,
    browserSupportsSpeechRecognition,
    clearTranscript: clearDescriptionTranscript,
    resetForm,
  };
};