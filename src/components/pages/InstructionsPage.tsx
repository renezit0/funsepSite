import { Info, Users, FileText, Clock, DollarSign, Heart, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function InstructionsPage() {
  return (
    <div className="space-y-6">
      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="h-6 w-6 text-primary" />
            </div>
            Informações Necessárias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              • O novo sistema começou a vigorar no dia <strong>1º de março de 2006</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              • O atendimento médico-hospitalar aos associados e dependentes do Funsep, com oferta de serviços em todo território Nacional, está sendo feito pela <strong>rede credenciada da Unimed-Curitiba</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              • O Funsep mantém a sua estrutura administrativa, que passará a fiscalizar e administrar o convênio com a Unimed-Curitiba.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              • O novo plano de saúde é de natureza empresarial, com <strong>participação dos usuários (25% sobre o valor de consultas e 25% nos exames de rotina)</strong>, com base nos valores de cobertura adotados pela Unimed.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              • <strong>Exames de alto custo: 25%</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Who can join */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Quem pode se associar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Podem ingressar no convênio Funsep-Unimed, juntamente com seus dependentes, <strong>funcionários do Tribunal de Justiça do Estado do Paraná e serventuários do foro judicial</strong>.
          </p>
        </CardContent>
      </Card>

      {/* How to register */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Como se inscrever
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Protocolar pedido de inscrição diretamente no escritório Funsep, em Curitiba (<strong>Rua Papa João XXIII, 244 - Centro Cívico</strong>).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Acessar a página <strong>www.funsep.com.br</strong>, imprimir e preencher requerimento próprio, com posterior remessa ao Funsep, pessoalmente ou pelo Correio.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Solicitar, por telefone <strong>(41) 3254-7758</strong>, encaminhamento de proposta de inscrição.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waiting periods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            Carências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-foreground mb-2">30 dias</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Consultas e exames de patologia clínica:</strong> 30 dias após o primeiro desconto (ex.: 1º desconto em janeiro, uso a partir de 1º de março).
              </p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-foreground mb-2">3 meses</h4>
              <p className="text-sm text-muted-foreground">
                Exames de diagnóstico e terapia, endoscopia diagnóstica em regime ambulatorial, exames radiológicos simples, histocitopatologia, exames e testes alergológicos, oftalmológicos, otorrinolaringológicos (exceto videolaringoestroboscopia), inaloterapia, provas de função pulmonar, teste ergométrico, procedimentos de reabilitação e fisioterapia.
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-foreground mb-2">6 meses</h4>
              <p className="text-sm text-muted-foreground">
                Internamentos clínicos e cirúrgicos, procedimentos cirúrgicos em regime ambulatorial, quimioterapia, radioterapia, hemodiálise e diálise peritoneal, litotripsia, videolaringoscipia cirúrgica, exames e procedimentos especiais (angiografia, arteriografia, eletroencefalograma prolongado, mapeamento cerebral e polissonagrafia, ultrassonografia, tomografia computadorizada, ressonância nuclear magnética, medicina nuclear, densitometria óssea, videolaparoscopia diagnóstica e radiologia intervencionista).
              </p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-foreground mb-2">10 meses</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Parto a termo:</strong> dez meses após o pagamento da primeira mensalidade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly fees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            Mensalidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Informações sobre valores e tipo de acomodação estão na aba de <strong>notícias</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            Benefícios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Para obtenção de benefícios, é necessária <strong>solicitação médica de profissional cadastrado na Unimed</strong>. Os serviços oferecidos são:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              "Consultas",
              "Exames",
              "Procedimentos ambulatoriais",
              "Atendimentos de emergência",
              "Internamentos clínicos",
              "Internamentos cirúrgicos",
              "Tratamento fisioterápico",
              "Tratamento fonoaudiológico"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span className="text-sm text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to use */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            Como utilizar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Consultas</h4>
              <p className="text-sm text-muted-foreground">
                Atendimento direto com médico conveniado com a Unimed, mediante apresentação de carteira de usuário, <strong>sem necessidade de guia</strong>.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Exames de rotina</h4>
              <p className="text-sm text-muted-foreground">
                Atendimento em laboratórios conveniados com a Unimed, mediante solicitação médica e apresentação de <strong>carteira Funsep-Unimed</strong>.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Exames condicionados a autorização prévia</h4>
              <p className="text-sm text-muted-foreground">
                Atendimento mediante solicitação médica de profissional conveniado com a Unimed, na unidade de atendimento Funsep-Unimed (<strong>Rua Papa João XXIII, 244 - Centro Cívico - fone/fax: 41 3254-7758</strong>), em Curitiba, ou nas unidades da Unimed de cada cidade.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Guias de internamento para procedimentos eletivos</h4>
              <p className="text-sm text-muted-foreground">
                Atendimento mediante solicitação médica de profissional conveniado com a Unimed, na unidade de atendimento Funsep-Unimed ou nas unidades da Unimed de cada cidade. <strong>Devem ser solicitadas com antecedência de no mínimo 72hrs</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}