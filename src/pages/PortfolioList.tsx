"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Edit, MessageSquareText, Share2, Whatsapp } from "lucide-react";
import { toast } from "sonner"; // Alterado de "react-hot-toast" para "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PortfolioItem {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  public_share_id: string;
  client_reference_contact: string | null;
  created_at: string;
  client_name?: string;
  images?: PortfolioImage[];
}

interface PortfolioImage {
  id: string;
  portfolio_item_id: string;
  image_url: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

export default function PortfolioList() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    client_id: "",
    client_reference_contact: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPortfolioItems();
    fetchClients();
  }, []);

  const fetchPortfolioItems = async () => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("portfolio_items")
      .select(`
        *,
        clients (name),
        portfolio_images (id, image_url, description, order_index)
      `)
      .eq("user_id", userData.user.id);

    if (error) {
      setError(error.message);
      toast.error("Erro ao carregar itens do portfólio.");
    } else {
      const itemsWithClientNames = data.map(item => ({
        ...item,
        client_name: item.clients?.name || "N/A",
        images: item.portfolio_images || [],
      }));
      setPortfolioItems(itemsWithClientNames as PortfolioItem[]);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setError("User not authenticated.");
      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Error fetching clients:", error.message);
      toast.error("Erro ao carregar clientes.");
    } else {
      setClients(data as Client[]);
    }
  };

  const handleShareIndividualOnWhatsApp = (item: PortfolioItem) => {
    const shareUrl = `${window.location.origin}/portfolio/${item.public_share_id}`;
    const message = `Confira este item do meu portfólio: ${item.title} - ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareAllOnWhatsApp = () => {
    const shareUrl = `${window.location.origin}/portfolio`;
    const message = `Confira meu portfólio completo: ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEditClick = (item: PortfolioItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description || "",
      client_id: item.client_id || "",
      client_reference_contact: item.client_reference_contact || "",
    });
    setIsDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!editingItem) return;

    const { error } = await supabase
      .from("portfolio_items")
      .update({
        title: form.title,
        description: form.description,
        client_id: form.client_id || null,
        client_reference_contact: form.client_reference_contact || null,
      })
      .eq("id", editingItem.id);

    if (error) {
      toast.error("Erro ao atualizar item do portfólio.");
      console.error("Error updating portfolio item:", error.message);
    } else {
      toast.success("Item do portfólio atualizado com sucesso!");
      setIsDialogOpen(false);
      setEditingItem(null);
      fetchPortfolioItems(); // Refresh the list
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando portfólios...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Portfólios</h1>
        <div className="flex space-x-2">
          <Button onClick={() => navigate("/portfolio/new")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Portfólio
          </Button>
          <Button variant="outline" onClick={handleShareAllOnWhatsApp} title="Compartilhar Portfólio Completo no WhatsApp">
            <Whatsapp className="mr-2 h-4 w-4" /> Compartilhar Tudo
          </Button>
        </div>
      </div>

      {portfolioItems.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum item de portfólio encontrado. Comece adicionando um!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>Cliente: {item.client_name}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
                {item.images && item.images.length > 0 && (
                  <div className="mt-4">
                    <img src={item.images[0].image_url} alt={item.images[0].description || item.title} className="w-full h-48 object-cover rounded-md" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center mt-4">
                <Link to={`/portfolio/${item.id}`} className="text-blue-600 hover:underline text-sm">
                  Ver Detalhes
                </Link>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleShareIndividualOnWhatsApp(item)} title="Compartilhar no WhatsApp">
                    <Whatsapp className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(item)} title="Editar Item">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item do Portfólio" : "Adicionar Novo Portfólio"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Faça alterações no seu item de portfólio aqui." : "Preencha os detalhes para um novo item de portfólio."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input id="title" value={form.title} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea id="description" value={form.description} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client_id" className="text-right">
                Cliente
              </Label>
              <Select onValueChange={(value) => handleFormChange({ target: { id: "client_id", value } } as React.ChangeEvent<HTMLSelectElement>)} value={form.client_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client_reference_contact" className="text-right">
                Contato de Referência
              </Label>
              <Input id="client_reference_contact" value={form.client_reference_contact} onChange={handleFormChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}