import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const forms = [
  { id: "exclusao-associado", title: "Exclusão de Associado" },
  { id: "exclusao-dependente", title: "Exclusão de Dependente" },
  { id: "inclusao-associado", title: "Inclusão de Associado" },
  { id: "inclusao-dependente", title: "Inclusão de Dependente" },
  { id: "inclusao-recem-nascido", title: "Inclusão de Recém-Nascido" },
  { id: "inscricao-pensionista", title: "Inscrição de Pensionista" },
  { id: "requerimento-21-anos", title: "Requerimento - 21 Anos" },
  { id: "requerimento-diversos", title: "Requerimento - Diversos" },
  { id: "requerimento-reembolso", title: "Requerimento - Reembolso" },
  { id: "termo-ciencia", title: "Termo de Ciência" },
  { id: "termo-opcoes", title: "Termo de Opção" },
];

const printStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: Verdana, Arial, sans-serif;
    font-size: 12px;
    background-color: #fff;
    color: #000;
    line-height: 1.5;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 15mm 20mm;
  }
  .form-content {
    max-width: 100%;
  }
  .form-title {
    text-align: center;
    color: #2a65b4;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: bold;
  }
  .deferimento-space {
    min-height: 80px;
    border: 2px solid #2a65b4;
    border-radius: 5px;
    margin: 15px 0 25px 0;
    padding: 12px 15px;
    background-color: #f0f7ff;
  }
  .titulo-deferimento {
    font-weight: bold;
    color: #2a65b4;
    font-size: 13px;
    margin-bottom: 10px;
    text-align: center;
  }
  .deferimento-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    flex-wrap: wrap;
  }
  .deferimento-opcoes {
    display: flex;
    gap: 25px;
    align-items: center;
  }
  .deferimento-opcao {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    font-size: 13px;
  }
  .deferimento-checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid #2a65b4;
    background-color: white;
    display: inline-block;
  }
  .deferimento-data {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .deferimento-data label {
    font-weight: bold;
    font-size: 12px;
  }
  .form-group {
    margin-bottom: 12px;
  }
  .form-group label {
    display: inline-block;
    margin-bottom: 4px;
    font-weight: bold;
    color: #333;
  }
  .form-group input[type="text"],
  .form-group input[type="email"],
  .form-group textarea {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #999;
    border-radius: 3px;
    font-family: Verdana, Arial, sans-serif;
    font-size: 12px;
    background: #fff;
  }
  .form-group textarea {
    min-height: 80px;
    resize: vertical;
  }
  .inline-input {
    display: inline !important;
    width: auto !important;
    margin: 0 4px;
    padding: 4px 6px !important;
  }
  .checkbox-group, .radio-group {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
    margin: 8px 0;
  }
  .checkbox-group label, .radio-group label {
    font-weight: normal;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  input[type="checkbox"], input[type="radio"] {
    width: 16px;
    height: 16px;
  }
  .section-title {
    font-weight: bold;
    color: #2a65b4;
    margin: 18px 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 13px;
  }
  .info-box {
    background-color: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    margin: 12px 0;
    border-left: 3px solid #2a65b4;
    font-size: 11px;
  }
  .info-box p {
    margin: 5px 0;
  }
  .signature-line {
    margin: 50px 0 30px 0;
    text-align: center;
  }
  .signature-line::before {
    content: "";
    display: block;
    width: 250px;
    margin: 0 auto 8px;
    border-top: 1px solid #000;
  }
  .alert {
    padding: 12px;
    margin: 15px 0;
    border-radius: 4px;
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
  }
  .alert strong {
    color: #856404;
    font-size: 11px;
  }
  p {
    margin: 12px 0;
    text-align: justify;
  }
  .page-break {
    page-break-before: always;
    margin-top: 40px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
  }
  table td, table th {
    padding: 6px;
    border: 1px solid #ddd;
    font-size: 11px;
  }
  table th {
    background-color: #2a65b4;
    color: white;
    text-align: left;
  }
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    body {
      padding: 10mm 15mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

export function ClassicFormsView() {
  const [activeForm, setActiveForm] = useState("exclusao-associado");
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handlePrint = () => {
    if (!formRef.current) return;

    // Captura todos os valores dos campos
    const formContent = formRef.current.cloneNode(true) as HTMLElement;
    const originalInputs = formRef.current.querySelectorAll("input, textarea, select");
    const clonedInputs = formContent.querySelectorAll("input, textarea, select");

    originalInputs.forEach((input, index) => {
      const clonedInput = clonedInputs[index];
      if (input instanceof HTMLInputElement) {
        if (input.type === "checkbox" || input.type === "radio") {
          if (input.checked) {
            (clonedInput as HTMLInputElement).setAttribute("checked", "checked");
          }
        } else {
          clonedInput.setAttribute("value", input.value);
          (clonedInput as HTMLInputElement).value = input.value;
        }
      } else if (input instanceof HTMLTextAreaElement) {
        (clonedInput as HTMLTextAreaElement).textContent = input.value;
        (clonedInput as HTMLTextAreaElement).innerHTML = input.value;
      } else if (input instanceof HTMLSelectElement) {
        (clonedInput as HTMLSelectElement).value = input.value;
      }
    });

    // Remove o botão de imprimir do clone
    const printBtn = formContent.querySelector(".print-button-container");
    if (printBtn) printBtn.remove();

    // Abre nova janela
    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Permita pop-ups para imprimir o formulário.",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Requerimento FUNSEP</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div class="form-content">
          ${formContent.innerHTML}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 shrink-0 bg-card rounded-lg border p-4 lg:p-6 lg:sticky lg:top-6 lg:h-fit">
        <h2 className="text-base lg:text-lg font-semibold mb-4 text-primary border-b-2 border-primary/20 pb-3">
          Selecione o Requerimento
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
          {forms.map((form) => (
            <button
              key={form.id}
              onClick={() => setActiveForm(form.id)}
              className={cn(
                "w-full text-left px-3 py-2 lg:px-4 lg:py-3 rounded-md transition-all text-xs lg:text-sm flex items-center gap-2",
                "hover:bg-primary/10 hover:translate-x-1",
                activeForm === form.id && "bg-primary text-primary-foreground font-semibold"
              )}
            >
              <span className="font-bold hidden lg:inline">▸</span>
              {form.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-card rounded-lg border p-4 sm:p-6 lg:p-8 min-h-[500px]">
        <div ref={formRef}>
          {activeForm === "exclusao-associado" && <ExclusaoAssociadoForm />}
          {activeForm === "exclusao-dependente" && <ExclusaoDependenteForm />}
          {activeForm === "inclusao-associado" && <InclusaoAssociadoForm />}
          {activeForm === "inclusao-dependente" && <InclusaoDependenteForm />}
          {activeForm === "inclusao-recem-nascido" && <InclusaoRecemNascidoForm />}
          {activeForm === "inscricao-pensionista" && <InscricaoPensionistaForm />}
          {activeForm === "requerimento-21-anos" && <Requerimento21AnosForm />}
          {activeForm === "requerimento-diversos" && <RequerimentoDiversosForm />}
          {activeForm === "requerimento-reembolso" && <RequerimentoReembolsoForm />}
          {activeForm === "termo-ciencia" && <TermoCienciaForm />}
          {activeForm === "termo-opcoes" && <TermoOpcaoForm />}
        </div>

        <div className="print-button-container text-center mt-8 pt-6 border-t">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Imprimir
          </button>
        </div>
      </main>
    </div>
  );
}

// Componente base para caixa de deferimento
function DeferimentoBox() {
  return (
    <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 mb-6">
      <div className="text-center font-bold text-primary mb-3">DECISÃO</div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="w-5 h-5 border-2 border-primary bg-white inline-block"></span>
            DEFERIDO
          </div>
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="w-5 h-5 border-2 border-primary bg-white inline-block"></span>
            INDEFERIDO
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="font-bold">Data:</label>
          <input type="text" className="w-10 border border-primary/50 rounded px-1 py-0.5 text-center text-sm" maxLength={2} placeholder="DD" /> /
          <input type="text" className="w-10 border border-primary/50 rounded px-1 py-0.5 text-center text-sm" maxLength={2} placeholder="MM" /> /
          <input type="text" className="w-14 border border-primary/50 rounded px-1 py-0.5 text-center text-sm" maxLength={4} placeholder="AAAA" />
        </div>
      </div>
    </div>
  );
}

// Componente para linha de assinatura
function SignatureLine({ label = "Assinatura" }: { label?: string }) {
  return (
    <div className="my-12 text-center">
      <div className="w-64 border-t border-foreground mx-auto mb-2"></div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

// Componente para alerta de atenção
function AlertBox({ message = "ATENÇÃO: TODOS OS CAMPOS DEVEM SER PREENCHIDOS, PARA ANDAMENTO DA SOLICITAÇÃO." }: { message?: string }) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-6">
      <strong className="text-yellow-800 text-sm">{message}</strong>
    </div>
  );
}

// Componente para caixa de informação
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 border-l-4 border-primary p-4 rounded-r my-4 text-sm">
      {children}
    </div>
  );
}

// ===========================================
// FORMULÁRIOS
// ===========================================

function ExclusaoAssociadoForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        AOS ILUSTRÍSSIMOS DIRETORES DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO DO PARANÁ
      </h2>

      <DeferimentoBox />

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@email.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefone:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="(00) 00000-0000" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo assinado(a), servidor(a) vinculado(a) ao Poder Judiciário do Estado do Paraná, venho, respeitosamente, <strong>REQUERER</strong> a minha <strong>EXCLUSÃO</strong> do quadro de associados do Funsep, juntando para tanto, carteira de sócio.
      </p>

      <p className="text-sm leading-relaxed text-justify">
        Autorizo o Funsep a cobrar através boleto bancário ou outro meio, os valores correspondentes a eventuais despesas de minha responsabilidade que não tenham sido apresentadas até a data do desligamento. Declaro, finalmente, ter ciência de que, em caso de retorno, terei que cumprir os prazos de carência estabelecidos pela Instrução Normativa nº 1/99.
      </p>

      <div className="my-8">
        <p className="font-bold">Nestes Termos,</p>
        <p className="font-bold">Pede deferimento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Em</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" />
        <span>de</span>
        <input type="text" className="w-28 border rounded px-2 py-1" placeholder="mês" />
        <span>de</span>
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine />
      <AlertBox />
    </div>
  );
}

function ExclusaoDependenteForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        AOS ILUSTRÍSSIMOS DIRETORES DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO DO PARANÁ
      </h2>

      <DeferimentoBox />

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@email.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefone:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="(00) 00000-0000" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo assinado(a), servidor(a) vinculado(a) ao Poder Judiciário do Estado do Paraná, venho, respeitosamente, requerer a <strong>EXCLUSÃO</strong> de{" "}
        <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-64" placeholder="nome do dependente" />,{" "}
        meu(minha) dependente, do quadro de associados do Funsep, juntando, para tanto, carteira de beneficiário(a).
      </p>

      <p className="text-sm leading-relaxed text-justify">
        Autorizo o Funsep a cobrar através boleto bancário ou outro meio, os valores correspondentes a eventuais despesas de minha responsabilidade que não tenham sido apresentadas até a data do desligamento. Declaro, finalmente, ter ciência de que, em caso de retorno, o(a) dependente terá que cumprir os prazos de carência estabelecidos pela Instrução Normativa nº 1/99.
      </p>

      <div className="my-8">
        <p className="font-bold">Nestes Termos,</p>
        <p className="font-bold">Pede deferimento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Em</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" />
        <span>de</span>
        <input type="text" className="w-28 border rounded px-2 py-1" placeholder="mês" />
        <span>de</span>
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine />
      <AlertBox />
    </div>
  );
}

function InclusaoAssociadoForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        ILUSTRÍSSIMOS DIRETORES DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO DO PARANÁ
      </h2>

      <DeferimentoBox />

      <p className="text-sm leading-relaxed text-justify">
        <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-64" placeholder="Nome completo" /> abaixo assinado(a), servidor(a) vinculado(a) ao Poder Judiciário do Estado do Paraná, e-mail{" "}
        <input type="email" className="inline border-b border-foreground px-2 py-0.5 w-52" placeholder="email" /> vem, respeitosamente, <strong>REQUERER</strong> a sua <strong>INSCRIÇÃO</strong> no quadro de associados do Funsep, manifestando, desde já, concordância com o desconto, em folha de pagamento, dos valores das mensalidades correspondentes ao Plano e declarando, também: <strong>a)</strong> estar ciente de que, a partir da inscrição para o plano de assistência do Funsep, com a possibilidade de utilização da Unimed-Curitiba, (com participação de 25% em consultas, exames de alto custo, exames de rotina e procedimentos) conforme contrato firmado entre aquela empresa e o referido Fundo, passará a contribuir mensalmente com base em valores definidos por faixa etária e variáveis de acordo com o tipo de acomodação escolhido para internamentos – ( ) <strong>APARTAMENTO</strong> ou ( ) <strong>ENFERMARIA</strong>; e <strong>b)</strong> ter conhecimento dos prazos de carência estabelecidos na Instrução Normativa nº 1/99, editada pelo Conselho Diretor.
      </p>

      <p className="text-sm leading-relaxed text-justify">
        O contrato firmado obedece ao contido na <strong>Lei nº 9656/98</strong> e demais Instruções.
      </p>

      <div className="my-6">
        <p className="font-bold">P. deferimento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Em</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" />
        <span>de</span>
        <input type="text" className="w-28 border rounded px-2 py-1" placeholder="mês" />
        <span>de</span>
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine />
      <AlertBox />

      <InfoBox>
        <p className="font-bold mb-2">OBS:</p>
        <p><strong>1.</strong> Não haverá em hipótese alguma devolução de valores pagos a título de mensalidade.</p>
        <p><strong>2.</strong> Será cobrada na primeira mensalidade uma taxa de inscrição de R$ 30,00 (trinta reais) por pessoa.</p>
        <p><strong>3.</strong> Para que seja efetuada a inscrição é necessário possuir margem consignável junto ao Departamento Econômico e Financeiro do TJ.</p>
      </InfoBox>

      {/* Página 2 - Prazos de Carência */}
      <div className="border-t pt-6 mt-8">
        <h3 className="font-bold text-primary mb-4">Prazos de carência (conforme Instrução Normativa nº 1/99)</h3>
        <InfoBox>
          <p className="mb-3"><strong>- Consultas e exames de patologia clínica</strong> – 30 dias após o pagamento da primeira mensalidade (desconto em folha)</p>
          <p className="mb-3"><strong>- Exames de diagnóstico e terapia, endoscopia diagnóstica em regime ambulatorial, exames radiológicos simples, histocitopatologia, exames e testes alergológicos, oftalmológicos, otorrinolaringológicos (exceto videolaringoestroboscopia), inaloterapia, provas de função pulmonar, teste ergométrico, procedimentos de reabilitação e fisioterapia</strong> - a partir do primeiro dia do terceiro mês seguinte ao pagamento da primeira mensalidade (desconto em folha)</p>
          <p className="mb-3"><strong>- Internamentos clínicos e cirúrgicos, procedimentos cirúrgicos em regime ambulatorial, quimioterapia, radioterapia, hemodiálise e diálise peritoneal, litotripsia, videolaringoscopia cirúrgica, exames e procedimentos especiais</strong> - a partir do primeiro dia do sexto mês seguinte ao pagamento da primeira mensalidade (desconto em folha)</p>
          <p><strong>- Parto a termo</strong> - a partir do primeiro dia do décimo mês seguinte ao pagamento da primeira mensalidade (desconto em folha).</p>
        </InfoBox>
      </div>

      {/* Página 3 - Documentos Necessários */}
      <div className="border-t pt-6 mt-4">
        <h3 className="font-bold text-primary mb-4">Documentos Necessários:</h3>
        <InfoBox>
          <p>- Fotocópia da Carteira de Identidade;</p>
          <p>- Fotocópia do CPF;</p>
          <p>- Certidão de Casamento (original) ou fotocópia autenticada (datada de até 180 dias), ou escritura pública de União Estável, fotocópia autenticada (datada de até 180 dias);</p>
          <p>- Certidão de Nascimento filhos menores (original);</p>
          <p>- Comprovante de residência;</p>
          <p>- Contracheque recente.</p>
          <p className="mt-2"><strong>OBS: Os documentos deverão ser enviados através dos Correios.</strong></p>
        </InfoBox>
      </div>

      {/* Página 4 - Informações Cadastrais */}
      <div className="border-t pt-6 mt-4">
        <h3 className="font-bold text-primary mb-4">INFORMAÇÕES CADASTRAIS:</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block font-bold text-sm mb-1">NOME:</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block font-bold text-sm mb-1">ENDEREÇO:</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">NÚMERO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">APTO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">BAIRRO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">CIDADE:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">ESTADO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">CEP:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">DATA NASCIMENTO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" placeholder="DD/MM/AAAA" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">SEXO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">CPF:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">IDENTIDADE:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-sm mb-1">FILIAÇÃO (Nome da Mãe):</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block font-bold text-sm mb-1">E-mail:</label>
            <input type="email" className="w-full border rounded px-3 py-2" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">TEL (residencial):</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">TEL (comercial):</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">TEL (celular):</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
          </div>
        </div>

        <h3 className="font-bold text-primary mt-6 mb-4">SITUAÇÃO FUNCIONAL:</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">LOTAÇÃO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">CARGO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">MATRÍCULA (TJ):</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">PIS/PASEP:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">BANCO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">CONTA CORRENTE:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">AGÊNCIA:</label>
              <input type="text" className="w-full border rounded px-3 py-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InclusaoDependenteForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        AOS ILUSTRÍSSIMOS DIRETORES DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO DO PARANÁ
      </h2>

      <DeferimentoBox />

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo do titular:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo do titular" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail do titular:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@email.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefone:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="(00) 00000-0000" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Matrícula no Funsep:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo-assinado(a), matrículado(a) nesse Fundo, vem, respeitosamente, <strong>REQUERER</strong> a <strong>inclusão</strong> de{" "}
        <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-64" placeholder="nome do dependente" />,{" "}
        com CPF <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-36" placeholder="000.000.000-00" />,{" "}
        nome da mãe <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-52" placeholder="nome da mãe" />,{" "}
        como seu dependente, conforme comprova os documentos em anexo.
      </p>

      <p className="text-sm leading-relaxed text-justify">
        Declaro, outrossim estar ciente das disposições constantes do regulamento do FUNSEP, notadamente em relação aos prazos de carência.
      </p>

      <div className="mt-4">
        <label className="block font-bold text-sm mb-2">Tipo de acomodação:</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="acomodacao-inc-dep" /> Apartamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="acomodacao-inc-dep" /> Enfermaria
          </label>
        </div>
      </div>

      <div className="my-8">
        <p className="font-bold">Nestes Termos,</p>
        <p className="font-bold">Pede deferimento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Em</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" />
        <span>de</span>
        <input type="text" className="w-28 border rounded px-2 py-1" placeholder="mês" />
        <span>de</span>
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine label="Associado" />
      <AlertBox />

      <InfoBox>
        <p className="font-bold mb-2">Obs:</p>
        <p>1. Não haverá em hipótese alguma devolução de valores pagos a título de mensalidade, nem de taxa de inscrição.</p>
        <p>2. Será cobrada na primeira mensalidade uma taxa de inscrição de R$ 30,00 (trinta reais) por pessoa.</p>
        <p>3. Para que seja efetuada a inscrição é necessário possuir margem consignável junto ao Departamento Econômico e Financeiro do TJ.</p>
      </InfoBox>
    </div>
  );
}

function InclusaoRecemNascidoForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        AO ILMO. SR. DIRETOR DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO
      </h2>

      <DeferimentoBox />

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo do titular:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo do titular" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@email.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Matrícula no Funsep:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo-assinado(a), matriculado(a) nesse Fundo de Saúde, vem, respeitosamente, requerer a inclusão de{" "}
        <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-64" placeholder="nome do recém-nascido" />,{" "}
        como seu(sua) dependente, conforme atestam os documentos em anexo.
      </p>

      <div className="mt-4">
        <label className="block font-bold text-sm mb-2">Tipo de acomodação:</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="acomodacao-recem" /> Apartamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="acomodacao-recem" /> Enfermaria
          </label>
        </div>
      </div>

      <InfoBox>
        <strong>Obs.:</strong> o(a) requerente declara ter ciência de que o prazo para a inscrição, no caso de que trata este pedido, é de 30 (trinta) dias contados da data do nascimento do(a) descendente, após o que vigorarão os prazos de carência previstos em contrato e no Regulamento do Funsep.
      </InfoBox>

      <div className="my-8">
        <p className="font-bold">Nestes Termos,</p>
        <p className="font-bold">Pede deferimento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Curitiba,</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" /> /
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="MM" /> /
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine label="Associado" />
      <AlertBox />

      <InfoBox>
        <strong>Documento necessário:</strong>
        <p>- Certidão de Nascimento (2ª via)</p>
        <p><strong>OBS:</strong> O documento deverá ser enviado através dos Correios.</p>
      </InfoBox>
    </div>
  );
}

function InscricaoPensionistaForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        AOS ILUSTRÍSSIMOS DIRETORES DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO DO PARANÁ
      </h2>

      <DeferimentoBox />

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@email.com" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo assinado(a), vem, respeitosamente, <strong>REQUERER</strong> a sua <strong>inscrição</strong> como pensionista nesse Fundo de Saúde, tendo em vista o falecimento de{" "}
        <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-64" placeholder="nome do falecido" />,{" "}
        conforme cópia de certidão de óbito em anexo.
      </p>

      <p className="text-sm leading-relaxed text-justify">
        Declaro: <strong>a)</strong> que concorda em pagar através boleto bancário os valores correspondentes à mensalidade devida por força da inscrição, definidos em tabela variável por faixa etária e de acordo com o tipo de acomodação escolhido para internamentos - [ ] apartamento ou [ ] enfermaria; e <strong>b)</strong> que tem conhecimento dos prazos de carência estabelecidos na Instrução Normativa nº 1/99.
      </p>

      <div className="my-8">
        <p className="font-bold">Nestes Termos,</p>
        <p className="font-bold">Pede deferimento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Em</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" />
        <span>de</span>
        <input type="text" className="w-28 border rounded px-2 py-1" placeholder="mês" />
        <span>de</span>
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine />
      <AlertBox />

      <InfoBox>
        <p className="font-bold mb-2">Obs:</p>
        <p>1. Não haverá em hipótese alguma devolução de valores pagos a título de mensalidade, nem de taxa de inscrição.</p>
        <p>2. Será cobrada na primeira mensalidade uma taxa de inscrição de R$ 30,00 (trinta reais) por pessoa.</p>
      </InfoBox>
    </div>
  );
}

function Requerimento21AnosForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        À DIRETORIA DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO
      </h2>

      <DeferimentoBox />

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo do titular:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo do titular" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@email.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Matrícula no Funsep:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo-assinado, nesse Fundo de Saúde, vem respeitosamente solicitar a permanência de{" "}
        <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-64" placeholder="nome do dependente" />,{" "}
        meu dependente, conforme comprovantes em anexo, referente ao(s) critério(s) abaixo relacionado(s):
      </p>

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Universitário(a)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Inválido(a)
        </label>
      </div>

      <div className="my-8">
        <p className="font-bold">Nestes Termos,</p>
        <p className="font-bold">Pede deferimento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Curitiba,</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" /> /
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="MM" /> /
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine />
      <AlertBox />

      <InfoBox>
        <p className="font-bold mb-2">Observações:</p>
        <p>- A permanência do dependente maior de 21 anos está condicionada à apresentação de comprovante de matrícula em curso superior ou laudo médico atualizado, conforme o caso.</p>
        <p>- Os documentos deverão ser enviados através dos Correios.</p>
      </InfoBox>
    </div>
  );
}

function RequerimentoDiversosForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        À DIRETORIA DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO
      </h2>

      <DeferimentoBox />

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@email.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Matrícula no Funsep:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo assinado, nesse Fundo de Saúde, vem respeitosamente requerer a Vs.Sªs:
      </p>

      <div>
        <label className="block font-bold text-sm mb-1">Descreva o requerimento:</label>
        <textarea className="w-full border rounded px-3 py-2 min-h-[120px]" placeholder="Descreva aqui o que você está solicitando..."></textarea>
      </div>

      <p className="text-sm leading-relaxed text-justify">
        Conforme comprova com os documentos em anexo.
      </p>

      <div className="my-8">
        <p className="font-bold">Nestes Termos,</p>
        <p className="font-bold">Pede deferimento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Curitiba,</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" /> /
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="MM" /> /
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine />
    </div>
  );
}

function RequerimentoReembolsoForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        REQUERIMENTO PARA REEMBOLSO
      </h2>

      <DeferimentoBox />

      <h3 className="font-bold text-primary border-b pb-2">DADOS DO BENEFICIÁRIO TITULAR DO PLANO</h3>

      <div className="space-y-3">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo:</label>
          <input type="text" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Nº Cartão Unimed:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail contato:</label>
          <input type="email" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefones para contato:</label>
          <input type="text" className="w-full border rounded px-3 py-2" />
        </div>
      </div>

      <h3 className="font-bold text-primary border-b pb-2 mt-6">DADOS DO BENEFICIÁRIO QUE REALIZOU O EVENTO</h3>

      <div className="space-y-3">
        <div>
          <label className="block font-bold text-sm mb-1">Nome completo:</label>
          <input type="text" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Nº Cartão Unimed:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>
      </div>

      <h3 className="font-bold text-primary border-b pb-2 mt-6">MOTIVO DA SOLICITAÇÃO DE REEMBOLSO</h3>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Falta de rede credenciada
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Médico/Prestador não credenciado
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Urgência/Emergência
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Outros:{" "}
          <input type="text" className="border rounded px-2 py-1 w-48" />
        </label>
      </div>

      <div className="mt-4">
        <label className="block font-bold text-sm mb-2">Registrou protocolo de informação?</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="protocolo-reemb" /> Não
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="protocolo-reemb" /> Sim{" "}
            <input type="text" className="border rounded px-2 py-1 w-32" placeholder="Nº do protocolo" />
          </label>
        </div>
      </div>

      <div>
        <label className="block font-bold text-sm mb-1">Valor Solicitado: R$</label>
        <input type="text" className="w-48 border rounded px-3 py-2" />
      </div>

      <div>
        <label className="block font-bold text-sm mb-1">Descrever o motivo da solicitação de reembolso:</label>
        <textarea className="w-full border rounded px-3 py-2 min-h-[80px]"></textarea>
      </div>

      <h3 className="font-bold text-primary border-b pb-2 mt-6">DADOS BANCÁRIOS</h3>

      <InfoBox>
        <strong>Observações:</strong> Nota fiscal deve possuir CNPJ e recibo deve possuir CPF do prestador. Informar a conta corrente do titular. Não é possível conta salário. As informações preenchidas abaixo são de inteira responsabilidade de quem o assina.
      </InfoBox>

      <div className="space-y-3">
        <div>
          <label className="block font-bold text-sm mb-1">Nome do titular da conta:</label>
          <input type="text" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">CPF/CNPJ do titular da conta:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Nome do Banco:</label>
          <input type="text" className="w-full border rounded px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-sm mb-1">Agência (sem o dígito):</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1">Número da Conta (com o dígito):</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" /> Conta Corrente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" /> Poupança
          </label>
        </div>
      </div>

      <p className="text-sm mt-4">
        <strong>*Declaro que as informações prestadas por mim nesse requerimento são verdadeiras e completas.</strong>
      </p>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Em</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" />
        <span>de</span>
        <input type="text" className="w-28 border rounded px-2 py-1" placeholder="mês" />
        <span>de</span>
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine label="Associado" />
    </div>
  );
}

function TermoCienciaForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        TERMO DE CIÊNCIA
      </h2>

      <DeferimentoBox />

      <p className="text-sm leading-relaxed text-justify">
        EU, <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-64" placeholder="Nome completo" />,{" "}
        E-MAIL <input type="email" className="inline border-b border-foreground px-2 py-0.5 w-48" placeholder="email" />,{" "}
        PORTADOR DO RG Nº <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-28" placeholder="0.000.000-0" />{" "}
        E INSCRITO NO CPF SOB Nº <input type="text" className="inline border-b border-foreground px-2 py-0.5 w-32" placeholder="000.000.000-00" />,{" "}
        ASSOCIADO DESTE FUNSEP- FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO – CNPJ 77.750.354/0001-88,
        ESTOU CIENTE QUE O PLANO DE SAÚDE QUE ADQUIRI JUNTO A ESTE FUNDO, É DE CUSTO OPERACIONAL,
        POSSIBILITANDO A UTILIZAÇÃO DA UNIMED-CURITIBA – PLANO DE COBERTURA NACIONAL,
        ATRAVÉS DE SUA REDE DE SERVIÇOS CREDENCIADOS PODENDO REALIZAR CONSULTAS, EXAMES,
        PROCEDIMENTOS, TRATAMENTO CLÍNICO, CIRÚRGICO OU PSIQUIÁTRICO.
      </p>

      <p className="text-sm leading-relaxed text-justify">
        DECLARO TER CONHECIMENTO QUE O REFERIDO CONTRATO ESTABELECIDO ENTRE AS PARTES ACIMA NOMINADAS,
        TORNA O FUNSEP O ÚNICO RESPONSÁVEL PELAS DESPESAS EFETUADAS POR SEUS ASSOCIADOS E EM CASO DE AÇÕES JUDICIAIS,
        O FUNDO É QUE ARCARÁ COM O ÔNUS QUE TAL SITUAÇÃO VENHA A REPRESENTAR.
      </p>

      <p className="text-sm leading-relaxed text-justify">
        EM RELAÇÃO AS NORMAS QUE DISCIPLINAM A UTILIZAÇÃO, DECLARO QUE ESTOU CIENTE, NOTADAMENTE DAS SEGUINTES:
      </p>

      <InfoBox>
        <p><strong>- CONSULTAS –</strong> LIMITADAS A 2 (DUAS) CONSULTAS MÊS, POR INDIVIDUO INSCRITO, COM PARTICIPAÇÃO DE 25% E A PARTIR DA 3ª, DESCONTO DE 100% DO VALOR DE TABELA DA CONSULTA;</p>
        <p><strong>- EXAMES E PROCEDIMENTOS –</strong> COM PARTICIPAÇÃO DE 25% DOS VALORES DE TABELA, INCLUSIVE QUANDO NO INTERNAMENTO HOSPITALAR.</p>
        <p><strong>- FISIOTERAPIA –</strong> LIMITADOS A 10 SESSÕES NO MÊS, COM 25% DE PARTCIPAÇÃO (INCLUSIVE NO INTERNAMENTO HOSPITALAR).</p>
        <p><strong>- FONOAUDIOLOGIA –</strong> LIMITADOS A 4 SESSÕES NO MÊS COM 25% DE PARTICIPAÇÃO (INCLUSIVE NO INTERNAMENTO HOSPITALAR).</p>
        <p><strong>- ACUPUNTURA –</strong> LIMITADA A 4 SESSÕES NO MÊS COM 25% DE PARTICIPAÇÃO.</p>
        <p><strong>- EXAMES DE ALTO CUSTO –</strong> PARTICIPAÇÃO DE 25% DOS VALORES DE TABELA, INCLUSIVE QUANDO NO INTERNAMENTO HOSPITALAR.</p>
      </InfoBox>

      <p className="text-sm leading-relaxed text-justify">
        DECLARO FINALMENTE, QUE RECEBI A INSTRUÇÃO NORMATIVA Nº 1/99 QUE TRATA DO PRAZO CARENCIAL E O MATERIAL SOBRE O FUNSEP, COM AS INFORMAÇÕES SOBRE A FORMA DE FUNCIONAMENTO.
      </p>

      <div className="flex flex-wrap items-center gap-2 text-sm mt-6">
        <span>Em</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" /> /
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="MM" /> /
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine label="RG Nº" />
    </div>
  );
}

function TermoOpcaoForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        TERMO DE OPÇÃO CONVÊNIO FUNSEP/UNIMED-CURITIBA
      </h2>

      <DeferimentoBox />

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-1">Eu,</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-sm mb-1">Matrícula Funsep:</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1">RG:</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1">CPF:</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail:</label>
          <input type="email" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefone:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        DECLARO estar ciente das normas que disciplinam a instituição assistencial e o funcionamento do convênio estabelecido entre o Funsep e a Unimed-Curitiba, OPTANDO pelo tipo de acomodação e faixa etária dos beneficiários, e CONCORDANDO em pagar os valores mensais das respectivas tabelas.
      </p>

      <h3 className="font-bold text-primary mt-6">TITULAR:</h3>
      <div className="flex gap-6 mt-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Apartamento
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Enfermaria
        </label>
      </div>

      {[1, 2, 3, 4, 5].map((num) => (
        <div key={num} className="mt-4">
          <h3 className="font-bold text-primary">DEPENDENTE {num}:</h3>
          <input type="text" className="w-full border rounded px-3 py-2 mt-2" placeholder={`Nome completo do dependente ${num}`} />
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Apartamento
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Enfermaria
            </label>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2 text-sm mt-8">
        <span>Em</span>
        <input type="text" className="w-12 border rounded px-2 py-1 text-center" maxLength={2} placeholder="DD" /> /
        <input type="text" className="w-28 border rounded px-2 py-1" placeholder="mês" /> /
        <input type="text" className="w-16 border rounded px-2 py-1 text-center" maxLength={4} placeholder="AAAA" />
      </div>

      <SignatureLine label="Titular" />
      <AlertBox />
    </div>
  );
}
