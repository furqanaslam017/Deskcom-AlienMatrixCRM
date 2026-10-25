"use client";

import { useState } from "react";
import {
  Robot,
  Sparkle,
  BookOpen,
  Brain,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  WarningCircle,
  Gear,
  Plus,
  Trash,
  ArrowRight,
  Lightning,
  MagnifyingGlass,
  Sliders,
  UserCircle,
} from "@/lib/ui/icons";
import type { TenantAiSettings } from "@/lib/alien-matrix/ai-settings-service";
import type { AgentPersona } from "@/lib/alien-matrix/ai-personas-service";
import type { KnowledgeItem } from "@/lib/alien-matrix/ai-knowledge-service";
import type { AIInsight } from "@/lib/alien-matrix/ai-insights-service";
import type { AIHandoffLog } from "@/lib/alien-matrix/ai-handoff-service";

interface TelemetryData {
  monthly_token_budget: number;
  monthly_cost_limit_cents: number;
  used_tokens: number;
  used_cost_cents: number;
  token_usage_percent: number;
  cost_usage_percent: number;
  budget_alert_active: boolean;
  hard_stop_triggered: boolean;
  total_operations: number;
}

export function AiLayerConsoleViewClient({
  initialSettings,
  initialPersonas = [],
  initialKnowledge = [],
  initialInsights = [],
  initialHandoffs = [],
  initialTelemetry,
}: {
  initialSettings: TenantAiSettings;
  initialPersonas: AgentPersona[];
  initialKnowledge: KnowledgeItem[];
  initialInsights: AIInsight[];
  initialHandoffs: AIHandoffLog[];
  initialTelemetry: TelemetryData;
}) {
  const [activeTab, setActiveTab] = useState<
    "providers" | "personas" | "knowledge" | "insights" | "handoffs" | "usage"
  >("providers");

  const [settings, setSettings] = useState<TenantAiSettings>(initialSettings);
  const [personas, setPersonas] = useState<AgentPersona[]>(initialPersonas);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(initialKnowledge);
  const [insights, setInsights] = useState<AIInsight[]>(initialInsights);
  const [handoffs, setHandoffs] = useState<AIHandoffLog[]>(initialHandoffs);
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);

  const [savingSettings, setSavingSettings] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New Persona Modal
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [newPersona, setNewPersona] = useState({
    name: "",
    role_title: "Commercial Advisory Specialist",
    tone: "professional_friendly" as AgentPersona["tone"],
    language: "en-US",
    system_prompt: "",
    first_message_greeting: "",
    fallback_behavior: "handoff" as AgentPersona["fallback_behavior"],
  });

  // New Knowledge Item Modal
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({
    title: "",
    type: "doc" as KnowledgeItem["type"],
    source_url: "",
    content: "",
    tags: "",
  });

  // RAG Search state
  const [ragQuery, setRagQuery] = useState("");
  const [ragResults, setRagResults] = useState<Array<{ id: string; title: string; content: string; score: number }>>([]);
  const [isSearchingRag, setIsSearchingRag] = useState(false);

  // Notification helper
  const notify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Settings Save
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/v1/alien-matrix/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update settings");
      setSettings(data.data);
      notify("AI model parameters and secure credentials updated successfully.");
    } catch (err: any) {
      notify(err.message, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Create Persona
  const handleCreatePersona = async () => {
    if (!newPersona.name || !newPersona.system_prompt) {
      notify("Please provide persona name and system instructions", "error");
      return;
    }
    try {
      const res = await fetch("/api/v1/alien-matrix/ai/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPersona),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create persona");
      setPersonas((prev) => [data.data, ...prev]);
      setShowPersonaModal(false);
      setNewPersona({
        name: "",
        role_title: "Commercial Advisory Specialist",
        tone: "professional_friendly",
        language: "en-US",
        system_prompt: "",
        first_message_greeting: "",
        fallback_behavior: "handoff",
      });
      notify("AI agent persona created successfully.");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  // Handle Create Knowledge
  const handleCreateKnowledge = async () => {
    if (!newKnowledge.title || !newKnowledge.content) {
      notify("Please provide document title and content body", "error");
      return;
    }
    try {
      const tagsArray = newKnowledge.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/v1/alien-matrix/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newKnowledge,
          tags: tagsArray,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to add knowledge item");
      setKnowledge((prev) => [data.data, ...prev]);
      setShowKnowledgeModal(false);
      setNewKnowledge({ title: "", type: "doc", source_url: "", content: "", tags: "" });
      notify("Knowledge document ingested and indexed into vector RAG.");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  // Handle RAG Search
  const handleRagSearch = async () => {
    if (!ragQuery.trim()) return;
    setIsSearchingRag(true);
    try {
      const res = await fetch(`/api/v1/alien-matrix/ai/knowledge?query=${encodeURIComponent(ragQuery)}`);
      const data = await res.json();
      if (res.ok && data.data?.results) {
        setRagResults(data.data.results);
      }
    } catch (err: any) {
      notify(err.message, "error");
    } finally {
      setIsSearchingRag(false);
    }
  };

  // Handle Apply Insight Fields
  const handleApplyInsightFields = async (insightId: string) => {
    try {
      const res = await fetch(`/api/v1/alien-matrix/ai/insights/${insightId}/apply`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to apply fields");
      setInsights((prev) =>
        prev.map((ins) => (ins.id === insightId ? { ...ins, fields_applied: true } : ins))
      );
      notify("Auto-extracted fields applied successfully to target records.");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  // Handle Resolve Handoff
  const handleResolveHandoff = async (handoffId: string, status: "accepted" | "resolved") => {
    try {
      const res = await fetch(`/api/v1/alien-matrix/ai/handoffs/${handoffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update handoff");
      setHandoffs((prev) =>
        prev.map((h) => (h.id === handoffId ? { ...h, status } : h))
      );
      notify(status === "accepted" ? "Conversation claimed by human team member." : "Handoff closed and resolved.");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--line-2)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--well)] text-[var(--tomato)] border border-[var(--line-2)]">
              <Robot size={22} weight="bold" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text)]">
                Autonomous AI Operations Console
              </h1>
              <p className="text-xs text-[var(--muted)] mt-1">
                Multi-model cognitive runtime (Anthropic, OpenAI, Google Gemini, Ollama), Personas, Vector RAG, and Intelligent Handoffs.
              </p>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-full border border-[var(--line-2)] bg-[var(--solid)] flex items-center gap-2 text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--pine)]" />
            <span className="text-[var(--muted)]">Active Engine:</span>
            <span className="badge badge--pine text-[10px] font-bold uppercase">{settings.active_provider}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full border border-[var(--line-2)] bg-[var(--solid)] flex items-center gap-2 text-xs shadow-sm">
            <Lightning size={14} className="text-[var(--tomato)]" />
            <span className="text-[var(--muted)]">Monthly Tokens:</span>
            <span className="font-semibold text-[var(--text)] font-numeric">
              {telemetry.used_tokens.toLocaleString()} / {telemetry.monthly_token_budget.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-[var(--r-tile)] text-xs flex items-center justify-between shadow-[var(--shadow-pop)] animate-in fade-in duration-150 ${
            notification.type === "success"
              ? "bg-[var(--solid)] border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-[var(--solid)] border border-rose-500/30 text-rose-700 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span>{notification.msg}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rapport Segmented Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <div className="tabs__track p-1 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("providers")}
            data-active={activeTab === "providers"}
            className="tab"
          >
            <Sliders size={15} />
            Providers &amp; Models
          </button>

          <button
            onClick={() => setActiveTab("personas")}
            data-active={activeTab === "personas"}
            className="tab"
          >
            <Brain size={15} />
            Agent Personas ({personas.length})
          </button>

          <button
            onClick={() => setActiveTab("knowledge")}
            data-active={activeTab === "knowledge"}
            className="tab"
          >
            <BookOpen size={15} />
            RAG Knowledge Base ({knowledge.length})
          </button>

          <button
            onClick={() => setActiveTab("insights")}
            data-active={activeTab === "insights"}
            className="tab"
          >
            <Sparkle size={15} />
            Lead Scoring &amp; Insights ({insights.length})
          </button>

          <button
            onClick={() => setActiveTab("handoffs")}
            data-active={activeTab === "handoffs"}
            className="tab"
          >
            <UserCircle size={15} />
            Human Handoffs ({handoffs.length})
          </button>

          <button
            onClick={() => setActiveTab("usage")}
            data-active={activeTab === "usage"}
            className="tab"
          >
            <Lightning size={15} />
            Telemetry &amp; Quotas
          </button>
        </div>
      </div>

      {/* TAB 1: PROVIDERS & MODEL CONFIG */}
      {activeTab === "providers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-5">
              <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <Sliders size={18} className="text-[var(--tomato)]" />
                Model &amp; Gateway Provider Selection
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text)] mb-1 block">Active AI Provider Gateway</label>
                  <select
                    value={settings.active_provider}
                    onChange={(e) =>
                      setSettings({ ...settings, active_provider: e.target.value as any })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="anthropic">Anthropic (Claude 3.5 Sonnet / Haiku)</option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="google">Google (Gemini 1.5 Pro / Flash)</option>
                    <option value="openrouter">OpenRouter (Multi-Model Gateway)</option>
                    <option value="local_ollama">Ollama Local (Self-Hosted Private Llama 3)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text)] mb-1 block">RAG Embeddings Vector Provider</label>
                  <select
                    value={settings.embedding_provider}
                    onChange={(e) =>
                      setSettings({ ...settings, embedding_provider: e.target.value as any })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="openai">OpenAI text-embedding-3-small (Recommended)</option>
                    <option value="google">Google text-embedding-004</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text)] mb-1 block">Primary Model (Reasoning &amp; Negotiation)</label>
                  <select
                    value={settings.primary_model}
                    onChange={(e) => setSettings({ ...settings, primary_model: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022 (Highest Accuracy)</option>
                    <option value="gpt-4o">gpt-4o (OpenAI Omni)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Google DeepMind)</option>
                    <option value="local-llama-3">llama3:70b-instruct (Local Ollama)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text)] mb-1 block">Fast Model (Triage &amp; Instant Responses)</label>
                  <select
                    value={settings.fast_model}
                    onChange={(e) => setSettings({ ...settings, fast_model: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022 (Low Latency)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  </select>
                </div>
              </div>

              {/* API Keys */}
              <div className="pt-4 border-t border-[var(--line-2)] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Provider API Credentials (Masked &amp; Encrypted at Rest)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[var(--muted)] mb-1 block">Anthropic API Key</label>
                    <input
                      type="password"
                      placeholder="sk-ant-••••••••"
                      value={settings.api_keys?.anthropic || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          api_keys: { ...settings.api_keys, anthropic: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted)] mb-1 block">OpenAI API Key</label>
                    <input
                      type="password"
                      placeholder="sk-proj-••••••••"
                      value={settings.api_keys?.openai || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          api_keys: { ...settings.api_keys, openai: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted)] mb-1 block">Google Gemini API Key</label>
                    <input
                      type="password"
                      placeholder="AIzaSy••••••••"
                      value={settings.api_keys?.google || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          api_keys: { ...settings.api_keys, google: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted)] mb-1 block">Local Ollama Server URL</label>
                    <input
                      type="text"
                      placeholder="http://localhost:11434"
                      value={settings.api_keys?.local_url || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          api_keys: { ...settings.api_keys, local_url: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="btn btn--ink text-xs font-semibold px-4 py-2"
                >
                  {savingSettings ? "Saving..." : "Save AI Configuration"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Feature Toggles & Hard Limits */}
          <div className="space-y-6">
            <div className="p-6 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[var(--tomato)]" />
                Autonomous Engine Toggles
              </h2>

              <div className="space-y-3.5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.lead_scoring_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, lead_scoring_enabled: e.target.checked })
                    }
                    className="mt-0.5 rounded accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text)] block">Predictive Lead Scoring</span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Evaluates customer intent from 0 to 100 with transparent factor rationales.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sentiment_analysis_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, sentiment_analysis_enabled: e.target.checked })
                    }
                    className="mt-0.5 rounded accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text)] block">Frustration &amp; Sentiment Detection</span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Triggers intelligent escalation when customer sentiment drops into frustration.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_fill_fields_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, auto_fill_fields_enabled: e.target.checked })
                    }
                    className="mt-0.5 rounded accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text)] block">Automated Field Extraction</span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Extracts structured parameters (budget, timeframe, role) directly into CRM fields.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-6 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-3.5">
              <h3 className="text-sm font-semibold text-[var(--text)]">Hard Stop &amp; Monthly Token Budget</h3>
              <p className="text-xs text-[var(--muted)]">
                Blocks AI operations automatically when monthly token quota or billing limits are reached.
              </p>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">
                  Monthly Token Budget Ceiling
                </label>
                <input
                  type="number"
                  value={settings.monthly_token_budget}
                  onChange={(e) =>
                    setSettings({ ...settings, monthly_token_budget: parseInt(e.target.value) || 100000 })
                  }
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-numeric focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={settings.hard_stop_on_budget}
                  onChange={(e) =>
                    setSettings({ ...settings, hard_stop_on_budget: e.target.checked })
                  }
                  className="rounded accent-rose-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-[var(--text)]">
                  Activate hard stop immediately upon reaching 100% quota
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGENT PERSONAS */}
      {activeTab === "personas" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Agent Personas &amp; Voice Architecture</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Configure tone of voice, behavioral guidelines, and conversational greetings for each agent role.
              </p>
            </div>
            <button
              onClick={() => setShowPersonaModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={14} weight="bold" />
              Create Persona
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className={`p-5 rounded-[var(--r-card)] border transition flex flex-col justify-between backdrop-blur-md ${
                  persona.is_default
                    ? "border-[var(--tomato)] bg-[var(--solid)] shadow-[var(--shadow-pop)] relative"
                    : "border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--text)] flex items-center gap-2">
                        {persona.name}
                        {persona.is_default && (
                          <span className="badge badge--pine text-[10px] uppercase font-bold">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[var(--muted)]">{persona.role_title}</p>
                    </div>
                    <span className="badge badge--plain text-[10px] font-mono uppercase">
                      {persona.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="badge badge--plain text-[10px]">
                      Tone: {persona.tone}
                    </span>
                    <span className="badge badge--butter text-[10px]">
                      Fallback: {persona.fallback_behavior}
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-tile)] bg-[var(--well)] border border-[var(--line-2)] text-xs text-[var(--muted)] line-clamp-3 italic leading-relaxed">
                    &ldquo;{persona.system_prompt}&rdquo;
                  </div>

                  {persona.first_message_greeting && (
                    <div className="text-[11px] text-[var(--muted)]">
                      <span className="font-semibold text-[var(--text)]">Greeting: </span>
                      {persona.first_message_greeting}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[var(--line-2)] mt-4 flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">
                    Status: <strong className="text-[var(--text)]">{persona.is_active ? "Active" : "Inactive"}</strong>
                  </span>
                  {!persona.is_default && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/v1/alien-matrix/ai/personas/${persona.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ is_default: true }),
                        });
                        setPersonas((prev) =>
                          prev.map((p) => ({ ...p, is_default: p.id === persona.id }))
                        );
                        notify(`Persona "${persona.name}" configured as organization default.`);
                      }}
                      className="text-[var(--text)] font-semibold hover:underline"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal New Persona */}
          {showPersonaModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] shadow-[var(--shadow-pop)] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
                  <h3 className="font-bold text-sm text-[var(--text)]">Create AI Agent Persona</h3>
                  <button
                    onClick={() => setShowPersonaModal(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">Agent Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Maya - Enterprise Commercial Advisor"
                      value={newPersona.name}
                      onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text)] block mb-1">Role Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Specialist"
                        value={newPersona.role_title}
                        onChange={(e) => setNewPersona({ ...newPersona, role_title: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--text)] block mb-1">Tone of Voice</label>
                      <select
                        value={newPersona.tone}
                        onChange={(e) => setNewPersona({ ...newPersona, tone: e.target.value as any })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                      >
                        <option value="professional_friendly">Professional &amp; Friendly</option>
                        <option value="formal">Executive &amp; Formal</option>
                        <option value="casual">Casual &amp; Conversational</option>
                        <option value="assertive_sales">Assertive High-Conversion Sales</option>
                        <option value="empathetic_support">Empathetic Client Support</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">System Instructions (System Prompt)</label>
                    <textarea
                      rows={4}
                      placeholder="Instruct the agent on business policies, qualifying criteria, and behavioral limits..."
                      value={newPersona.system_prompt}
                      onChange={(e) => setNewPersona({ ...newPersona, system_prompt: e.target.value })}
                      className="w-full text-xs p-3 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">Initial Greeting Message (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Hello! How can I assist with your workspace implementation today?"
                      value={newPersona.first_message_greeting}
                      onChange={(e) => setNewPersona({ ...newPersona, first_message_greeting: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                  <button
                    onClick={() => setShowPersonaModal(false)}
                    className="btn btn--ghost btn--sm text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePersona}
                    className="btn btn--ink btn--sm text-xs font-semibold"
                  >
                    Save Persona
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE (RAG) */}
      {activeTab === "knowledge" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Organization Vector RAG Knowledge Base</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Documentation, FAQs, external URLs, and product policies indexed semantically for autonomous agent retrieval.
              </p>
            </div>
            <button
              onClick={() => setShowKnowledgeModal(true)}
              className="btn btn--ink inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 w-full sm:w-auto"
            >
              <Plus size={14} weight="bold" />
              Add Knowledge Document
            </button>
          </div>

          {/* Interactive RAG Search Simulator */}
          <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-3.5">
            <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
              <MagnifyingGlass size={16} className="text-[var(--tomato)]" />
              Interactive RAG Semantic Search Simulator
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. pricing conditions for enterprise plan or cancellation policy terms..."
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRagSearch()}
                className="flex-1 text-xs px-4 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
              />
              <button
                onClick={handleRagSearch}
                disabled={isSearchingRag}
                className="btn btn--ink text-xs font-semibold px-4 py-2 w-full sm:w-auto justify-center"
              >
                {isSearchingRag ? "Searching..." : "Simulate Search"}
              </button>
            </div>

            {ragResults.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                  Semantic Chunks Retrieved:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ragResults.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] text-xs shadow-sm"
                    >
                      <div className="flex items-center justify-between font-semibold text-[var(--text)] mb-1">
                        <span>{res.title}</span>
                        <span className="badge badge--pine text-[10px]">Score: {res.score}</span>
                      </div>
                      <p className="text-[var(--muted)] text-[11px] line-clamp-3 leading-relaxed">{res.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Knowledge Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledge.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="badge badge--plain text-[10px] uppercase font-bold tracking-wider">
                      {item.type}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {item.chunk_count} chunk(s) · ~{item.token_count} tokens
                    </span>
                  </div>

                  <h3 className="font-semibold text-xs text-[var(--text)] line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-[var(--muted)] line-clamp-3 mt-1 leading-relaxed">{item.content}</p>
                </div>

                {item.tags?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[var(--line-2)]">
                    {item.tags.map((tag) => (
                      <span key={tag} className="badge badge--plain text-[10px]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Modal New Knowledge */}
          {showKnowledgeModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] shadow-[var(--shadow-pop)] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
                  <h3 className="font-bold text-sm text-[var(--text)]">Add Document to Knowledge Base</h3>
                  <button
                    onClick={() => setShowKnowledgeModal(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">Document Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Service Level Agreement & Pricing"
                      value={newKnowledge.title}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text)] block mb-1">Material Classification</label>
                      <select
                        value={newKnowledge.type}
                        onChange={(e) => setNewKnowledge({ ...newKnowledge, type: e.target.value as any })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                      >
                        <option value="doc">Document / Manual</option>
                        <option value="faq">Frequently Asked Questions (FAQ)</option>
                        <option value="policy">Policy / Terms</option>
                        <option value="url">Web Page Source (URL)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--text)] block mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="pricing, enterprise, sla"
                        value={newKnowledge.tags}
                        onChange={(e) => setNewKnowledge({ ...newKnowledge, tags: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">Textual Content</label>
                    <textarea
                      rows={5}
                      placeholder="Paste unstructured policies, answers, or catalog details for chunking..."
                      value={newKnowledge.content}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                      className="w-full text-xs p-3 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-mono text-[11px] focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                  <button
                    onClick={() => setShowKnowledgeModal(false)}
                    className="btn btn--ghost btn--sm text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKnowledge}
                    className="btn btn--ink btn--sm text-xs font-semibold"
                  >
                    Ingest Document
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEAD SCORING & INSIGHTS */}
      {activeTab === "insights" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">Realtime Lead Scoring &amp; Cognitive Insights</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Predictive scoring computed autonomously by AI models, sentiment alerts, and automated parameter extraction.
            </p>
          </div>

          <div className="space-y-4">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className="p-6 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--line-2)] pb-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-[var(--r-tile)] flex items-center justify-center font-bold text-base font-numeric ${
                        ins.lead_score >= 75
                          ? "badge--pine"
                          : ins.lead_score >= 50
                          ? "badge--butter"
                          : "badge--tomato"
                      }`}
                    >
                      {ins.lead_score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text)]">Lead Score: {ins.lead_score}/100</span>
                        <span
                          className={`badge text-[10px] font-bold uppercase ${
                            ins.sentiment === "positive"
                              ? "badge--pine"
                              : ins.sentiment === "frustrated"
                              ? "badge--tomato"
                              : "badge--plain"
                          }`}
                        >
                          Sentiment: {ins.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{ins.summary}</p>
                    </div>
                  </div>

                  {ins.extracted_fields && Object.keys(ins.extracted_fields).length > 0 && !ins.fields_applied && (
                    <button
                      onClick={() => handleApplyInsightFields(ins.id)}
                      className="btn btn--ink btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} />
                      Apply Extracted Fields
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Reasons breakdown */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                      Scoring Factor Breakdown
                    </span>
                    <div className="space-y-1.5">
                      {ins.score_reasons?.map((r, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] text-xs shadow-sm"
                        >
                          <span className="text-[var(--text)]">{r.note}</span>
                          <span className={r.delta >= 0 ? "text-emerald-600 dark:text-emerald-400 font-bold font-numeric" : "text-[var(--tomato)] font-bold font-numeric"}>
                            {r.delta >= 0 ? `+${r.delta}` : r.delta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Best Actions */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                      Next-Best-Action Recommendations
                    </span>
                    <div className="space-y-1.5">
                      {ins.next_best_actions?.map((act, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] text-xs shadow-sm"
                        >
                          <span className="text-[var(--text)] font-medium">{act.title}</span>
                          <span className="badge badge--plain text-[9px] uppercase font-bold">
                            {act.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extracted fields */}
                {ins.extracted_fields && Object.keys(ins.extracted_fields).length > 0 && (
                  <div className="pt-3 border-t border-[var(--line-2)] flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-semibold text-[var(--text)] text-[11px]">Chat Entities Extracted:</span>
                    {Object.entries(ins.extracted_fields).map(([k, v]) => (
                      <span key={k} className="badge badge--plain font-mono text-[11px]">
                        {k}: <strong className="text-[var(--text)]">{String(v)}</strong>
                      </span>
                    ))}
                    {ins.fields_applied && (
                      <span className="badge badge--pine text-[10px] font-semibold inline-flex items-center gap-1 ml-auto">
                        <CheckCircle size={12} /> Applied to Records
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: INTELLIGENT HUMAN HANDOFFS */}
      {activeTab === "handoffs" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">Human Escalation &amp; Handoff Queue</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Cases escalated by AI agents with conversational summaries, urgency rating, and suggested sales actions.
            </p>
          </div>

          <div className="space-y-3.5">
            {handoffs.map((handoff) => (
              <div
                key={handoff.id}
                className={`p-5 rounded-[var(--r-card)] border transition space-y-3.5 backdrop-blur-md ${
                  handoff.status === "pending"
                    ? "border-[var(--tomato)] bg-[var(--solid)] shadow-[var(--shadow-pop)]"
                    : "border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)]"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[var(--line-2)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`badge text-[10px] font-bold uppercase ${
                        handoff.urgency === "urgent" || handoff.urgency === "high"
                          ? "badge--tomato"
                          : "badge--butter"
                      }`}
                    >
                      Urgency: {handoff.urgency}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text)]">
                      Trigger: {handoff.trigger_reason}
                    </span>
                  </div>

                  <span className="text-[11px] text-[var(--muted)]">
                    Status: <strong className="text-[var(--text)] uppercase">{handoff.status}</strong>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-[var(--text)] font-medium leading-relaxed">{handoff.ai_summary}</p>
                  {handoff.suggested_action && (
                    <p className="text-xs text-[var(--text)] bg-[var(--well)] p-2.5 rounded-[var(--r-tile)] border border-[var(--line-2)]">
                      <strong className="text-[var(--tomato)]">AI Recommendation: </strong>
                      {handoff.suggested_action}
                    </p>
                  )}
                </div>

                {handoff.status === "pending" && (
                  <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                    <button
                      onClick={() => handleResolveHandoff(handoff.id, "accepted")}
                      className="btn btn--ink btn--sm text-xs font-semibold"
                    >
                      Claim Conversation
                    </button>
                    <button
                      onClick={() => handleResolveHandoff(handoff.id, "resolved")}
                      className="btn btn--ghost btn--sm text-xs font-medium"
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: USAGE & BUDGET TELEMETRY */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">Consumption Telemetry &amp; Token Budget</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Transparent cost accounting, token usage meters, and billing quota tracking for AI execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md">
              <span className="text-xs text-[var(--muted)] font-semibold">Tokens Consumed</span>
              <p className="text-2xl font-bold text-[var(--text)] font-numeric mt-1.5">
                {telemetry.used_tokens.toLocaleString()}
              </p>
              <div className="w-full bg-[var(--well)] rounded-full h-1.5 mt-3 border border-[var(--line-2)] overflow-hidden">
                <div
                  className="bg-[var(--pill)] h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, telemetry.token_usage_percent)}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--muted)] mt-1.5 block">
                {telemetry.token_usage_percent}% of monthly quota ({telemetry.monthly_token_budget.toLocaleString()})
              </span>
            </div>

            <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md">
              <span className="text-xs text-[var(--muted)] font-semibold">Accrued Cost</span>
              <p className="text-2xl font-bold text-[var(--text)] font-numeric mt-1.5">
                ${(telemetry.used_cost_cents / 100).toFixed(2)}
              </p>
              <span className="text-[10px] text-[var(--muted)] mt-3 block">
                Hard ceiling: ${(telemetry.monthly_cost_limit_cents / 100).toFixed(2)}
              </span>
            </div>

            <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md">
              <span className="text-xs text-[var(--muted)] font-semibold">Executed Operations</span>
              <p className="text-2xl font-bold text-[var(--text)] font-numeric mt-1.5">{telemetry.total_operations}</p>
              <span className="text-[10px] text-[var(--muted)] mt-3 block">
                Conversation turns, scoring, and RAG passes
              </span>
            </div>

            <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md">
              <span className="text-xs text-[var(--muted)] font-semibold">Quota Health</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
                <CheckCircle size={18} /> Healthy (Normal)
              </p>
              <span className="text-[10px] text-[var(--muted)] mt-3 block">
                Hard stop enabled: {settings.hard_stop_on_budget ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
