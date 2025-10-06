import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  const portfolioImages = [
    {
      src: "/placeholder.svg", // Replace with actual image paths
      alt: "Reforma de Cozinha Moderna",
      title: "Reforma de Cozinha Moderna",
    },
    {
      src: "/placeholder.svg", // Replace with actual image paths
      alt: "Banheiro de Luxo",
      title: "Banheiro de Luxo",
    },
    {
      src: "/placeholder.svg", // Replace with actual image paths
      alt: "Sala de Estar Integrada",
      title: "Sala de Estar Integrada",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 text-black dark:text-white">Solução Reformas</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300">Transformando espaços com excelência</p>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
        <Link to="/budgets">
          <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg shadow-lg transition-all duration-300">
            Orçamentos
          </Button>
        </Link>
        <Link to="/portfolio">
          <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-lg shadow-lg transition-all duration-300">
            Serviços Realizados
          </Button>
        </Link>
      </div>

      <section className="w-full max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">Reformas de Alto Padrão</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portfolioImages.map((item, index) => (
            <Card key={index} className="overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-0">
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-60 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-black dark:text-white">{item.title}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;