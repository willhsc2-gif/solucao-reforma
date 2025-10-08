"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Edit, Share2, Trash2 } from "lucide-react"; 
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/components/SessionContextProvider"; // Importar useSession
import EditPortfolioItemDialog from "@/components/EditPortfolioItemDialog"; // Importar o novo componente de diálogo

interface PortfolioItem {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  public_share_id: string;
  client_reference_contact: string | null;
  created_at: string;
  clients?: { name: string };
  portfolio_images?: PortfolioImage[];
}

interface PortfolioImage {
  id: string;
  portfolio_item_id: string;
  image_url: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

export default function PortfolioList() {
  const { user } = useSession(); // Obter o usuário da sessão
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Estado para o diálogo de edição
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null); // Item selecionado para edição
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchPortfolioItems();
      fetchClients();
    }
  }, [user]);

  const fetchPortfolioItems = async () => {
    setLoading(true);
    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("portfolio_items")
      .select(`
        *,
        clients (name),
        portfolio_images (id, image_url, description, order_index)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      toast.error("Erro ao carregar itens do portfólio.");
    } else {
      const itemsWithClientNames = data.map(item => ({
        ...item,
        client_name: item.clients?.name || "N/A",
        images: item.portfolio_images || [],
      }));
      setPortfolioItems(itemsWithClientNames as PortfolioItem[]);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching clients:", error.message);
      toast.error("Erro ao carregar clientes.");
    } else {
      setClients(data as Client[]);
    }
  };

  const handleShareIndividualOnWhatsApp = (item: PortfolioItem) => {
    const shareUrl = `${window.location.origin}/portfolio-view/${item.public_share_id}`;
    const message = `Confira este item do meu portfólio: ${item.title} - ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareAllOnWhatsApp = () => {
    const shareUrl = `${window.location.origin}/public-portfolio`;
    const message = `Confira meu portfólio completo: ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEditClick = (item: PortfolioItem) => {
    setSelectedPortfolioItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    setLoading(true);
    try {
      // 1. Delete associated images from storage and database
      const { data: imagesData, error: fetchImagesError } = await supabase
        .from("portfolio_images")
        .select("id, image_url")
        .eq("portfolio_item_id", itemId);

      if (fetchImagesError) {
        console.warn("Erro ao buscar imagens para exclusão:", fetchImagesError.message);
      } else if (imagesData && imagesData.length > 0) {
        const filePaths = imagesData.map(img => img.image_url.split('portfolio_images/')[1]).filter(Boolean);
        if (filePaths.length > 0) {
          const { error: deleteStorageError } = await supabase.storage.from("portfolio_images").remove(filePaths);
          if (deleteStorageError) {
            console.warn("Erro ao excluir imagens do storage:", deleteStorageError.message);
          }
        }
        const { error: deleteDbImagesError } = await supabase.from("portfolio_images").delete().eq("portfolio_item_id", itemId);
        if (deleteDbImagesError) {
          console.warn("Erro ao excluir imagens do banco de dados:", deleteDbImagesError.message);
        }
      }

      // 2. Delete the portfolio item itself
      const { error } = await supabase.from("portfolio_items").delete().eq("id", itemId);
      if (error) {
        throw error;
      }
      toast.success("Item do portfólio excluído com sucesso!");
      fetchPortfolioItems(); // Refresh the list
    } catch (error: any) {
      toast.error("Erro ao excluir item do portfólio: " + error.message);
      console.error("Erro ao excluir item do portfólio:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando portfólios...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Portfólios</h1>
        <div className="flex space-x-2">
          <Button onClick={() => navigate("/portfolio")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Portfólio
          </Button>
          <Button variant="outline" onClick={handleShareAllOnWhatsApp} title="Compartilhar Portfólio Completo no WhatsApp">
            <Share2 className="mr-2 h-4 w-4" /> Compartilhar Tudo
          </Button>
        </div>
      </div>

      {portfolioItems.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum item de portfólio encontrado. Comece adicionando um!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>Cliente: {item.clients?.name || "N/A"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
                {item.portfolio_images && item.portfolio_images.length > 0 && (
                  <div className="mt-4">
                    <img src={item.portfolio_images[0].image_url} alt={item.portfolio_images[0].description || item.title} className="w-full h-48 object-cover rounded-md" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center mt-4">
                <Link to={`/portfolio-view/${item.public_share_id}`} className="text-blue-600 hover:underline text-sm">
                  Ver Detalhes
                </Link>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleShareIndividualOnWhatsApp(item)} title="Compartilhar no WhatsApp">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(item)} title="Editar Item">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" title="Excluir Item">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja excluir o item "{item.title}" do portfólio? Esta ação é irreversível e removerá todas as imagens associadas.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {}}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => handleDeleteItem(item.id)}>Excluir</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedPortfolioItem && (
        <EditPortfolioItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          portfolioItem={selectedPortfolioItem}
          onSaveSuccess={fetchPortfolioItems}
          clients={clients}
        />
      )}
    </div>
  );
}