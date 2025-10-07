import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string; // The full recognized text for the current session
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  browserSupportsSpeechRecognition: boolean;
  clearTranscript: () => void;
}

const useSpeechToText = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const browserSupportsSpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript(''); // Clear transcript for new session
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Reconhecimento de voz iniciado. Comece a falar.");
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info("Reconhecimento de voz parado.");
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setTranscript('');
      toast.error("Erro no reconhecimento de voz: " + event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [browserSupportsSpeechRecognition]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    browserSupportsSpeechRecognition,
    clearTranscript,
  };
};

export default useSpeechToText;