import { useState } from "react";
import { createTourDate, deleteTourDate, type TourDate } from "../../api/presskit";

export function TourDatesManager({
  initial,
  onChange,
}: {
  initial: TourDate[];
  onChange: (items: TourDate[]) => void;
}) {
  const [items, setItems] = useState(initial);
  const [date, setDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 className="font-medium">Agenda de shows</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span>
              {new Date(item.date).toLocaleDateString("pt-BR")} — {item.venueName}, {item.city}
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
