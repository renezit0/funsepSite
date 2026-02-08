import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, Gavel } from "lucide-react";

export function StatutePage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gavel className="h-6 w-6 text-primary" />
            </div>
            Estatuto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <a 
            href="https://funsep.com.br/estatutofunsep.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <FileText className="h-5 w-5" />
            Acessar Estatuto FUNSEP (PDF)
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}