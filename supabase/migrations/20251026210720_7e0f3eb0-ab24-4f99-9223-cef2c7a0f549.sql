-- Restaurar conteúdo original da seção "Quem somos"
UPDATE sobre_funsep
SET conteudo = 'O Fundo de Saúde dos Servidores do Poder Judiciário – FUNSEP, foi criado mediante ato próprio da Presidência desse Tribunal em 11 de outubro de 1983, e destina-se ao desenvolvimento de programas de apoio à saúde do Servidor do Poder Judiciário do Estado do Paraná, custeando, complementando, auxiliando e promovendo a manutenção ou a reabilitação da saúde desses funcionários.

O FUNSEP é um Fundo de Saúde sem fins lucrativos, possui como única fonte de receita as mensalidades pagas por seus associados, cujos valores são significativamente inferiores aos praticados por planos abertos de saúde, justamente para propiciar o atendimento ao maior número possível de servidores do Tribunal.

Em 2005 o FUNSEP convocou uma Assembleia Extraordinária, propondo a contratação da UNIMED CURITIBA, para prestar atendimento aos associados através de sua rede credenciada. O contrato elaborado entre o FUNSEP e a Unimed Curitiba é de custo operacional (a operadora envia a fatura com a cobrança dos atendimentos prestados aos filiados ao Fundo), e está ativo desde 2006.

Desta forma, é importante salientar que a contratação com a Unimed Curitiba é do FUNSEP, gestor do contrato.'
WHERE slug = 'quem-somos';

-- Restaurar conteúdo original da seção "Como se inscrever"
UPDATE sobre_funsep
SET conteudo = 'Para aderir ao plano, basta preencher e assinar o requerimento disponível no link https://www.funsep.com.br/inclusao_associado.php e enviar todos os documentos relacionados para o endereço do FUNSEP (Rua Papa João XXIII, 244 – Centro Cívico - Curitiba/PR - CEP: 80.530-030).

A inclusão deve ocorrer até o último dia útil do mês e o desconto se dará através da folha de vencimentos no mês subsequente ao requerido, desde que haja margem consignável.

Somente é possível a inclusão no FUNSEP para utilização da Unimed Curitiba, através da folha de vencimentos.

Mensalmente, caso tenha sido utilizado o plano para consultas ou exames, haverá a respectiva cobrança da coparticipação, podendo ou não ser incluída em folha de vencimentos, caso em que poderá, excepcionalmente ser através de boleto bancário.'
WHERE slug = 'como-se-inscrever';

-- Restaurar "Carência"
UPDATE sobre_funsep
SET conteudo = 'É o prazo ininterrupto, contado a partir da vigência do contrato, ou seja, após o primeiro desconto em folha da mensalidade, durante o qual o beneficiário não tem direito à utilização dos procedimentos contratados.

No FUNSEP, a carência funciona da seguinte forma:

**Consultas - Exames de patologia clínica:** 30 dias após o primeiro desconto (ex.: 1º desconto em janeiro, uso a partir de 1º de março)

**Exames de diagnóstico e terapia:** endoscopia diagnóstica em regime ambulatorial, exames radiológicos simples, histocitopatologia, exames e testes alergológicos, oftalmológicos, otorrinolaringológicos (exceto videolaringoestroboscopia), inalo terapia, provas de função pulmonar, teste ergométrico, procedimentos de reabilitação e fisioterapia

**Internamentos clínicos e cirúrgicos:** procedimentos cirúrgicos em regime ambulatorial, quimioterapia, radioterapia, hemodiálise e diálise peritoneal, litotripsia, videolaringoscopia cirúrgica, exames e procedimentos especiais (angiografia, arteriografia, eletroencefalograma prolongado, mapeamento cerebral e polissonografia, ultrassonografia, tomografia computadorizada, ressonância nuclear magnética, medicina nuclear, densitometria óssea, videolaparoscopia diagnóstica e radiologia intervencionista), terapias especiais (fonoaudiologia, psicoterapia, psicopedagogia e terapia ocupacional.

**Parto a termo:** 10 meses após 1º desconto'
WHERE slug = 'carencia';

-- Restaurar "Plano e Coparticipação" com tabela
UPDATE sobre_funsep
SET conteudo = '**Plano com coparticipação de 25%** (Regulamentado de acordo com a Lei 9656/98)

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
- **Psicologia:** até 40 (quarenta) sessões/ano, dependendo da patologia, com coparticipação 25%.'
WHERE slug = 'plano-coparticipacao';