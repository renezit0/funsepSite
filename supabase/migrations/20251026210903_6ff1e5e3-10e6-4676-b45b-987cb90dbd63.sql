-- Restaurar outras seções
UPDATE sobre_funsep
SET conteudo = '**Procedimentos cobertos:**

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
- **NÃO há reembolso** para atendimentos fora da rede credenciada'
WHERE slug = 'coberturas-exclusoes';

UPDATE sobre_funsep
SET conteudo = 'Poderão participar do plano de saúde do FUNSEP as seguintes pessoas, na condição de dependentes dos associados:

✦ O cônjuge, ou companheiro(a) com Escritura de União Estável (atualizada)

✦ **Filhos recém-nascidos:** Enviar por correspondência a cópia autenticada da certidão de nascimento em até 30 dias do nascimento

✦ Os filhos de associado, enquanto solteiros, **menores de 21 anos** ou de até **25 anos se universitários**, desde que vivam comprovadamente sob a dependência econômica do associado titular, comprovando sua dependência através da Declaração de Imposto de Renda

✦ Os filhos portadores de incapacidade total, desde que o evento incapacitante tenha se dado até os 24 anos de idade

✦ Os menores com Termo de Responsabilidade e Guarda que estejam sob a dependência econômica do titular, até a idade de 21 anos

✦ **Pensionistas do Poder Judiciário:** Observar que com o falecimento do titular, o vínculo contratual extingue, haverá a exclusão de todos os dependentes. Para ingressar como pensionista é preciso ficar atento ao prazo máximo de **60 dias** após o óbito do TITULAR para solicitar a nova inscrição.'
WHERE slug = 'dependentes';

UPDATE sobre_funsep
SET conteudo = 'É um benefício concedido pelo Tribunal de Justiça aos servidores ativos/inativos, que mediante comprovação de pagamento de plano de saúde, reembolsa os valores pagos a título de mensalidade.

**Como solicitar:**

Para obter o benefício, o associado deverá solicitar ao FUNSEP a declaração através do e-mail **declaracao.funsep@gmail.com**, anexando o contracheque em que estará o desconto do plano. 

De posse da declaração para o auxílio, a mesma deverá ser encaminhada ao Tribunal de Justiça (RH) através do sistema Hércules.

**Importante:** A responsabilidade pelo auxílio saúde é do servidor. O FUNSEP não administra o auxílio saúde.'
WHERE slug = 'auxilio-saude';

UPDATE sobre_funsep
SET conteudo = 'A mensalidade do seu plano de saúde poderá sofrer reajuste quando:

a) **Anualmente**, na data base (aniversário) do contrato.

b) Houver **desequilíbrio contratual** devido ao aumento dos custos médicos, frequência de utilização ou ainda de acordo com as condições contratuais, exclusivamente para contratos firmados com pessoa jurídica.

c) Houver **mudança de faixa etária**.'
WHERE slug = 'reajustes';

UPDATE sobre_funsep
SET conteudo = 'O contrato entre o FUNSEP e a Unimed Curitiba, prevê atendimento em âmbito nacional, dentro das Unimeds que possuem acordo prévio para atender a Unimed Curitiba.

**Como encontrar locais credenciados:**

- **Guia médico no aplicativo:** selecionar a cidade e a especialidade buscada e aguardar as informações.
- **Guia médico no computador:** Ir em busca detalhada e informar o CPF ou a carteirinha, selecionar estado/cidade, especialidade ou tipo de estabelecimento (clinica/hospital) e pesquisar.

**Carteirinha:**

- **Virtual:** Pode ser baixada através do APP da Unimed Curitiba.
- **Física:** somente para os acima de 60 anos.

**ECCO-SALVA:** O FUNSEP possui parceria para atendimento médico de Emergências e Urgências 24h por dia com custo diferenciado de R$ 15,75 por pessoa. Solicite através do e-mail: atendimento.funsep@gmail.com'
WHERE slug = 'atendimento-nacional';

UPDATE sobre_funsep
SET conteudo = '**Central de Atendimento:**
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
- Endereço: Rua Papa João XXIII, 244 – Centro Cívico - Curitiba/PR - CEP: 80.530-030'
WHERE slug = 'contatos';