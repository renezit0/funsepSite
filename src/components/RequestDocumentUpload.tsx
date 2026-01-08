import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";

interface DocumentUploadProps {
  label: string;
  required?: boolean;
  onUpload: (url: string, fileName: string) => void;
  currentFile?: { url: string; name: string };
  requestType: string;
}

export function RequestDocumentUpload({ 
  label, 
  required = false, 
  onUpload, 
  currentFile,
  requestType 
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      mostrarFeedback('erro', 'Erro', 'Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      mostrarFeedback('erro', 'Erro', 'Tipo de arquivo não permitido. Use apenas JPG, PNG ou PDF.');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${requestType}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('requerimentos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('requerimentos')
        .getPublicUrl(fileName);

      onUpload(data.publicUrl, file.name);

      mostrarToast('sucesso', 'Documento enviado com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      mostrarFeedback('erro', 'Erro', 'Não foi possível enviar o documento. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {currentFile ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
          <FileText className="h-4 w-4" />
          <span className="text-sm flex-1 truncate">{currentFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onUpload("", "")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            required={required}
            className="flex-1"
          />
          {isUploading && (
            <Upload className="h-4 w-4 animate-pulse" />
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Formatos aceitos: JPG, PNG, PDF (máx. 10MB)
      </p>
    </div>
  );
}
