import { useEffect, useState } from "react";
import { FIELD_HELP } from "../../lib/fieldHelp";
import { Globe } from "lucide-react";
import { customDomainSchema, type CustomDomainInfo } from "@presskit/shared";
import { getCustomDomain, setCustomDomain } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { Button, FieldError, Input, Label } from "../../components/ui";
import { Badge } from "../../components/admin/ui";
import { presskitSubdomain } from "../../config";

export function DomainCard({ slug, published }: { slug: string; published: boolean }) {
  const [info, setInfo] = useState<CustomDomainInfo | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCustomDomain()
      .then((result) => {
        setInfo(result);
        setValue(result.domain ?? "");
      })
      .catch((err) => setError(apiErrorMessage(err, "Não foi possível carregar o domínio")));
  }, []);

  async function save(domain: string | null) {
    setBusy(true);
    setError(null);
    try {
      const result = await setCustomDomain(domain);
      setInfo(result);
      setValue(result.domain ?? "");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar o domínio"));
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    const parsed = customDomainSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Domínio inválido");
      return;
    }
    void save(parsed.data);
  }

  const status = info?.status ?? "NONE";

  const subdomain = presskitSubdomain(slug);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-bg p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-fg-muted">Sem domínio? Use o seu endereço grátis:</span>
          <Badge tone={published ? "success" : "warning"}>{published ? "ativo" : "ativa ao publicar"}</Badge>
        </div>
        {published ? (
          <a href={`https://${subdomain}`} target="_blank" rel="noreferrer" className="break-all font-bold text-fg underline">
            {subdomain}
          </a>
        ) : (
          <span className="break-all font-bold text-fg">{subdomain}</span>
        )}
        <span className="text-xs text-fg-muted">Muda junto com o seu link (slug). Não precisa configurar nada.</span>
      </div>
      <p className="text-xs text-fg-muted">
        Ou use um domínio seu (ex.: <span className="text-fg">nomedoartista.com.br</span>) no lugar de presskitai.com.br/
        {"{seu-nome}"}. Você aponta o DNS, a gente ativa.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Label hint={FIELD_HELP.domain}>Domínio</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="nomedoartista.com.br"
            inputMode="url"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <Button type="button" onClick={submit} disabled={busy || !value.trim() || value.trim() === info?.domain}>
          <Globe size={15} /> Salvar
        </Button>
        {info?.domain && (
          <Button type="button" variant="ghost" onClick={() => void save(null)} disabled={busy}>
            Remover
          </Button>
        )}
      </div>
      <FieldError>{error}</FieldError>

      {info?.domain && info.dns && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-bg p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-fg">{info.domain}</span>
            <Badge tone={status === "ACTIVE" ? "success" : "warning"}>
              {status === "ACTIVE" ? "ativo" : "aguardando ativação"}
            </Badge>
          </div>
          <p className="text-xs text-fg-muted">No painel do seu provedor de domínio, crie este registro:</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
            <dt className="text-fg-muted">Tipo</dt>
            <dd className="text-fg">{info.dns.type}</dd>
            <dt className="text-fg-muted">Nome</dt>
            <dd className="break-all text-fg">{info.dns.name}</dd>
            <dt className="text-fg-muted">Valor</dt>
            <dd className="break-all text-fg">{info.dns.value}</dd>
          </dl>
          {status !== "ACTIVE" && (
            <p className="text-xs text-fg-muted">
              Depois que o DNS propagar (até 24h), nossa equipe ativa o domínio — você recebe o aviso por e-mail.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
