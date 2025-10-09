import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PdfViewerDialogProps {
  showPdfViewer: boolean;
  setShowPdfViewer: (show: boolean) => void;
  currentPdfUrl: string | null;
  budgetNumber: string;
  clientName: string;
  date: Date | undefined;
}

const PdfViewerDialog: React.FC<PdfViewerDialogProps> = ({
  showPdfViewer,
  setShowPdfViewer,
  currentPdfUrl,
  budgetNumber,
  clientName,
  date,
}) => {
  const handleDownloadPdf = () => {
    if (currentPdfUrl) {
      const clientNameForFileName = clientName.replace(/[^a-zA-Z0-9]/g, '_') || 'cliente';
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

  return (
    <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prévia do Orçamento {budgetNumber}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow relative">
          <PdfViewer pdfUrl={currentPdfUrl || ''} />
        </div>
        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button onClick={() => setShowPdfViewer(false)} variant="outline">Fechar</Button>
          <Button onClick={handleDownloadPdf} disabled={!currentPdfUrl}>
            <Download className="mr-2 h-4 w-4" /> Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewerDialog;