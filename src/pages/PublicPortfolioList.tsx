import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  public_share_id: string;
  client_id?: string | null; // Permitir que client_id seja null
  clients?: { name: string }[] | null; // Corrigido: clients agora é um array ou null
  portfolio_images: { image_url: string }[];
}

const PublicPortfolioList = () => {
  const [portfolioItems, setPortfolioItems] = React.useState<PortfolioItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log("PublicPortfolioList component mounted."); // Debugging line
    fetchPublicPortfolioItems();
  }, []);

  const fetchPublicPortfolioItems = async () => {
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
          clients (name),
          portfolio_images (image_url)
        `)
        .not("public_share_id", "is", null) // Only fetch items with a public share ID
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      // Mapear os dados para garantir a tipagem correta de 'clients'
      const typedData: PortfolioItem[] = data.map(item => ({
        ...item,
        clients: item.clients ? (item.clients as { name: string }[]) : null, // Corrigido: cast para array ou null
        portfolio_images: item.portfolio_images as { image_url: string }[],
      }));
      setPortfolioItems(typedData);
    } catch (err: any) {
      console.error("Erro ao carregar portfólios públicos:", err);
      setError("Erro ao carregar os portfólios. Por favor, tente novamente mais tarde.");
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
          <Link to="/" className="mt-4 inline-block text-blue-500 hover:text-blue-700 underline">
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    );
  }

  if (portfolioItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Nenhum Portfólio Disponível</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">Não há itens de portfólio compartilhados publicamente no momento.</p>
          <Link to="/" className="mt-4 inline-block text-blue-500 hover:text-blue-700 underline">
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-black dark:text-white">Nosso Portfólio</h1>
        <p className="text-lg text-center text-gray-700 dark:text-gray-300 mb-8">
          Confira alguns dos nossos trabalhos mais recentes e inspire-se para o seu próximo projeto!
        </p>

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
                {item.clients?.[0]?.name && ( {/* Corrigido: Acessa o primeiro elemento do array */}
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Cliente: {item.clients[0].name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{item.description}</p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link to={`/portfolio-view/${item.public_share_id}`}>
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicPortfolioList;