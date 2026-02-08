import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart } from "lucide-react";

export function HealthTipsPage() {
  return (
    <div className="space-y-8">
      {/* Health Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            Dicas de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Medications */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Medicamentos Genéricos, Similares e de Marca</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-primary mb-2">Genérico:</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  É o medicamento que possui o mesmo princípio ativo (substância do medicamento que provoca sua ação terapêutica), 
                  as mesmas características e a mesma ação terapêutica que um de marca (nome fantasia), comprovadas pelos testes de equivalência. 
                  Ele deve ser uma cópia fiel do de marca, inclusive na apresentação (comprimidos, xarope, injetável, etc) e na dosagem.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-primary mb-2">Similares:</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  São os medicamentos que copiam os princípios ativos dos remédios de marca, propondo-se a ter a mesma ação terapêutica, 
                  mas que não são cópias fiéis dos originais, podendo variar nas formas de apresentação e de dosagem, como exemplo, 
                  temos o ácido acetil salicílico sendo vendido sob as mais variadas denominações e apresentações.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                  Existem no Brasil desde a década de 70. Normalmente os similares ocasionam o mesmo efeito terapêutico que os remédios 
                  de marca e são geralmente mais baratos.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Informações Importantes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>O remédio de marca e o similar devem ter na embalagem o nome do princípio ativo e um nome fantasia.</li>
                  <li>O genérico deve ter apenas o nome do princípio ativo.</li>
                  <li>Os médicos têm total liberdade de indicar remédio de marca, genérico ou similar.</li>
                  <li>Em caso de troca, apenas um farmacêutico pode efetuá-la (não um balconista), se o médico não expressar a frase "não autorizo a troca".</li>
                  <li>Um remédio de marca somente poderá ser trocado por um genérico, não por um similar.</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Diabetes */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Diabete Mélito: Conhecimento e controle</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Diabete Mélito é uma doença crônica, caracterizada pela elevação do açúcar no sangue. 
                Não se conhece exatamente sua(s) causa(s). Podem estar envolvidos fatores hereditários, genéticos, ambientais, imunológicos e virais.
              </p>

              <div>
                <h4 className="font-medium text-primary mb-2">Tipos de Diabete:</h4>
                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h5 className="font-medium mb-1">Diabete Mélito Tipo I (DMID)</h5>
                    <p className="text-sm text-muted-foreground">
                      Caracterizado pelo início abrupto dos sintomas clássicos (sede, urina em excesso, aumento do apetite e emagrecimento), 
                      tendência à cetoacidose e dependência de insulina exógena. Inicia-se geralmente entre a infância e o início da idade adulta.
                    </p>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h5 className="font-medium mb-1">Diabete Mélito Tipo II (DMNID)</h5>
                    <p className="text-sm text-muted-foreground">
                      Caracterizado por início lento, com poucos sintomas, ou é assintomático. Os sintomas são: sede e urina em excesso, 
                      fraqueza, dor nas pernas, visão borrada, cãibras, às vezes até perda de peso. Ocorre geralmente após os 45 anos. 
                      A obesidade está presente em 80 a 90% dos casos.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-primary mb-2">Tratamento:</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  O tratamento inicial é a mudança no hábito alimentar e incentivo à atividade física. O objetivo é a manutenção do peso normal. 
                  Deve ser evitada a ingestão de açúcar, mel, refrigerantes açucarados. Devem ser evitadas as frituras e limitar o uso de gorduras. 
                  Evitar ao máximo o consumo de álcool e de cigarros.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                  O tratamento deve ser contínuo e realizado por uma equipe profissional multidisciplinar: médicos, nutricionistas, 
                  psicólogos e professores de educação física. Um paciente bem informado sobre sua doença, enfrenta melhor o seu dia a dia.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Triglycerides */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Saiba mais sobre os Triglicerídeos e como controlá-los melhor</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                O aumento dos triglicerídeos é um distúrbio lipídico relativamente frequente na prática clínica. 
                Na maioria dos casos, as hipertrigliceridemias são causadas por distúrbios no metabolismo dos hidratos de carbono (açúcares).
              </p>

              <div>
                <h4 className="font-medium text-primary mb-2">Classificação:</h4>
                <div className="space-y-2">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h5 className="font-medium mb-1">Primária</h5>
                    <p className="text-sm text-muted-foreground">
                      Quando não apresenta fator desencadeante, ou seja, distúrbio metabólico frequentemente acompanhado de outras alterações 
                      significativas como redução do HDL (colesterol "bom") e aumento do LDL (colesterol "ruim").
                    </p>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h5 className="font-medium mb-1">Secundária</h5>
                    <p className="text-sm text-muted-foreground">
                      Quando decorre de outras doenças como diabete mélito, hipotireoidismo, nefropatia crônica, alcoolismo, obesidade e uso de medicamentos.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-primary mb-2">Tratamento e Controle:</h4>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                  Considera-se como normal o valor de 200ml/dl. A intervenção dietoterápica é o passo inicial no tratamento:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Redução da ingestão de carboidratos simples (mel, açúcar, geleias, bolos e doces em geral)</li>
                  <li>Controlar a ingestão de carboidratos complexos (arroz, batata, derivados do trigo)</li>
                  <li>Dieta rica em frutas, vegetais e legumes</li>
                  <li>Evitar açúcares, bebidas alcóolicas, gorduras saturadas</li>
                  <li>Aumento da atividade física (caminhadas diárias)</li>
                  <li>Restrição ao álcool</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}