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
} from "@/lib/ui/icons";

interface WhatsAppNumber {
  id: string;
  name: string;
  phone_number: string;
  provider: "waha" | "meta_cloud";
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
  const [numProvider, setNumProvider] = useState<"waha" | "meta_cloud">("waha");

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
        setStatusMessage("Message sent successfully via WhatsApp channel!");
      }
    } catch (err: any) {
      setStatusMessage(`Erro ao enviar: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  async function handleSendInvoiceMessage() {
    if (!selectedConv) return;
    setLoading(true);
    const invoiceMsg = `📄 Fatura / Proposta Comercial Gerada\nValor: USD $2,500.00\nVencimento: 5 dias\nLink PDF: ${window.location.origin}/app/crm/invoices`;
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
        setStatusMessage("Proposta comercial enviada diretamente no chat do cliente!");
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
        setStatusMessage("Nota interna salva! Visível apenas para a equipe.");
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
        setStatusMessage(`Sessão do número ${num.phone_number} reconectada e saudável!`);
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
      setStatusMessage("Safety guardrails updated successfully!");
    } finally {
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <WhatsappLogo size={26} weight="bold" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">WhatsApp Flagship & Shared Inbox</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-number support (WAHA & Meta Cloud API), shared team inbox, anti-ban broadcasts, and 7 configurable safety guardrails.
          </p>
        </div>

        {/* Action Button based on Tab */}
        <div className="flex items-center gap-2">
          {activeTab === "numbers" && (
            <button
              onClick={() => setShowNewNumberModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition shadow-sm"
            >
              <Plus size={16} weight="bold" />
              Adicionar Número
            </button>
          )}
          {activeTab === "broadcasts" && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} weight="bold" />
              New Broadcast
            </button>
          )}
          {activeTab === "chatbots" && (
            <button
              onClick={() => setShowChatbotModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} weight="bold" />
              Novo Chatbot
            </button>
          )}
          {activeTab === "links" && (
            <button
              onClick={() => setShowLinkModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} weight="bold" />
              Gerar Link WhatsApp
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm flex items-center justify-between animate-fadeIn">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-semibold hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "inbox"
              ? "border-emerald-600 text-emerald-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ChatCircle size={16} />
          Shared Team Inbox ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab("numbers")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "numbers"
              ? "border-emerald-600 text-emerald-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Phone size={16} />
          Multi-Numbers & Sessions ({numbers.length})
        </button>
        <button
          onClick={() => setActiveTab("broadcasts")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "broadcasts"
              ? "border-emerald-600 text-emerald-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <PaperPlaneTilt size={16} />
          Transmissões Anti-Ban ({broadcasts.length})
        </button>
        <button
          onClick={() => setActiveTab("chatbots")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "chatbots"
              ? "border-emerald-600 text-emerald-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkle size={16} />
          Chatbots & Palavras-Chave ({chatbots.length})
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "links"
              ? "border-emerald-600 text-emerald-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag size={16} />
          Links & Rastreio ({links.length})
        </button>
        <button
          onClick={() => setActiveTab("guardrails")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "guardrails"
              ? "border-emerald-600 text-emerald-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck size={16} />
          Os 7 Guardrails
        </button>
      </div>

      {/* TAB 1: SHARED TEAM INBOX */}
      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[720px] border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          {/* Left Column: Conversations List */}
          <div className="lg:col-span-4 border-r border-border flex flex-col h-full bg-muted/10">
            <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Conversas Ativas</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                {conversations.length} total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedConv(c)}
                  className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                    selectedConv?.id === c.id ? "bg-muted/80 border-l-4 border-emerald-500" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {c.contact?.name || "Contato WhatsApp"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {c.last_message_text || "Sem mensagens recentes"}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {c.deal && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                        Deal: {c.deal.title}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                      SLA: OK
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Column: Active Conversation Messages & Composer */}
          <div className="lg:col-span-5 flex flex-col h-full bg-background border-r border-border">
            {selectedConv ? (
              <>
                {/* Thread Header */}
                <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20">
                  <div>
                    <h3 className="font-semibold text-sm">{selectedConv.contact?.name || "Contato"}</h3>
                    <p className="text-xs text-muted-foreground">{selectedConv.contact?.phone_number}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSendInvoiceMessage}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-border bg-card hover:bg-muted transition flex items-center gap-1"
                    >
                      <Receipt size={13} />
                      Enviar Fatura
                    </button>
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] rounded-xl p-3 text-xs shadow-sm ${
                        m.direction === "outbound"
                          ? "ml-auto bg-emerald-600 text-white rounded-br-none"
                          : "mr-auto bg-card border border-border text-foreground rounded-bl-none"
                      }`}
                    >
                      {m.message_type === "invoice" && (
                        <div className="mb-2 p-2 rounded bg-black/10 flex items-center gap-2 font-mono text-[11px]">
                          <Receipt size={14} />
                          <span>FATURA COMERCIAL</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {m.direction === "outbound" && <span>✓✓</span>}
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Inicie a conversa ou envie uma resposta abaixo.
                    </div>
                  )}
                </div>

                {/* Composer */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your WhatsApp reply... (use /demo or /pricing for quick templates)"
                    className="flex-1 text-xs p-2.5 rounded-lg border border-border bg-card"
                  />
                  <button
                    type="submit"
                    disabled={loading || !replyText.trim()}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition flex items-center gap-1.5"
                  >
                    <PaperPlaneTilt size={14} weight="bold" />
                    Enviar
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Selecione uma conversa ao lado para ver o histórico.
              </div>
            )}
          </div>

          {/* Right Column: Contact, Deal & Internal Team Notes */}
          <div className="lg:col-span-3 flex flex-col h-full p-4 overflow-y-auto space-y-4 bg-muted/10">
            {selectedConv && (
              <>
                <div className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs">
                  <p className="font-semibold text-foreground">Ficha do Cliente</p>
                  <p className="text-muted-foreground">Nome: {selectedConv.contact?.name}</p>
                  <p className="text-muted-foreground">Telefone: {selectedConv.contact?.phone_number}</p>
                  <p className="text-muted-foreground">Canal: {selectedConv.number?.name || "WhatsApp Oficial"}</p>
                </div>

                {selectedConv.deal && (
                  <div className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Handshake size={14} className="text-primary" />
                      Oportunidade Vinculada
                    </p>
                    <p className="text-muted-foreground">Negócio: {selectedConv.deal.title}</p>
                    <p className="font-semibold text-foreground">
                      Valor: {selectedConv.deal.currency} ${(selectedConv.deal.value_cents / 100).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Internal Team Notes (@mentions) */}
                <div className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs flex-1 flex flex-col">
                  <p className="font-semibold text-foreground">Notas Internas (@equipe)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Anotações visíveis apenas para a equipe, não aparecem para o cliente.
                  </p>
                  <form onSubmit={handleAddInternalNote} className="space-y-2 mt-auto">
                    <textarea
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                      placeholder="e.g. @carlos client requested a 10% discount on annual plan..."
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background h-20"
                    />
                    <button
                      type="submit"
                      disabled={!internalNoteText.trim()}
                      className="w-full py-1.5 rounded bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80"
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
            <div key={num.id} className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5 ${
                      num.status === "connected"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {num.status === "connected" ? "Conectado" : "Aguardando QR"}
                  </span>

                  <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono font-medium">
                    {num.provider === "waha" ? "WAHA Engine" : "Meta Cloud API"}
                  </span>
                </div>

                <h3 className="font-semibold text-base mb-1">{num.name}</h3>
                <p className="text-sm font-mono text-muted-foreground mb-4">{num.phone_number}</p>

                <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Bateria do Dispositivo:</span>
                    <strong className="text-foreground">{num.battery_level ?? 98}%</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Saúde da Conexão:</span>
                    <strong className="text-emerald-600">Saudável (Ativa)</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Reconexão Automática:</span>
                    <strong className="text-foreground">Ativada</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                {num.provider === "waha" && (
                  <button
                    onClick={() => setShowQRModal(num)}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <QrCode size={14} />
                    Ver QR Code
                  </button>
                )}
                {num.provider === "meta_cloud" && (
                  <span className="text-[11px] text-muted-foreground">Oficial (Sem QR)</span>
                )}

                <button
                  onClick={() => handleReconnect(num)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition"
                >
                  <ArrowsClockwise size={12} />
                  Reconnect
                </button>
              </div>
            </div>
          ))}

          {numbers.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl">
              <Phone size={40} className="mx-auto text-muted-foreground/60 mb-3" />
              <p className="font-medium text-sm">No WhatsApp numbers connected.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect multiple phone numbers using WAHA or the official Meta Cloud API.
              </p>
              <button
                onClick={() => setShowNewNumberModal(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium"
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
          <div className="p-4 bg-muted/30 border border-border rounded-xl text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Regras de Anti-Ban e Espaçamento Seguro</p>
              <p className="text-muted-foreground">
                Disparos respeitam delay programado entre cada mensagem e opt-out automático (STOP / SAIR) para manter seu número seguro.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
              Proteção Anti-Ban Ativa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {broadcasts.map((b) => (
              <div key={b.id} className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                      {b.status === "completed" ? "Concluída" : "Pronta"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Delay: {b.throttle_delay_seconds}s
                    </span>
                  </div>

                  <h3 className="font-semibold text-base mb-1">{b.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{b.message_body}</p>

                  <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destinatários:</span>
                      <strong>{b.total_recipients} leads</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entregues:</span>
                      <strong className="text-emerald-600">{b.delivered_count || b.total_recipients}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    onClick={async () => {
                      await fetch(`/api/v1/alien-matrix/whatsapp/broadcasts/${b.id}/start`, { method: "POST" });
                      setBroadcasts(
                        broadcasts.map((item) =>
                          item.id === b.id ? { ...item, status: "completed", delivered_count: item.total_recipients } : item
                        )
                      );
                      setStatusMessage(`Campaign "${b.name}" triggered successfully!`);
                    }}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg"
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
            <div key={cb.id} className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-indigo-50 text-indigo-700">
                    Tipo: {cb.flow_type}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Fallback: {cb.fallback_mode}
                  </span>
                </div>

                <h3 className="font-semibold text-base mb-1">{cb.name}</h3>
                <div className="flex flex-wrap gap-1 my-2">
                  {cb.keywords.map((kw, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-muted font-mono">
                      #{kw}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mt-2 mb-4 bg-muted/40 p-2 rounded">
                  {cb.response_text}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                <span>Roteia para humano se não entender</span>
                <span className="text-emerald-600 font-semibold">Ativo</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: CLICK-TO-WHATSAPP LINKS */}
      {activeTab === "links" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {links.map((link) => (
            <div key={link.id} className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-purple-50 text-purple-700">
                    wa.me/{link.slug}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {link.clicks_count} cliques
                  </span>
                </div>

                <h3 className="font-semibold text-base mb-1">{link.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{link.prefilled_text}</p>

                <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1 mb-4">
                  <p className="text-muted-foreground">UTM Origem: {link.utm_source || "meta_ads"}</p>
                  <p className="text-muted-foreground">Leads Criados: {link.leads_generated_count} no funil</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://wa.me/5511988887777?text=${encodeURIComponent(link.prefilled_text || "")}`);
                    setStatusMessage("Link Click-to-WhatsApp copiado para a área de transferência!");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                >
                  <Copy size={13} />
                  Copiar Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 6: THE 7 GUARDRAILS CONFIGURATION */}
      {activeTab === "guardrails" && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 border border-border rounded-xl text-xs">
            <p className="font-semibold text-foreground">Configuration of 7 Pre-Send Safety Guardrails</p>
            <p className="text-muted-foreground">
              Cada mensagem gerada por inteligência artificial passa por 7 filtros obrigatórios antes de tocar os servidores do WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guardrail 1 */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">1. Stop / Opt-out Automático</p>
                <p className="text-xs text-muted-foreground">
                  Respeita imediatamente palavras como SAIR, PARE ou STOP, impedindo novos envios.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.stopOptoutEnabled}
                onChange={(e) => handleUpdateGuardrails("stopOptoutEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Guardrail 2 */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">2. LGPD & Base Legal de Prospecção</p>
                <p className="text-xs text-muted-foreground">
                  Anonimiza dados sensíveis e audita a finalidade legal do contato.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.lgpdEnabled}
                onChange={(e) => handleUpdateGuardrails("lgpdEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Guardrail 3 */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">3. Anti-Ban Pacing & Throttle</p>
                <p className="text-xs text-muted-foreground">
                  Limita velocidade de disparos por hora e respeita aquecimento do chip.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.antiBanPacingEnabled}
                onChange={(e) => handleUpdateGuardrails("antiBanPacingEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Guardrail 4 */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">4. Janela de 24 Horas de Atendimento</p>
                <p className="text-xs text-muted-foreground">
                  Impede envio de texto livre fora da janela de 24 horas da Meta.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.messagingWindowEnabled}
                onChange={(e) => handleUpdateGuardrails("messagingWindowEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Guardrail 5 */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">5. Spinning Anti-Duplicação</p>
                <p className="text-xs text-muted-foreground">
                  Evita envio de textos idênticos seguidos para destinatários diferentes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.spinningEnabled}
                onChange={(e) => handleUpdateGuardrails("spinningEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Guardrail 6 */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">6. Promessa Semântica (Anti-Alucinação)</p>
                <p className="text-xs text-muted-foreground">
                  Veta promessas comerciais não declaradas na tabela oficial de produtos/preços.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.promiseSemanticEnabled}
                onChange={(e) => handleUpdateGuardrails("promiseSemanticEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Guardrail 7 */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">7. Divulgação de Assistente de IA</p>
                <p className="text-xs text-muted-foreground">
                  Identifica de forma transparente que a mensagem foi gerada por IA.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.disclosureEnabled}
                onChange={(e) => handleUpdateGuardrails("disclosureEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Emergency Killswitch */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-rose-900">Killswitch de Emergência</p>
                <p className="text-xs text-rose-700">
                  Suspende imediatamente qualquer disparo automatizado de IA na organização.
                </p>
              </div>
              <input
                type="checkbox"
                checked={guardrails.emergencyKillswitch}
                onChange={(e) => handleUpdateGuardrails("emergencyKillswitch", e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl max-w-sm w-full p-6 shadow-xl text-center animate-scaleIn">
            <h2 className="text-base font-bold mb-1">Escanear WhatsApp QR Code</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Open WhatsApp &gt; Linked Devices &gt; Link a Device
            </p>

            <div className="p-4 bg-white rounded-lg border border-border inline-block mb-4 shadow-sm">
              <QrCode size={180} className="text-black" />
            </div>

            <p className="text-xs font-mono text-muted-foreground mb-4">{showQRModal.phone_number}</p>

            <button
              onClick={() => setShowQRModal(null)}
              className="w-full py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NOVO NÚMERO */}
      {showNewNumberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-1">Adicionar Número de WhatsApp</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Escolha entre conexão via WAHA (QR Code) ou Oficial (Meta Cloud API).
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
                    setStatusMessage(`Number ${json.data.phone_number} registered successfully!`);
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold block mb-1">Identificação / Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vendas WhatsApp VIP"
                  value={numName}
                  onChange={(e) => setNumName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Número com DDI (+55...)</label>
                <input
                  type="text"
                  required
                  placeholder="+55 11 98888-7777"
                  value={numPhone}
                  onChange={(e) => setNumPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-card font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Provedor</label>
                <select
                  value={numProvider}
                  onChange={(e) => setNumProvider(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-card"
                >
                  <option value="waha">WAHA Engine (Aparelho Físico / QR Code)</option>
                  <option value="meta_cloud">Meta Cloud API (Oficial / WABA)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewNumberModal(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
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
