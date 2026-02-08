import { Star, Heart, Shield, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
  {
    icon: Heart,
    title: "Desconto em Folha",
    description: "Facilidade de pagamento com desconto direto em folha de pagamento no mês seguinte ao atendimento.",
    features: [
      "Pagamento automático",
      "Sem necessidade de reembolso",
      "Desconto no mês seguinte",
      "Maior comodidade"
    ]
  },
  {
    icon: Shield,
    title: "Atendimento de Emergência",
    description: "Atendimento de emergência ou urgência pela rede credenciada Unimed com total segurança.",
    features: [
      "Rede credenciada Unimed",
      "Atendimento 24 horas",
      "Emergências médicas",
      "Urgências hospitalares"
    ]
  },
  {
    icon: Users,
    title: "Cobertura para Filhos",
    description: "Atendimento a filhos com idade até 25 anos, desde que comprovada dependência econômica do associado titular.",
    features: [
      "Filhos até 25 anos",
      "Dependência econômica comprovada",
      "Cobertura completa",
      "Proteção familiar estendida"
    ]
  },
  {
    icon: Star,
    title: "Mensalidades Reduzidas",
    description: "Mensalidades inferiores às dos planos comerciais, oferecendo economia significativa aos associados.",
    features: [
      "Valores abaixo do mercado",
      "Economia mensal",
      "Benefício associativo",
      "Custo-benefício superior"
    ]
  },
  {
    icon: CheckCircle,
    title: "Ampla Rede Credenciada",
    description: "Abrangência da rede de médicos e clínicas credenciados para maior conveniência e qualidade.",
    features: [
      "Médicos especializados",
      "Clínicas credenciadas",
      "Ampla cobertura geográfica",
      "Qualidade garantida"
    ]
  }
];

export function BenefitsPage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            Vantagens do FUNSEP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            O FUNSEP oferece um conjunto abrangente de benefícios para garantir 
            o bem-estar e a tranquilidade dos servidores do Poder Judiciário e 
            seus dependentes.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              
              return (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                    
                    <div className="space-y-2">
                      {benefit.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}