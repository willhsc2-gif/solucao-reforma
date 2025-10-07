import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Importar Tooltip components

const Home = () => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url('/images/total-de-construcao-da-torre-em-paris-franca_474717-93674.jpg')` }}
    >
      {/* Overlay escuro para melhorar a legibilidade do texto */}
      <div className="absolute inset-0 bg-black opacity-60"></div> 

      {/* Conteúdo da página inicial */}
      <div className="relative z-10 flex flex-col items-center justify-center text-white">
        
        {/* Botão de Configurações no canto superior direito */}
        <div className="absolute top-4 right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/settings">
                <Button variant="outline" size="icon" className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white border-white"> {/* Botão menor e com ícone */}
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
            <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-white text-black hover:bg-gray-200 rounded-lg shadow-lg transition-all duration-300">
              Criar Orçamento
            </Button>
          </Link>
          <Link to="/budget-list">
            <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-lg transition-all duration-300">
              Ver Orçamentos Salvos
            </Button>
          </Link>
          <Link to="/portfolio">
            <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-orange-500 text-white hover:bg-orange-600 rounded-lg shadow-lg transition-all duration-300">
              Serviços Realizados
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;