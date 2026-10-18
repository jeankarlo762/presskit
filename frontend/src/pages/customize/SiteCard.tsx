import { useEffect, useState } from "react";
import { FIELD_HELP } from "../../lib/fieldHelp";
import { NAV_MODES, NAV_MODE_LABELS, type NavMode, type PresskitUpdateInput } from "@presskit/shared";
import type { Presskit } from "../../api/presskit";
import { Input, Label, Select } from "../../components/ui";
import { useAuthStore } from "../../store/auth.store";

export function SiteCard({ presskit, onChange }: { presskit: Presskit; onChange: (patch: PresskitUpdateInput) => void }) {
  const userName = useAuthStore((state) => state.user?.name ?? "");
  const [tagline, setTagline] = useState(presskit.tagline ?? "");
  const [displayName, setDisplayName] = useState(presskit.displayName ?? "");
  useEffect(() => setTagline(presskit.tagline ?? ""), [presskit.tagline]);
  useEffect(() => setDisplayName(presskit.displayName ?? ""), [presskit.displayName]);

  function commitDisplayName() {
    const trimmed = displayName.trim();
    // Roster pages must keep a name; the account page can fall back to the account name.
    if (presskit.agencyId && trimmed.length < 2) {
      setDisplayName(presskit.displayName ?? "");
      return;
    }
    if ((trimmed || null) !== presskit.displayName) onChange({ displayName: trimmed || null });
  }

  function commitTagline() {
    const trimmed = tagline.trim();
    if ((trimmed || null) !== presskit.tagline) onChange({ tagline: trimmed || null });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label hint={FIELD_HELP.displayName}>Nome na página</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={commitDisplayName}
          maxLength={80}
          placeholder={presskit.agencyId ? "Nome artístico" : userName || "Nome da conta"}
        />
      </div>
      <div>
        <Label hint={FIELD_HELP.tagline}>Frase abaixo do nome</Label>
        <Input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          onBlur={commitTagline}
          maxLength={140}
          placeholder="Ex.: DJ e produtor de techno · São Paulo"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg-muted">
          Navegação entre seções
          <Select value={presskit.navMode} onChange={(e) => onChange({ navMode: e.target.value as NavMode })}>
            {NAV_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {NAV_MODE_LABELS[mode]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex min-h-11 items-end gap-2.5 pb-2.5 text-[13px] font-semibold text-fg-muted">
          <input
            type="checkbox"
            checked={presskit.showNav}
            onChange={(e) => onChange({ showNav: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          Mostrar menu com as seções
        </label>
      </div>
      <p className="text-xs text-fg-muted">
        No modo "abas", o visitante vê uma seção por vez (como um site com páginas). Em "rolagem", o menu fixo leva
        para cada parte da página.
      </p>
    </div>
  );
}
