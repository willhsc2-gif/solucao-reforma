import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  // As imagens de portfólio não são mais necessárias, pois a seção foi removida.
  // const portfolioImages = [
  //   {
  //     src: "/placeholder.svg", // Substitua com os caminhos reais das imagens
  //     alt: "Reforma de Cozinha Moderna",
  //     title: "Reforma de Cozinha Moderna",
  //   },
  //   {
  //     src: "/placeholder.svg", // Substitua com os caminhos reais das imagens
  //     alt: "Banheiro de Luxo",
  //     title: "Banheiro de Luxo",
  //   },
  //   {
  //     src: "/placeholder.svg", // Substitua com os caminhos reais das imagens
  //     alt: "Sala de Estar Integrada",
  //     title: "Sala de Estar Integrada",
  //   },
  // ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 text-black dark:text-white">Solução Reformas</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300">Transformando espaços com excelência</p>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
        <Link to="/budgets">
          <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg shadow-lg transition-all duration-300">
            Criar Orçamento
          </Button>
        </Link>
        <Link to="/budget-list">
          <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-lg shadow-lg transition-all duration-300">
            Ver Orçamentos Salvos
          </Button>
        </Link>
        <Link to="/portfolio">
          <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-lg transition-all duration-300">
            Serviços Realizados
          </Button>
        </Link>
      </div>

      {/* A seção de portfólio de imagens foi removida conforme solicitado. */}
    </div>
  );
};

export default Home;