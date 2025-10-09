import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Home = () => {
  // Imagem de um prédio moderno com fachada de vidro para transmitir sofisticação e confiança.
  // Esta é uma imagem de exemplo. Você pode substituí-la pela sua imagem preferida.
  const backgroundImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      {/* Overlay sutil para legibilidade do texto */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Conteúdo da página com animação de fade-in */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in">
        {/* Botão de Configurações no canto superior direito */}
        <div className="absolute top-4 right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/settings">
                <Button variant="outline" size="icon" className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white border-white">
                  <SettingsIcon className="h-5 w-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Configurações da Empresa</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4 text-white">Solução Reformas</h1>
          <p className="text-xl text-gray-200">Transformando espaços com excelência</p>
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
      </div>
    </div>
  );
};

export default Home;