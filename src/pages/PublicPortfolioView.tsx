import React from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  client_reference_contact?: string;
  clients?: { name: string } | null; // Permitir que clients seja null
}

interface PortfolioImage {
  id: string;
  image_url: string;
  description?: string;
  order_index: number;
}

const PublicPortfolioView = () => {
  const { publicShareId } = useParams<{ publicShareId: string }>();
  const [portfolioItem, setPortfolioItem] = React.useState<PortfolioItem | null>(null);
  const [images, setImages] = React.useState<PortfolioImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (publicShareId) {
      fetchPortfolioData(publicShareId);
    } else {
      setError("ID de compartilhamento público não fornecido.");
      setLoading(false);
    }
  }, [publicShareId]);

  const fetchPortfolioData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch portfolio item
      const { data: itemData, error: itemError } = await supabase
        .from("portfolio_items")
        .select(`
          id,
          title,
          description,
          client_reference_contact,
          clients (name)
        `)
        .eq("public_share_id", id)
        .single();

      if (itemError) {
        throw itemError;
      }
      if (!itemData) {
        setError("Item de portfólio não encontrado ou não compartilhado publicamente.");
        setLoading(false);
        return;
      }
      // Mapear os dados para garantir a tipagem correta de 'clients'
      const typedItemData: PortfolioItem = {
        ...itemData,
        clients: itemData.clients as { name: string } | null,
      };
      setPortfolioItem(typedItemData);

      // Fetch images for the portfolio item
      const { data: imageData, error: imageError } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("portfolio_item_id", itemData.id)
        .order("order_index", { ascending: true });

      if (imageError) {
        throw imageError;
      }
      setImages(imageData || []);

    } catch (err: any) {
      console.error("Erro ao carregar portfólio público:", err);
      setError("Erro ao carregar o portfólio. Por favor, tente novamente mais tarde.");
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Carregando portfólio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">{error}</p>
          <a href="/" className="mt-4 inline-block text-blue-500 hover:text-blue-700 underline">
            Voltar para a Página Inicial
          </a>
        </div>
      </div>
    );
  }

  if (!portfolioItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Portfólio Não Encontrado</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">O item de portfólio que você está procurando não existe ou não está disponível publicamente.</p>
          <a href="/" className="mt-4 inline-block text-blue-500 hover:text-blue-700 underline">
            Voltar para a Página Inicial
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold text-center mb-4 text-black dark:text-white">{portfolioItem.title}</h1>
        <p className="text-lg text-center text-gray-700 dark:text-gray-300 mb-8">{portfolioItem.description}</p>

        {portfolioItem.client_reference_contact && (
          <div className="text-center mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p className="text-md font-semibold text-gray-800 dark:text-gray-200">
              Contato de Referência: {portfolioItem.client_reference_contact}
            </p>
            {portfolioItem.clients?.name && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                (Cliente: {portfolioItem.clients.name})
              </p>
            )}
          </div>
        )}

        {images.length > 0 ? (
          <Carousel className="w-full max-w-2xl mx-auto">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={image.id}>
                  <div className="relative flex items-center justify-center p-1">
                    <img
                      src={image.image_url}
                      alt={image.description || `Imagem ${index + 1}`}
                      className="w-full h-96 object-cover rounded-lg shadow-lg"
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute bottom-4 right-4 bg-white/70 hover:bg-white dark:bg-gray-800/70 dark:hover:bg-gray-800"
                        >
                          <Expand className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>{image.description || portfolioItem.title}</DialogTitle>
                        </DialogHeader>
                        <img
                          src={image.image_url}
                          alt={image.description || `Imagem ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  {image.description && (
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">{image.description}</p>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400">Nenhuma imagem disponível para este portfólio.</p>
        )}
      </div>
    </div>
  );
};

export default PublicPortfolioView;