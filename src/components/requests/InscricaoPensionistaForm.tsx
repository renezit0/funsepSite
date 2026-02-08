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

export function InscricaoPensionistaForm({ formData, updateFormData, handleDocumentUpload, getDocument }: FormProps) {
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
          Taxa de inscrição: R$ 30,00. Pagamento via boleto bancário. Mesmos prazos de carência.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Nome do Requerente *</Label>
        <Input 
          value={formData.nome_requerente || formData.nome} 
          onChange={(e) => updateFormData("nome_requerente", e.target.value)} 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label>Nome do Falecido *</Label>
        <Input 
          value={formData.nome_falecido || ""} 
          onChange={(e) => updateFormData("nome_falecido", e.target.value)} 
          required 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CPF *</Label>
          <Input 
            value={formData.cpf || ""} 
            onChange={(e) => updateFormData("cpf", e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>Data de Nascimento *</Label>
          <Input 
            type="date" 
            value={formData.dtnasc || ""} 
            onChange={(e) => updateFormData("dtnasc", e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sexo *</Label>
          <Select value={formData.sexo || ""} onValueChange={(v) => updateFormData("sexo", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estado Civil *</Label>
          <Select value={formData.estcivil || ""} onValueChange={(v) => updateFormData("estcivil", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Solteiro(a)</SelectItem>
              <SelectItem value="2">Casado(a)</SelectItem>
              <SelectItem value="3">Divorciado(a)</SelectItem>
              <SelectItem value="4">Viúvo(a)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço Completo *</Label>
        <Input 
          value={formData.endereco || ""} 
          onChange={(e) => updateFormData("endereco", e.target.value)} 
          required 
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Número *</Label>
          <Input 
            value={formData.numero || ""} 
            onChange={(e) => updateFormData("numero", e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>Bairro *</Label>
          <Input 
            value={formData.bairro || ""} 
            onChange={(e) => updateFormData("bairro", e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>Cidade *</Label>
          <Input 
            value={formData.cidade || ""} 
            onChange={(e) => updateFormData("cidade", e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado *</Label>
          <Input 
            value={formData.uf || ""} 
            onChange={(e) => updateFormData("uf", e.target.value)} 
            maxLength={2} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>CEP *</Label>
          <Input 
            value={formData.cep || ""} 
            onChange={(e) => updateFormData("cep", e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Servidor (Falecido) *</Label>
        <Select value={formData.tipo_servidor || ""} onValueChange={(v) => updateFormData("tipo_servidor", v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ESTATUTARIO">Estatutário</SelectItem>
            <SelectItem value="SERVENTUARIO">Serventuário</SelectItem>
          </SelectContent>
        </Select>
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
        <Label>Data *</Label>
        <Input 
          type="date" 
          value={formData.data || ""} 
          onChange={(e) => updateFormData("data", e.target.value)} 
          required 
        />
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold">Documentos Obrigatórios</h3>
        <RequestDocumentUpload
          label="Certidão de Óbito (2ª via)"
          required
          requestType="inscricao_pensionista"
          onUpload={(url, name) => handleDocumentUpload("certidao_obito", url, name)}
          currentFile={getDocument("certidao_obito")}
        />
        <RequestDocumentUpload
          label="RG e CPF (cópia autenticada)"
          required
          requestType="inscricao_pensionista"
          onUpload={(url, name) => handleDocumentUpload("rg_cpf", url, name)}
          currentFile={getDocument("rg_cpf")}
        />
        <RequestDocumentUpload
          label="Comprovante de Endereço Atualizado"
          required
          requestType="inscricao_pensionista"
          onUpload={(url, name) => handleDocumentUpload("comprovante_endereco", url, name)}
          currentFile={getDocument("comprovante_endereco")}
        />
        <RequestDocumentUpload
          label="Contracheque do Paraná Previdência"
          required
          requestType="inscricao_pensionista"
          onUpload={(url, name) => handleDocumentUpload("contracheque_previdencia", url, name)}
          currentFile={getDocument("contracheque_previdencia")}
        />
      </div>
    </div>
  );
}
