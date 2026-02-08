import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ContactPage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            Localização e Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">FUNSEP - Fundo de Saúde dos Servidores do Poder Judiciário</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>Rua Papa João XXIII, 244</p>
              <p>Centro Cívico - Curitiba - Paraná</p>
              <p>CEP 80.530-030</p>
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Contato</p>
                <p className="text-muted-foreground">Fone: (41) 3254-7758</p>
                <p className="text-muted-foreground">Fax: (41) 3254-7758</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Horário de Funcionamento</p>
                <p className="text-muted-foreground">Segunda à Sexta: 09:00h às 18:00h</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}