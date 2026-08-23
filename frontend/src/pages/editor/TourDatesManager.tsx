import { useEffect, useState } from "react";
import { SECTION_DEFAULT_TITLES } from "@presskit/shared";
import { createTourDate, deleteTourDate, updateSectionData, type TourDate } from "../../api/presskit";
import { SectionTitleField } from "./SectionTitleField";

export function TourDatesManager({
  initial,
  initialTitle,
  onChange,
  onTitleSaved,
}: {
  initial: TourDate[];
  initialTitle: string;
  onChange: (items: TourDate[]) => void;
  onTitleSaved: (title: string) => void;
}) {
  const [items, setItems] = useState(initial);
  const [date, setDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState(initialTitle);
  const [titleSaving, setTitleSaving] = useState(false);
  const titleChanged = title !== initialTitle;

  useEffect(() => setItems(initial), [initial]);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  async function handleAdd() {
    if (!date || !venueName.trim() || !city.trim()) return;
    setBusy(true);
    try {
      const tourDate = await createTourDate({
        date: new Date(date),
        venueName: venueName.trim(),
        city: city.trim(),
        ticketUrl: ticketUrl.trim() || undefined,
      });
      const next = [...items, tourDate].sort((a, b) => a.date.localeCompare(b.date));
      setItems(next);
      onChange(next);
      setDate("");
      setVenueName("");
      setCity("");
      setTicketUrl("");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteTourDate(id);
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    onChange(next);
  }

  async function handleSaveTitle() {
    setTitleSaving(true);
    try {
      const section = await updateSectionData("TOUR_DATES", {}, title);
      onTitleSaved(section.title ?? SECTION_DEFAULT_TITLES.TOUR_DATES);
    } finally {
      setTitleSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-end gap-2">
        <SectionTitleField value={title} defaultTitle={SECTION_DEFAULT_TITLES.TOUR_DATES} onChange={setTitle} />
        {titleChanged && (
          <button
            onClick={handleSaveTitle}
            disabled={titleSaving}
            className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Salvar título
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span>
              {new Date(item.date).toLocaleDateString("pt-BR", { timeZone: "UTC" })} — {item.venueName}, {item.city}
            </span>
            <button onClick={() => handleDelete(item.id)} className="text-red-600">
              remover
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          placeholder="Local"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Cidade"
          className="w-32 rounded border px-3 py-2 text-sm"
        />
        <input
          value={ticketUrl}
          onChange={(e) => setTicketUrl(e.target.value)}
          placeholder="Link de ingressos (opcional)"
          className="w-48 rounded border px-3 py-2 text-sm"
        />
        <button onClick={handleAdd} disabled={busy} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          Adicionar
        </button>
      </div>
    </div>
  );
}
