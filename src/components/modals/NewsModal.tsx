import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Image as ImageIcon, Table } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingNews?: any;
}

const categorias = [
  "Saúde",
  "Informativo", 
  "Benefícios",
  "Tecnologia",
  "Geral"
];

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image'],
    [{ 'color': [] }, { 'background': [] }],
    ['blockquote', 'code-block'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'align',
  'link', 'image',
  'color', 'background',
  'blockquote', 'code-block'
];

const generateTableHTML = (rows: number, cols: number) => {
  let html = '<table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">';
  for (let i = 0; i < rows; i++) {
    html += '<tr>';
    for (let j = 0; j < cols; j++) {
      if (i === 0) {
        html += '<th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; font-weight: bold;">Cabeçalho</th>';
      } else {
        html += '<td style="border: 1px solid #ddd; padding: 8px;">Célula</td>';
      }
    }
    html += '</tr>';
  }
  html += '</table><p><br></p>';
  return html;
};

export function NewsModal({ isOpen, onClose, onSuccess, editingNews }: NewsModalProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    resumo: "",
    conteudo: "",
    categoria: "",
    publicado: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const { mostrarToast, mostrarFeedback } = useFeedback();
  const { session } = useAuth();

  useEffect(() => {
    if (editingNews) {
      setFormData({
        titulo: editingNews.titulo || "",
        resumo: editingNews.resumo || "",
        conteudo: editingNews.conteudo || "",
        categoria: editingNews.categoria || "",
        publicado: editingNews.publicado || false,
      });
      setImagePreview(editingNews.imagem_url || null);
    } else {
      setFormData({ titulo: "", resumo: "", conteudo: "", categoria: "", publicado: false });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [editingNews, isOpen]);

  const insertTable = () => {
    const tableHTML = generateTableHTML(tableRows, tableCols);
    setFormData(prev => ({
      ...prev,
      conteudo: prev.conteudo + tableHTML
    }));
    setTablePopoverOpen(false);
    mostrarToast('sucesso', 'Tabela inserida!');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    
    const { error } = await supabase.storage
      .from('noticias')
      .upload(fileName, file);

    if (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('noticias')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imagemUrl = editingNews?.imagem_url || null;

      if (imageFile) {
        imagemUrl = await uploadImage(imageFile);
        if (!imagemUrl) {
          mostrarFeedback('erro', 'Erro', 'Falha ao fazer upload da imagem');
          return;
        }
      }

      if (!session?.sigla) {
        mostrarFeedback('erro', 'Erro', 'Sessão administrativa não encontrada');
        return;
      }

      const newsData = {
        ...formData,
        imagem_url: imagemUrl,
        autor_sigla: session.sigla,
        data_publicacao: formData.publicado ? new Date().toISOString() : null,
      };

      let result;
      if (editingNews) {
        result = await supabase
          .from('noticias')
          .update(newsData)
          .eq('id', editingNews.id);
      } else {
        result = await supabase
          .from('noticias')
          .insert([newsData]);
      }

      if (result.error) {
        throw result.error;
      }

      mostrarToast('sucesso', `Notícia ${editingNews ? 'atualizada' : 'criada'} com sucesso!`);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
      mostrarFeedback('erro', 'Erro', 'Falha ao salvar notícia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingNews ? "Editar Notícia" : "Nova Notícia"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select 
              value={formData.categoria}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="resumo">Resumo (usado na lista de notícias)</Label>
            <Input
              id="resumo"
              value={formData.resumo}
              onChange={(e) => setFormData(prev => ({ ...prev, resumo: e.target.value }))}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="conteudo">Conteúdo</Label>
              <Popover open={tablePopoverOpen} onOpenChange={setTablePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-2">
                    <Table className="h-4 w-4" />
                    Inserir Tabela
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <h4 className="font-medium">Configurar Tabela</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rows" className="text-xs">Linhas</Label>
                        <Input
                          id="rows"
                          type="number"
                          min={2}
                          max={10}
                          value={tableRows}
                          onChange={(e) => setTableRows(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cols" className="text-xs">Colunas</Label>
                        <Input
                          id="cols"
                          type="number"
                          min={2}
                          max={10}
                          value={tableCols}
                          onChange={(e) => setTableCols(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={insertTable} className="w-full">
                      Inserir
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="bg-background border rounded-md">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.conteudo}
                onChange={(value) => setFormData(prev => ({ ...prev, conteudo: value }))}
                modules={modules}
                formats={formats}
                className="min-h-[300px]"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="imagem">Imagem</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <div className="text-sm text-muted-foreground">
                          Clique para selecionar uma imagem
                        </div>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="publicado"
              checked={formData.publicado}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, publicado: checked }))}
            />
            <Label htmlFor="publicado">Publicar imediatamente</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingNews ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}