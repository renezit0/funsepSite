import { useState } from "react";
import { MapPin, Phone, Mail, Clock, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SupportMessageModal } from "@/components/modals/SupportMessageModal";

export function ContactPage() {
  const [showSupportMessage, setShowSupportMessage] = useState(false);

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

          <Separator />

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-1" />
            <div className="space-y-1">
              <p className="font-medium">E-mails de Contato</p>
              <p className="text-muted-foreground">
                Geral: <a href="mailto:funsep@funsep.com.br" className="hover:underline">funsep@funsep.com.br</a>
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:exclusoes.funsep@gmail.com" className="hover:underline">exclusoes.funsep@gmail.com</a>
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:inclusoes.funsep@gmail.com" className="hover:underline">inclusoes.funsep@gmail.com</a>
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:financeirofunsep@gmail.com" className="hover:underline">financeirofunsep@gmail.com</a>
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:atendimento.funsep@gmail.com" className="hover:underline">atendimento.funsep@gmail.com</a>
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:declaracao.funsep@gmail.com" className="hover:underline">declaracao.funsep@gmail.com</a>
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:funsep@unimedcuritiba.com.br" className="hover:underline">funsep@unimedcuritiba.com.br</a>
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:maiores21anos@gmail.com" className="hover:underline">maiores21anos@gmail.com</a>
              </p>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border bg-muted/30 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Envio de Mensagens Internas
                </p>
                <p className="text-sm text-muted-foreground">
                  Não conseguiu cadastrar senha ou acessar? Envie seus dados para contato da equipe.
                </p>
              </div>
              <Button onClick={() => setShowSupportMessage(true)} className="sm:w-auto w-full gap-2">
                <MessageSquare className="h-4 w-4" />
                Enviar mensagem
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SupportMessageModal
        isOpen={showSupportMessage}
        onClose={() => setShowSupportMessage(false)}
        source="CONTACT_PAGE"
      />
    </div>
  );
}
