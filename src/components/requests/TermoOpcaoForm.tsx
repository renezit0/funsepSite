import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFeedback } from "@/contexts/FeedbackContext";

interface FormProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export function TermoOpcaoForm({ formData, updateFormData }: FormProps) {
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
          Declarar opção de tipo de acomodação e faixa etária dos beneficiários
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
          <Label>Matrícula no Funsep *</Label>
          <Input 
            value={formData.matricula} 
            onChange={(e) => updateFormData("matricula", e.target.value)} 
            required 
            disabled={!!formData.matricula}
          />
        </div>
        <div className="space-y-2">
          <Label>RG *</Label>
          <Input 
            value={formData.rg || ""} 
            onChange={(e) => updateFormData("rg", e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>CPF *</Label>
        <Input 
          value={formData.cpf || ""} 
          onChange={(e) => updateFormData("cpf", e.target.value)} 
          required 
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

      <div className="border-t pt-4 space-y-4">
        <Label className="font-semibold">Opção de Acomodação do Titular *</Label>
        <RadioGroup 
          value={formData.acomodacao_titular || ""} 
          onValueChange={(v) => updateFormData("acomodacao_titular", v)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="APARTAMENTO" id="titular-apto" />
            <label htmlFor="titular-apto">Apartamento</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ENFERMARIA" id="titular-enf" />
            <label htmlFor="titular-enf">Enfermaria</label>
          </div>
        </RadioGroup>
      </div>

      <div className="border-t pt-4 space-y-4">
        <Label className="font-semibold">Dependentes (até 5)</Label>
        <p className="text-sm text-muted-foreground">
          Para cada dependente, informe o nome e tipo de acomodação
        </p>
        
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="space-y-2 p-3 border rounded-md">
            <div className="space-y-2">
              <Label>Nome do Dependente {num}</Label>
              <Input 
                value={formData[`dependente_${num}_nome`] || ""} 
                onChange={(e) => updateFormData(`dependente_${num}_nome`, e.target.value)} 
                placeholder="Opcional"
              />
            </div>
            {formData[`dependente_${num}_nome`] && (
              <RadioGroup 
                value={formData[`dependente_${num}_acomodacao`] || ""} 
                onValueChange={(v) => updateFormData(`dependente_${num}_acomodacao`, v)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="APARTAMENTO" id={`dep${num}-apto`} />
                  <label htmlFor={`dep${num}-apto`}>Apartamento</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ENFERMARIA" id={`dep${num}-enf`} />
                  <label htmlFor={`dep${num}-enf`}>Enfermaria</label>
                </div>
              </RadioGroup>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
