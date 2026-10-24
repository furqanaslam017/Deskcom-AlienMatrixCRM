"use client";

import React, { useState } from "react";
import { CalendarCheck, PhoneCall, VideoCamera, Plus, Clock, Check, X, CircleNotch, User, ChatCircleText } from "@phosphor-icons/react";

interface EventItem {
  id: string;
  type: "task" | "call" | "meeting" | "demo" | "video_call" | "whatsapp_call";
  title: string;
  date: string;
  status: string;
  priority?: string;
  contactName?: string;
  leadTitle?: string;
  notes?: string;
  durationMinutes?: number;
}

interface CalendarViewClientProps {
  initialEvents: EventItem[];
  contacts: Array<{ id: string; name: string }>;
}

export function CalendarViewClient({ initialEvents, contacts }: CalendarViewClientProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [activityType, setActivityType] = useState<any>("call");
  const [direction, setDirection] = useState<any>("outbound");
  const [outcome, setOutcome] = useState<any>("completed");
  const [subject, setSubject] = useState("");
  const [contactId, setContactId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group events by date
  const eventsByDate: Record<string, EventItem[]> = {};
  for (const ev of events) {
    const d = ev.date ? ev.date.split("T")[0] : "Sem data";
    if (d) {
      if (!eventsByDate[d]) eventsByDate[d] = [];
      eventsByDate[d].push(ev);
    }
  }

  const sortedDates = Object.keys(eventsByDate).sort().reverse();

  async function handleCreateCall(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/alien-matrix/activities/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType,
          direction,
          outcome,
          subject: subject.trim(),
          contactId: contactId || undefined,
          durationSeconds: (parseInt(durationMinutes, 10) || 0) * 60,
          performedAt: eventDate ? `${eventDate}T12:00:00Z` : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || "Erro ao registrar atividade");
      }

      const created = json.data || json;
      const contactObj = contacts.find((c) => c.id === contactId);

      const newEv: EventItem = {
        id: created.id,
        type: activityType,
        title: created.subject,
        date: created.performed_at || new Date().toISOString(),
        status: created.outcome,
        contactName: contactObj?.name,
        notes: created.notes,
        durationMinutes: parseInt(durationMinutes, 10) || 0,
      };

      setEvents((prev) => [newEv, ...prev]);
      setIsModalOpen(false);
      setSubject("");
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-medium">
          {events.length} atividades e tarefas programadas na linha do tempo
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          <Plus size={16} weight="bold" />
          Registrar Ligação / Reunião
        </button>
      </div>

      {/* Timeline View */}
      <div className="space-y-6">
        {sortedDates.map((dateStr) => {
          const dayEvents = eventsByDate[dateStr] || [];
          return (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {dateStr === "Sem data"
                    ? "Sem Data Definida"
                    : new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                      })}
                </span>
                <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        ev.type === "meeting" || ev.type === "demo"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : ev.type === "whatsapp_call"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : ev.type === "task"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {ev.type === "meeting" || ev.type === "demo" ? (
                        <VideoCamera size={20} weight="duotone" />
                      ) : ev.type === "whatsapp_call" ? (
                        <ChatCircleText size={20} weight="duotone" />
                      ) : ev.type === "task" ? (
                        <CalendarCheck size={20} weight="duotone" />
                      ) : (
                        <PhoneCall size={20} weight="duotone" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {ev.title}
                        </h4>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {ev.status}
                        </span>
                      </div>

                      {ev.contactName && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                          <User size={13} />
                          <span>{ev.contactName}</span>
                          {ev.leadTitle && (
                            <span className="text-zinc-400 truncate">({ev.leadTitle})</span>
                          )}
                        </div>
                      )}

                      {ev.notes && (
                        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                          {ev.notes}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-zinc-400">
                        {ev.durationMinutes !== undefined && ev.durationMinutes > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{ev.durationMinutes} min</span>
                          </div>
                        )}
                        <span className="uppercase font-medium text-zinc-400">
                          {ev.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="py-16 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            No activities or scheduled appointments found.
          </div>
        )}
      </div>

      {/* Log Call Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <PhoneCall size={20} className="text-blue-500" />
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Registrar Atividade Comercial
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCall} className="mt-4 space-y-3.5">
              {error && (
                <div className="p-3 text-xs text-red-600 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Tipo de Atividade
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="call">Ligação Telefônica</option>
                    <option value="whatsapp_call">Ligação de WhatsApp</option>
                    <option value="meeting">Reunião Presencial</option>
                    <option value="demo">Demonstração de Produto</option>
                    <option value="video_call">Videoconferência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Resultado / Desfecho
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="completed">Completed Successfully</option>
                    <option value="connected">Falou com Decisor</option>
                    <option value="busy">Ocupado</option>
                    <option value="no_answer">Sem Resposta</option>
                    <option value="rescheduled">Reagendada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Contato Relacionado
                </label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Selecione um contato...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Assunto / Resumo *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Alinhamento de proposta comercial"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notas e Próximos Passos
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Principais pontos acordados..."
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isSubmitting ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
                  Registrar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
