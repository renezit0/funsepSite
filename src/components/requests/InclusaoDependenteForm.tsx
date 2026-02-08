import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function InclusaoDependenteForm({ formData, updateFormData, handleDocumentUpload, getDocument }: FormProps) {
  const { mostrarToast } = useFeedback();

  const validateField = (fieldName: string, fieldLabel: string) => {
    if (!formData[fieldName] || formData[fieldName].trim() === "") {
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
          Taxa de inscrição: R$ 30,00. Mesmos prazos de carência da inclusão de associado.
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
        <Label>Matrícula no Funsep *</Label>
        <Input
          value={formData.matricula}
          onChange={(e) => updateFormData("matricula", e.target.value)}
          onBlur={() => validateField("matricula", "Matrícula no Funsep")}
          required
          disabled={!!formData.matricula}
        />
      </div>

      <div className="space-y-2">
        <Label>Nome Completo do Dependente *</Label>
        <Input
          value={formData.nome_dependente || ""}
          onChange={(e) => updateFormData("nome_dependente", e.target.value)}
          onBlur={() => validateField("nome_dependente", "Nome Completo do Dependente")}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CPF do Dependente *</Label>
          <Input
            value={formData.cpf_dependente || ""}
            onChange={(e) => updateFormData("cpf_dependente", e.target.value)}
            onBlur={() => validateField("cpf_dependente", "CPF do Dependente")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Data de Nascimento *</Label>
          <Input
            type="date"
            value={formData.dtnasc_dependente || ""}
            onChange={(e) => updateFormData("dtnasc_dependente", e.target.value)}
            onBlur={() => validateField("dtnasc_dependente", "Data de Nascimento")}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nome da Mãe do Dependente *</Label>
        <Input
          value={formData.nomemae_dependente || ""}
          onChange={(e) => updateFormData("nomemae_dependente", e.target.value)}
          onBlur={() => validateField("nomemae_dependente", "Nome da Mãe do Dependente")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Escolaridade *</Label>
        <Input
          value={formData.escolaridade || ""}
          onChange={(e) => updateFormData("escolaridade", e.target.value)}
          onBlur={() => validateField("escolaridade", "Escolaridade")}
          placeholder="Ensino Fundamental, Médio, Superior, etc."
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de Acomodação *</Label>
        <Select
          value={formData.tipacomoda || ""}
          onValueChange={(v) => {
            updateFormData("tipacomoda", v);
            if (!v) {
              mostrarToast("erro", "Por favor, selecione o Tipo de Acomodação");
            }
          }}
        >
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="APARTAMENTO">Apartamento</SelectItem>
            <SelectItem value="ENFERMARIA">Enfermaria</SelectItem>
          </SelectContent>
        </Select>
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
          label="RG e CPF (cópia autenticada) ou Certidão de Nascimento"
          required
          requestType="inclusao_dependente"
          onUpload={(url, name) => handleDocumentUpload("rg_cpf_certidao", url, name)}
          currentFile={getDocument("rg_cpf_certidao")}
        />
        <RequestDocumentUpload
          label="Certidão de Casamento/União Estável (se companheiro/a)"
          requestType="inclusao_dependente"
          onUpload={(url, name) => handleDocumentUpload("certidao_casamento", url, name)}
          currentFile={getDocument("certidao_casamento")}
        />
        <RequestDocumentUpload
          label="Comprovante de Endereço Atualizado"
          required
          requestType="inclusao_dependente"
          onUpload={(url, name) => handleDocumentUpload("comprovante_endereco", url, name)}
          currentFile={getDocument("comprovante_endereco")}
        />
        <RequestDocumentUpload
          label="Contracheque"
          required
          requestType="inclusao_dependente"
          onUpload={(url, name) => handleDocumentUpload("contracheque", url, name)}
          currentFile={getDocument("contracheque")}
        />
      </div>
    </div>
  );
}
