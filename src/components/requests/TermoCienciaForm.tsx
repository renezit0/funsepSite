import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFeedback } from "@/contexts/FeedbackContext";

interface FormProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export function TermoCienciaForm({ formData, updateFormData }: FormProps) {
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
          Documento de ciência sobre normas e funcionamento do plano
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Nome Completo *</Label>
        <Input 
          value={formData.nome_completo || formData.nome} 
          onChange={(e) => updateFormData("nome_completo", e.target.value)} 
          required 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>RG *</Label>
          <Input 
            value={formData.rg || ""} 
            onChange={(e) => updateFormData("rg", e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>CPF *</Label>
          <Input 
            value={formData.cpf || ""} 
            onChange={(e) => updateFormData("cpf", e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data *</Label>
        <Input 
          type="date" 
          value={formData.data || ""} 
          onChange={(e) => updateFormData("data", e.target.value)} 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label>Telefone para Contato *</Label>
        <Input 
          type="tel"
          value={formData.telefone || ""} 
          onChange={(e) => updateFormData("telefone", e.target.value)} 
          placeholder="(41) 99999-9999"
          required 
        />
      </div>

      <div className="space-y-3 border-t pt-4">
        <Label className="font-semibold">Declarações de Ciência *</Label>
        <div className="space-y-2">
          {[
            "Plano de custo operacional",
            "Cobertura Unimed-Curitiba nacional",
            "Consultas: limitadas a 2/mês com 25% participação",
            "Exames e procedimentos: 25% participação",
            "Fisioterapia: 10 sessões/mês com 25%",
            "Fonoaudiologia: 4 sessões/mês com 25%",
            "Acupuntura: 4 sessões/mês com 25%",
            "Exames alto custo: 25% participação"
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox 
                id={`ciencia-${index}`}
                checked={formData[`ciencia_${index}`] || false}
                onCheckedChange={(checked) => updateFormData(`ciencia_${index}`, checked)}
                required
              />
              <label htmlFor={`ciencia-${index}`} className="text-sm">
                {item}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
