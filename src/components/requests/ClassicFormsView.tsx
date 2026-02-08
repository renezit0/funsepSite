import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useFeedback } from "@/contexts/FeedbackContext";

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
    padding: 15mm 20mm 20mm 20mm;
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
    page-break-inside: avoid;
    break-inside: avoid;
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
  .inline-field {
    display: inline-block;
    width: auto;
    padding: 4px 8px;
    border: 1px solid #999;
    border-radius: 4px;
    background: #fff;
    vertical-align: baseline;
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
    margin: 24px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #2a65b4;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    page-break-after: avoid;
    break-after: avoid;
  }
  .info-box {
    background-color: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    margin: 12px 0;
    border-left: 3px solid #2a65b4;
    font-size: 11px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .info-box p {
    margin: 5px 0;
  }
  .signature-line, .signature-block {
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
  .signature-block p {
    text-align: center;
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
  /* Evitar que inputs inline sejam separados do texto */
  .inline-field, input.inline-field {
    white-space: nowrap;
  }
  span:has(+ input.inline-field),
  span:has(+ .inline-field) {
    white-space: nowrap;
  }
  .page-break {
    page-break-before: always;
    break-before: page;
    margin-top: 40px;
  }
  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
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
    .no-print {
      display: none !important;
    }
    .avoid-break, .info-box, .deferimento-space {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-before: auto;
      page-break-after: auto;
    }
    .section-title, h3 {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .page-break {
      page-break-before: always !important;
      break-before: page !important;
    }
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }
    body {
      padding: 0;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

interface ClassicFormsViewProps {
  initialFormId?: string | null;
  hideSidebar?: boolean;
}

// Função para obter data no horário de Brasília
const getBrasiliaDate = (): { dia: string; mes: string; mesNome: string; ano: string } => {
  const brasiliaDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const dia = String(brasiliaDate.getDate()).padStart(2, '0');
  const mes = String(brasiliaDate.getMonth() + 1).padStart(2, '0');
  const ano = String(brasiliaDate.getFullYear());
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const mesNome = meses[brasiliaDate.getMonth()];
  return { dia, mes, mesNome, ano };
};

export function ClassicFormsView({ initialFormId, hideSidebar = false }: ClassicFormsViewProps) {
  const [activeForm, setActiveForm] = useState(initialFormId || "exclusao-associado");
  const formRef = useRef<HTMLDivElement>(null);
  const { mostrarToast } = useFeedback();

  const scopedStyles = `
    .classic-forms-scope input[type="text"],
    .classic-forms-scope input[type="email"],
    .classic-forms-scope textarea,
    .classic-forms-scope select {
      border: 1px solid hsl(var(--border));
      border-radius: 0.5rem;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      font-size: 0.875rem;
      line-height: 1.25rem;
    }

    .classic-forms-scope input[type="text"],
    .classic-forms-scope input[type="email"],
    .classic-forms-scope select {
      min-height: 2.5rem;
      padding: 0.5rem 0.75rem;
    }

    .classic-forms-scope textarea {
      padding: 0.5rem 0.75rem;
    }

    .classic-forms-scope input[type="text"]::placeholder,
    .classic-forms-scope input[type="email"]::placeholder,
    .classic-forms-scope textarea::placeholder {
      color: hsl(var(--muted-foreground));
      opacity: 0.85;
    }

    .classic-forms-scope input[type="text"]:focus,
    .classic-forms-scope input[type="email"]:focus,
    .classic-forms-scope textarea:focus,
    .classic-forms-scope select:focus {
      outline: none;
      border-color: hsl(var(--ring));
      box-shadow: 0 0 0 3px hsl(var(--ring) / 0.28);
    }

    /* Campos inline (no meio do texto) */
    .classic-forms-scope input.inline {
      min-height: auto;
      padding: 0 0.35rem;
      border-radius: 0;
      border: none;
      border-bottom: 1px solid hsl(var(--border));
      background: transparent;
    }

    /* Campo inline no padrão do formulário (box) */
    .classic-forms-scope .inline-field {
      display: inline-block;
      min-height: 2rem;
      padding: 0.25rem 0.5rem;
      border: 1px solid hsl(var(--border));
      border-radius: 0.5rem;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      vertical-align: baseline;
    }

    .classic-forms-scope .inline-field:focus {
      outline: none;
      border-color: hsl(var(--ring));
      box-shadow: 0 0 0 3px hsl(var(--ring) / 0.28);
    }
  `;

  const getPrintableStylesHtml = () => {
    const stylesheetLinks = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']"))
      .map((l) => `<link rel="stylesheet" href="${l.href}">`)
      .join("\n");

    const inlineStyles = Array.from(document.querySelectorAll<HTMLStyleElement>("style"))
      .map((s) => `<style>${s.textContent ?? ""}</style>`)
      .join("\n");

    // Inclui também os estilos escopados (inputs/visual padrão)
    const extra = `<style>${scopedStyles}\n${printStyles}</style>`;

    return `${stylesheetLinks}\n${inlineStyles}\n${extra}`;
  };

  const validateRequiredFields = (): boolean => {
    if (!formRef.current) return true;

    const container = formRef.current;

    // Por padrão: todo input/textarea/select (exceto checkbox/radio/botão/hidden) é obrigatório,
    // a menos que esteja marcado como opcional.
    const autoCandidates = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")
    ).filter((el) => {
      if (el.hasAttribute("disabled")) return false;
      if (el.getAttribute("aria-hidden") === "true") return false;
      if (el.hasAttribute("data-optional")) return false;
      if (el.closest("[data-optional-scope='true']")) return false;

      if (el instanceof HTMLInputElement) {
        const t = (el.type || "text").toLowerCase();
        if (t === "checkbox" || t === "radio" || t === "button" || t === "submit" || t === "reset" || t === "hidden") {
          return false;
        }
      }

      return true;
    });

    // Campos marcados explicitamente como obrigatórios (ex.: checkbox/radio)
    const explicitRequired = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[data-required='true']")
    ).filter((el) => !el.hasAttribute("data-optional") && !el.closest("[data-optional-scope='true']"));

    const requiredEls = Array.from(new Set([...autoCandidates, ...explicitRequired]));

    // Limpa marcações anteriores
    requiredEls.forEach((el) => {
      el.classList.remove("ring-2", "ring-red-500", "border-red-500", "bg-red-50");
      el.removeAttribute("aria-invalid");
    });

    const isEmpty = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
      if (el instanceof HTMLInputElement) {
        if (el.type === "checkbox" || el.type === "radio") return !el.checked;
        return !el.value || el.value.trim() === "";
      }
      if (el instanceof HTMLTextAreaElement) return !el.value || el.value.trim() === "";
      return !el.value;
    };

    const firstInvalid = requiredEls.find(isEmpty) || null;

    if (firstInvalid) {
      requiredEls.forEach((el) => {
        if (isEmpty(el)) {
          el.classList.add("ring-2", "ring-red-500", "border-red-500", "bg-red-50");
          el.setAttribute("aria-invalid", "true");
        }
      });

      mostrarToast("erro", "Preencha os campos em branco (eles serão destacados) antes de imprimir.");

      try {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        // noop
      }

      if (typeof (firstInvalid as any).focus === "function") {
        (firstInvalid as any).focus();
      }

      return false;
    }

    return true;
  };

  // (removido) copyStylesToPrintWindow: agora os estilos são injetados direto no HTML do print

  // Atualizar activeForm quando initialFormId mudar
  useEffect(() => {
    if (initialFormId) {
      setActiveForm(initialFormId);
    }
  }, [initialFormId]);

  const handlePrint = () => {
    if (!formRef.current) return;
    if (!validateRequiredFields()) return;

    // Preencher data automaticamente (horário de Brasília) SOMENTE para o campo de data final do formulário, NÃO para o campo de decisão
    const { dia, mes, mesNome, ano } = getBrasiliaDate();
    // Seleciona apenas o grupo de inputs de data que NÃO está dentro do DeferimentoBox (decisão)
    const mainDateRow = Array.from(formRef.current.querySelectorAll<HTMLDivElement>(".flex.flex-wrap.items-center.gap-2.text-sm"))
      .filter(div => !div.closest("[data-optional-scope='true']"))[0];
    if (mainDateRow) {
      const inputs = mainDateRow.querySelectorAll<HTMLInputElement>("input[type='text']");
      inputs.forEach((input) => {
        const placeholder = input.placeholder?.toLowerCase() || "";
        const isEmpty = !input.value || input.value.trim() === "";
        if (isEmpty) {
          if (placeholder === "dd") {
            input.value = dia;
          } else if (placeholder === "mm" || placeholder === "mês" || placeholder === "mês" || placeholder === "mes") {
            input.value = mesNome;
          } else if (placeholder === "aaaa") {
            input.value = ano;
          }
        }
      });
    }

    // Captura todos os valores dos campos
    const formContent = formRef.current.cloneNode(true) as HTMLElement;
    const originalInputs = formRef.current.querySelectorAll("input, textarea, select");
    const clonedInputs = formContent.querySelectorAll("input, textarea, select");

    // Substituir os inputs de data finais por texto preenchido
    const { dia: diaClone, mesNome: mesNomeClone, ano: anoClone } = getBrasiliaDate();
    // Seleciona o grupo de data final (fora do DeferimentoBox)
    const mainDateRowClone = Array.from(formContent.querySelectorAll<HTMLDivElement>(".flex.flex-wrap.items-center.gap-2.text-sm"))
      .filter(div => !div.closest("[data-optional-scope='true']"))[0];
    if (mainDateRowClone) {
      // Substitui os inputs por spans com a data
      const dateInputs = mainDateRowClone.querySelectorAll<HTMLInputElement>("input[type='text']");
      dateInputs.forEach((input) => {
        const placeholder = input.placeholder?.toLowerCase() || "";
        let value = input.value;
        if (!value || value.trim() === "") {
          if (placeholder === "dd") value = diaClone;
          else if (placeholder === "mm" || placeholder === "mês" || placeholder === "mes") value = mesNomeClone;
          else if (placeholder === "aaaa") value = anoClone;
        }
        const span = document.createElement("span");
        span.textContent = value;
        input.replaceWith(span);
      });
    }

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
      mostrarToast("erro", "Permita pop-ups para imprimir o formulário.");
      return;
    }

    const htmlClass = document.documentElement.className || "";
    const bodyClass = document.body.className || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR" class="${htmlClass}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Requerimento FUNSEP</title>
        <base href="${window.location.origin}/">
        ${getPrintableStylesHtml()}
        <style>
          .print-button-overlay {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #2a65b4;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            transition: all 0.2s;
          }
          .print-button-overlay:hover {
            background: #1e4a8a;
            transform: scale(1.05);
          }
          @media print {
            .print-button-overlay {
              display: none !important;
            }
          }
        </style>
      </head>
      <body class="${bodyClass}">
        <button class="print-button-overlay no-print" onclick="window.print()">🖨️ Imprimir Formulário</button>
        <div class="form-content">
          ${formContent.innerHTML}
        </div>
        <script>
          (function () {
            function waitAndPrint() {
              try {
                var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
                var pending = links.length;
                var done = function () {
                  pending--;
                  if (pending <= 0) {
                    setTimeout(function () { window.print(); }, 100);
                  }
                };
                if (!pending) {
                  setTimeout(function () { window.print(); }, 100);
                  return;
                }
                links.forEach(function (l) {
                  l.addEventListener('load', done);
                  l.addEventListener('error', done);
                });
                // Fallback: imprime mesmo que algum CSS não carregue
                setTimeout(function () { window.print(); }, 1200);
              } catch (e) {
                setTimeout(function () { window.print(); }, 200);
              }
            }
            window.addEventListener('load', function () {
              setTimeout(waitAndPrint, 50);
            });
          })();
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="classic-forms-scope flex flex-col lg:flex-row gap-6">
      <style>{scopedStyles}</style>
      {/* Sidebar - Esconder quando hideSidebar for true */}
      {!hideSidebar && (
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
      )}

      {/* Content */}
      <main className={cn(
        "bg-card rounded-lg border p-4 sm:p-6 lg:p-8 min-h-[500px]",
        hideSidebar ? "w-full" : "flex-1"
      )}>
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
    <div className="avoid-break border-2 border-primary rounded-lg p-4 bg-primary/5 mb-6" data-optional-scope="true">
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
          <input type="text" data-optional="true" className="w-10 border border-primary/50 rounded px-1 py-0.5 text-center text-sm" maxLength={2} placeholder="" /> /
          <input type="text" data-optional="true" className="w-10 border border-primary/50 rounded px-1 py-0.5 text-center text-sm" maxLength={2} placeholder="" /> /
          <input type="text" data-optional="true" className="w-14 border border-primary/50 rounded px-1 py-0.5 text-center text-sm" maxLength={4} placeholder="" />
        </div>
      </div>
    </div>
  );
}

