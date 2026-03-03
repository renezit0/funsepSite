import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RequestDocumentUpload } from "@/components/RequestDocumentUpload";
import { useFeedback } from "@/contexts/FeedbackContext";

interface FormProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  handleDocumentUpload: (docType: string, url: string, fileName: string) => void;
  getDocument: (docType: string) => any;
}

export function Requerimento21AnosForm({ formData, updateFormData, handleDocumentUpload, getDocument }: FormProps) {
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
      <div className="space-y-2">
        <Label>Nome do Beneficiário/Titular *</Label>
        <Input 
          value={formData.nome_beneficiario || formData.nome} 
          onChange={(e) => updateFormData("nome_beneficiario", e.target.value)} 
          required 
        />
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
        <Label>Nome do Dependente (Permanência) *</Label>
        <Input 
          value={formData.nome_dependente || ""} 
          onChange={(e) => updateFormData("nome_dependente", e.target.value)} 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label>Data de Nascimento do Dependente *</Label>
        <Input 
          type="date" 
          value={formData.dtnasc_dependente || ""} 
          onChange={(e) => updateFormData("dtnasc_dependente", e.target.value)} 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label>Data do Requerimento *</Label>
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

      <div className="space-y-2">
        <Label>Declaração *</Label>
        <Textarea
          value={formData.declaracao || ""}
          onChange={(e) => updateFormData("declaracao", e.target.value)}
          placeholder="Declaro que o dependente é solteiro(a), não possui emprego fixo e vive sob dependência econômica"
          rows={3}
          required
        />
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold">Documentos Obrigatórios</h3>
        <RequestDocumentUpload
          label="RG e CPF (cópia autenticada) do Dependente"
          required
          requestType="requerimento_21_anos"
          onUpload={(url, name) => handleDocumentUpload("rg_cpf_dependente", url, name)}
          currentFile={getDocument("rg_cpf_dependente")}
        />
        <RequestDocumentUpload
          label="Declaração do Imposto de Renda com dependentes"
          required
          requestType="requerimento_21_anos"
          onUpload={(url, name) => handleDocumentUpload("declaracao_ir", url, name)}
          currentFile={getDocument("declaracao_ir")}
        />
        <RequestDocumentUpload
          label="Declaração de Matrícula no Ensino Superior"
          required
          requestType="requerimento_21_anos"
          onUpload={(url, name) => handleDocumentUpload("declaracao_matricula", url, name)}
          currentFile={getDocument("declaracao_matricula")}
        />
      </div>
    </div>
  );
}
