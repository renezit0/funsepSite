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

export function TermoCompromissoForm({ formData, updateFormData }: FormProps) {
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
          Compromisso de cumprimento dos prazos de carência
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Nome do Associado *</Label>
        <Input 
          value={formData.nome_associado || formData.nome} 
          onChange={(e) => updateFormData("nome_associado", e.target.value)} 
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
        <Label>Matrícula no Funsep *</Label>
        <Input 
          value={formData.matricula} 
          onChange={(e) => updateFormData("matricula", e.target.value)} 
          required 
          disabled={!!formData.matricula}
        />
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

      <div className="border-t pt-4 space-y-4">
        <Label className="font-semibold">Controle de Prazos de Carência</Label>
        
        <div className="space-y-2">
          <Label>Data Entrega Carteira de Identificação *</Label>
          <Input 
            type="date" 
            value={formData.data_carteira || ""} 
            onChange={(e) => updateFormData("data_carteira", e.target.value)} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Exames: Data de Liberação *</Label>
          <Input 
            type="date" 
            value={formData.data_exames || ""} 
            onChange={(e) => updateFormData("data_exames", e.target.value)} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Radiologia: Data de Liberação *</Label>
          <Input 
            type="date" 
            value={formData.data_radiologia || ""} 
            onChange={(e) => updateFormData("data_radiologia", e.target.value)} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Alto Custo/Internamento: Data de Liberação *</Label>
          <Input 
            type="date" 
            value={formData.data_alto_custo || ""} 
            onChange={(e) => updateFormData("data_alto_custo", e.target.value)} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Obstetrícia: Data de Liberação *</Label>
          <Input 
            type="date" 
            value={formData.data_obstetricia || ""} 
            onChange={(e) => updateFormData("data_obstetricia", e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <Label className="font-semibold">Compromisso *</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="compromisso-1"
              checked={formData.compromisso_carencia || false}
              onCheckedChange={(checked) => updateFormData("compromisso_carencia", checked)}
              required
            />
            <label htmlFor="compromisso-1" className="text-sm">
              Comprometo-me a cumprir prazos de carência
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="compromisso-2"
              checked={formData.compromisso_descontos || false}
              onCheckedChange={(checked) => updateFormData("compromisso_descontos", checked)}
              required
            />
            <label htmlFor="compromisso-2" className="text-sm">
              Autorizo descontos em folha por utilização irregular
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
