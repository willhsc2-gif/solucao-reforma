import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, XCircle, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from "@/utils/file";

interface Client {
  id: string;
  name: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  public_share_id: string;
  client_id?: string;
  clients?: { name: string }[] | null; // Corrected: clients can be an array or null
  created_at: string;
}

interface PortfolioImage {
  id: string;
  image_url: string;
  description?: string;
  order_index: number;
}

interface ImageFileWithPreview extends File {
  preview: string;
  description: string;
  id: string; // Unique ID for managing in state
  isNew?: boolean; // Flag to identify new files
}

interface EditPortfolioItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioItem: PortfolioItem | null;
  onSaveSuccess: () => void;
  clients: Client[];
}

const EditPortfolioItemDialog: React.FC<EditPortfolioItemDialogProps> = ({
  isOpen,
  onClose,
  portfolioItem,
  onSaveSuccess,
  clients,
}) => {
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | undefined>(undefined);
  const [imageFilesWithPreviews, setImageFilesWithPreviews] = useState<ImageFileWithPreview[]>([]);
  const [existingImages, setExistingImages] = useState<PortfolioImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portfolioItem && isOpen) {
      setEditedTitle(portfolioItem.title);
      setEditedDescription(portfolioItem.description);
      setSelectedClient(portfolioItem.client_id || undefined);
      fetchPortfolioImages(portfolioItem.id);
    } else if (!isOpen) {
      // Reset form when dialog closes
      setEditedTitle("");
      setEditedDescription("");
      setSelectedClient(undefined);
      setImageFilesWithPreviews([]);
      setExistingImages([]);
      setImagesToDelete([]);
    }
  }, [portfolioItem, isOpen]);

  const fetchPortfolioImages = async (portfolioItemId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("portfolio_item_id", portfolioItemId)
        .order("order_index", { ascending: true });

      if (error) {
        throw error;
      }
      setExistingImages(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar imagens do portfólio:", err);
      toast.error("Erro ao carregar imagens: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => Object.assign(file, {
        preview: URL.createObjectURL(file),
        description: "", // Initialize with empty description
        id: uuidv4(), // Assign a unique ID
        isNew: true, // Mark as new file
      })) as ImageFileWithPreview[];

      if (imageFilesWithPreviews.length + existingImages.length + newFiles.length > 20) {
        toast.error("Você pode adicionar no máximo 20 imagens por item de portfólio.");
        return;
      }
      setImageFilesWithPreviews((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveNewImage = (id: string) => {
    setImageFilesWithPreviews((prev) => prev.filter(file => file.id !== id));
  };

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter(img => img.id !== imageId));
    setImagesToDelete((prev) => [...prev, imageId]);
  };

  const handleImageDescriptionChange = (id: string, description: string, isNew: boolean) => {
    if (isNew) {
      setImageFilesWithPreviews((prev) =>
        prev.map((file) => (file.id === id ? { ...file, description } : file))
      );
    } else {
      setExistingImages((prev) =>
        prev.map((file) => (file.id === id ? { ...file, description } : file))
      );
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      const newFiles = Array.from(event.dataTransfer.files).map(file => Object.assign(file, {
        preview: URL.createObjectURL(file),
        description: "",
        id: uuidv4(),
        isNew: true,
      })) as ImageFileWithPreview[];

      if (imageFilesWithPreviews.length + existingImages.length + newFiles.length > 20) {
        toast.error("Você pode adicionar no máximo 20 imagens por item de portfólio.");
        return;
      }
      setImageFilesWithPreviews((prev) => [...prev, ...newFiles]);
    }
  };

  const uploadFile = useCallback(async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      throw error;
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  }, []);

  const handleSave = async () => {
    if (!portfolioItem) return;

    setLoading(true);
    try {
      if (!editedTitle) {
        toast.error("O título da foto é obrigatório.");
        return;
      }
      if (imageFilesWithPreviews.length + existingImages.length === 0) {
        toast.error("Adicione pelo menos uma imagem ao portfólio.");
        return;
      }

      // 1. Update portfolio item details
      const { error: updateItemError } = await supabase
        .from("portfolio_items")
        .update({
          title: editedTitle,
          description: editedDescription,
          client_id: selectedClient,
        })
        .eq("id", portfolioItem.id);

      if (updateItemError) {
        throw updateItemError;
      }

      // 2. Delete images marked for deletion
      for (const imageId of imagesToDelete) {
        // First, get the image_url to delete from storage
        const { data: imageData, error: fetchImageError } = await supabase
          .from("portfolio_images")
          .select("image_url")
          .eq("id", imageId)
          .single();

        if (fetchImageError) {
          console.warn(`Could not fetch image URL for deletion: ${imageId}`, fetchImageError.message);
          // Continue even if fetching fails, try to delete from DB
        } else if (imageData?.image_url) {
          const filePath = imageData.image_url.split('portfolio_images/')[1];
          if (filePath) {
            const { error: deleteStorageError } = await supabase.storage.from("portfolio_images").remove([filePath]);
            if (deleteStorageError) {
              console.warn(`Could not delete image from storage: ${filePath}`, deleteStorageError.message);
            }
          }
        }

        const { error: deleteDbError } = await supabase
          .from("portfolio_images")
          .delete()
          .eq("id", imageId);

        if (deleteDbError) {
          console.warn(`Could not delete image from database: ${imageId}`, deleteDbError.message);
        }
      }

      // 3. Upload new images and insert into portfolio_images
      const newImageUploads = imageFilesWithPreviews.map(async (imageFile, index) => {
        const sanitizedImageFileName = sanitizeFileName(imageFile.name);
        const filePath = `${portfolioItem.id}/${Date.now()}-${sanitizedImageFileName}`;
        const imageUrl = await uploadFile(imageFile, "portfolio_images", filePath);
        return {
          portfolio_item_id: portfolioItem.id,
          image_url: imageUrl,
          description: imageFile.description,
          order_index: existingImages.length + index, // Append new images to the end
        };
      });

      const uploadedImages = await Promise.all(newImageUploads);

      if (uploadedImages.length > 0) {
        const { error: insertImagesError } = await supabase
          .from("portfolio_images")
          .insert(uploadedImages);

        if (insertImagesError) {
          throw insertImagesError;
        }
      }

      // 4. Update descriptions and order of existing images
      const updateExistingImagesPromises = existingImages.map(async (image, index) => {
        const { error: updateImageError } = await supabase
          .from("portfolio_images")
          .update({
            description: image.description,
            order_index: index, // Re-order existing images
          })
          .eq("id", image.id);
        if (updateImageError) {
          console.warn(`Could not update image description/order for ${image.id}:`, updateImageError.message);
        }
      });
      await Promise.all(updateExistingImagesPromises);


      toast.success("Item de portfólio atualizado com sucesso!");
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao salvar item de portfólio: " + error.message);
      console.error("Erro ao salvar item de portfólio:", error);
    } finally {
      setLoading(false);
    }
  };

  const allImages = [...existingImages, ...imageFilesWithPreviews];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Portfólio: {portfolioItem?.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          <div>
            <Label htmlFor="edited-title">Título da Foto</Label>
            <Input
              id="edited-title"
              placeholder="Ex: Reforma de cozinha"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edited-description">Descrição do Serviço</Label>
            <Textarea
              id="edited-description"
              placeholder="Detalhes sobre o serviço realizado..."
              rows={3}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="client-link">Vincular a um Cliente (opcional)</Label>
            <Select onValueChange={setSelectedClient} value={selectedClient}>
              <SelectTrigger id="client-link">
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

          {/* Gerenciamento de Imagens */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center"
               onDragOver={handleDragOver}
               onDrop={handleDrop}>
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Arraste e solte novas fotos aqui ou clique no botão abaixo.</p>
            <input
              type="file"
              id="image-upload-edit"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
            />
            <Label htmlFor="image-upload-edit" className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-md transition-all duration-300 font-medium">
              Adicionar Mais Fotos
            </Label>

            {allImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img src={image.image_url} alt={image.description || "Imagem existente"} className="w-full h-32 object-cover rounded-md shadow-sm" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveExistingImage(image.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Descrição da foto"
                      className="mt-1 text-sm"
                      value={image.description || ""}
                      onChange={(e) => handleImageDescriptionChange(image.id, e.target.value, false)}
                    />
                  </div>
                ))}
                {imageFilesWithPreviews.map((file) => (
                  <div key={file.id} className="relative group">
                    <img src={file.preview} alt={file.name} className="w-full h-32 object-cover rounded-md shadow-sm" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveNewImage(file.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Descrição da foto"
                      className="mt-1 text-sm"
                      value={file.description}
                      onChange={(e) => handleImageDescriptionChange(file.id, e.target.value, true)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPortfolioItemDialog;