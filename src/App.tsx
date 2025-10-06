import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Budgets from "./pages/Budgets";
import Portfolio from "./pages/Portfolio";
import PublicPortfolioView from "./pages/PublicPortfolioView";
import BudgetList from "./pages/BudgetList"; // Importar a nova página
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/budget-list" element={<BudgetList />} /> {/* Nova rota */}
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio-view/:publicShareId" element={<PublicPortfolioView />} />
          {/* ADICIONE TODAS AS ROTAS PERSONALIZADAS ACIMA DA ROTA CORINGA "*" */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;