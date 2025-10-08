import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Budgets from "./pages/Budgets";
import Portfolio from "./pages/Portfolio";
import PublicPortfolioView from "./pages/PublicPortfolioView";
import PublicPortfolioList from "./pages/PublicPortfolioList";
import BudgetList from "./pages/BudgetList";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Importar a página de Login
import { SessionContextProvider } from "./components/SessionContextProvider"; // Importar o provedor de sessão
import ProtectedRoute from "./components/ProtectedRoute"; // Importar o ProtectedRoute

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Envolve todo o aplicativo com o provedor de sessão */}
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/portfolio-view/:publicShareId" element={<PublicPortfolioView />} />
            <Route path="/public-portfolio" element={<PublicPortfolioList />} />

            {/* Rotas Protegidas */}
            <Route
              path="/budgets"
              element={
                <ProtectedRoute>
                  <Budgets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget-list"
              element={
                <ProtectedRoute>
                  <BudgetList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* ADICIONE TODAS AS ROTAS PERSONALIZADAS ACIMA DA ROTA CORINGA "*" */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;