import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Link as LinkIcon, UserPlus, Image as ImageIcon, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  name: string;
  phone?: string;
}

interface ImageFileWithPreview extends File {
  preview: string;
  description: string;
  id: string; // Unique ID for managing in state
}

const Portfolio = () => {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = React.useState<string | undefined>(undefined);
  const [portfolioTitle, setPortfolioTitle] = React.useState("");
  const [portfolioDescription, setPortfolioDescription] = React.useState("");
  const [clientReferenceContact, setClientReferenceContact] = React.useState("");
  const [imageFilesWithPreviews, setImageFilesWithPreviews] = React.useState<ImageFileWithPreview[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [publicShareLink, setPublicShareLink] = React.useState<string | null>(null);

  // State for new client dialog
  const [newClientName, setNewClientName] = React.useState("");
  const [newClientPhone, setNewClientPhone] = React.useState("");
  const [newClientEmail, setNewClientEmail] = React.useState("");
  const [newClientAddress, setNewClientAddress] = React.useState("");
  const [newClientCityZip, setNewClientCityZip] = React.useState("");
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = React.useState(false);

  React.useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("id, name, phone");
    if (error) {
      toast.error("Erro ao carregar clientes: " + error.message);
    } else {
      setClients(data);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => Object.assign(file, {
        preview: URL.createObjectURL(file),
        description: "", // Initialize with empty description
        id: uuidv4(), // Assign a unique ID
      })) as ImageFileWithPreview[];

      if (imageFilesWithPreviews.length + newFiles.length > 20) {
        toast.error("Você pode adicionar no máximo 20 imagens por item de portfólio.");
        return;
      }
      setImageFilesWithPreviews((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImageFilesWithPreviews((prev) => prev.filter(file => file.id !== id));
  };

  const handleImageDescriptionChange = (id: string, description: string) => {
    setImageFilesWithPreviews((prev) =>
      prev.map((file) => (file.id === id ? { ...file, description } : file))
    );
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      const newFiles = Array.from(event.dataTransfer.files).map(file => Object.assign(file, {
        preview: URL.createObjectURL(file),
        description: "",
        id: uuidv4(),
      })) as ImageFileWithPreview[];

      if (imageFilesWithPreviews.length + newFiles.length > 20) {
        toast.error("Você pode adicionar no máximo 20 imagens por item de portfólio.");
        return;
      }
      setImageFilesWithPreviews((prev) => [...prev, ...newFiles]);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      throw error;
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const handleSavePortfolioItem = async () => {
    setLoading(true);
    try {
      if (!portfolioTitle) {
        toast.error("O título do item de portfólio é obrigatório.");
        return;
      }
      if (imageFilesWithPreviews.length === 0) {
        toast.error("Adicione pelo menos uma imagem ao portfólio.");
        return;
      }

      // 1. Insert portfolio item
      const { data: portfolioItemData, error: portfolioItemError } = await supabase
        .from("portfolio_items")
        .insert([
          {
            client_id: selectedClient,
            title: portfolioTitle,
            description: portfolioDescription,
            client_reference_contact: clientReferenceContact,
            user_id: null, // Definir como null já que não há usuário logado
          },
        ])
        .select()
        .single();

      if (portfolioItemError) {
        throw portfolioItemError;
      }

      const portfolioItemId = portfolioItemData.id;
      const publicShareId = portfolioItemData.public_share_id;

      // 2. Upload images and insert into portfolio_images
      for (const [index, imageFile] of imageFilesWithPreviews.entries()) {
        const imageUrl = await uploadFile(imageFile, "portfolio_images", `${portfolioItemId}/${Date.now()}-${imageFile.name}`);
        const { error: imageError } = await supabase.from("portfolio_images").insert([
          {
            portfolio_item_id: portfolioItemId,
            image_url: imageUrl,
            description: imageFile.description,
            order_index: index,
          },
        ]);
        if (imageError) {
          throw imageError;
        }
      }

      const generatedLink = `${window.location.origin}/portfolio-view/${publicShareId}`;
      setPublicShareLink(generatedLink);
      toast.success("Item de portfólio salvo com sucesso!");

      // Reset form
      setPortfolioTitle("");
      setPortfolioDescription("");
      setClientReferenceContact("");
      setSelectedClient(undefined);
      setImageFilesWithPreviews([]);

    } catch (error: any) {
      toast.error("Erro ao salvar item de portfólio: " + error.message);
      console.error("Erro ao salvar item de portfólio:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (publicShareLink) {
      navigator.clipboard.writeText(publicShareLink);
      toast.success("Link copiado para a área de transferência!");
    } else {
      toast.error("Nenhum link para copiar. Salve o item de portfólio primeiro.");
    }
  };

  const handleAddClient = async () => {
    setLoading(true);
    try {
      if (!newClientName) {
        toast.error("O nome do cliente é obrigatório.");
        return;
      }
      const { data, error } = await supabase.from("clients").insert([
        {
          name: newClientName,
          phone: newClientPhone,
          email: newClientEmail,
          address: newClientAddress,
          city_zip: newClientCityZip,
          user_id: null, // Definir como null já que não há usuário logado
        },
      ]).select().single();

      if (error) {
        throw error;
      }

      toast.success("Cliente adicionado com sucesso!");
      setClients((prev) => [...prev, data]);
      setSelectedClient(data.id); // Select the newly added client
      setIsNewClientDialogOpen(false);
      setNewClientName("");
      setNewClientPhone("");
      setNewClientEmail("");
      setNewClientAddress("");
      setNewClientCityZip("");
    } catch (error: any) {
      toast.error("Erro ao adicionar cliente: " + error.message);
      console.error("Erro ao adicionar cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">Gerenciar Portfólio de Obras</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <Label htmlFor="portfolio-title">Título do Item de Portfólio</Label>
            <Input id="portfolio-title" placeholder="Ex: Reforma de cozinha" value={portfolioTitle} onChange={(e) => setPortfolioTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="portfolio-description">Descrição Geral do Serviço</Label>
            <Textarea id="portfolio-description" placeholder="Detalhes gerais do serviço realizado..." rows={3} value={portfolioDescription} onChange={(e) => setPortfolioDescription(e.target.value)} />
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
          <div>
            <Label htmlFor="client-reference-contact">Contato de Referência do Cliente (opcional)</Label>
            <Input id="client-reference-contact" placeholder="Ex: (XX) XXXX-XXXX" value={clientReferenceContact} onChange={(e) => setClientReferenceContact(e.target.value)} />
          </div>
        </div>

        {/* Seção de Upload de Imagens */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center mb-8"
             onDragOver={handleDragOver}
             onDrop={handleDrop}>
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">Arraste e solte suas fotos aqui (máx. 20), ou</p>
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
          {imageFilesWithPreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {imageFilesWithPreviews.map((file) => (
                <div key={file.id} className="relative group">
                  <img src={file.preview} alt={file.name} className="w-full h-32 object-cover rounded-md shadow-sm" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(file.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Descrição da foto"
                    className="mt-1 text-sm"
                    value={file.description}
                    onChange={(e) => handleImageDescriptionChange(file.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button onClick={handleSavePortfolioItem} className="px-6 py-3 bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-md transition-all duration-300" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Item de Portfólio"}
          </Button>
          {publicShareLink && (
            <Button onClick={handleCopyLink} variant="outline" className="px-6 py-3 border-orange-500 text-orange-500 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-600 dark:hover:bg-gray-800 rounded-lg shadow-md transition-all duration-300">
              <LinkIcon className="mr-2 h-5 w-5" /> Copiar Link Público
            </Button>
          )}
          <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg shadow-md transition-all duration-300">
                <UserPlus className="mr-2 h-5 w-5" /> Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newClientName" className="text-right">Nome</Label>
                  <Input id="newClientName" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newClientPhone" className="text-right">Telefone</Label>
                  <Input id="newClientPhone" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newClientEmail" className="text-right">Email</Label>
                  <Input id="newClientEmail" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newClientAddress" className="text-right">Endereço</Label>
                  <Input id="newClientAddress" value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newClientCityZip" className="text-right">Cidade/CEP</Label>
                  <Input id="newClientCityZip" value={newClientCityZip} onChange={(e) => setNewClientCityZip(e.target.value)} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddClient} disabled={loading}>
                  {loading ? "Adicionando..." : "Adicionar Cliente"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;