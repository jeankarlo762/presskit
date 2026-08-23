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

type ThemeValues = Pick<
  Presskit,
  "themeBackgroundColor" | "themeTextColor" | "themeAccentColor" | "themeFontKey" | "themeBackgroundImageUrl"
>;

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
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <h3 className="font-medium">Aparência</h3>

      <div className="flex flex-wrap gap-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Cor de fundo</label>
          <input
            type="color"
            value={theme.themeBackgroundColor}
            onChange={(e) => persist({ themeBackgroundColor: e.target.value })}
            className="h-9 w-16 cursor-pointer rounded border"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cor do texto</label>
          <input
            type="color"
            value={theme.themeTextColor}
            onChange={(e) => persist({ themeTextColor: e.target.value })}
            className="h-9 w-16 cursor-pointer rounded border"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cor de destaque</label>
          <input
            type="color"
            value={theme.themeAccentColor}
            onChange={(e) => persist({ themeAccentColor: e.target.value })}
            className="h-9 w-16 cursor-pointer rounded border"
          />
          <div className="mt-1 flex gap-1">
            {PRESET_ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => persist({ themeAccentColor: color })}
                style={{ backgroundColor: color }}
                className="h-5 w-5 rounded-full border border-black/10"
                aria-label={color}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tipografia</label>
        <select
          value={theme.themeFontKey}
          onChange={(e) => persist({ themeFontKey: e.target.value as FontKey })}
          className="rounded border px-3 py-2 text-sm"
          style={{ fontFamily: FONT_FAMILY_CSS[theme.themeFontKey] }}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.key} value={font.key} style={{ fontFamily: FONT_FAMILY_CSS[font.key] }}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Imagem / textura de fundo</label>
        {theme.themeBackgroundImageUrl ? (
          <div className="flex items-center gap-3">
            <img src={theme.themeBackgroundImageUrl} alt="Fundo" className="h-16 w-16 rounded object-cover" />
            <button onClick={handleRemoveBackground} className="text-sm text-red-600">
              remover
            </button>
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
            className="text-sm"
          />
        )}
        {uploadingBg && <p className="mt-1 text-sm text-neutral-500">Enviando...</p>}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      {savingColor && <p className="text-xs text-neutral-400">Salvando...</p>}
    </div>
  );
}
