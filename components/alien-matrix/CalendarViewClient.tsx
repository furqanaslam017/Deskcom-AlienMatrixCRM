"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Phone,
  VideoCamera,
  Plus,
  Clock,
  Check,
  X,
  CircleNotch,
  UserCircle,
  ChatCircle,
} from "@/lib/ui/icons";

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
    const d = ev.date ? ev.date.split("T")[0] : "Unscheduled";
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
        throw new Error(json.error || json.message || "Failed to record activity");
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line-2)]">
        <div>
          <span className="text-xs font-semibold text-[var(--muted)]">
            {events.length} activities and scheduled appointments on timeline
          </span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn--ink inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 w-full sm:w-auto"
        >
          <Plus size={15} weight="bold" />
          Log Activity / Meeting
        </button>
      </div>

      {/* Timeline View */}
      <div className="space-y-6">
        {sortedDates.map((dateStr) => {
          const dayEvents = eventsByDate[dateStr] || [];
          return (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="badge badge--plain text-xs font-semibold tracking-wider">
                  {dateStr === "Unscheduled"
                    ? "Unscheduled"
                    : new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                      })}
                </span>
                <span className="h-px flex-1 bg-[var(--line-2)]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3.5 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] p-4 shadow-sm hover:shadow-[var(--shadow-pop)] transition-all"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-2)] ${
                        ev.type === "meeting" || ev.type === "demo"
                          ? "bg-[var(--well)] text-purple-600 dark:text-purple-400"
                          : ev.type === "whatsapp_call"
                          ? "bg-[var(--well)] text-emerald-600 dark:text-emerald-400"
                          : ev.type === "task"
                          ? "bg-[var(--well)] text-amber-600 dark:text-amber-400"
                          : "bg-[var(--well)] text-[var(--tomato)]"
                      }`}
                    >
                      {ev.type === "meeting" || ev.type === "demo" ? (
                        <VideoCamera size={18} weight="bold" />
                      ) : ev.type === "whatsapp_call" ? (
                        <ChatCircle size={18} weight="bold" />
                      ) : ev.type === "task" ? (
                        <CalendarCheck size={18} weight="bold" />
                      ) : (
                        <Phone size={18} weight="bold" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[var(--text)] truncate">
                          {ev.title}
                        </h4>
                        <span className="badge badge--plain text-[10px] uppercase font-bold shrink-0">
                          {ev.status}
                        </span>
                      </div>

                      {ev.contactName && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                          <UserCircle size={14} />
                          <span>{ev.contactName}</span>
                          {ev.leadTitle && (
                            <span className="opacity-75 truncate">({ev.leadTitle})</span>
                          )}
                        </div>
                      )}

                      {ev.notes && (
                        <p className="mt-2 text-xs text-[var(--text)] bg-[var(--well)] p-2.5 rounded-[var(--r-tile)] border border-[var(--line-2)] leading-relaxed">
                          {ev.notes}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[var(--muted)]">
                        {ev.durationMinutes !== undefined && ev.durationMinutes > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock size={13} />
                            <span>{ev.durationMinutes} min</span>
                          </div>
                        )}
                        <span className="uppercase font-semibold tracking-wider opacity-75">
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
          <div className="py-16 text-center text-xs text-[var(--muted)] border-2 border-dashed border-[var(--line-2)] rounded-[var(--r-card)] bg-[var(--solid)]/50">
            No activities or scheduled appointments found.
          </div>
        )}
      </div>

      {/* Log Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-[var(--r-card)] bg-[var(--solid)] border border-[var(--rim)] shadow-[var(--shadow-pop)] p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-[var(--line-2)]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[var(--well)] border border-[var(--line-2)] flex items-center justify-center text-[var(--tomato)]">
                  <Phone size={16} weight="bold" />
                </span>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Log Commercial Activity
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateCall} className="mt-4 space-y-3.5">
              {error && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 rounded-[var(--r-tile)] bg-rose-500/10 border border-rose-500/20">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Activity Type
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="call">Phone Call</option>
                    <option value="whatsapp_call">WhatsApp Call</option>
                    <option value="meeting">In-Person Meeting</option>
                    <option value="demo">Product Demo</option>
                    <option value="video_call">Video Conference</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Outcome
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="completed">Completed Successfully</option>
                    <option value="connected">Connected with Decision Maker</option>
                    <option value="busy">Busy / Line Busy</option>
                    <option value="no_answer">No Answer</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Related Contact
                </label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                >
                  <option value="">Select a contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Commercial proposal review & roadmap alignment"
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Notes & Next Steps
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key decisions and action items agreed upon..."
                  className="w-full rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn--ghost btn--sm text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn--ink btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
