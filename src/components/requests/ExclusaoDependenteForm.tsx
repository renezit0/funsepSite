import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RequestDocumentUpload } from "@/components/RequestDocumentUpload";
import { useFeedback } from "@/contexts/FeedbackContext";

interface FormProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  handleDocumentUpload: (docType: string, url: string, fileName: string) => void;
  getDocument: (docType: string) => any;
}

export function ExclusaoDependenteForm({ formData, updateFormData, handleDocumentUpload, getDocument }: FormProps) {
  const { mostrarToast } = useFeedback();

  const validateField = (fieldName: string, fieldLabel: string) => {
    if (!formData[fieldName] || (typeof formData[fieldName] === "string" && formData[fieldName].trim() === "")) {
      mostrarToast("erro", `Por favor, preencha o campo: ${fieldLabel}`);
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Autoriza cobrança de despesas pendentes. Mesmos prazos de carência em caso de retorno.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Nome do Titular *</Label>
        <Input
          value={formData.nome_titular || formData.nome}
          onChange={(e) => updateFormData("nome_titular", e.target.value)}
          onBlur={() => validateField("nome_titular", "Nome do Titular")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Nome do Dependente a ser Excluído *</Label>
        <Input
          value={formData.nome_dependente || ""}
          onChange={(e) => updateFormData("nome_dependente", e.target.value)}
          onBlur={() => validateField("nome_dependente", "Nome do Dependente a ser Excluído")}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Telefone para Contato</Label>
          <Input
            type="tel"
            value={formData.telefone || ""}
            onChange={(e) => updateFormData("telefone", e.target.value)}
            placeholder="(41) 99999-9999"
          />
        </div>
        <div className="space-y-2">
          <Label>Celular</Label>
          <Input
            type="tel"
            value={formData.celular || ""}
            onChange={(e) => updateFormData("celular", e.target.value)}
            placeholder="(41) 99999-9999"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            value={formData.email || ""}
            onChange={(e) => updateFormData("email", e.target.value)}
            placeholder="seu@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label>E-mail Particular</Label>
          <Input
            type="email"
            value={formData.email_particular || ""}
            onChange={(e) => updateFormData("email_particular", e.target.value)}
            placeholder="seu@emailparticular.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data *</Label>
        <Input
          type="date"
          value={formData.data || ""}
          onChange={(e) => updateFormData("data", e.target.value)}
          onBlur={() => validateField("data", "Data")}
          required
        />
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold">Documentos Obrigatórios</h3>
        <RequestDocumentUpload
          label="Carteira de Beneficiário"
          required
          requestType="exclusao_dependente"
          onUpload={(url, name) => handleDocumentUpload("carteira", url, name)}
          currentFile={getDocument("carteira")}
        />
      </div>
    </div>
  );
}
