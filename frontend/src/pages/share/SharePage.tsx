import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy, Instagram, Mail, MessageCircle, Rocket } from "lucide-react";
import { PLAN_LIMITS, type AnalyticsLinkStats, type PlanKey } from "@presskit/shared";
import {
  createLink,
  deleteLink,
  getMyPresskit,
  isPlanLimitError,
  publishPresskit,
  type Presskit,
  type TrackableLink,
} from "../../api/presskit";
import { getAnalyticsSummary } from "../../api/analytics";
import { apiErrorMessage } from "../../api/axios";
import { publicPresskitUrl } from "../../config";
import { useAuthStore } from "../../store/auth.store";
import { Button, Card, FieldError, Input, Label, Textarea } from "../../components/ui";
import { LinksManager } from "../editor/LinksManager";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "Clube X · booking" → "clube-x-booking" (the ?ref= code). */
function codeFromName(name: string): string {
  const code = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");
  return code.length >= 2 ? code : "contato";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

function defaultMessage(url: string) {
  return `Oi! Segue meu presskit com fotos, vídeos e contato: ${url} — bora conversar sobre datas?`;
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "");
}

function toStats(link: TrackableLink): AnalyticsLinkStats {
  return {
    id: link.id,
    label: link.label,
    code: link.code,
    active: link.active ?? true,
    createdAt: link.createdAt,
    totalViews: 0,
    windowViews: 0,
    firstViewAt: null,
    lastViewAt: null,
  };
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function SharePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [planKey, setPlanKey] = useState<PlanKey>(user?.planKey ?? "FREE");

  const [presskit, setPresskit] = useState<Presskit | null>(null);
  const [links, setLinks] = useState<AnalyticsLinkStats[]>([]);
  const [maxLinks, setMaxLinks] = useState(PLAN_LIMITS[planKey].maxTrackableLinks);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [bannerNote, setBannerNote] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  // The link already created for the name currently typed — sending twice
  // to the same contractor must not burn a second link from the quota.
  const [current, setCurrent] = useState<{ name: string; link: AnalyticsLinkStats } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [sendNote, setSendNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await getMyPresskit();
        if (cancelled) return;
        if (!found) {
          navigate("/onboarding");
          return;
        }
        setPresskit(found);
        setMessage(defaultMessage(publicPresskitUrl(found.slug)));
        const summary = await getAnalyticsSummary(7);
        if (cancelled) return;
        setLinks(summary.links);
        setMaxLinks(summary.maxTrackableLinks);
        setPlanKey(summary.plan);
      } catch (error) {
        if (!cancelled) setLoadError(apiErrorMessage(error, "Não foi possível carregar seus links."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const baseUrl = presskit ? publicPresskitUrl(presskit.slug) : "";
  const linkPattern = useMemo(
    () => (baseUrl ? new RegExp(`${escapeRegExp(baseUrl)}(?:\\?ref=[a-z0-9-]+)?`, "g") : null),
    [baseUrl],
  );

  /** Puts `url` where the presskit link sits in the message (or at the end). */
  function withLink(text: string, url: string) {
    if (linkPattern && text.match(linkPattern)) return text.replace(linkPattern, url);
    return `${text.trimEnd()} ${url}`;
  }

  const atLimit = links.length >= maxLinks && !(current && current.name === name.trim());
  const canSend = Boolean(presskit?.published) && name.trim().length > 0 && !sending;

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      setPresskit(await publishPresskit());
    } catch (error) {
      setPublishError(apiErrorMessage(error, "Não foi possível publicar agora. Tente de novo."));
    } finally {
      setPublishing(false);
    }
  }

  async function handleCopyMain(forInstagram: boolean) {
    const ok = await copyText(baseUrl);
    if (!ok) {
      setBannerNote(`Não deu para copiar automaticamente. Seu link: ${baseUrl}`);
      return;
    }
    setBannerNote(
      forInstagram
        ? "Link copiado. No Instagram: Editar perfil → Links → Adicionar link externo, e cole."
        : "Link copiado.",
    );
  }

  /** Returns the message with this contractor's own link, creating it once. */
  async function ensureTrackedMessage(): Promise<string | null> {
    if (!presskit) return null;
    const label = name.trim();
    let link = current && current.name === label ? current.link : null;

    if (!link) {
      const code = codeFromName(label);
      try {
        let created: TrackableLink;
        try {
          created = await createLink({ code, label, active: true });
        } catch (error) {
          // Same code already used for another contractor: add a suffix.
          if ((error as { response?: { status?: number } }).response?.status !== 409) throw error;
          created = await createLink({ code: `${code.slice(0, 35)}-${randomSuffix()}`, label, active: true });
        }
        link = toStats(created);
        setLinks((previous) => [link as AnalyticsLinkStats, ...previous]);
        setCurrent({ name: label, link });
      } catch (error) {
        if (isPlanLimitError(error)) {
          setLimitHit(true);
        } else {
          setSendError(apiErrorMessage(error, "Não foi possível criar o link. Tente de novo."));
        }
        return null;
      }
    }

    const text = withLink(message, publicPresskitUrl(presskit.slug, link.code));
    setMessage(text);
    return text;
  }

  async function handleSend(channel: "whatsapp" | "email" | "copy") {
    setSendError(null);
    setSendNote(null);
    setLimitHit(false);
    if (!canSend) return;

    // Opened synchronously, inside the click, so popup blockers allow it;
    // it's pointed at WhatsApp once the link exists.
    const popup = channel === "whatsapp" ? window.open("about:blank", "_blank") : null;

    setSending(true);
    try {
      const text = await ensureTrackedMessage();
      if (!text) {
        popup?.close();
        return;
      }
      if (channel === "whatsapp") {
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        if (popup) {
          popup.opener = null;
          popup.location.href = url;
        } else {
          window.location.href = url;
        }
        setSendNote("Mensagem aberta no WhatsApp. Escolha o contato e envie.");
      } else if (channel === "email") {
        const subject = `Presskit — ${user?.name ?? "meu trabalho"}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        setSendNote("Abrimos seu app de e-mail com a mensagem pronta.");
      } else {
        const ok = await copyText(text);
        setSendNote(
          ok
            ? "Mensagem copiada com o link só dessa pessoa. É só colar onde quiser."
            : "Não deu para copiar automaticamente — selecione a mensagem acima e copie.",
        );
      }
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteLink(id: string) {
    await deleteLink(id);
    setLinks((previous) => previous.filter((item) => item.id !== id));
    if (current?.link.id === id) setCurrent(null);
  }

  if (loading) return <p className="p-6 text-sm text-fg-muted md:p-8">Carregando...</p>;
  if (!presskit) {
    return <p className="p-6 text-sm text-red-400 md:p-8">{loadError ?? "Presskit não encontrado."}</p>;
  }

  const upgradeMessage = (
    <p className="text-sm leading-relaxed text-fg-muted">
      Você já usou {maxLinks === 1 ? "o seu link" : `os ${maxLinks} links`} do plano {planKey}.{" "}
      <Link to="/assinatura" className="font-bold text-primary-text hover:underline">
        Assine o PRO
      </Link>{" "}
      para enviar até {PLAN_LIMITS.PRO.maxTrackableLinks} contratantes — ou remova um link antigo.
    </p>
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-8 md:py-7">
      <h1 className="text-[26px] font-extrabold text-fg">Compartilhar</h1>

      {presskit.published ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#1F5A43] bg-[#0F2E22] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-base font-extrabold text-[#A7F3D0]">Seu presskit está no ar</p>
              <a
                href={baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm text-[#C9C4D1] hover:text-fg"
              >
                {displayUrl(baseUrl)}
              </a>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button onClick={() => void handleCopyMain(false)} className="bg-fg text-bg hover:bg-white">
                <Copy size={16} /> Copiar link
              </Button>
              <Button variant="secondary" onClick={() => void handleCopyMain(true)}>
                <Instagram size={16} /> Usar na bio do Instagram
              </Button>
            </div>
          </div>
          {bannerNote && (
            <p role="status" className="flex items-center gap-2 text-sm text-[#A7F3D0]">
              <Check size={16} /> {bannerNote}
            </p>
          )}
        </div>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-base font-extrabold text-fg">Seu presskit ainda não está no ar</p>
            <p className="text-sm leading-relaxed text-fg-muted">
              Publique para que o link {displayUrl(baseUrl)} funcione e você possa enviar para contratantes.
            </p>
            <FieldError>{publishError}</FieldError>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 text-[15px] font-bold text-fg hover:bg-white/5"
            >
              Revisar antes
            </Link>
            <Button onClick={() => void handlePublish()} disabled={publishing}>
              <Rocket size={16} /> {publishing ? "Publicando..." : "Publicar agora"}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card
          as="form"
          className="flex min-w-0 flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend("whatsapp");
          }}
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-fg">Enviar para um contratante</h2>
            <p className="text-sm leading-relaxed text-fg-muted">
              Cada contratante recebe um link só dele. Assim você sabe exatamente quem abriu.
            </p>
          </div>

          <div>
            <Label>Para quem é</Label>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSendNote(null);
              }}
              placeholder="Ex: Clube Aurora · booking"
              maxLength={120}
            />
          </div>

          <div>
            <Label>Mensagem pronta</Label>
            <Textarea
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="resize-y leading-normal"
            />
            <p className="mt-1.5 text-[13px] text-fg-muted">
              Ao enviar, o link da mensagem vira o link só dessa pessoa.
            </p>
          </div>

          {atLimit || limitHit ? (
            upgradeMessage
          ) : (
            <div className="flex flex-wrap gap-2.5">
              <Button type="submit" disabled={!canSend}>
                <MessageCircle size={16} /> Enviar no WhatsApp
              </Button>
              <Button type="button" variant="secondary" disabled={!canSend} onClick={() => void handleSend("email")}>
                <Mail size={16} /> Enviar por e-mail
              </Button>
              <Button type="button" variant="secondary" disabled={!canSend} onClick={() => void handleSend("copy")}>
                <Copy size={16} /> Só copiar
              </Button>
            </div>
          )}

          {!presskit.published && (
            <p className="text-[13px] text-fg-muted">Publique seu presskit para liberar o envio.</p>
          )}
          {sendNote && (
            <p role="status" className="text-sm text-[#6EE7B7]">
              {sendNote}
            </p>
          )}
          <FieldError>{sendError}</FieldError>
        </Card>

        <LinksManager
          links={links}
          slug={presskit.slug}
          planKey={planKey}
          maxTrackableLinks={maxLinks}
          onDelete={handleDeleteLink}
        />
      </div>
      {loadError && <p className="text-sm text-red-400">{loadError}</p>}
    </div>
  );
}
