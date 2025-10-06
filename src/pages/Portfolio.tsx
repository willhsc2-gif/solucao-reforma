import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Link as LinkIcon, UserPlus, Image as ImageIcon } from "lucide-react";

const Portfolio = () => {
  const [selectedClient, setSelectedClient] = React.useState<string | undefined>(undefined);
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);

  // Dados de cliente fictícios para o dropdown
  const clients = [
    { id: "1", name: "Cliente A" },
    { id: "2", name: "Cliente B" },
    { id: "3", name: "Cliente C" },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setImageFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      const newFiles = Array.from(event.dataTransfer.files);
      setImageFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleShare = () => {
    // Lógica para gerar e compartilhar link público
    console.log("Compartilhando portfólio...");
  };

  const handleCopyLink = () => {
    // Lógica para copiar link para a área de transferência
    console.log("Copiando link...");
  };

  const handleNewContact = () => {
    // Lógica para adicionar novo cliente
    console.log("Adicionando novo contato...");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">Portfólio de Obras</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <Label htmlFor="photo-title">Título da Foto</Label>
            <Input id="photo-title" placeholder="Ex: Reforma de cozinha" />
          </div>
          <div>
            <Label htmlFor="service-description">Descrição do Serviço</Label>
            <Textarea id="service-description" placeholder="Detalhes do serviço realizado..." rows={3} />
          </div>
          <div>
            <Label htmlFor="client-link">Vincular a um Cliente (opcional)</Label>
            <Select onValueChange={setSelectedClient} value={selectedClient}>
              <SelectTrigger id="client-link">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seção de Upload de Imagens */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center mb-8"
             onDragOver={handleDragOver}
             onDrop={handleDrop}>
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">Arraste e solte suas fotos aqui, ou</p>
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
          <Label htmlFor="image-upload" className="cursor-pointer text-orange-500 hover:text-orange-400 font-medium">
            Selecionar Fotos
          </Label>
          {imageFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`Prévia ${index}`} className="w-full h-32 object-cover rounded-md shadow-sm" />
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 truncate">{imageFiles[index].name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button onClick={handleShare} className="px-6 py-3 bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-md transition-all duration-300">
            <Share2 className="mr-2 h-5 w-5" /> Compartilhar
          </Button>
          <Button onClick={handleCopyLink} variant="outline" className="px-6 py-3 border-orange-500 text-orange-500 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-600 dark:hover:bg-gray-800 rounded-lg shadow-md transition-all duration-300">
            <LinkIcon className="mr-2 h-5 w-5" /> Copiar Link
          </Button>
          <Button onClick={handleNewContact} variant="secondary" className="px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg shadow-md transition-all duration-300">
            <UserPlus className="mr-2 h-5 w-5" /> Novo Contato
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;