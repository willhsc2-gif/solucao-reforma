import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Budgets from "./pages/Budgets";
import Portfolio from "./pages/Portfolio";
import PublicPortfolioView from "./pages/PublicPortfolioView";
import PublicPortfolioList from "./pages/PublicPortfolioList";
import BudgetList from "./pages/BudgetList";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Importar a página de Login
import { SessionContextProvider, useSession } from "./components/SessionContextProvider"; // Importar o SessionContextProvider e useSession

const queryClient = new QueryClient();

// Componente para proteger rotas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/portfolio-view/:publicShareId" element={<PublicPortfolioView />} />
            <Route path="/public-portfolio" element={<PublicPortfolioList />} />
            
            {/* Rotas Protegidas */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
            <Route path="/budget-list" element={<ProtectedRoute><BudgetList /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* ADICIONE TODAS AS ROTAS PERSONALIZADAS ACIMA DA ROTA CORINGA "*" */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;