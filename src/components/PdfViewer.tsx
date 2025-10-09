import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PdfViewerProps {
  pdfUrl: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);

      if (!pdfUrl) {
        setError("Nenhuma URL de PDF fornecida.");
        setLoading(false);
        return;
      }

      try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err: any) {
        console.error("Erro ao carregar PDF:", err);
        setError("Não foi possível carregar o PDF. Verifique a URL ou o arquivo.");
        toast.error("Erro ao carregar PDF: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      setLoading(true);
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 }); // Ajuste a escala conforme necessário
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;
        }
      } catch (err: any) {
        console.error("Erro ao renderizar página do PDF:", err);
        setError("Não foi possível renderizar a página. Tente novamente.");
        toast.error("Erro ao renderizar página: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage]);

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (loading && !pdfDoc) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-lg text-gray-700 dark:text-gray-300">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        Carregando PDF...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Nenhum PDF para exibir.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full">
      <div className="relative flex-grow w-full overflow-auto flex justify-center items-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        <canvas ref={canvasRef} className="max-w-full h-auto shadow-lg rounded-md" />
      </div>
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button onClick={goToPreviousPage} disabled={currentPage <= 1 || loading} variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Página {currentPage} de {numPages}
        </span>
        <Button onClick={goToNextPage} disabled={currentPage >= numPages || loading} variant="outline" size="sm">
          Próxima <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PdfViewer;