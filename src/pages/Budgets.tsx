import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, UploadCloud, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Budgets = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setLogoFile(event.target.files[0]);
    }
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPdfFile(event.target.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setPdfFile(event.dataTransfer.files[0]);
    }
  };

  const handleSaveAndGeneratePdf = () => {
    // Logic to save budget data and generate PDF
    console.log("Salvando orçamento e gerando PDF...");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-black text-white p-4 flex flex-col sm:flex-row items-center justify-between shadow-md">
        <div className="flex items-center mb-4 sm:mb-0">
          {logoFile ? (
            <img src={URL.createObjectURL(logoFile)} alt="Logo" className="h-12 mr-4 rounded-md" />
          ) : (
            <div className="h-12 w-12 bg-gray-700 flex items-center justify-center rounded-md mr-4">
              <span className="text-sm">Logo</span>
            </div>
          )}
          <input
            type="file"
            id="logo-upload"
            className="hidden"
            accept="image/*"
            onChange={handleLogoChange}
          />
          <Label htmlFor="logo-upload" className="cursor-pointer text-orange-500 hover:text-orange-400">
            Alterar Logo
          </Label>
        </div>
        <div className="text-sm text-center sm:text-right">
          <p>Telefone: (XX) XXXX-XXXX</p>
          <p>E-mail: contato@solucaoreformas.com</p>
          <p>CNPJ: XX.XXX.XXX/XXXX-XX</p>
          <p>Endereço: Rua Exemplo, 123 - Bairro, Cidade/CEP</p>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">Criar Orçamento</h1>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="budget-number">Número do Orçamento</Label>
              <Input id="budget-number" placeholder="Ex: ORC-001" />
            </div>
            <div>
              <Label htmlFor="client-name">Nome do Cliente</Label>
              <Input id="client-name" placeholder="Nome Completo do Cliente" />
            </div>
            <div>
              <Label htmlFor="services-description">Descrição dos Serviços</Label>
              <Textarea id="services-description" placeholder="Detalhes dos serviços a serem realizados..." rows={5} />
            </div>
            <div>
              <Label htmlFor="additional-notes">Observações Adicionais</Label>
              <Textarea id="additional-notes" placeholder="Qualquer observação relevante..." rows={3} />
            </div>
            <div>
              <Label htmlFor="duration">Duração da Obra</Label>
              <Input id="duration" placeholder="Ex: 30 dias úteis" />
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
                    {date ? format(date, "PPP") : <span>Selecione uma data</span>}
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
              <Input id="value-with-material" type="number" placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="value-without-material">Valor sem Material (R$)</Label>
              <Input id="value-without-material" type="number" placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="validity">Validade (dias)</Label>
              <Input id="validity" type="number" placeholder="Ex: 30" />
            </div>
            <div>
              <Label htmlFor="payment-method">Forma de Pagamento</Label>
              <Input id="payment-method" placeholder="Ex: 50% no início, 50% na entrega" />
            </div>

            {/* PDF Upload Section */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center mt-6"
                 onDragOver={handleDragOver}
                 onDrop={handleDrop}>
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Arraste e solte seu PDF aqui, ou</p>
              <input
                type="file"
                id="pdf-upload"
                className="hidden"
                accept="application/pdf"
                onChange={handlePdfUpload}
              />
              <Label htmlFor="pdf-upload" className="cursor-pointer text-orange-500 hover:text-orange-400 font-medium">
                Selecionar PDF
              </Label>
              {pdfFile && <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Arquivo selecionado: {pdfFile.name}</p>}
            </div>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Button onClick={handleSaveAndGeneratePdf} className="px-8 py-4 text-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-lg transition-all duration-300">
            <Save className="mr-2 h-5 w-5" /> Salvar e Gerar PDF
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Budgets;