// Componente para linha de assinatura
function SignatureLine({ label = "Assinatura" }: { label?: string }) {
  return (
    <div className="signature-block avoid-break mt-8 mb-12 pt-10 text-center">
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
    <div className="avoid-break bg-muted/50 border-l-4 border-primary p-4 rounded-r my-4 text-sm">
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
          <label className="block font-bold text-sm mb-1">Nome completo: <span className="text-red-600">*</span></label>
          <input type="text" data-required="true" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome completo" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">E-mail: <span className="text-red-600">*</span></label>
          <input type="email" data-required="true" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="seu@email.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefone: <span className="text-red-600">*</span></label>
          <input type="text" data-required="true" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="(00) 00000-0000" />
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
        <span>Em <span className="text-red-600">*</span></span>
        <input type="text" data-required="true" className="w-12 border rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-primary/30" maxLength={2} placeholder="DD" />
        <span>de</span>
        <input type="text" data-required="true" className="w-28 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="mês" />
        <span>de</span>
        <input type="text" data-required="true" className="w-16 border rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-primary/30" maxLength={4} placeholder="AAAA" />
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
          <label className="block font-bold text-sm mb-1">E-mail particular:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@emailparticular.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefone:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="(00) 00000-0000" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Celular:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="(00) 00000-0000" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo assinado(a), servidor(a) vinculado(a) ao Poder Judiciário do Estado do Paraná, venho, respeitosamente, requerer a <strong>EXCLUSÃO</strong> de{" "}
        <input type="text" className="inline-field w-64" placeholder="nome do dependente" />,{" "}
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
  const [dependentes, setDependentes] = useState<Array<{ id: string }>>([]);
  const [acomodacao, setAcomodacao] = useState<"APARTAMENTO" | "ENFERMARIA" | "">("");

  const addDependente = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto.randomUUID as () => string)()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setDependentes((prev) => [...prev, { id }]);
  };

  const removeDependente = (id: string) => {
    setDependentes((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-center text-primary font-bold text-base sm:text-lg mb-6">
        ILUSTRÍSSIMOS DIRETORES DO FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO DO PARANÁ
      </h2>

      <DeferimentoBox />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-sm mb-1">
            Nome completo <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            data-required="true"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Nome completo"
          />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">
            E-mail <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            data-required="true"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block font-bold text-sm mb-2">
          Tipo de acomodação <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-inclusao"
              checked={acomodacao === "APARTAMENTO"}
              onChange={() => setAcomodacao("APARTAMENTO")}
            />
            Apartamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-inclusao"
              checked={acomodacao === "ENFERMARIA"}
              onChange={() => setAcomodacao("ENFERMARIA")}
            />
            Enfermaria
          </label>
        </div>
        {/* Corrigir validação: só precisa de UM marcado, não ambos */}
        <input type="hidden" data-required="true" value={acomodacao ? "ok" : ""} />
      </div>

      <p className="text-sm leading-relaxed text-justify">
        Abaixo assinado(a), servidor(a) vinculado(a) ao Poder Judiciário do Estado do Paraná, vem, respeitosamente, <strong>REQUERER</strong> a sua <strong>INSCRIÇÃO</strong> no quadro de associados do Funsep, manifestando, desde já, concordância com o desconto, em folha de pagamento, dos valores das mensalidades correspondentes ao Plano e declarando, também: <strong>a)</strong> estar ciente de que, a partir da inscrição para o plano de assistência do Funsep, com a possibilidade de utilização da Unimed-Curitiba, (com participação de 25% em consultas, exames de alto custo, exames de rotina e procedimentos) conforme contrato firmado entre aquela empresa e o referido Fundo, passará a contribuir mensalmente com base em valores definidos por faixa etária e variáveis de acordo com o tipo de acomodação escolhido para internamentos – ({acomodacao === "APARTAMENTO" ? "X" : " "}) <strong>APARTAMENTO</strong> ou ({acomodacao === "ENFERMARIA" ? "X" : " "}) <strong>ENFERMARIA</strong>; e <strong>b)</strong> ter conhecimento dos prazos de carência estabelecidos na Instrução Normativa nº 1/99, editada pelo Conselho Diretor.
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
          <p className="mb-3"><strong>- Consultas e exames de patologia clínica</strong> – 30 dias após o primeiro desconto (ex.: 1º desconto em janeiro, uso a partir de 1º de março)</p>
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
            <input type="text" className="w-full border rounded px-3 py-2" data-optional="true" />
          </div>

          <div>
            <label className="block font-bold text-sm mb-1">ENDEREÇO:</label>
            <input type="text" className="w-full border rounded px-3 py-2" data-optional="true" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-sm mb-1">NÚMERO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" data-optional="true" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">APTO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" data-optional="true" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-1">BAIRRO:</label>
              <input type="text" className="w-full border rounded px-3 py-2" data-optional="true" />
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

      {/* Dependentes (opcional) - manter no final */}
      <div className="page-break">
        <h3 className="font-bold text-primary mb-3">DEPENDENTES (OPCIONAL)</h3>

        <div className="no-print">
          <InfoBox>
            <p className="mb-3">
              Se desejar, clique em <strong>Adicionar dependente</strong>. Ao imprimir, a relação de dependentes será incluída.
            </p>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={addDependente}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                + Adicionar dependente
              </button>
            </div>
          </InfoBox>
        </div>

        {dependentes.length > 0 && (
          <div className="mt-6">

            <div className="space-y-4">
              {dependentes.map((dep, idx) => (
                <div key={dep.id} className="avoid-break relative rounded-lg border bg-muted/30 p-4">
                  <div className="no-print absolute right-3 top-3">
                    <button
                      type="button"
                      onClick={() => removeDependente(dep.id)}
                      className="px-3 py-1.5 text-sm font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Remover
                    </button>
                  </div>

                  <p className="font-bold text-sm text-primary mb-4">Dependente {idx + 1}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-sm mb-1">Nome completo:</label>
                      <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome completo do dependente" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-sm mb-1">CPF:</label>
                        <input type="text" className="w-full border rounded px-3 py-2" placeholder="000.000.000-00" />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">RG:</label>
                        <input type="text" className="w-full border rounded px-3 py-2" placeholder="RG" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-sm mb-1">Sexo:</label>
                        <input type="text" className="w-full border rounded px-3 py-2" placeholder="M/F" />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">Data de nascimento:</label>
                        <input type="text" className="w-full border rounded px-3 py-2" placeholder="DD/MM/AAAA" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-sm mb-1">Parentesco:</label>
                      <input type="text" className="w-full border rounded px-3 py-2" placeholder="Ex.: Filho(a), Cônjuge..." />
                    </div>

                    <div>
                      <label className="block font-bold text-sm mb-1">Data de expedição:</label>
                      <input type="text" className="w-full border rounded px-3 py-2" placeholder="DD/MM/AAAA" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-sm mb-1">Estado (UF):</label>
                        <input type="text" className="w-full border rounded px-3 py-2" placeholder="UF" maxLength={2} />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">Órgão expedidor:</label>
                        <input type="text" className="w-full border rounded px-3 py-2" placeholder="Órgão expedidor" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-sm mb-1">Nome da mãe:</label>
                      <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nome da mãe" />
                    </div>

                    <div>
                      <label className="block font-bold text-sm mb-1">Profissão:</label>
                      <input type="text" className="w-full border rounded px-3 py-2" placeholder="Profissão" />
                    </div>

                    <div>
                      <label className="block font-bold text-sm mb-1">Escolaridade:</label>
                      <input type="text" className="w-full border rounded px-3 py-2" placeholder="Escolaridade" />
                    </div>
                  </div>

                  <div className="mt-4">
        <label className="block font-bold text-sm mb-2">Tipo de acomodação: <span className="text-red-600">*</span></label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-inc-dep"
              checked={acomodacao === "Apartamento"}
              onChange={() => setAcomodacao("Apartamento")}
            />
            Apartamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-inc-dep"
              checked={acomodacao === "Enfermaria"}
              onChange={() => setAcomodacao("Enfermaria")}
            />
            Enfermaria
          </label>
        </div>
        {/* Corrigir validação: só precisa de UM marcado, não ambos */}
        <input type="hidden" data-required="true" value={acomodacao ? "ok" : ""} />
      </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InclusaoDependenteForm() {
  const [acomodacao, setAcomodacao] = useState<"Apartamento" | "Enfermaria" | "">("");

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
          <label className="block font-bold text-sm mb-1">E-mail particular do titular:</label>
          <input type="email" className="w-full border rounded px-3 py-2" placeholder="seu@emailparticular.com" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefone:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="(00) 00000-0000" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Celular:</label>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="(00) 00000-0000" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Matrícula no Funsep:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        Abaixo-assinado(a), matrículado(a) nesse Fundo, vem, respeitosamente, <strong>REQUERER</strong> a <strong>inclusão</strong> de{" "}
        <input type="text" className="inline-field w-64" placeholder="nome do dependente" />,{" "}
        com CPF <input type="text" className="inline-field w-36" placeholder="000.000.000-00" />,{" "}
        nome da mãe <input type="text" className="inline-field w-52" placeholder="nome da mãe" />,{" "}
        como seu dependente, conforme comprova os documentos em anexo.
      </p>

      <p className="text-sm leading-relaxed text-justify">
        Declaro, outrossim estar ciente das disposições constantes do regulamento do FUNSEP, notadamente em relação aos prazos de carência.
      </p>

      <div className="mt-4">
        <label className="block font-bold text-sm mb-1">Escolaridade do dependente:</label>
        <input type="text" className="w-full border rounded px-3 py-2" placeholder="Escolaridade" />
      </div>

      <div className="mt-4">
        <label className="block font-bold text-sm mb-2">Tipo de acomodação: <span className="text-red-600">*</span></label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-inc-dep"
              checked={acomodacao === "Apartamento"}
              onChange={() => setAcomodacao("Apartamento")}
            />
            Apartamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-inc-dep"
              checked={acomodacao === "Enfermaria"}
              onChange={() => setAcomodacao("Enfermaria")}
            />
            Enfermaria
          </label>
        </div>
        {/* Corrigir validação: só precisa de UM marcado, não ambos */}
        <input type="hidden" data-required="true" value={acomodacao ? "ok" : ""} />
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

      <div className="page-break">
        <h3 className="font-bold text-primary mb-4 border-b border-primary/20 pb-2">Anexo I</h3>
        <InfoBox>
          <p><strong>Prazos de carência (conforme Instrução Normativa nº 1/99)</strong></p>
          <p className="mt-3"><strong>- Consultas e exames de patologia clínica</strong> - 30 dias após o primeiro desconto (ex.: 1º desconto em janeiro, uso a partir de 1º de março).</p>
          <p className="mt-2"><strong>- Exames de diagnóstico e terapia, endoscopia diagnóstica em regime ambulatorial, exames radiológicos simples, histocitopatologia, exames e testes alergológicos, oftalmológicos, otorrinolaringológicos (exceto videolaringoestroboscopia), inaloterapia, provas de função pulmonar, teste ergométrico, procedimentos de reabilitação e fisioterapia</strong> - a partir do primeiro dia do terceiro mês seguinte ao pagamento da primeira mensalidade.</p>
          <p className="mt-2"><strong>- Internamentos clínicos e cirúrgicos, procedimentos cirúrgicos em regime ambulatorial, quimioterapia, radioterapia, hemodiálise e diálise peritoneal, litotripsia, videolaringoscopia cirúrgica, exames e procedimentos especiais</strong> - a partir do primeiro dia do sexto mês seguinte ao pagamento da primeira mensalidade.</p>
          <p className="mt-2"><strong>- Parto a termo</strong> - a partir do primeiro dia do décimo mês seguinte ao pagamento da primeira mensalidade.</p>
        </InfoBox>
      </div>

      <div className="page-break">
        <h3 className="font-bold text-primary mb-4 border-b border-primary/20 pb-2">Anexo II</h3>
        <InfoBox>
          <p><strong>Documentos necessários:</strong></p>
          <p className="mt-2">· <strong>RG e CPF (cópia autenticada)</strong> - em caso de inclusão de crianças, caso não possua RG, pode-se substituir pela Certidão de Nascimento (2ª via);</p>
          <p className="mt-2">· <strong>Certidão de Casamento (2ª via datada de até 180 dias)</strong>, ou <strong>Escritura Pública de União Estável (2ª via datada de até 180 dias)</strong> - quando a inclusão for de companheiro(a);</p>
          <p className="mt-2">· <strong>Comprovante de endereço atualizado;</strong></p>
          <p className="mt-2">· <strong>Contracheque.</strong></p>
          <p className="mt-3"><strong>OBS: Os documentos deverão ser enviados através dos Correios.</strong></p>
        </InfoBox>
      </div>
    </div>
  );
}

function InclusaoRecemNascidoForm() {
  const [acomodacao, setAcomodacao] = useState<"Apartamento" | "Enfermaria" | "">("");

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
        <input type="text" className="inline-field w-64" placeholder="nome do recém-nascido" />,{" "}
        como seu(sua) dependente, conforme atestam os documentos em anexo.
      </p>

      <div className="mt-4">
        <label className="block font-bold text-sm mb-2">Tipo de acomodação: <span className="text-red-600">*</span></label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-recem"
              checked={acomodacao === "Apartamento"}
              onChange={() => setAcomodacao("Apartamento")}
            />
            Apartamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-recem"
              checked={acomodacao === "Enfermaria"}
              onChange={() => setAcomodacao("Enfermaria")}
            />
            Enfermaria
          </label>
        </div>
        {/* Corrigir validação: só precisa de UM marcado, não ambos */}
        <input type="hidden" data-required="true" value={acomodacao ? "ok" : ""} />
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
  const [acomodacao, setAcomodacao] = useState<"apartamento" | "enfermaria" | "">("");

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
        <input type="text" className="inline-field w-64" placeholder="nome do falecido" />,{" "}
        conforme cópia de certidão de óbito em anexo.
      </p>

      <div className="mt-4">
        <label className="block font-bold text-sm mb-2">Tipo de acomodação:</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-pensionista"
              checked={acomodacao === "apartamento"}
              onChange={() => setAcomodacao("apartamento")}
            />
            Apartamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="acomodacao-pensionista"
              checked={acomodacao === "enfermaria"}
              onChange={() => setAcomodacao("enfermaria")}
            />
            Enfermaria
          </label>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify">
        Declaro: <strong>a)</strong> que concorda em pagar através boleto bancário os valores correspondentes à mensalidade devida por força da inscrição, definidos em tabela variável por faixa etária e de acordo com o tipo de acomodação escolhido para internamentos - [{acomodacao === "apartamento" ? "X" : " "}] apartamento ou [{acomodacao === "enfermaria" ? "X" : " "}] enfermaria; e <strong>b)</strong> que tem conhecimento dos prazos de carência estabelecidos na Instrução Normativa nº 1/99.
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
        <input type="text" className="inline-field w-64" placeholder="nome do dependente" />,{" "}
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
          <input type="text" data-optional="true" className="border rounded px-2 py-1 w-48" />
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
            <input type="text" data-optional="true" className="border rounded px-2 py-1 w-32" placeholder="Nº do protocolo" />
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
        EU, <input type="text" className="inline-field w-64" placeholder="Nome completo" />,{" "}
        E-MAIL <input type="email" className="inline-field w-48" placeholder="email" />,{" "}
        PORTADOR DO RG Nº <input type="text" className="inline-field w-28" placeholder="0.000.000-0" />{" "}
        E INSCRITO NO CPF SOB Nº <input type="text" className="inline-field w-32" placeholder="000.000.000-00" />,{" "}
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
  const [acomodacaoTitular, setAcomodacaoTitular] = useState<"Apartamento" | "Enfermaria" | "">("");
  const [acomodacoesDependentes, setAcomodacoesDependentes] = useState<Record<number, "Apartamento" | "Enfermaria" | "">>({
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
  });

  const setAcomodacaoDependente = (num: number, value: "Apartamento" | "Enfermaria") => {
    setAcomodacoesDependentes((prev) => ({ ...prev, [num]: value }));
  };

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
          <label className="block font-bold text-sm mb-1">E-mail particular:</label>
          <input type="email" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Telefone:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">Celular:</label>
          <input type="text" className="w-48 border rounded px-3 py-2" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-justify mt-6">
        DECLARO estar ciente das normas que disciplinam a instituição assistencial e o funcionamento do convênio estabelecido entre o Funsep e a Unimed-Curitiba, OPTANDO pelo tipo de acomodação e faixa etária dos beneficiários, e CONCORDANDO em pagar os valores mensais das respectivas tabelas.
      </p>

      <h3 className="font-bold text-primary mt-6">TITULAR:</h3>
      <div className="flex gap-6 mt-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="acomodacao-titular"
            checked={acomodacaoTitular === "Apartamento"}
            onChange={() => setAcomodacaoTitular("Apartamento")}
          />
          Apartamento
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="acomodacao-titular"
            checked={acomodacaoTitular === "Enfermaria"}
            onChange={() => setAcomodacaoTitular("Enfermaria")}
          />
          Enfermaria
        </label>
      </div>

      {[1, 2, 3, 4, 5].map((num) => (
        <div key={num} className="mt-4">
          <h3 className="font-bold text-primary">DEPENDENTE {num}:</h3>
          <input type="text" data-optional="true" className="w-full border rounded px-3 py-2 mt-2" placeholder={`Nome completo do dependente ${num}`} />
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`acomodacao-dep-${num}`}
                checked={acomodacoesDependentes[num] === "Apartamento"}
                onChange={() => setAcomodacaoDependente(num, "Apartamento")}
              />
              Apartamento
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`acomodacao-dep-${num}`}
                checked={acomodacoesDependentes[num] === "Enfermaria"}
                onChange={() => setAcomodacaoDependente(num, "Enfermaria")}
              />
              Enfermaria
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
