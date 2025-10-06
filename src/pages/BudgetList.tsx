import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, CheckCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Budget {
  id: string;
  client_id?: string;
  clients?: { name: string }; // Nested client data
  budget_number: string;
  description?: string;
  additional_notes?: string;
  duration?: string;
  budget_date?: string;
  value_with_material?: number;
  value_without_material?: number;
  validity_days?: number;
  payment_method?: string;
  pdf_url?: string;
  logo_url?: string;
  status: "Pendente" | "Finalizado";
  created_at: string;
}

const BudgetList = () => {
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("budgets")
      .select(`
        *,
        clients (name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar orçamentos:", error);
      setError("Erro ao carregar orçamentos: " + error.message);
      toast.error("Erro ao carregar orçamentos: " + error.message);
    } else {
      setBudgets(data as Budget[]);
    }
    setLoading(false);
  };

  const handleDeleteBudget = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("budgets").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast.error("Erro ao excluir orçamento: " + error.message);
    } else {
      toast.success("Orçamento excluído com sucesso!");
      fetchBudgets(); // Refresh the list
    }
    setLoading(false);
  };

  const handleUpdateBudgetStatus = async (id: string, newStatus: "Pendente" | "Finalizado") => {
    setLoading(true);
    const { error } = await supabase.from("budgets").update({ status: newStatus }).eq("id", id);

    if (error) {
      console.error("Erro ao atualizar status do orçamento:", error);
      toast.error("Erro ao atualizar status: " + error.message);
    } else {
      toast.success(`Orçamento marcado como ${newStatus} com sucesso!`);
      fetchBudgets(); // Refresh the list
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-lg text-gray-700 dark:text-gray-300">Carregando orçamentos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">{error}</p>
          <Button onClick={fetchBudgets} className="mt-4">Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">Meus Orçamentos</h1>

        {budgets.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-xl text-gray-700 dark:text-gray-300">Nenhum orçamento encontrado.</p>
            <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Comece criando um novo orçamento na página "Orçamentos".</p>
            <Button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => window.location.href = "/budgets"}>
              Criar Novo Orçamento
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.budget_number}</TableCell>
                    <TableCell>{budget.clients?.name || "N/A"}</TableCell>
                    <TableCell>{budget.budget_date ? format(new Date(budget.budget_date), "dd/MM/yyyy") : "N/A"}</TableCell>
                    <TableCell>R$ {((budget.value_with_material || 0) + (budget.value_without_material || 0)).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={budget.status === "Finalizado" ? "default" : "secondary"} className={budget.status === "Finalizado" ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}>
                        {budget.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      {budget.pdf_url && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>Visualizar PDF do Orçamento {budget.budget_number}</DialogTitle>
                            </DialogHeader>
                            <iframe src={budget.pdf_url} className="w-full h-full border-none" title={`Prévia do PDF do Orçamento ${budget.budget_number}`}></iframe>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateBudgetStatus(budget.id, "Finalizado")}
                        disabled={budget.status === "Finalizado"}
                        className={budget.status === "Finalizado" ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Finalizado
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateBudgetStatus(budget.id, "Pendente")}
                        disabled={budget.status === "Pendente"}
                        className={budget.status === "Pendente" ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Clock className="h-4 w-4 mr-1" /> Pendente
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o orçamento {budget.budget_number}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBudget(budget.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetList;