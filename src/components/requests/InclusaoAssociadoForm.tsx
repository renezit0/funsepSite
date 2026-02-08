import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RequestDocumentUpload } from "@/components/RequestDocumentUpload";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useFeedback } from "@/contexts/FeedbackContext";

interface FormProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  handleDocumentUpload: (docType: string, url: string, fileName: string) => void;
  getDocument: (docType: string) => any;
}

export function InclusaoAssociadoForm({ formData, updateFormData, handleDocumentUpload, getDocument }: FormProps) {
  const [numDependentes, setNumDependentes] = useState(0);
  const { mostrarToast } = useFeedback();

  const validateField = (fieldName: string, fieldLabel: string) => {
    if (!formData[fieldName] || (typeof formData[fieldName] === "string" && formData[fieldName].trim() === "")) {
      mostrarToast("erro", `Por favor, preencha o campo: ${fieldLabel}`);
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Taxa de inscrição: R$ 30,00 por pessoa. Prazos de carência: Consultas (30 dias), Exames diagnósticos (3 meses), Internamentos/cirurgias (6 meses), Parto (10 meses).
        </AlertDescription>
      </Alert>

      {/* DADOS DO TITULAR */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-lg">Dados do Titular</h3>
        
        <div className="space-y-2">
          <Label>Nome Completo *</Label>
          <Input value={formData.nome || ""} onChange={(e) => updateFormData("nome", e.target.value)} required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CPF *</Label>
            <Input value={formData.cpf || ""} onChange={(e) => updateFormData("cpf", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Data de Nascimento *</Label>
            <Input type="date" value={formData.dtnasc || ""} onChange={(e) => updateFormData("dtnasc", e.target.value)} required />
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
          <Label>Nome da Mãe *</Label>
          <Input value={formData.nomemae || ""} onChange={(e) => updateFormData("nomemae", e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>RG (Número) *</Label>
          <Input value={formData.identidade || ""} onChange={(e) => updateFormData("identidade", e.target.value)} required />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>UF RG *</Label>
            <Input value={formData.orgemi || ""} onChange={(e) => updateFormData("orgemi", e.target.value)} maxLength={2} required />
          </div>
          <div className="space-y-2">
            <Label>Data Expedição *</Label>
            <Input type="date" value={formData.dtemirg || ""} onChange={(e) => updateFormData("dtemirg", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Órgão Expedidor *</Label>
            <Input value={formData.orgemi_nome || ""} onChange={(e) => updateFormData("orgemi_nome", e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Endereço (Rua) *</Label>
          <Input value={formData.endereco || ""} onChange={(e) => updateFormData("endereco", e.target.value)} required />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Número *</Label>
            <Input value={formData.numero || ""} onChange={(e) => updateFormData("numero", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Complemento/Apto</Label>
            <Input value={formData.complemento || ""} onChange={(e) => updateFormData("complemento", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bairro *</Label>
            <Input value={formData.bairro || ""} onChange={(e) => updateFormData("bairro", e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Cidade *</Label>
            <Input value={formData.cidade || ""} onChange={(e) => updateFormData("cidade", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Estado *</Label>
            <Input value={formData.uf || ""} onChange={(e) => updateFormData("uf", e.target.value)} maxLength={2} required />
          </div>
          <div className="space-y-2">
            <Label>CEP *</Label>
            <Input value={formData.cep || ""} onChange={(e) => updateFormData("cep", e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Telefone Residencial *</Label>
            <Input value={formData.telefone_residencial || ""} onChange={(e) => updateFormData("telefone_residencial", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Telefone Comercial *</Label>
            <Input value={formData.telefone_comercial || ""} onChange={(e) => updateFormData("telefone_comercial", e.target.value)} required />
          </div>
        </div>
      </div>

      {/* DADOS DO SERVIDOR */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-lg">Dados do Servidor</h3>

        <div className="space-y-2">
          <Label>Tipo de Servidor *</Label>
          <Select value={formData.tipofunc || ""} onValueChange={(v) => updateFormData("tipofunc", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ESTATUTARIO">Estatutário</SelectItem>
              <SelectItem value="SERVENTUARIO">Serventuário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Plano *</Label>
          <Select value={formData.plano || ""} onValueChange={(v) => updateFormData("plano", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PLANO_II_ESPECIAL">Plano II Especial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Lotação *</Label>
            <Input value={formData.localtrab || ""} onChange={(e) => updateFormData("localtrab", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Cargo *</Label>
            <Input value={formData.cargo || ""} onChange={(e) => updateFormData("cargo", e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Matrícula (TJ) *</Label>
            <Input value={formData.matrfunc || ""} onChange={(e) => updateFormData("matrfunc", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>PIS/PASEP *</Label>
            <Input value={formData.pispasep || ""} onChange={(e) => updateFormData("pispasep", e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Banco *</Label>
            <Input value={formData.banco || ""} onChange={(e) => updateFormData("banco", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Agência *</Label>
            <Input value={formData.agencia || ""} onChange={(e) => updateFormData("agencia", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Conta Corrente *</Label>
            <Input value={formData.contacorr || ""} onChange={(e) => updateFormData("contacorr", e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Acomodação *</Label>
          <Select value={formData.tipacomoda || ""} onValueChange={(v) => updateFormData("tipacomoda", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="APARTAMENTO">Apartamento</SelectItem>
              <SelectItem value="ENFERMARIA">Enfermaria</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DADOS DOS DEPENDENTES */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Dados dos Dependentes (até 6)</h3>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setNumDependentes(Math.max(0, numDependentes - 1))}
              disabled={numDependentes === 0}
            >
              -
            </Button>
            <span className="px-3 py-1">{numDependentes}</span>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setNumDependentes(Math.min(6, numDependentes + 1))}
              disabled={numDependentes === 6}
            >
              +
            </Button>
          </div>
        </div>

        {Array.from({ length: numDependentes }).map((_, index) => (
          <div key={index} className="p-4 border rounded-md space-y-4">
            <h4 className="font-semibold">Dependente {index + 1}</h4>
            
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData[`dep${index}_nome`] || ""}
                onChange={(e) => updateFormData(`dep${index}_nome`, e.target.value)}
                onBlur={() => validateField(`dep${index}_nome`, `Nome Completo (Dependente ${index + 1})`)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parentesco *</Label>
                <Select
                  value={formData[`dep${index}_parentesco`] || ""}
                  onValueChange={(v) => {
                    updateFormData(`dep${index}_parentesco`, v);
                    if (!v) {
                      mostrarToast("erro", `Por favor, selecione o Parentesco (Dependente ${index + 1})`);
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONJUGE">Cônjuge</SelectItem>
                    <SelectItem value="FILHO">Filho(a)</SelectItem>
                    <SelectItem value="ENTEADO">Enteado(a)</SelectItem>
                    <SelectItem value="MENOR_TUTELA">Menor sob tutela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sexo *</Label>
                <Select
                  value={formData[`dep${index}_sexo`] || ""}
                  onValueChange={(v) => {
                    updateFormData(`dep${index}_sexo`, v);
                    if (!v) {
                      mostrarToast("erro", `Por favor, selecione o Sexo (Dependente ${index + 1})`);
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Nascimento *</Label>
                <Input
                  type="date"
                  value={formData[`dep${index}_dtnasc`] || ""}
                  onChange={(e) => updateFormData(`dep${index}_dtnasc`, e.target.value)}
                  onBlur={() => validateField(`dep${index}_dtnasc`, `Data de Nascimento (Dependente ${index + 1})`)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input
                  value={formData[`dep${index}_cpf`] || ""}
                  onChange={(e) => updateFormData(`dep${index}_cpf`, e.target.value)}
                  onBlur={() => validateField(`dep${index}_cpf`, `CPF (Dependente ${index + 1})`)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome da Mãe *</Label>
              <Input
                value={formData[`dep${index}_nomemae`] || ""}
                onChange={(e) => updateFormData(`dep${index}_nomemae`, e.target.value)}
                onBlur={() => validateField(`dep${index}_nomemae`, `Nome da Mãe (Dependente ${index + 1})`)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>RG (Número) *</Label>
                <Input
                  value={formData[`dep${index}_rg`] || ""}
                  onChange={(e) => updateFormData(`dep${index}_rg`, e.target.value)}
                  onBlur={() => validateField(`dep${index}_rg`, `RG (Dependente ${index + 1})`)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data Expedição *</Label>
                <Input
                  type="date"
                  value={formData[`dep${index}_rg_data`] || ""}
                  onChange={(e) => updateFormData(`dep${index}_rg_data`, e.target.value)}
                  onBlur={() => validateField(`dep${index}_rg_data`, `Data Expedição RG (Dependente ${index + 1})`)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>UF/Órgão *</Label>
                <Input
                  value={formData[`dep${index}_rg_orgao`] || ""}
                  onChange={(e) => updateFormData(`dep${index}_rg_orgao`, e.target.value)}
                  onBlur={() => validateField(`dep${index}_rg_orgao`, `UF/Órgão (Dependente ${index + 1})`)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profissão *</Label>
                <Input
                  value={formData[`dep${index}_profissao`] || ""}
                  onChange={(e) => updateFormData(`dep${index}_profissao`, e.target.value)}
                  onBlur={() => validateField(`dep${index}_profissao`, `Profissão (Dependente ${index + 1})`)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Escolaridade *</Label>
                <Input
                  value={formData[`dep${index}_escolaridade`] || ""}
                  onChange={(e) => updateFormData(`dep${index}_escolaridade`, e.target.value)}
                  onBlur={() => validateField(`dep${index}_escolaridade`, `Escolaridade (Dependente ${index + 1})`)}
                  placeholder="Ensino Fundamental, Médio, Superior, etc."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Acomodação *</Label>
              <Select
                value={formData[`dep${index}_acomoda`] || ""}
                onValueChange={(v) => {
                  updateFormData(`dep${index}_acomoda`, v);
                  if (!v) {
                    mostrarToast("erro", `Por favor, selecione o Tipo de Acomodação (Dependente ${index + 1})`);
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
          </div>
        ))}
      </div>

      {/* OBSERVAÇÕES */}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea 
          value={formData.observacoes || ""} 
          onChange={(e) => updateFormData("observacoes", e.target.value)}
          placeholder="Informações adicionais"
          rows={3}
        />
      </div>

      {/* DOCUMENTOS OBRIGATÓRIOS */}
      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold">Documentos Obrigatórios</h3>
        <RequestDocumentUpload
          label="RG e CPF (cópia autenticada)"
          required
          requestType="inclusao_associado"
          onUpload={(url, name) => handleDocumentUpload("rg_cpf", url, name)}
          currentFile={getDocument("rg_cpf")}
        />
        <RequestDocumentUpload
          label="Comprovante de Endereço Atualizado"
          required
          requestType="inclusao_associado"
          onUpload={(url, name) => handleDocumentUpload("comprovante_endereco", url, name)}
          currentFile={getDocument("comprovante_endereco")}
        />
        <RequestDocumentUpload
          label="Contracheque"
          required
          requestType="inclusao_associado"
          onUpload={(url, name) => handleDocumentUpload("contracheque", url, name)}
          currentFile={getDocument("contracheque")}
        />
        <RequestDocumentUpload
          label="Certidão de Casamento/União Estável (se aplicável)"
          requestType="inclusao_associado"
          onUpload={(url, name) => handleDocumentUpload("certidao_casamento", url, name)}
          currentFile={getDocument("certidao_casamento")}
        />
      </div>
    </div>
  );
}
