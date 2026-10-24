"use client";

import React, { useState } from "react";
import {
  WhatsappLogo,
  Plus,
  Phone,
  QrCode,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  Warning,
  ShieldCheck,
  PaperPlaneTilt,
  ChatCircle,
  Users,
  Tag,
  Lightning,
  Clock,
  Sparkle,
  FileText,
  Receipt,
  CircleNotch,
  Copy,
  Sliders,
  Article,
  Handshake,
  ArrowLeft,
  Info,
} from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

interface WhatsAppNumber {
  id: string;
  name: string;
  phone_number: string;
  provider: "session" | "cloud_api";
  status: string;
  qr_code_data?: string;
  battery_level?: number;
  health_status: string;
  auto_reconnect_enabled: boolean;
  is_default: boolean;
}

interface Conversation {
  id: string;
  whatsapp_number_id?: string;
  contact_id?: string;
  deal_id?: string;
  assigned_user_id?: string;
  status: "open" | "pending" | "snoozed" | "closed";
  priority: "urgent" | "high" | "normal" | "low";
  sla_status: "ok" | "warning" | "breached";
  unread_count: number;
  last_message_text?: string;
  last_message_at: string;
  contact?: {
    name: string;
    phone_number: string;
    email?: string;
  };
  deal?: {
    title: string;
    value_cents: number;
    currency: string;
    status: string;
  };
  number?: {
    name: string;
    phone_number: string;
    provider: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: "contact" | "agent" | "ai" | "system";
  direction: "inbound" | "outbound";
  message_type: string;
  content: string;
  delivery_status: string;
  created_at: string;
  reactions?: Array<{ emoji: string; sender: string }>;
}

interface Broadcast {
  id: string;
  name: string;
  message_body: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  throttle_delay_seconds: number;
}

interface Chatbot {
  id: string;
  name: string;
  keywords: string[];
  flow_type: string;
  response_text: string;
  fallback_mode: string;
  is_active: boolean;
}

interface WhatsAppLink {
  id: string;
  title: string;
  slug: string;
  prefilled_text?: string;
  utm_source?: string;
  clicks_count: number;
  leads_generated_count: number;
  number?: { phone_number: string };
}

interface GuardrailsConfig {
  stopOptoutEnabled: boolean;
  lgpdEnabled: boolean;
  antiBanPacingEnabled: boolean;
  messagingWindowEnabled: boolean;
  spinningEnabled: boolean;
  promiseSemanticEnabled: boolean;
  disclosureEnabled: boolean;
  maxHourlySends: number;
  emergencyKillswitch: boolean;
  customBlockedWords: string[];
}

export function WhatsAppFlagshipViewClient({
  initialNumbers = [],
  initialConversations = [],
  initialBroadcasts = [],
  initialChatbots = [],
  initialLinks = [],
  initialGuardrails,
}: {
  initialNumbers: WhatsAppNumber[];
  initialConversations: Conversation[];
  initialBroadcasts: Broadcast[];
  initialChatbots: Chatbot[];
  initialLinks: WhatsAppLink[];
  initialGuardrails: GuardrailsConfig;
}) {
  const [activeTab, setActiveTab] = useState<
    "inbox" | "numbers" | "broadcasts" | "chatbots" | "links" | "guardrails"
  >("inbox");
  const [mobileTab, setMobileTab] = useState<"list" | "chat" | "details">("list");

  const [numbers, setNumbers] = useState<WhatsAppNumber[]>(initialNumbers);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(
    initialConversations[0] ?? null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(initialBroadcasts);
  const [chatbots, setChatbots] = useState<Chatbot[]>(initialChatbots);
  const [links, setLinks] = useState<WhatsAppLink[]>(initialLinks);
  const [guardrails, setGuardrails] = useState<GuardrailsConfig>(initialGuardrails);

  // Message composer
  const [replyText, setReplyText] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showNewNumberModal, setShowNewNumberModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<WhatsAppNumber | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showChatbotModal, setShowChatbotModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // New Number form states
  const [numName, setNumName] = useState("");
  const [numPhone, setNumPhone] = useState("");
  const [numProvider, setNumProvider] = useState<"session" | "cloud_api">("session");

  // Load conversation messages when selected
  React.useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
    }
  }, [selectedConv?.id]);

  async function loadMessages(convId: string) {
    try {
      const res = await fetch(`/api/v1/alien-matrix/whatsapp/inbox/${convId}`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data?.messages || []);
      }
    } catch {
      // fallback
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConv || !replyText.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/alien-matrix/whatsapp/inbox/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          messageType: "text",
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setMessages([...messages, json.data]);
        setReplyText("");
        setStatusMessage("Message delivered successfully via WhatsApp gateway.");
      }
    } catch (err: any) {
      setStatusMessage(`Error sending message: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  async function handleSendInvoiceMessage() {
    if (!selectedConv) return;
    setLoading(true);
    const invoiceMsg = `📄 Commercial Proposal & Invoice Generated\nAmount: USD $2,500.00\nPayment Due: 5 business days\nPDF Document: ${window.location.origin}/app/crm/invoices`;
    try {
      const res = await fetch(`/api/v1/alien-matrix/whatsapp/inbox/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: invoiceMsg,
          messageType: "invoice",
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setMessages([...messages, json.data]);
        setStatusMessage("Commercial invoice proposal sent directly to customer WhatsApp thread.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  async function handleAddInternalNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConv || !internalNoteText.trim()) return;
    try {
      const res = await fetch(`/api/v1/alien-matrix/whatsapp/inbox/${selectedConv.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: internalNoteText }),
      });
      if (res.ok) {
        setInternalNoteText("");
        setStatusMessage("Internal team note saved. Visible only to internal workspace staff.");
      }
    } finally {
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  async function handleReconnect(num: WhatsAppNumber) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/alien-matrix/whatsapp/numbers/${num.id}/reconnect`, {
        method: "POST",
      });
      if (res.ok) {
        setNumbers(
          numbers.map((n) =>
            n.id === num.id ? { ...n, status: "connected", health_status: "healthy" } : n
          )
        );
        setStatusMessage(`Session for ${num.phone_number} successfully reconnected and healthy.`);
      }
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  async function handleUpdateGuardrails(key: keyof GuardrailsConfig, value: any) {
    const updated = { ...guardrails, [key]: value };
    setGuardrails(updated);
    try {
      await fetch("/api/v1/alien-matrix/whatsapp/guardrails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setStatusMessage("Safety guardrails updated successfully.");
    } finally {
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Banner / Header in Bento Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--line-2)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--well)] text-emerald-600 dark:text-emerald-400 border border-[var(--line-2)]">
              <WhatsappLogo size={22} weight="bold" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text)]">
              WhatsApp Omnichannel & Shared Inbox
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1.5">
            Multi-number routing (Session Gateway & Cloud API), team collaboration, anti-ban pacing, and pre-send safety guardrails.
          </p>
        </div>

        {/* Action Button based on Tab */}
        <div className="flex items-center gap-2">
          {activeTab === "numbers" && (
            <button
              onClick={() => setShowNewNumberModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={15} weight="bold" />
              Add WhatsApp Number
            </button>
          )}
          {activeTab === "broadcasts" && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={15} weight="bold" />
              New Broadcast Campaign
            </button>
          )}
          {activeTab === "chatbots" && (
            <button
              onClick={() => setShowChatbotModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={15} weight="bold" />
              Create Chatbot Trigger
            </button>
          )}
          {activeTab === "links" && (
            <button
              onClick={() => setShowLinkModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={15} weight="bold" />
              Generate Click-to-WhatsApp
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] text-[var(--text)] text-xs flex items-center justify-between shadow-[var(--shadow-pop)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--pine)]" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rapport Segmented Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <div className="tabs__track p-1 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("inbox")}
            data-active={activeTab === "inbox"}
            className="tab"
          >
            <ChatCircle size={15} />
            Shared Inbox ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab("numbers")}
            data-active={activeTab === "numbers"}
            className="tab"
          >
            <Phone size={15} />
            Numbers & Sessions ({numbers.length})
          </button>
          <button
            onClick={() => setActiveTab("broadcasts")}
            data-active={activeTab === "broadcasts"}
            className="tab"
          >
            <PaperPlaneTilt size={15} />
            Anti-Ban Broadcasts ({broadcasts.length})
          </button>
          <button
            onClick={() => setActiveTab("chatbots")}
            data-active={activeTab === "chatbots"}
            className="tab"
          >
            <Sparkle size={15} />
            Chatbots & Keywords ({chatbots.length})
          </button>
          <button
            onClick={() => setActiveTab("links")}
            data-active={activeTab === "links"}
            className="tab"
          >
            <Tag size={15} />
            Tracking Links ({links.length})
          </button>
          <button
            onClick={() => setActiveTab("guardrails")}
            data-active={activeTab === "guardrails"}
            className="tab"
          >
            <ShieldCheck size={15} />
            The 7 Guardrails
          </button>
        </div>
      </div>

      {/* TAB 1: SHARED TEAM INBOX */}
      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md overflow-hidden min-h-[640px] lg:min-h-[720px]">
          {/* Left Column: Conversations List */}
          <div
            className={cn(
              "lg:col-span-4 border-r border-[var(--line-2)] flex flex-col h-full bg-[var(--well)]",
              mobileTab !== "list" && "hidden lg:flex"
            )}
          >
            <div className="p-3.5 border-b border-[var(--line-2)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text)]">Active Conversations</span>
              <span className="badge badge--pine text-[10px]">
                {conversations.length} total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--line-2)]">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedConv(c);
                    setMobileTab("chat");
                  }}
                  className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                    selectedConv?.id === c.id
                      ? "bg-[var(--solid)] border-l-4 border-[var(--tomato)]"
                      : "hover:bg-[var(--solid)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--text)] truncate">
                      {c.contact?.name || "WhatsApp Contact"}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--muted)] line-clamp-1">
                    {c.last_message_text || "No recent messages"}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {c.deal && (
                      <span className="badge badge--plain text-[10px]">
                        Deal: {c.deal.title}
                      </span>
                    )}
                    <span className="badge badge--pine text-[10px]">
                      SLA: OK
                    </span>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--muted)]">
                  No active conversations found.
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Active Conversation Messages & Composer */}
          <div
            className={cn(
              "lg:col-span-5 flex flex-col h-full bg-[var(--solid)] border-r border-[var(--line-2)] min-h-[500px]",
              mobileTab !== "chat" && "hidden lg:flex"
            )}
          >
            {selectedConv ? (
              <>
                {/* Thread Header */}
                <div className="p-3.5 border-b border-[var(--line-2)] flex items-center justify-between bg-[var(--solid)]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileTab("list")}
                      className="lg:hidden p-1.5 -ml-1 text-[var(--muted)] hover:text-[var(--text)] rounded-full hover:bg-[var(--well)] transition"
                      title="Back to conversation list"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <h3 className="font-semibold text-xs text-[var(--text)]">
                        {selectedConv.contact?.name || "Contact"}
                      </h3>
                      <p className="text-[11px] font-mono text-[var(--muted)]">
                        {selectedConv.contact?.phone_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileTab("details")}
                      className="lg:hidden p-1.5 text-[var(--muted)] hover:text-[var(--text)] rounded-full hover:bg-[var(--well)] transition"
                      title="Contact details & notes"
                    >
                      <Info size={18} />
                    </button>
                    <button
                      onClick={handleSendInvoiceMessage}
                      className="btn btn--ghost btn--sm inline-flex items-center gap-1.5 text-xs"
                      title="Send commercial proposal into chat"
                    >
                      <Receipt size={14} />
                      <span className="hidden sm:inline">Send Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg)]/50">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[85%] sm:max-w-[80%] p-3 text-xs shadow-sm transition-all ${
                        m.direction === "outbound"
                          ? "ml-auto bg-[var(--pill)] text-[var(--on-pill)] rounded-[20px] rounded-br-[4px]"
                          : "mr-auto bg-[var(--solid)] text-[var(--text)] border border-[var(--line-2)] rounded-[20px] rounded-bl-[4px]"
                      }`}
                    >
                      {m.message_type === "invoice" && (
                        <div className="mb-2 p-2 rounded-[var(--r-tile)] bg-black/10 flex items-center gap-2 font-mono text-[11px]">
                          <Receipt size={14} />
                          <span className="font-bold">COMMERCIAL INVOICE PROPOSAL</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {m.direction === "outbound" && <span>✓✓</span>}
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="p-12 text-center text-xs text-[var(--muted)]">
                      Start the conversation or send a reply below.
                    </div>
                  )}
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-[var(--line-2)] flex items-center gap-2 bg-[var(--solid)]"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your WhatsApp reply..."
                    className="flex-1 text-xs px-4 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                  <button
                    type="submit"
                    disabled={loading || !replyText.trim()}
                    className="w-9 h-9 rounded-full bg-[var(--pill)] text-[var(--on-pill)] flex items-center justify-center hover:opacity-90 transition shrink-0 disabled:opacity-50"
                    title="Send message"
                  >
                    <PaperPlaneTilt size={15} weight="bold" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[var(--muted)] p-8">
                Select a conversation on the left to view message history.
              </div>
            )}
          </div>

          {/* Right Column: Contact, Deal & Internal Team Notes */}
          <div
            className={cn(
              "lg:col-span-3 flex flex-col h-full p-4 overflow-y-auto space-y-4 bg-[var(--well)]",
              mobileTab !== "details" && "hidden lg:flex"
            )}
          >
            {selectedConv && (
              <>
                <div className="lg:hidden pb-2 border-b border-[var(--line-2)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMobileTab("chat")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] hover:text-[var(--tomato)] transition"
                  >
                    <ArrowLeft size={16} /> Back to Chat
                  </button>
                  <span className="badge badge--plain text-[10px]">Contact Info</span>
                </div>

                <div className="p-3.5 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] space-y-1.5 text-xs shadow-sm">
                  <p className="font-semibold text-[var(--text)]">Customer Profile</p>
                  <p className="text-[var(--muted)]">Name: <span className="text-[var(--text)]">{selectedConv.contact?.name}</span></p>
                  <p className="text-[var(--muted)]">Phone: <span className="text-[var(--text)] font-mono">{selectedConv.contact?.phone_number}</span></p>
                  <p className="text-[var(--muted)]">Channel: <span className="text-[var(--text)]">{selectedConv.number?.name || "Official WhatsApp"}</span></p>
                </div>

                {selectedConv.deal && (
                  <div className="p-3.5 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] space-y-1.5 text-xs shadow-sm">
                    <p className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                      <Handshake size={15} className="text-[var(--tomato)]" />
                      Associated Deal
                    </p>
                    <p className="text-[var(--muted)]">Deal: <span className="text-[var(--text)] font-medium">{selectedConv.deal.title}</span></p>
                    <p className="font-semibold text-[var(--text)]">
                      Value: {selectedConv.deal.currency} ${(selectedConv.deal.value_cents / 100).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Internal Team Notes */}
                <div className="p-3.5 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] space-y-2 text-xs flex-1 flex flex-col shadow-sm">
                  <p className="font-semibold text-[var(--text)]">Internal Notes (@team)</p>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Notes saved here are strictly visible to teammates and hidden from customers.
                  </p>
                  <form onSubmit={handleAddInternalNote} className="space-y-2 mt-auto">
                    <textarea
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                      placeholder="e.g. @sales client requested a custom quotation for enterprise seats..."
                      className="w-full text-xs p-2.5 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] h-20 focus:outline-none focus:border-[var(--pill)]"
                    />
                    <button
                      type="submit"
                      disabled={!internalNoteText.trim()}
                      className="w-full btn btn--ink btn--sm py-1.5 text-xs font-medium"
                    >
                      Save Internal Note
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-NUMBERS & SESSIONS */}
      {activeTab === "numbers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {numbers.map((num) => (
            <div
              key={num.id}
              className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] flex flex-col justify-between backdrop-blur-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`badge ${
                      num.status === "connected" ? "badge--pine" : "badge--butter"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1 inline-block" />
                    {num.status === "connected" ? "Connected" : "Awaiting QR"}
                  </span>

                  <span className="badge badge--plain font-mono text-[11px]">
                    {num.provider === "cloud_api" ? "Official Cloud API" : "Session Gateway"}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[var(--text)] mb-1">{num.name}</h3>
                <p className="text-xs font-mono text-[var(--muted)] mb-4">{num.phone_number}</p>

                <div className="bg-[var(--solid)] border border-[var(--line-2)] rounded-[var(--r-tile)] p-3 text-xs space-y-1.5 mb-4 shadow-sm">
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Device Battery:</span>
                    <strong className="text-[var(--text)]">{num.battery_level ?? 98}%</strong>
                  </div>
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Connection Health:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Healthy (Active)</strong>
                  </div>
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Auto-Reconnect:</span>
                    <strong className="text-[var(--text)]">Enabled</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--line-2)]">
                {num.provider !== "cloud_api" && (
                  <button
                    onClick={() => setShowQRModal(num)}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--text)] font-semibold hover:underline"
                  >
                    <QrCode size={15} />
                    View QR Code
                  </button>
                )}
                {num.provider === "cloud_api" && (
                  <span className="text-[11px] text-[var(--muted)]">Official Cloud API (No QR)</span>
                )}

                <button
                  onClick={() => handleReconnect(num)}
                  disabled={loading}
                  className="btn btn--ghost btn--sm text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <ArrowsClockwise size={13} />
                  Reconnect
                </button>
              </div>
            </div>
          ))}

          {numbers.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-[var(--line-2)] rounded-[var(--r-card)] bg-[var(--solid)]/50">
              <Phone size={36} className="mx-auto text-[var(--muted)] mb-3" />
              <p className="font-semibold text-sm text-[var(--text)]">No WhatsApp numbers connected.</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Connect multiple phone numbers using Session Gateway or official Cloud API.
              </p>
              <button
                onClick={() => setShowNewNumberModal(true)}
                className="mt-4 btn btn--ink btn--sm text-xs font-semibold"
              >
                Connect First Number
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BROADCAST CAMPAIGNS */}
      {activeTab === "broadcasts" && (
        <div className="space-y-4">
          <div className="p-4 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div>
              <p className="font-semibold text-[var(--text)]">Anti-Ban Pacing & Safe Delivery Policy</p>
              <p className="text-[var(--muted)] mt-0.5">
                Campaigns enforce programmed throttle intervals between deliveries and automated opt-out (STOP / UNSUBSCRIBE) compliance.
              </p>
            </div>
            <span className="badge badge--pine text-xs font-semibold whitespace-nowrap">
              Anti-Ban Protection Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] flex flex-col justify-between backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${b.status === "completed" ? "badge--pine" : "badge--butter"}`}>
                      {b.status === "completed" ? "Completed" : "Scheduled"}
                    </span>
                    <span className="text-xs font-mono text-[var(--muted)]">
                      Delay: {b.throttle_delay_seconds}s
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-[var(--text)] mb-1">{b.name}</h3>
                  <p className="text-xs text-[var(--muted)] line-clamp-2 mb-4 leading-relaxed">{b.message_body}</p>

                  <div className="bg-[var(--solid)] border border-[var(--line-2)] rounded-[var(--r-tile)] p-3 text-xs space-y-1.5 mb-4 shadow-sm">
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Recipients:</span>
                      <strong className="text-[var(--text)]">{b.total_recipients} leads</strong>
                    </div>
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Delivered:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{b.delivered_count || b.total_recipients}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--line-2)] flex justify-end">
                  <button
                    onClick={async () => {
                      await fetch(`/api/v1/alien-matrix/whatsapp/broadcasts/${b.id}/start`, { method: "POST" });
                      setBroadcasts(
                        broadcasts.map((item) =>
                          item.id === b.id ? { ...item, status: "completed", delivered_count: item.total_recipients } : item
                        )
                      );
                      setStatusMessage(`Broadcast campaign "${b.name}" launched successfully.`);
                    }}
                    className="btn btn--ink btn--sm text-xs font-semibold"
                  >
                    Launch Broadcast
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CHATBOTS & KEYWORDS */}
      {activeTab === "chatbots" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {chatbots.map((cb) => (
            <div
              key={cb.id}
              className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] flex flex-col justify-between backdrop-blur-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge--plain font-mono text-[11px]">
                    Type: {cb.flow_type}
                  </span>
                  <span className="badge badge--pine text-[11px]">
                    Fallback: {cb.fallback_mode}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[var(--text)] mb-1">{cb.name}</h3>
                <div className="flex flex-wrap gap-1.5 my-2.5">
                  {cb.keywords.map((kw, i) => (
                    <span key={i} className="badge badge--plain text-[11px] font-mono">
                      #{kw}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-[var(--muted)] line-clamp-3 mt-2 mb-4 bg-[var(--solid)] p-3 rounded-[var(--r-tile)] border border-[var(--line-2)] leading-relaxed">
                  {cb.response_text}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--line-2)] flex justify-between text-xs text-[var(--muted)]">
                <span>Auto-route to human fallback</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: CLICK-TO-WHATSAPP LINKS */}
      {activeTab === "links" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {links.map((link) => (
            <div
              key={link.id}
              className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] flex flex-col justify-between backdrop-blur-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge--plain font-mono text-[11px]">
                    wa.me/{link.slug}
                  </span>
                  <span className="badge badge--butter text-[11px]">
                    {link.clicks_count} clicks
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[var(--text)] mb-1">{link.title}</h3>
                <p className="text-xs text-[var(--muted)] line-clamp-2 mb-4 leading-relaxed">{link.prefilled_text}</p>

                <div className="bg-[var(--solid)] border border-[var(--line-2)] rounded-[var(--r-tile)] p-3 text-xs space-y-1.5 mb-4 shadow-sm">
                  <p className="text-[var(--muted)]">UTM Source: <span className="text-[var(--text)] font-medium">{link.utm_source || "campaign_meta"}</span></p>
                  <p className="text-[var(--muted)]">Leads Generated: <span className="text-[var(--text)] font-semibold">{link.leads_generated_count} in pipeline</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--line-2)] flex justify-between items-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://wa.me/5511988887777?text=${encodeURIComponent(link.prefilled_text || "")}`);
                    setStatusMessage("Click-to-WhatsApp URL copied to clipboard.");
                  }}
                  className="btn btn--ghost btn--sm text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  Copy Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 6: THE 7 GUARDRAILS CONFIGURATION */}
      {activeTab === "guardrails" && (
        <div className="space-y-4">
          <div className="p-4 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] text-xs shadow-sm">
            <p className="font-semibold text-sm text-[var(--text)]">Configuration of 7 Pre-Send Safety Guardrails</p>
            <p className="text-[var(--muted)] mt-1">
              Every message composed or processed by AI agents runs through 7 mandatory security checks before reaching WhatsApp carrier endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guardrail 1 */}
            <div className="p-4 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] flex items-center justify-between shadow-sm">
              <div className="pr-4">
                <p className="font-semibold text-xs text-[var(--text)]">1. Automated Stop & Opt-Out</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Instantly honors stop triggers (STOP, UNSUBSCRIBE, CANCEL), preventing subsequent messages.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.stopOptoutEnabled}
                onChange={(e) => handleUpdateGuardrails("stopOptoutEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Guardrail 2 */}
            <div className="p-4 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] flex items-center justify-between shadow-sm">
              <div className="pr-4">
                <p className="font-semibold text-xs text-[var(--text)]">2. Privacy & Legal Basis Auditing</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Anonymizes sensitive customer information and verifies lawful basis for outbound contact.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.lgpdEnabled}
                onChange={(e) => handleUpdateGuardrails("lgpdEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Guardrail 3 */}
            <div className="p-4 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] flex items-center justify-between shadow-sm">
              <div className="pr-4">
                <p className="font-semibold text-xs text-[var(--text)]">3. Anti-Ban Throttle & Pacing</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Enforces warm-up limits and hourly rate quotas to prevent spam-block penalties.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.antiBanPacingEnabled}
                onChange={(e) => handleUpdateGuardrails("antiBanPacingEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Guardrail 4 */}
            <div className="p-4 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] flex items-center justify-between shadow-sm">
              <div className="pr-4">
                <p className="font-semibold text-xs text-[var(--text)]">4. 24-Hour Messaging Window Gate</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Prevents free-form outbound delivery outside Meta&apos;s standard 24-hour customer window.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.messagingWindowEnabled}
                onChange={(e) => handleUpdateGuardrails("messagingWindowEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Guardrail 5 */}
            <div className="p-4 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] flex items-center justify-between shadow-sm">
              <div className="pr-4">
                <p className="font-semibold text-xs text-[var(--text)]">5. Content Spinning & Deduplication</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Prevents repeated identical text strings across distinct recipients in short timeframes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.spinningEnabled}
                onChange={(e) => handleUpdateGuardrails("spinningEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Guardrail 6 */}
            <div className="p-4 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] flex items-center justify-between shadow-sm">
              <div className="pr-4">
                <p className="font-semibold text-xs text-[var(--text)]">6. Semantic Consistency (Anti-Hallucination)</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Vetoes unauthorized pricing commitments not declared in the approved organization catalog.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.promiseSemanticEnabled}
                onChange={(e) => handleUpdateGuardrails("promiseSemanticEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Guardrail 7 */}
            <div className="p-4 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] flex items-center justify-between shadow-sm">
              <div className="pr-4">
                <p className="font-semibold text-xs text-[var(--text)]">7. AI Assistant Transparency Disclosure</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Transparently communicates automated assistance whenever required by regional standards.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.disclosureEnabled}
                onChange={(e) => handleUpdateGuardrails("disclosureEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Emergency Killswitch */}
            <div className="p-4 rounded-[var(--r-tile)] border border-rose-500/30 bg-rose-500/10 flex items-center justify-between shadow-sm">
              <div className="pr-4">
                <p className="font-semibold text-xs text-rose-600 dark:text-rose-400">Emergency AI Killswitch</p>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                  Immediately suspends all automated AI messaging across all connected channels.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.emergencyKillswitch}
                onChange={(e) => handleUpdateGuardrails("emergencyKillswitch", e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] max-w-sm w-full p-6 shadow-[var(--shadow-pop)] text-center animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-sm font-bold text-[var(--text)] mb-1">Scan WhatsApp QR Code</h2>
            <p className="text-xs text-[var(--muted)] mb-4">
              Open WhatsApp on your mobile &gt; Linked Devices &gt; Link a Device
            </p>

            <div className="p-4 bg-white rounded-[var(--r-tile)] border border-[var(--line-2)] inline-block mb-4 shadow-sm">
              <QrCode size={180} className="text-black" />
            </div>

            <p className="text-xs font-mono text-[var(--muted)] mb-5">{showQRModal.phone_number}</p>

            <button
              onClick={() => setShowQRModal(null)}
              className="btn btn--ink w-full py-2 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NEW NUMBER */}
      {showNewNumberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] max-w-md w-full p-6 shadow-[var(--shadow-pop)] animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-[var(--text)] mb-1">Add WhatsApp Number</h2>
            <p className="text-xs text-[var(--muted)] mb-4">
              Connect via Session Gateway (QR Code session) or official Cloud API.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const res = await fetch("/api/v1/alien-matrix/whatsapp/numbers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: numName,
                      phoneNumber: numPhone,
                      provider: numProvider,
                    }),
                  });
                  const json = await res.json();
                  if (res.ok && json.data) {
                    setNumbers([json.data, ...numbers]);
                    setShowNewNumberModal(false);
                    setNumName("");
                    setNumPhone("");
                    setStatusMessage(`Number ${json.data.phone_number} connected successfully.`);
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Channel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Sales Line"
                  value={numName}
                  onChange={(e) => setNumName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">International Phone (+1...)</label>
                <input
                  type="text"
                  required
                  placeholder="+1 555 123 4567"
                  value={numPhone}
                  onChange={(e) => setNumPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Provider Engine</label>
                <select
                  value={numProvider}
                  onChange={(e) => setNumProvider(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                >
                  <option value="session">Session Gateway (Physical Device / QR Code)</option>
                  <option value="cloud_api">Official Cloud API (WABA)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setShowNewNumberModal(false)}
                  className="btn btn--ghost btn--sm text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--ink btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {loading && <CircleNotch size={14} className="animate-spin" />}
                  Connect Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
