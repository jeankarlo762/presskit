import { Sparkles } from "lucide-react";
import { Card } from "../../components/ui";

export function CreateWithAiPage() {
  return (
    <div className="p-6">
      <Card className="flex flex-col items-start gap-3">
        <Sparkles className="text-violet" size={24} />
        <h1 className="text-lg font-semibold text-fg">Crie com IA</h1>
        <p className="text-sm text-fg-muted">Em construção — chega em uma próxima etapa.</p>
      </Card>
    </div>
  );
}
