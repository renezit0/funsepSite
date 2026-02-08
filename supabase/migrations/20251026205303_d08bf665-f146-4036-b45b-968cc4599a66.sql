-- Criar tabela para seções do "Sobre o Funsep"
CREATE TABLE public.sobre_funsep (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  slug text NOT NULL UNIQUE,
  conteudo text NOT NULL,
  ordem integer NOT NULL,
  publicado boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_por_sigla text
);

-- Enable Row Level Security
ALTER TABLE public.sobre_funsep ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública das seções publicadas
CREATE POLICY "Seções publicadas são visíveis para todos"
ON public.sobre_funsep
FOR SELECT
USING (publicado = true);

-- Política para admins gerenciarem todas as seções
CREATE POLICY "Admins podem gerenciar todas as seções"
ON public.sobre_funsep
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_sobre_funsep_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sobre_funsep_updated_at
BEFORE UPDATE ON public.sobre_funsep
FOR EACH ROW
EXECUTE FUNCTION public.update_sobre_funsep_updated_at();

-- Inserir as seções iniciais com o conteúdo do PDF
INSERT INTO public.sobre_funsep (titulo, slug, conteudo, ordem, publicado) VALUES
('Quem somos', 'quem-somos', 'O Fundo de Saúde dos Servidores do Poder Judiciário – FUNSEP, foi criado mediante ato próprio da Presidência desse Tribunal em 11 de outubro de 1983, e destina-se ao desenvolvimento de programas de apoio à saúde do Servidor do Poder Judiciário do Estado do Paraná, custeando, complementando, auxiliando e promovendo a manutenção ou a reabilitação da saúde desses funcionários.

O FUNSEP é um Fundo de Saúde sem fins lucrativos, possui como única fonte de receita as mensalidades pagas por seus associados, cujos valores são significativamente inferiores aos praticados por planos abertos de saúde, justamente para propiciar o atendimento ao maior número possível de servidores do Tribunal.

Em 2005 o FUNSEP convocou uma Assembleia Extraordinária, propondo a contratação da UNIMED CURITIBA, para prestar atendimento aos associados através de sua rede credenciada. O contrato elaborado entre o FUNSEP e a Unimed Curitiba é de custo operacional (a operadora envia a fatura com a cobrança dos atendimentos prestados aos filiados ao Fundo), e está ativo desde 2006.

Desta forma, é importante salientar que a contratação com a Unimed Curitiba é do FUNSEP, gestor do contrato.', 1, true),

('Como se inscrever', 'como-se-inscrever', 'Para aderir ao plano, basta preencher e assinar o requerimento disponível no link https://www.funsep.com.br/inclusao_associado.php e enviar todos os documentos relacionados para o endereço do FUNSEP (Rua Papa João XXIII, 244 – Centro Cívico - Curitiba/PR - CEP: 80.530-030).

A inclusão deve ocorrer até o último dia útil do mês e o desconto se dará através da folha de vencimentos no mês subsequente ao requerido, desde que haja margem consignável.

Somente é possível a inclusão no FUNSEP para utilização da Unimed Curitiba, através da folha de vencimentos.

Mensalmente, caso tenha sido utilizado o plano para consultas ou exames, haverá a respectiva cobrança da coparticipação, podendo ou não ser incluída em folha de vencimentos, caso em que poderá, excepcionalmente ser através de boleto bancário.', 2, true),

('Carência', 'carencia', 'É o prazo ininterrupto, contado a partir da vigência do contrato, ou seja, após o primeiro desconto em folha da mensalidade, durante o qual o beneficiário não tem direito à utilização dos procedimentos contratados.

No FUNSEP, a carência funciona da seguinte forma:

**Consultas - Exames de patologia clínica:** 30 dias após o primeiro desconto (ex.: 1º desconto em janeiro, uso a partir de 1º de março)

**Exames de diagnóstico e terapia:** endoscopia diagnóstica em regime ambulatorial, exames radiológicos simples, histocitopatologia, exames e testes alergológicos, oftalmológicos, otorrinolaringológicos (exceto videolaringoestroboscopia), inalo terapia, provas de função pulmonar, teste ergométrico, procedimentos de reabilitação e fisioterapia

**Internamentos clínicos e cirúrgicos:** procedimentos cirúrgicos em regime ambulatorial, quimioterapia, radioterapia, hemodiálise e diálise peritoneal, litotripsia, videolaringoscopia cirúrgica, exames e procedimentos especiais (angiografia, arteriografia, eletroencefalograma prolongado, mapeamento cerebral e polissonografia, ultrassonografia, tomografia computadorizada, ressonância nuclear magnética, medicina nuclear, densitometria óssea, videolaparoscopia diagnóstica e radiologia intervencionista), terapias especiais (fonoaudiologia, psicoterapia, psicopedagogia e terapia ocupacional.

**Parto a termo:** 10 meses após 1º desconto', 3, true),

('Plano e Coparticipação', 'plano-coparticipacao', '**Plano com coparticipação de 25%** (Regulamentado de acordo com a Lei 9656/98)

**Valores mensais por faixa etária:**

| Faixa Etária | Enfermaria | Apartamento |
|--------------|------------|-------------|
| 0 a 18 | R$ 243,55 | R$ 347,54 |
| 19 a 28 | R$ 339,13 | R$ 472,74 |
| 29 a 38 | R$ 389,30 | R$ 553,62 |
| 39 a 48 | R$ 532,50 | R$ 747,62 |
| 49 a 58 | R$ 826,23 | R$ 1.095,17 |
| acima de 59 | R$ 1.117,58 | R$ 1.747,76 |

**Detalhes da Coparticipação:**

- **Consultas:** 2 (duas) consultas no mês, por pessoa, com coparticipação de 25%. A partir da 3ª consulta no mesmo mês, a coparticipação será de 100% conforme o valor de tabela.
- **Exames:** coparticipação de 25% dos valores de tabela, sem limitação.
- **Fisioterapia:** 10 (dez) sessões no mês com coparticipação de 25%, inclusive no internamento hospitalar.
- **Terapia Ocupacional:** 8 (oito) sessões no mês com coparticipação 25%.
- **Fonoaudiologia:** 8 (oito) sessões no mês com coparticipação 25%.
- **Acupuntura:** 4 (quatro) sessões no mês com coparticipação de 25%.
- **Nutricionista:** 1 (uma) consulta no mês com coparticipação de 25%.
- **Psicologia:** até 40 (quarenta) sessões/ano, dependendo da patologia, com coparticipação 25%.', 4, true),

('Coberturas e Exclusões', 'coberturas-exclusoes', '**Procedimentos cobertos:**

- Internamento clínico: não existe limitação, observado o prazo de carência de 6 (meses).
- Internamento psiquiátrico: até 30 (trinta) dias em situação de crise.
- Tratamento quimioterápico ou radioterápico: após carência de 6 meses.
- Tratamento de hemodiálise: após carência de 6 meses.

**Procedimentos EXCLUÍDOS da cobertura:**

- Procedimentos odontológicos, consultas, exames ou cirurgias
- Procedimentos realizados fora da rede de atendimento Unimed
- Exames e medicamentos ainda não reconhecidos pelo Serviço Nacional de Fiscalização
- Tratamentos e cirurgias experimentais
- Tratamentos para infertilidade e esterilidade
- Enfermagem em caráter particular
- Cirurgias plásticas e tratamentos estéticos
- Exames admissionais e demissionais
- Fornecimento de próteses não ligadas ao ato cirúrgico
- Medicação de uso contínuo fora do ambiente hospitalar
- Aluguel de equipamentos
- Consultas e atendimentos domiciliares
- Ambulância ou remoção intra-hospitalar
- **NÃO há reembolso** para atendimentos fora da rede credenciada', 5, true),

('Como incluir dependentes', 'dependentes', 'Poderão participar do plano de saúde do FUNSEP as seguintes pessoas, na condição de dependentes dos associados:

✦ O cônjuge, ou companheiro(a) com Escritura de União Estável (atualizada)

✦ **Filhos recém-nascidos:** Enviar por correspondência a cópia autenticada da certidão de nascimento em até 30 dias do nascimento

✦ Os filhos de associado, enquanto solteiros, **menores de 21 anos** ou de até **25 anos se universitários**, desde que vivam comprovadamente sob a dependência econômica do associado titular, comprovando sua dependência através da Declaração de Imposto de Renda

✦ Os filhos portadores de incapacidade total, desde que o evento incapacitante tenha se dado até os 24 anos de idade

✦ Os menores com Termo de Responsabilidade e Guarda que estejam sob a dependência econômica do titular, até a idade de 21 anos

✦ **Pensionistas do Poder Judiciário:** Observar que com o falecimento do titular, o vínculo contratual extingue, haverá a exclusão de todos os dependentes. Para ingressar como pensionista é preciso ficar atento ao prazo máximo de **60 dias** após o óbito do TITULAR para solicitar a nova inscrição.', 6, true),

('Auxílio Saúde', 'auxilio-saude', 'É um benefício concedido pelo Tribunal de Justiça aos servidores ativos/inativos, que mediante comprovação de pagamento de plano de saúde, reembolsa os valores pagos a título de mensalidade.

**Como solicitar:**

Para obter o benefício, o associado deverá solicitar ao FUNSEP a declaração através do e-mail **declaracao.funsep@gmail.com**, anexando o contracheque em que estará o desconto do plano. 

De posse da declaração para o auxílio, a mesma deverá ser encaminhada ao Tribunal de Justiça (RH) através do sistema Hércules.

**Importante:** A responsabilidade pelo auxílio saúde é do servidor. O FUNSEP não administra o auxílio saúde.', 7, true),

('Reajustes', 'reajustes', 'A mensalidade do seu plano de saúde poderá sofrer reajuste quando:

a) **Anualmente**, na data base (aniversário) do contrato.

b) Houver **desequilíbrio contratual** devido ao aumento dos custos médicos, frequência de utilização ou ainda de acordo com as condições contratuais, exclusivamente para contratos firmados com pessoa jurídica.

c) Houver **mudança de faixa etária**.', 8, true),

('Atendimento Nacional', 'atendimento-nacional', 'O contrato entre o FUNSEP e a Unimed Curitiba, prevê atendimento em âmbito nacional, dentro das Unimeds que possuem acordo prévio para atender a Unimed Curitiba.

**Como encontrar locais credenciados:**

- **Guia médico no aplicativo:** selecionar a cidade e a especialidade buscada e aguardar as informações.
- **Guia médico no computador:** Ir em busca detalhada e informar o CPF ou a carteirinha, selecionar estado/cidade, especialidade ou tipo de estabelecimento (clinica/hospital) e pesquisar.

**Carteirinha:**

- **Virtual:** Pode ser baixada através do APP da Unimed Curitiba.
- **Física:** somente para os acima de 60 anos.

**ECCO-SALVA:** O FUNSEP possui parceria para atendimento médico de Emergências e Urgências 24h por dia com custo diferenciado de R$ 15,75 por pessoa. Solicite através do e-mail: atendimento.funsep@gmail.com', 9, true),

('Contatos', 'contatos', '**Central de Atendimento:**
(Segunda a sexta das 09:00 às 18h)
- Telefone: (41) 3254-7758
- E-mail: atendimento.funsep@gmail.com

**Liberação de exames:**
(Segunda a sexta das 09:00 às 18h)
- WhatsApp: (41) 98454-7236
- E-mail: funsep@unimedcuritiba.com.br

**Financeiro | 2ª via boleto:**
- Telefone: (41) 3254-7758
- WhatsApp: (41) 98454-7238
- E-mail: financeirofunsep@gmail.com

**Declarações | Relatórios:**
- Telefone: (41) 3254-7758 – Ramal 15
- E-mail: declaracao.funsep@gmail.com

**Maiores de 21 anos:**
- Telefone: (41) 3254-7758 – Ramal 13
- E-mail: maiores21anos@gmail.com

**SAC – Serviço de Atendimento ao Cliente:**
- E-mail: funsep@funsep.com.br
- Endereço: Rua Papa João XXIII, 244 – Centro Cívico - Curitiba/PR - CEP: 80.530-030', 10, true);