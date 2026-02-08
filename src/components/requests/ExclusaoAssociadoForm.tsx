import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFeedback } from "@/contexts/FeedbackContext";

interface FormProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export function ExclusaoAssociadoForm({ formData, updateFormData }: FormProps) {
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
          Autoriza cobrança via boleto bancário de eventuais despesas pendentes. Necessário devolver carteira de sócio. Em caso de retorno, cumprirá novos prazos de carência.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Nome Completo *</Label>
        <Input
          value={formData.nome}
          onChange={(e) => updateFormData("nome", e.target.value)}
          onBlur={() => validateField("nome", "Nome Completo")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Telefone para Contato *</Label>
        <Input
          type="tel"
          value={formData.telefone || ""}
          onChange={(e) => updateFormData("telefone", e.target.value)}
          onBlur={() => validateField("telefone", "Telefone para Contato")}
          placeholder="(41) 99999-9999"
          required
        />
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

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input 
          value={formData.observacoes || ""} 
          onChange={(e) => updateFormData("observacoes", e.target.value)} 
          placeholder="Devolução da carteira de sócio"
        />
      </div>
    </div>
  );
}
