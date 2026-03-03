import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { Loader2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface SobreFunsepSecao {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string;
  ordem: number;
  publicado: boolean;
}

interface SobreFunsepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingSecao: SobreFunsepSecao | null;
}

export function SobreFunsepModal({
  isOpen,
  onClose,
  onSuccess,
  editingSecao,
}: SobreFunsepModalProps) {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [loading, setLoading] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();

  useEffect(() => {
    if (editingSecao) {
      setTitulo(editingSecao.titulo);
      setConteudo(editingSecao.conteudo);
    } else {
      setTitulo("");
      setConteudo("");
    }
  }, [editingSecao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!editingSecao) {
      mostrarFeedback('erro', 'Erro', 'Seção não encontrada');
      setLoading(false);
      return;
    }

    if (!titulo.trim()) {
      mostrarFeedback('aviso', 'Atenção', 'O título é obrigatório');
      setLoading(false);
      return;
    }

    if (!conteudo.trim() || conteudo === '<p><br></p>') {
      mostrarFeedback('aviso', 'Atenção', 'O conteúdo é obrigatório');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("sobre_funsep")
      .update({
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingSecao.id);

    if (error) {
      mostrarFeedback('erro', 'Erro', 'Erro ao atualizar seção');
      console.error("Erro:", error);
    } else {
      mostrarToast('sucesso', 'Seção atualizada com sucesso!');
      onSuccess();
    }

    setLoading(false);
  };

  // Configuração do editor Quill (sem tabelas por enquanto - requer pacote adicional)
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "color",
    "background",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-4 truncate">Editar Seção: {editingSecao?.titulo}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-full overflow-x-hidden">
          <div className="space-y-2 w-full max-w-full">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full max-w-full"
            />
          </div>

          <div className="space-y-2 w-full max-w-full overflow-x-hidden">
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <div className="min-h-[300px] sm:min-h-[400px] w-full max-w-full overflow-x-hidden">
              <div className="w-full max-w-full overflow-x-hidden">
                <ReactQuill
                  theme="snow"
                  value={conteudo}
                  onChange={setConteudo}
                  modules={modules}
                  formats={formats}
                  className="bg-background w-full max-w-full"
                  style={{ height: "auto", minHeight: "250px" }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-8 sm:mt-12 break-words">
              Use a barra de ferramentas para formatar o texto, adicionar links, etc. Para tabelas, use o formato markdown: | Coluna 1 | Coluna 2 |
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
