import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Pencil, Plus, Users } from "lucide-react";
import {
  ARTIST_CATEGORY_LABELS,
  PICKABLE_ARTIST_CATEGORIES,
  rosterArtistCreateSchema,
  type RosterArtistCreateInput,
} from "@presskit/shared";
import { createRosterArtist, deleteRosterArtist, listMyPresskits, type Presskit } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { usePresskitStore } from "../../store/presskit.store";
import { publicPresskitUrl, SITE_HOST } from "../../config";
import { Button, Card, FieldError, Input, Label, Select } from "../../components/ui";
import { Badge, ConfirmButton, PageHeader } from "../../components/admin/ui";
import { InfoTip } from "../../components/InfoTip";
import { FIELD_HELP } from "../../lib/fieldHelp";

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function ArtistsPage() {
  const navigate = useNavigate();
  const setActivePresskitId = usePresskitStore((state) => state.setActivePresskitId);
  const [pages, setPages] = useState<Presskit[]>([]);
  const [roster, setRoster] = useState({ used: 0, seats: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RosterArtistCreateInput>({
    resolver: zodResolver(rosterArtistCreateSchema),
    defaultValues: { name: "", category: "MUSICO_BANDA", slug: "" },
  });
  const name = watch("name");
  const slug = watch("slug");

  async function load() {
    try {
      const result = await listMyPresskits();
      setPages(result.presskits);
      setRoster(result.roster);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível carregar seus artistas"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const agencyPage = pages.find((p) => !p.agencyId) ?? null;
  const artists = pages.filter((p) => p.agencyId);
  const canAdd = roster.used < roster.seats;

  function openEditor(page: Presskit) {
    setActivePresskitId(page.agencyId ? page.id : null);
    navigate("/");
  }

  async function onSubmit(input: RosterArtistCreateInput) {
    setError(null);
    try {
      const created = await createRosterArtist(input);
      reset({ name: "", category: "MUSICO_BANDA", slug: "" });
      setAdding(false);
      await load();
      openEditor(created);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar a página do artista"));
    }
  }

  async function handleDelete(page: Presskit) {
    setDeleting(page.id);
    setError(null);
    try {
      await deleteRosterArtist(page.id);
      const active = usePresskitStore.getState().activePresskitId;
      if (active === page.id) setActivePresskitId(null);
      setArmedDelete(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover"));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-6 sm:px-8">
      <PageHeader
        icon={Users}
        title="Artistas"
        description="Cada artista tem a própria página, com o mesmo painel. A página da produtora lista todos os publicados."
        actions={<InfoTip content={FIELD_HELP.roster} label="Sobre os artistas" />}
      />
      <FieldError>{error}</FieldError>

      {loading ? (
        <p className="text-sm text-fg-muted">Carregando...</p>
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-fg">
                {roster.used} de {roster.seats} {roster.seats === 1 ? "artista" : "artistas"} do plano
              </p>
              <p className="text-sm text-fg-muted">
                {roster.seats === 0
                  ? "Seu plano atual não inclui páginas de artistas."
                  : canAdd
                    ? `Você ainda pode criar ${roster.seats - roster.used} ${roster.seats - roster.used === 1 ? "página" : "páginas"}.`
                    : "Limite do plano atingido."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!canAdd && (
                <Link
                  to="/assinatura"
                  className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-[15px] font-bold text-fg transition hover:bg-white/5"
                >
                  Aumentar plano
                </Link>
              )}
              <Button onClick={() => setAdding((v) => !v)} disabled={!canAdd}>
                <Plus size={16} /> Novo artista
              </Button>
            </div>
          </Card>

          {adding && (
            <Card>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <h2 className="font-extrabold text-fg">Nova página de artista</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Nome artístico</Label>
                    <Input
                      autoFocus
                      placeholder="Ex.: Banda Alvorada"
                      {...register("name", {
                        onChange: (e) => {
                          if (!slug || slug === slugify(name)) setValue("slug", slugify(e.target.value));
                        },
                      })}
                    />
                    <FieldError>{errors.name?.message}</FieldError>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select {...register("category")}>
                      {PICKABLE_ARTIST_CATEGORIES.map((key) => (
                        <option key={key} value={key}>
                          {ARTIST_CATEGORY_LABELS[key]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Endereço da página</Label>
                  <div className="flex min-h-11 w-full items-center rounded-xl border border-white/15 bg-bg px-4 py-2 focus-within:border-primary-text">
                    <span className="text-[15px] text-fg-muted">{SITE_HOST}/</span>
                    <input className="w-full bg-transparent text-[15px] text-fg outline-none" placeholder="nome-do-artista" {...register("slug")} />
                  </div>
                  <FieldError>{errors.slug?.message}</FieldError>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Criando..." : "Criar página"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <ul className="flex flex-col gap-2">
            {agencyPage && <PageRow page={agencyPage} label="Página da produtora" onEdit={() => openEditor(agencyPage)} />}
            {artists.map((page) => (
              <PageRow
                key={page.id}
                page={page}
                label={ARTIST_CATEGORY_LABELS[page.category]}
                onEdit={() => openEditor(page)}
                remove={
                  <ConfirmButton
                    label="Remover"
                    confirmLabel="Apagar página e fotos"
                    armed={armedDelete === page.id}
                    onArm={() => setArmedDelete(page.id)}
                    onDisarm={() => setArmedDelete(null)}
                    onConfirm={() => handleDelete(page)}
                    disabled={deleting === page.id}
                  />
                }
              />
            ))}
          </ul>
          {artists.length === 0 && !adding && (
            <p className="text-sm text-fg-muted">Nenhum artista ainda. Clique em "Novo artista" para criar a primeira página.</p>
          )}
        </>
      )}
    </div>
  );
}

function PageRow({ page, label, onEdit, remove }: { page: Presskit; label: string; onEdit: () => void; remove?: React.ReactNode }) {
  const name = page.displayName ?? "Minha página";
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3">
      {page.avatarImageUrl ? (
        <img src={page.avatarImageUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-elevated-2 text-lg font-extrabold text-primary-text">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-bold text-fg">
          {name}
          <span className="ml-2 text-xs font-semibold text-fg-muted">{label}</span>
        </span>
        <a
          href={publicPresskitUrl(page.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate text-xs text-fg-muted hover:text-fg"
        >
          /{page.slug} <ExternalLink size={11} />
        </a>
      </span>
      <Badge tone={page.published ? "success" : "neutral"}>{page.published ? "publicado" : "rascunho"}</Badge>
      <Button variant="secondary" size="sm" onClick={onEdit}>
        <Pencil size={14} /> Editar
      </Button>
      {remove}
    </li>
  );
}
