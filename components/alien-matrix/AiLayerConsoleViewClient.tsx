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
    role_title: "Consultor Comercial",
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
      notify("AI settings and API keys saved successfully!");
    } catch (err: any) {
      notify(err.message, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Create Persona
  const handleCreatePersona = async () => {
    if (!newPersona.name || !newPersona.system_prompt) {
      notify("Preencha o nome e o prompt do sistema da persona", "error");
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
        role_title: "Consultor Comercial",
        tone: "professional_friendly",
        language: "en-US",
        system_prompt: "",
        first_message_greeting: "",
        fallback_behavior: "handoff",
      });
      notify("Nova persona de IA criada!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  // Handle Create Knowledge
  const handleCreateKnowledge = async () => {
    if (!newKnowledge.title || !newKnowledge.content) {
      notify("Preencha o título e o conteúdo da base", "error");
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
      notify("Document ingested into RAG knowledge base!");
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
      notify("Auto-extracted fields applied successfully to records!");
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
      notify(status === "accepted" ? "Conversa assumida pela equipe humana!" : "Handoff concluído e encerrado!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
              <Robot size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                AlienMatrix AI Console
              </h1>
              <p className="text-sm text-muted-foreground">
                Enterprise AI Engine: Multi-provider (Claude, GPT, Gemini, Ollama), Personas, RAG, Lead Scoring, and Intelligent Handoff.
              </p>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg border border-border bg-card flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-muted-foreground">Active Provider:</span>
            <span className="font-semibold text-foreground uppercase">{settings.active_provider}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg border border-border bg-card flex items-center gap-2 text-xs">
            <Lightning size={14} className="text-amber-500" />
            <span className="text-muted-foreground">Tokens Mês:</span>
            <span className="font-semibold text-foreground">
              {telemetry.used_tokens.toLocaleString()} / {telemetry.monthly_token_budget.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 overflow-x-auto text-sm font-medium">
        <button
          onClick={() => setActiveTab("providers")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "providers"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders size={16} />
          Providers & Models
        </button>

        <button
          onClick={() => setActiveTab("personas")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "personas"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Brain size={16} />
          Personas do Agente ({personas.length})
        </button>

        <button
          onClick={() => setActiveTab("knowledge")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "knowledge"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen size={16} />
          Base RAG ({knowledge.length})
        </button>

        <button
          onClick={() => setActiveTab("insights")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "insights"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkle size={16} />
          Lead Scoring & Insights ({insights.length})
        </button>

        <button
          onClick={() => setActiveTab("handoffs")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "handoffs"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCircle size={16} />
          Handoffs Humanos ({handoffs.length})
        </button>

        <button
          onClick={() => setActiveTab("usage")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "usage"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lightning size={16} />
          Telemetria & Orçamento
        </button>
      </div>

      {/* TAB 1: PROVIDERS & MODEL CONFIG */}
      {activeTab === "providers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 border border-border rounded-xl bg-card shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sliders size={18} className="text-purple-600" />
                Model & Provider Selection
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Active AI Provider</label>
                  <select
                    value={settings.active_provider}
                    onChange={(e) =>
                      setSettings({ ...settings, active_provider: e.target.value as any })
                    }
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                  >
                    <option value="anthropic">Anthropic (Claude 3.5 Sonnet / Haiku)</option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="google">Google (Gemini 1.5 Pro / Flash)</option>
                    <option value="openrouter">OpenRouter (Multi-Model Gateway)</option>
                    <option value="local_ollama">Ollama Local (Llama 3 / Mistral)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">RAG Embeddings Provider</label>
                  <select
                    value={settings.embedding_provider}
                    onChange={(e) =>
                      setSettings({ ...settings, embedding_provider: e.target.value as any })
                    }
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                  >
                    <option value="openai">OpenAI text-embedding-3-small</option>
                    <option value="google">Google text-embedding-004</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Modelo Primário (Raciocínio & Fechamento)</label>
                  <select
                    value={settings.primary_model}
                    onChange={(e) => setSettings({ ...settings, primary_model: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                  >
                    <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022 (Recomendado)</option>
                    <option value="gpt-4o">gpt-4o (OpenAI Omni)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Google DeepMind)</option>
                    <option value="local-llama-3">llama3:70b-instruct (Local Ollama)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Modelo Rápido (Triagem & Respostas Curtas)</label>
                  <select
                    value={settings.fast_model}
                    onChange={(e) => setSettings({ ...settings, fast_model: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                  >
                    <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022 (Super Rápido)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  </select>
                </div>
              </div>

              {/* API Keys per provider */}
              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Provider API Keys (Encrypted / Masked)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Anthropic API Key</label>
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
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">OpenAI API Key</label>
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
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Google Gemini API Key</label>
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
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">URL do Servidor Ollama Local</label>
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
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition"
                >
                  {savingSettings ? "Saving..." : "Save AI Settings"}
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar: Feature Toggles & Hard Limits */}
          <div className="space-y-6">
            <div className="p-5 border border-border rounded-xl bg-card shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-600" />
                Autonomous Turn Modules
              </h2>

              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.lead_scoring_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, lead_scoring_enabled: e.target.checked })
                    }
                    className="mt-0.5 rounded border-border text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Lead Scoring Preditivo</span>
                    <span className="text-[11px] text-muted-foreground">
                      Calcula score de 0 a 100 com justificativas a cada mensagem recebida.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sentiment_analysis_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, sentiment_analysis_enabled: e.target.checked })
                    }
                    className="mt-0.5 rounded border-border text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Detector de Sentimento & Frustração</span>
                    <span className="text-[11px] text-muted-foreground">
                      Dispara handoff automático para atendente humano caso detecte cliente irritado.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_fill_fields_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, auto_fill_fields_enabled: e.target.checked })
                    }
                    className="mt-0.5 rounded border-border text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Auto-Preenchimento de Campos</span>
                    <span className="text-[11px] text-muted-foreground">
                      Extrai dados de contato (e-mail, telefone, orçamento) e sugere atualização nos registros.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-5 border border-border rounded-xl bg-card shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Teto de Gastos e Parada Dura</h3>
              <p className="text-xs text-muted-foreground">
                Blocks AI requests when monthly token or cost quota limit is reached.
              </p>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Orçamento de Tokens Mensais
                </label>
                <input
                  type="number"
                  value={settings.monthly_token_budget}
                  onChange={(e) =>
                    setSettings({ ...settings, monthly_token_budget: parseInt(e.target.value) || 100000 })
                  }
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={settings.hard_stop_on_budget}
                  onChange={(e) =>
                    setSettings({ ...settings, hard_stop_on_budget: e.target.checked })
                  }
                  className="rounded border-border text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-medium text-foreground">
                  Ativar Parada Dura ao atingir 100%
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
              <h2 className="text-base font-semibold text-foreground">Personas & Voz do Agente</h2>
              <p className="text-xs text-muted-foreground">
                Configure tone of voice, behavioral instructions, and greetings for each company agent.
              </p>
            </div>
            <button
              onClick={() => setShowPersonaModal(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              Nova Persona
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className={`p-5 rounded-xl border transition flex flex-col justify-between ${
                  persona.is_default
                    ? "border-purple-300 bg-purple-50/20 shadow-sm"
                    : "border-border bg-card"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {persona.name}
                        {persona.is_default && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Padrão
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">{persona.role_title}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {persona.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                      Tom: {persona.tone}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200">
                      Fallback: {persona.fallback_behavior}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground line-clamp-3 italic">
                    "{persona.system_prompt}"
                  </div>

                  {persona.first_message_greeting && (
                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Saudação: </span>
                      {persona.first_message_greeting}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Status: {persona.is_active ? "Ativo" : "Inativo"}
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
                        notify(`Persona "${persona.name}" definida como padrão!`);
                      }}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Definir como Padrão
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Nova Persona */}
          {showPersonaModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-base text-foreground">Create New Persona de IA</h3>
                  <button onClick={() => setShowPersonaModal(false)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Nome do Agente</label>
                    <input
                      type="text"
                      placeholder="Ex: Maya - Consultora Imobiliária"
                      value={newPersona.name}
                      onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Cargo / Papel</label>
                      <input
                        type="text"
                        placeholder="Ex: Consultor Sênior"
                        value={newPersona.role_title}
                        onChange={(e) => setNewPersona({ ...newPersona, role_title: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Tom de Voz</label>
                      <select
                        value={newPersona.tone}
                        onChange={(e) => setNewPersona({ ...newPersona, tone: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                      >
                        <option value="professional_friendly">Profissional & Amigável</option>
                        <option value="formal">Formal & Executive</option>
                        <option value="casual">Casual & Descontraído</option>
                        <option value="assertive_sales">Vendas Assertivas</option>
                        <option value="empathetic_support">Empático & Acolhedor</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">System Instructions (System Prompt)</label>
                    <textarea
                      rows={4}
                      placeholder="Instrua o modelo sobre regras de negócio, limites e estilo..."
                      value={newPersona.system_prompt}
                      onChange={(e) => setNewPersona({ ...newPersona, system_prompt: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Primeira Saudação (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Olá! Como posso ajudar você hoje?"
                      value={newPersona.first_message_greeting}
                      onChange={(e) => setNewPersona({ ...newPersona, first_message_greeting: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setShowPersonaModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreatePersona}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium"
                  >
                    Create Persona
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
              <h2 className="text-base font-semibold text-foreground">Organization RAG Knowledge Base</h2>
              <p className="text-xs text-muted-foreground">
                Documentos, FAQs, URLs externas e políticas ingeridas e indexadas semanticamente para os agentes.
              </p>
            </div>
            <button
              onClick={() => setShowKnowledgeModal(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              Add Document
            </button>
          </div>

          {/* Interactive RAG Search Simulator */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
              <MagnifyingGlass size={16} className="text-purple-600" />
              Simulador de Busca Semântica RAG
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: quanto custa o apartamento alpha park ou como funciona fgts..."
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRagSearch()}
                className="flex-1 text-xs p-2.5 rounded-lg border border-border bg-background"
              />
              <button
                onClick={handleRagSearch}
                disabled={isSearchingRag}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg"
              >
                {isSearchingRag ? "Buscando..." : "Testar RAG"}
              </button>
            </div>

            {ragResults.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Resultados Relevantes Retornados:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ragResults.map((res) => (
                    <div key={res.id} className="p-3 rounded-lg border border-purple-200 bg-purple-50/30 text-xs">
                      <div className="flex items-center justify-between font-semibold text-purple-900 mb-1">
                        <span>{res.title}</span>
                        <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded">Score: {res.score}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] line-clamp-3">{res.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Knowledge Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledge.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.chunk_count} chunk(s) · ~{item.token_count} tokens
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-xs text-foreground line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{item.content}</p>
                </div>

                {item.tags?.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {item.tags.map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Modal Novo Conhecimento */}
          {showKnowledgeModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-base text-foreground">Add Document à Base RAG</h3>
                  <button onClick={() => setShowKnowledgeModal(false)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Título do Documento</label>
                    <input
                      type="text"
                      placeholder="Ex: Tabela de Preços e Condições 2026"
                      value={newKnowledge.title}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Tipo de Material</label>
                      <select
                        value={newKnowledge.type}
                        onChange={(e) => setNewKnowledge({ ...newKnowledge, type: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                      >
                        <option value="doc">Document / Manual</option>
                        <option value="faq">Frequently Asked Questions (FAQ)</option>
                        <option value="policy">Política / Termos</option>
                        <option value="url">Página Web (URL)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Tags (separadas por vírgula)</label>
                      <input
                        type="text"
                        placeholder="precos, lancamento, faqs"
                        value={newKnowledge.tags}
                        onChange={(e) => setNewKnowledge({ ...newKnowledge, tags: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Conteúdo Textual</label>
                    <textarea
                      rows={5}
                      placeholder="Cole aqui o texto, regras ou respostas que o agente deve memorizar..."
                      value={newKnowledge.content}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setShowKnowledgeModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateKnowledge}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium"
                  >
                    Ingerir Documento
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
            <h2 className="text-base font-semibold text-foreground">Lead Scoring & Insights em Tempo Real</h2>
            <p className="text-xs text-muted-foreground">
              Pontuação preditiva calculada automaticamente pela IA, detecção de sentimento e auto-preenchimento de campos.
            </p>
          </div>

          <div className="space-y-4">
            {insights.map((ins) => (
              <div key={ins.id} className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        ins.lead_score >= 75
                          ? "bg-emerald-100 text-emerald-800"
                          : ins.lead_score >= 50
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {ins.lead_score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Score do Lead: {ins.lead_score}/100</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            ins.sentiment === "positive"
                              ? "bg-emerald-100 text-emerald-800"
                              : ins.sentiment === "frustrated"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          Sentimento: {ins.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{ins.summary}</p>
                    </div>
                  </div>

                  {ins.extracted_fields && Object.keys(ins.extracted_fields).length > 0 && !ins.fields_applied && (
                    <button
                      onClick={() => handleApplyInsightFields(ins.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <CheckCircle size={14} />
                      Aplicar Campos Detectados
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Reasons breakdown */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Fatores de Pontuação
                    </span>
                    <div className="space-y-1.5">
                      {ins.score_reasons?.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <span className="text-muted-foreground">{r.note}</span>
                          <span className={r.delta >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                            {r.delta >= 0 ? `+${r.delta}` : r.delta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Best Actions */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Próximas Ações Recomendadas (Next-Best-Action)
                    </span>
                    <div className="space-y-1.5">
                      {ins.next_best_actions?.map((act, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-purple-50/50 border border-purple-100 text-purple-900 font-medium">
                          <span>{act.title}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-200">
                            {act.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extracted fields */}
                {ins.extracted_fields && Object.keys(ins.extracted_fields).length > 0 && (
                  <div className="pt-2 border-t border-border flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-semibold text-foreground text-[11px]">Dados Extraídos do Chat:</span>
                    {Object.entries(ins.extracted_fields).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[11px]">
                        {k}: <strong className="text-foreground">{String(v)}</strong>
                      </span>
                    ))}
                    {ins.fields_applied && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 ml-auto">
                        <CheckCircle size={12} /> Aplicado nos Registros
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
            <h2 className="text-base font-semibold text-foreground">Fila de Transição Humana (Handoff)</h2>
            <p className="text-xs text-muted-foreground">
              Cases escalated by AI with executive conversation summary, urgency rating, and recommended next action for the sales rep.
            </p>
          </div>

          <div className="space-y-3">
            {handoffs.map((handoff) => (
              <div
                key={handoff.id}
                className={`p-4 rounded-xl border transition space-y-3 ${
                  handoff.status === "pending"
                    ? "border-amber-300 bg-amber-50/20 shadow-sm"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        handoff.urgency === "urgent" || handoff.urgency === "high"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Urgência: {handoff.urgency}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Motivo: {handoff.trigger_reason}
                    </span>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    Status: <strong className="text-foreground uppercase">{handoff.status}</strong>
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-foreground font-medium">{handoff.ai_summary}</p>
                  {handoff.suggested_action && (
                    <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
                      <strong>Recomendação da IA: </strong>
                      {handoff.suggested_action}
                    </p>
                  )}
                </div>

                {handoff.status === "pending" && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleResolveHandoff(handoff.id, "accepted")}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg"
                    >
                      Assumir Atendimento
                    </button>
                    <button
                      onClick={() => handleResolveHandoff(handoff.id, "resolved")}
                      className="px-3 py-1.5 border border-border text-foreground hover:bg-muted text-xs font-medium rounded-lg"
                    >
                      Marcar Resolvido
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
            <h2 className="text-base font-semibold text-foreground">Telemetria de Consumo & Orçamento</h2>
            <p className="text-xs text-muted-foreground">
              Monitoramento transparente de custos, tokens consumidos e limites de faturamento da IA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Tokens Consumidos</span>
              <p className="text-2xl font-bold text-foreground mt-1">
                {telemetry.used_tokens.toLocaleString()}
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-3">
                <div
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, telemetry.token_usage_percent)}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                {telemetry.token_usage_percent}% of monthly quota ({telemetry.monthly_token_budget.toLocaleString()})
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Custo Acumulado</span>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(telemetry.used_cost_cents / 100).toFixed(2)}
              </p>
              <span className="text-[10px] text-muted-foreground mt-3 block">
                Teto máximo: ${(telemetry.monthly_cost_limit_cents / 100).toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Operações Executadas</span>
              <p className="text-2xl font-bold text-foreground mt-1">{telemetry.total_operations}</p>
              <span className="text-[10px] text-muted-foreground mt-3 block">
                Turnos de conversa, scoring e RAG
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Status do Orçamento</span>
              <p className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle size={18} /> Normal
              </p>
              <span className="text-[10px] text-muted-foreground mt-3 block">
                Parada dura configurada: {settings.hard_stop_on_budget ? "Sim" : "Não"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
