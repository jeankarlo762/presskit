import { useRef, useState } from "react";
import axios from "axios";
import { FONT_FAMILY_CSS, FONT_OPTIONS, PRESET_ACCENT_COLORS, type FontKey } from "@presskit/shared";
import {
  confirmThemeBackground,
  removeThemeBackground,
  requestThemeBackgroundUploadUrl,
  updatePresskit,
  type Presskit,
} from "../../api/presskit";
import { Button, Card, FieldError, Label, Select } from "../../components/ui";

type ThemeValues = Pick<
  Presskit,
  "themeBackgroundColor" | "themeTextColor" | "themeAccentColor" | "themeFontKey" | "themeBackgroundImageUrl"
>;

function ColorSwatch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div
      className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 shadow-sm"
      style={{ backgroundColor: value }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute -left-1 -top-1 h-12 w-12 cursor-pointer opacity-0"
      />
    </div>
  );
}

export function ThemeEditor({ initial, onChange }: { initial: ThemeValues; onChange: (theme: ThemeValues) => void }) {
  const [theme, setTheme] = useState(initial);
  const [savingColor, setSavingColor] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function persist(patch: Partial<ThemeValues>) {
    const next = { ...theme, ...patch };
    setTheme(next);
    setSavingColor(true);
    try {
      await updatePresskit(patch);
      onChange(next);
    } finally {
      setSavingColor(false);
    }
  }

  async function handleBackgroundUpload(file: File) {
    setError(null);
    setUploadingBg(true);
    try {
      const extension = file.name.split(".").pop() ?? "jpg";
      const { uploadUrl, storageKey, publicUrl } = await requestThemeBackgroundUploadUrl(extension);
      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });
      const presskit = await confirmThemeBackground({ storageKey, url: publicUrl });
      const next = { ...theme, themeBackgroundImageUrl: presskit.themeBackgroundImageUrl };
      setTheme(next);
      onChange(next);
    } catch {
      setError("Não foi possível enviar a imagem de fundo — verifique se o armazenamento está configurado");
    } finally {
      setUploadingBg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveBackground() {
    const presskit = await removeThemeBackground();
    const next = { ...theme, themeBackgroundImageUrl: presskit.themeBackgroundImageUrl };
    setTheme(next);
    onChange(next);
  }

  return (
    <Card className="flex flex-col gap-5">
      <h3 className="font-medium text-fg">Aparência</h3>

      <div className="flex flex-wrap gap-6">
        <div>
          <Label>Cor de fundo</Label>
          <ColorSwatch value={theme.themeBackgroundColor} onChange={(v) => persist({ themeBackgroundColor: v })} />
        </div>
        <div>
          <Label>Cor do texto</Label>
          <ColorSwatch value={theme.themeTextColor} onChange={(v) => persist({ themeTextColor: v })} />
        </div>
        <div>
          <Label>Cor de destaque</Label>
          <ColorSwatch value={theme.themeAccentColor} onChange={(v) => persist({ themeAccentColor: v })} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESET_ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => persist({ themeAccentColor: color })}
                style={{ backgroundColor: color }}
                className="h-5 w-5 rounded-full border border-black/10 transition hover:scale-110"
                aria-label={color}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>Tipografia</Label>
        <Select
          value={theme.themeFontKey}
          onChange={(e) => persist({ themeFontKey: e.target.value as FontKey })}
          className="max-w-xs"
          style={{ fontFamily: FONT_FAMILY_CSS[theme.themeFontKey] }}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.key} value={font.key} style={{ fontFamily: FONT_FAMILY_CSS[font.key] }}>
              {font.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Imagem / textura de fundo</Label>
        {theme.themeBackgroundImageUrl ? (
          <div className="flex items-center gap-3">
            <img
              src={theme.themeBackgroundImageUrl}
              alt="Fundo"
              className="h-16 w-16 rounded-2xl object-cover shadow-sm"
            />
            <Button onClick={handleRemoveBackground} variant="ghost" size="sm">
              remover
            </Button>
          </div>
        ) : (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploadingBg}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleBackgroundUpload(file);
            }}
            className="text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-violet file:to-magenta file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:opacity-90"
          />
        )}
        {uploadingBg && <p className="mt-2 text-sm text-fg-muted">Enviando...</p>}
        <FieldError>{error}</FieldError>
      </div>

      {savingColor && <p className="text-xs text-fg-muted">Salvando...</p>}
    </Card>
  );
}
