import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Eye, Share2, Link as LinkIcon, Trash2, MessageSquareText, Pencil, Image as ImageIcon } from "lucide-react";
import EditPortfolioItemDialog from "@/components/EditPortfolioItemDialog"; // Importar o novo componente de edição

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  public_share_id: string;
  client_id?: string;
  clients?: { name: string };
  created_at: string;
  portfolio_images: { image_url: string }[];
}

interface Client {
  id: string;
  name: string;
}

const PortfolioList = () => {
  const [portfolioItems, setPortfolioItems] = React.useState<PortfolioItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [currentEditingItem, setCurrentEditingItem] = React.useState<PortfolioItem | null>(null);
  const [clients, setClients] = React.useState<Client[]>([]); // Para passar para o diálogo de edição

  React.useEffect(() => {
    fetchPortfolioItems();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("id, name");
    if (error) {
      console.error("Erro ao carregar clientes:", error);
    } else {
      setClients(data || []);
    }
  };

  const fetchPortfolioItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select(`
          id,
          title,
          description,
          public_share_id,
          client_id,
          created_at,
          clients (name),
          portfolio_images (image_url)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      setPortfolioItems(data as PortfolioItem[]);
    } catch (err: any) {
      console.error("Erro ao carregar itens do portfólio:", err);
      setError("Erro ao carregar itens do portfólio: " + err.message);
      toast.error("Erro ao carregar portfólio: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPortfolio = (publicShareId: string) => {
    if (!publicShareId) {
      toast.error("ID de compartilhamento público não disponível para este item.");
      return;
    }
    window.open(`/portfolio-view/${publicShareId}`, '_blank');
  };

  const handleCopyLink = (publicShareId: string) => {
    if (!publicShareId) {
      toast.error("ID de compartilhamento público não disponível para este item.");
      return;
    }
    const link = `${window.location.origin}/portfolio-view/${publicShareId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleShareOnWhatsApp = (portfolioItem: PortfolioItem) => {
    if (!portfolioItem.public_share_id) {
      toast.error("ID de compartilhamento público não disponível para este item.");
      return;
    }
    const link = `${window.location.origin}/portfolio-view/${portfolioItem.public_share_id}`;
    const message = `Confira meu novo serviço realizado: ${portfolioItem.title} - ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    toast.success("Abrindo WhatsApp para compartilhar!");
  };

  const handleDeletePortfolioItem = async (id: string) => {
    setLoading(true);
    try {
      // Fetch images associated with the portfolio item to delete from storage
      const { data: imagesData, error: fetchImagesError } = await supabase
        .from("portfolio_images")
        .select("image_url")
        .eq("portfolio_item_id", id);

      if (fetchImagesError) {
        console.warn("Could not fetch images for deletion from storage:", fetchImagesError.message);
        // Continue with deletion from DB even if storage deletion fails
      } else if (imagesData && imagesData.length > 0) {
        const filePaths = imagesData.map(img => img.image_url.split('portfolio_images/')[1]).filter(Boolean);
        if (filePaths.length > 0) {
          const { error: deleteStorageError } = await supabase.storage.from("portfolio_images").remove(filePaths as string[]);
          if (deleteStorageError) {
            console.warn("Could not delete images from storage:", deleteStorageError.message);
          }
        }
      }

      const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (error) {
        throw error;
      }
      toast.success("Item de portfólio excluído com sucesso!");
      fetchPortfolioItems(); // Refresh the list
    } catch (err: any) {
      toast.error("Erro ao excluir item de portfólio: " + err.message);
      console.error("Erro ao excluir item de portfólio:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item: PortfolioItem) => {
    setCurrentEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setCurrentEditingItem(null);
  };

  const handleSaveSuccess = () => {
    fetchPortfolioItems(); // Refresh the list after successful save
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-700 dark:text-gray-300">Carregando portfólio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">{error}</p>
        <Button onClick={fetchPortfolioItems} className="mt-4">Tentar Novamente</Button>
      </div>
    );
  }

  if (portfolioItems.length === 0) {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-xl text-gray-700 dark:text-gray-300">Nenhum item de portfólio encontrado.</p>
        <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Crie seu primeiro serviço realizado na aba "Criar Novo Serviço".</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolioItems.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <CardHeader>
              <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                {item.portfolio_images.length > 0 ? (
                  <img
                    src={item.portfolio_images[0].image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              <CardTitle className="mt-4">{item.title}</CardTitle>
              {item.clients?.name && (
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Cliente: {item.clients.name}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{item.description}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => handleViewPortfolio(item.public_share_id)} title="Visualizar Portfólio">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCopyLink(item.public_share_id)} title="Copiar Link Público">
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShareOnWhatsApp(item)} title="Compartilhar no WhatsApp">
                <MessageSquareText className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleEditClick(item)} title="Editar Item">
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" title="Excluir Item">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o item de portfólio "{item.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeletePortfolioItem(item.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      {currentEditingItem && (
        <EditPortfolioItemDialog
          isOpen={isEditDialogOpen}
          onClose={handleEditDialogClose}
          portfolioItem={currentEditingItem}
          onSaveSuccess={handleSaveSuccess}
          clients={clients}
        />
      )}
    </>
  );
};

export default PortfolioList;