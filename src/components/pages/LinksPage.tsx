import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Construction } from "lucide-react";

export function LinksPage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <ExternalLink className="h-6 w-6 text-primary" />
            </div>
            Links
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <Construction className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Em desenvolvimento</h3>
              <p className="text-muted-foreground max-w-md">
                A seção "Links" está sendo desenvolvida e estará disponível em breve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}