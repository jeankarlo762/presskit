import { LayoutTemplate } from "lucide-react";
import { Card } from "../../components/ui";

export function ReadyTemplatesPage() {
  return (
    <div className="p-6">
      <Card className="flex flex-col items-start gap-3">
        <LayoutTemplate className="text-violet" size={24} />
        <h1 className="text-lg font-semibold text-fg">Modelos prontos</h1>
        <p className="text-sm text-fg-muted">Em construção — chega em uma próxima etapa.</p>
      </Card>
    </div>
  );
}
