import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Link as LinkIcon, UserPlus, Image as ImageIcon, XCircle, Users, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"; // Adicionado DialogFooter
import { sanitizeFileName } from "@/utils/file"; // Importar a função de sanitização

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city_zip?: string;
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
  const [imageFilesWithPreviews, setImageFilesWithPreviews] = React.useState<ImageFileWithPreview[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [publicShareLink, setPublicShareLink] = React.useState<string | null>(null);

  // State for client form dialog (add/edit)
  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = React.useState(false);
  const [isNewClientMode, setIsNewClientMode] = React.useState(true); // true for add, false for edit
  const [clientForm, setClientForm] = React.useState<Partial<Client>>({});
  const [isManageClientsDialogOpen, setIsManageClientsDialogOpen] = React.useState(false);

  React.useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("id, name, phone, email, address, city_zip");
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
        toast.error("O título da foto é obrigatório.");
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
        const sanitizedImageFileName = sanitizeFileName(imageFile.name); // Sanitize the filename
        const imageUrl = await uploadFile(imageFile, "portfolio_images", `${portfolioItemId}/${Date.now()}-${sanitizedImageFileName}`);
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

  const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setClientForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    setClientForm((prev) => ({ ...prev, city_zip: e.target.value })); // Update city_zip with raw CEP input

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast.error("CEP não encontrado.");
          setClientForm((prev) => ({ ...prev, address: "", city_zip: e.target.value }));
          return;
        }

        setClientForm((prev) => ({
          ...prev,
          address: `${data.logradouro}, ${data.bairro}`,
          city_zip: `${data.localidade} - ${data.uf} (${cep})`, // Format as "City - State (CEP)"
        }));
        toast.success("Endereço preenchido automaticamente!");
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast.error("Erro ao buscar CEP. Verifique a conexão ou o CEP digitado.");
        setClientForm((prev) => ({ ...prev, address: "", city_zip: e.target.value }));
      }
    }
  };

  const handleSaveClient = async () => {
    setLoading(true);
    try {
      if (!clientForm.name) {
        toast.error("O nome do cliente é obrigatório.");
        return;
      }

      if (isNewClientMode) {
        const { data, error } = await supabase.from("clients").insert([
          {
            name: clientForm.name,
            phone: clientForm.phone,
            email: clientForm.email,
            address: clientForm.address,
            city_zip: clientForm.city_zip,
            user_id: null, // Definir como null já que não há usuário logado
          },
        ]).select().single();

        if (error) {
          throw error;
        }
        toast.success("Cliente adicionado com sucesso!");
        setClients((prev) => [...prev, data]);
        setSelectedClient(data.id); // Select the newly added client
      } else {
        if (!clientForm.id) {
          toast.error("ID do cliente não encontrado para atualização.");
          return;
        }
        const { data, error } = await supabase.from("clients").update({
          name: clientForm.name,
          phone: clientForm.phone,
          email: clientForm.email,
          address: clientForm.address,
          city_zip: clientForm.city_zip,
        }).eq("id", clientForm.id).select().single();

        if (error) {
          throw error;
        }
        toast.success("Cliente atualizado com sucesso!");
        setClients((prev) => prev.map(c => c.id === data.id ? data : c));
        setSelectedClient(data.id); // Keep selected if it was the updated one
      }

      setIsClientFormDialogOpen(false);
      setClientForm({}); // Clear form
    } catch (error: any) {
      toast.error("Erro ao salvar cliente: " + error.message);
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("clients").delete().eq("id", clientId);
      if (error) {
        throw error;
      }
      toast.success("Cliente excluído com sucesso!");
      fetchClients(); // Refresh the client list
      if (selectedClient === clientId) {
        setSelectedClient(undefined); // Deselect if the deleted client was selected
      }
    } catch (error: any) {
      toast.error("Erro ao excluir cliente: " + error.message);
      console.error("Erro ao excluir cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddClientDialog = () => {
    setClientForm({});
    setIsNewClientMode(true);
    setIsClientFormDialogOpen(true);
  };

  const openEditClientDialog = (client: Client) => {
    setClientForm(client);
    setIsNewClientMode(false);
    setIsClientFormDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Top Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 mb-8">
          {publicShareLink && ( // Only show share button if a link exists
            <Button onClick={handleCopyLink} variant="outline" className="bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700">
              <Share2 className="mr-2 h-4 w-4" /> Compartilhar Link
            </Button>
          )}

          <Button variant="outline" onClick={openAddClientDialog}>
            <UserPlus className="mr-2 h-4 w-4" /> Novo Contato
          </Button>

          <Dialog open={isManageClientsDialogOpen} onOpenChange={setIsManageClientsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" /> Gerenciar Clientes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerenciar Clientes</DialogTitle>
              </DialogHeader>
              <div className="max-h-[400px] overflow-y-auto">
                {clients.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400">Nenhum cliente cadastrado.</p>
                ) : (
                  <ul className="space-y-2">
                    {clients.map((client) => (
                      <li key={client.id} className="flex flex-wrap items-center justify-between p-2 border rounded-md dark:border-gray-700">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{client.phone}</p>}
                        </div>
                        <div className="flex space-x-2 mt-2 sm:mt-0">
                          <Button variant="outline" size="sm" onClick={() => openEditClientDialog(client)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente <span className="font-bold">{client.name}</span> e qualquer portfólio ou orçamento vinculado a ele.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteClient(client.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsManageClientsDialogOpen(false)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Client Form Dialog (Add/Edit) */}
        <Dialog open={isClientFormDialogOpen} onOpenChange={setIsClientFormDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isNewClientMode ? "Adicionar Novo Cliente" : "Editar Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" value={clientForm.name || ""} onChange={handleClientFormChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Telefone</Label>
                <Input id="phone" value={clientForm.phone || ""} onChange={handleClientFormChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={clientForm.email || ""} onChange={handleClientFormChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city_zip" className="text-right">CEP</Label>
                <Input id="city_zip" value={clientForm.city_zip || ""} onChange={handleCepChange} placeholder="Digite o CEP para preencher o endereço" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Endereço</Label>
                <Input id="address" value={clientForm.address || ""} onChange={handleClientFormChange} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveClient} disabled={loading}>
                {loading ? (isNewClientMode ? "Adicionando..." : "Salvando...") : (isNewClientMode ? "Adicionar Cliente" : "Salvar Alterações")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">Serviços Realizados</h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">Portfólio de Obras</p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Adicione fotos e vincule contatos de clientes como referência.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div>
            <Label htmlFor="portfolio-title">Título da Foto</Label>
            <Input id="portfolio-title" placeholder="Ex: Reforma de cozinha" value={portfolioTitle} onChange={(e) => setPortfolioTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="portfolio-description">Descrição do Serviço</Label>
            <Textarea id="portfolio-description" placeholder="Detalhes sobre o serviço realizado..." rows={3} value={portfolioDescription} onChange={(e) => setPortfolioDescription(e.target.value)} />
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

        {/* Upload de Fotos do Serviço Section */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center mb-8"
             onDragOver={handleDragOver}
             onDrop={handleDrop}>
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">Arraste e solte suas fotos aqui ou clique no botão abaixo.</p>
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
          <Label htmlFor="image-upload" className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-md transition-all duration-300 font-medium">
            Adicionar Fotos
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

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button onClick={handleSavePortfolioItem} className="px-8 py-4 text-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-lg transition-all duration-300" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Serviço"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;