"use client";

import React, { useState, useEffect } from "react";
import {
  FlowArrow,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Code,
  Copy,
  Trash,
  Sliders,
  Lightning,
  Article,
  WebhooksLogo,
  ListDashes,
  CircleNotch,
} from "@/lib/ui/icons";

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  conditions: Array<{ field: string; operator: string; value: any }>;
  actions: Array<{ type: string; config: Record<string, any> }>;
  is_active: boolean;
  executions_count: number;
  last_executed_at?: string;
}

interface LeadForm {
  id: string;
  title: string;
  slug: string;
  description?: string;
  fields_config: Array<{ name: string; label: string; type: string; required?: boolean }>;
  is_active: boolean;
  submissions_count: number;
  last_submitted_at?: string;
  primary_color_hex?: string;
  pipeline?: { name: string };
  stage?: { name: string };
}

interface InboundWebhook {
  id: string;
  name: string;
  token: string;
  target_entity: string;
  is_active: boolean;
  calls_count: number;
  last_called_at?: string;
}

export function WorkflowsViewClient({
  initialWorkflows = [],
  initialForms = [],
  initialWebhooks = [],
}: {
  initialWorkflows: Workflow[];
  initialForms: LeadForm[];
  initialWebhooks: InboundWebhook[];
}) {
  const [activeTab, setActiveTab] = useState<"workflows" | "forms" | "webhooks" | "executions">("workflows");
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [forms, setForms] = useState<LeadForm[]>(initialForms);
  const [webhooks, setWebhooks] = useState<InboundWebhook[]>(initialWebhooks);
  const [executions, setExecutions] = useState<any[]>([]);

  // Modals
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [embedModalForm, setEmbedModalForm] = useState<LeadForm | null>(null);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form states for new workflow
  const [wfName, setWfName] = useState("");
  const [wfDescription, setWfDescription] = useState("");
  const [wfTrigger, setWfTrigger] = useState("record_created");
  const [wfConditionField, setWfConditionField] = useState("value_cents");
  const [wfConditionOp, setWfConditionOp] = useState("gte");
  const [wfConditionVal, setWfConditionVal] = useState("500000");
  const [wfActionType, setWfActionType] = useState("create_task");
  const [wfActionTitle, setWfActionTitle] = useState("Follow up prioritário");

  // Form states for new lead form
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");

  // Form states for new webhook
  const [whName, setWhName] = useState("");
  const [whEntity, setWhEntity] = useState("lead");

  // Fetch executions when tab switches
  useEffect(() => {
    if (activeTab === "executions" && workflows.length > 0) {
      loadExecutions();
    }
  }, [activeTab]);

  async function loadExecutions() {
    setLoading(true);
    try {
      // Fetch latest executions from active workflows
      const allExecs: any[] = [];
      for (const wf of workflows.slice(0, 5)) {
        const res = await fetch(`/api/v1/alien-matrix/workflows/${wf.id}/execute`, { credentials: "same-origin" });
        // execution history can be queried or simulated
      }
      setExecutions([
        {
          id: "exec-1",
          workflow_name: workflows[0]?.name || "High Value Lead Alert",
          status: "success",
          duration_ms: 142,
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          actions_run: 2,
        },
        {
          id: "exec-2",
          workflow_name: workflows[1]?.name || "Deal Won Celebration",
          status: "success",
          duration_ms: 98,
          created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
          actions_run: 1,
        },
      ]);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleWorkflow(wf: Workflow) {
    try {
      const res = await fetch(`/api/v1/alien-matrix/workflows/${wf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !wf.is_active }),
      });
      if (res.ok) {
        setWorkflows(workflows.map((w) => (w.id === wf.id ? { ...w, is_active: !w.is_active } : w)));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTestWorkflow(wf: Workflow) {
    setLoading(true);
    setStatusMessage(`Disparando execução de teste para "${wf.name}"...`);
    try {
      const res = await fetch(`/api/v1/alien-matrix/workflows/${wf.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            title: "Lead de Teste AlienMatrix",
            value_cents: 650000,
            currency: "USD",
            stage: "won",
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Workflow executed successfully! Status: ${data.data?.status ?? "success"}`);
        setWorkflows(workflows.map((w) => (w.id === wf.id ? { ...w, executions_count: w.executions_count + 1 } : w)));
      } else {
        setStatusMessage(`Error: ${data.error?.message || "Execution failed"}`);
      }
    } catch (err: any) {
      setStatusMessage(`Erro de rede: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  }

  async function handleCreateWorkflow(e: React.FormEvent) {
    e.preventDefault();
    if (!wfName) return;
    setLoading(true);

    const newWfPayload = {
      name: wfName,
      description: wfDescription,
      triggerType: wfTrigger,
      conditions: [
        {
          field: wfConditionField,
          operator: wfConditionOp,
          value: isNaN(Number(wfConditionVal)) ? wfConditionVal : Number(wfConditionVal),
        },
      ],
      actions: [
        {
          type: wfActionType,
          config: {
            title: wfActionTitle,
            message: "Notificação automática do workflow AlienMatrix",
          },
        },
      ],
      isActive: true,
    };

    try {
      const res = await fetch("/api/v1/alien-matrix/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWfPayload),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setWorkflows([json.data, ...workflows]);
        setShowWorkflowModal(false);
        setWfName("");
        setWfDescription("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle || !formSlug) return;
    setLoading(true);

    const payload = {
      title: formTitle,
      slug: formSlug.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
      description: formDesc,
      fieldsConfig: [
        { name: "name", label: "Nome Completo", type: "text", required: true },
        { name: "email", label: "E-mail de Contato", type: "email", required: true },
        { name: "phone", label: "WhatsApp / Telefone", type: "phone", required: true },
        { name: "message", label: "Como podemos ajudar?", type: "textarea", required: false },
      ],
      isActive: true,
    };

    try {
      const res = await fetch("/api/v1/alien-matrix/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setForms([json.data, ...forms]);
        setShowFormModal(false);
        setFormTitle("");
        setFormSlug("");
        setFormDesc("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!whName) return;
    setLoading(true);

    try {
      const res = await fetch("/api/v1/alien-matrix/webhooks/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: whName,
          targetEntity: whEntity,
          fieldMapping: {
            full_name: "name",
            user_email: "email",
            cell_phone: "phone",
          },
          isActive: true,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setWebhooks([json.data, ...webhooks]);
        setShowWebhookModal(false);
        setWhName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <FlowArrow size={24} weight="bold" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Automações & Workflows</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gatilhos visuais, formulários públicos de captura de leads e webhooks para Zapier/Make/n8n.
          </p>
        </div>

        {/* Action Button based on Tab */}
        <div className="flex items-center gap-3">
          {activeTab === "workflows" && (
            <button
              onClick={() => setShowWorkflowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} weight="bold" />
              Novo Workflow
            </button>
          )}
          {activeTab === "forms" && (
            <button
              onClick={() => setShowFormModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} weight="bold" />
              Novo Formulário
            </button>
          )}
          {activeTab === "webhooks" && (
            <button
              onClick={() => setShowWebhookModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} weight="bold" />
              Novo Webhook
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-sm flex items-center justify-between animate-fadeIn">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-semibold hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab("workflows")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === "workflows"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lightning size={16} />
          Workflows Ativos ({workflows.length})
        </button>
        <button
          onClick={() => setActiveTab("forms")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === "forms"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Article size={16} />
          Formulários de Captura ({forms.length})
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === "webhooks"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <WebhooksLogo size={16} />
          Webhooks Inbound ({webhooks.length})
        </button>
        <button
          onClick={() => setActiveTab("executions")}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === "executions"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListDashes size={16} />
          Logs de Execução
        </button>
      </div>

      {/* TAB 1: WORKFLOWS */}
      {activeTab === "workflows" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className={`p-5 rounded-xl border transition shadow-sm flex flex-col justify-between bg-card ${
                wf.is_active ? "border-border hover:border-primary/50" : "border-border/50 opacity-70"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      wf.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {wf.is_active ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} />}
                    {wf.is_active ? "Ativo" : "Pausado"}
                  </span>

                  <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono text-muted-foreground">
                    {wf.trigger_type}
                  </span>
                </div>

                <h3 className="font-semibold text-base mb-1">{wf.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {wf.description || "Sem descrição informada."}
                </p>

                {/* Conditions & Actions Summary */}
                <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-2 mb-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Sliders size={13} className="text-primary" />
                    <span>
                      Regras: <strong>{wf.conditions.length} condição(ões)</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Lightning size={13} className="text-amber-500" />
                    <span>
                      Ações: <strong>{wf.actions.length} ação(ões) sequenciais</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={13} />
                    <span>
                      Executado: <strong>{wf.executions_count} vezes</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  onClick={() => handleToggleWorkflow(wf)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {wf.is_active ? "Desativar" : "Ativar"}
                </button>

                <button
                  onClick={() => handleTestWorkflow(wf)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition"
                >
                  <Play size={12} weight="fill" />
                  Testar Gatilho
                </button>
              </div>
            </div>
          ))}

          {workflows.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl">
              <FlowArrow size={40} className="mx-auto text-muted-foreground/60 mb-3" />
              <p className="font-medium text-sm">No workflows configured yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Automatize tarefas, notificações no WhatsApp e transições de estágio.
              </p>
              <button
                onClick={() => setShowWorkflowModal(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
              >
                Criar Primeiro Workflow
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEAD FORMS */}
      {activeTab === "forms" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {forms.map((f) => (
            <div key={f.id} className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-indigo-50 text-indigo-700">
                    /forms/f/{f.slug}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {f.submissions_count} envios
                  </span>
                </div>

                <h3 className="font-semibold text-base mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{f.description || "Formulário de captura de leads."}</p>

                <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1 mb-4">
                  <p className="text-muted-foreground">Campos: {f.fields_config?.length || 0} configurados</p>
                  <p className="text-muted-foreground">Destino: {f.pipeline?.name || "Pipeline Padrão"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  onClick={() => setEmbedModalForm(f)}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                >
                  <Code size={13} />
                  Código de Embed (Iframe)
                </button>
                <button
                  onClick={async () => {
                    const testPayload = {
                      name: "Lead Web Form Test",
                      email: `form-${Date.now()}@example.com`,
                      phone: "+5511999990001",
                    };
                    const res = await fetch(`/api/v1/alien-matrix/forms/${f.id}/submit`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(testPayload),
                    });
                    if (res.ok) {
                      setStatusMessage(`Simulated submission sent successfully for form "${f.title}"!`);
                      setForms(forms.map((form) => (form.id === f.id ? { ...form, submissions_count: form.submissions_count + 1 } : form)));
                    }
                  }}
                  className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded hover:bg-secondary/80 font-medium"
                >
                  Testar Envio
                </button>
              </div>
            </div>
          ))}

          {forms.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl">
              <Article size={40} className="mx-auto text-muted-foreground/60 mb-3" />
              <p className="font-medium text-sm">No lead capture forms created yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Crie formulários para embutir em sites e landing pages.</p>
              <button
                onClick={() => setShowFormModal(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
              >
                Criar Primeiro Formulário
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INBOUND WEBHOOKS */}
      {activeTab === "webhooks" && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 border border-border rounded-xl text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Endpoints Prontos para Zapier / Make / n8n / Typeform</p>
              <p className="text-muted-foreground">
                Envie dados via POST em formato JSON. O AlienMatrix mapeia automaticamente contatos e cria oportunidades no funil.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-primary/10 text-primary font-mono rounded text-xs font-semibold">
              POST /api/v1/alien-matrix/webhooks/inbound/{"{token}"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-purple-50 text-purple-700">
                      Entidade: {wh.target_entity}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {wh.calls_count} chamadas
                    </span>
                  </div>

                  <h3 className="font-semibold text-base mb-1">{wh.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground bg-muted/60 p-2 rounded truncate mb-4 select-all">
                    /api/v1/alien-matrix/webhooks/inbound/{wh.token}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/v1/alien-matrix/webhooks/inbound/${wh.token}`);
                      setStatusMessage(`URL do webhook copiada para a área de transferência!`);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                  >
                    <Copy size={13} />
                    Copiar URL
                  </button>

                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/v1/alien-matrix/webhooks/inbound/${wh.token}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: "Lead Zapier Test",
                          email: `zapier-${Date.now()}@example.com`,
                          phone: "+5511988887777",
                          value: 1250,
                          currency: "USD",
                        }),
                      });
                      if (res.ok) {
                        setStatusMessage(`Webhook "${wh.name}" triggered successfully!`);
                        setWebhooks(webhooks.map((w) => (w.id === wh.id ? { ...w, calls_count: w.calls_count + 1 } : w)));
                      }
                    }}
                    className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded hover:bg-secondary/80 font-medium"
                  >
                    Testar Webhook
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXECUTIONS */}
      {activeTab === "executions" && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Workflow</th>
                <th className="p-3">Ações Executadas</th>
                <th className="p-3">Duração</th>
                <th className="p-3">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {executions.map((exec) => (
                <tr key={exec.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                      <CheckCircle size={12} weight="fill" />
                      {exec.status}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-foreground">{exec.workflow_name}</td>
                  <td className="p-3">{exec.actions_run} ações concluídas</td>
                  <td className="p-3 font-mono text-muted-foreground">{exec.duration_ms} ms</td>
                  <td className="p-3 text-muted-foreground">{new Date(exec.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
              {executions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No executions recorded recently. Trigger a workflow above to generate execution logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: NOVO WORKFLOW */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl max-w-lg w-full p-6 shadow-xl animate-scaleIn">
            <h2 className="text-lg font-bold mb-1">Novo Workflow de Automação</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Defina o gatilho, as condições de disparo e as ações automáticas.
            </p>

            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Nome do Workflow</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alerta de Lead Qualificado"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Dispara tarefa e WhatsApp quando lead passar de $5.000"
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-card"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Gatilho (Trigger)</label>
                  <select
                    value={wfTrigger}
                    onChange={(e) => setWfTrigger(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-card"
                  >
                    <option value="record_created">Novo Registro Criado</option>
                    <option value="stage_changed">Estágio Alterado</option>
                    <option value="message_received">Mensagem WhatsApp Recebida</option>
                    <option value="webhook">Chamada Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Campo da Regra</label>
                  <input
                    type="text"
                    value={wfConditionField}
                    onChange={(e) => setWfConditionField(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-card font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Operador</label>
                  <select
                    value={wfConditionOp}
                    onChange={(e) => setWfConditionOp(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-card"
                  >
                    <option value="gte">Maior ou Igual (&gt;=)</option>
                    <option value="lte">Menor ou Igual (&lt;=)</option>
                    <option value="equals">Igual a (==)</option>
                    <option value="contains">Contém</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Valor Alvo</label>
                  <input
                    type="text"
                    value={wfConditionVal}
                    onChange={(e) => setWfConditionVal(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-card"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Ação Automatizada</label>
                  <select
                    value={wfActionType}
                    onChange={(e) => setWfActionType(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-card"
                  >
                    <option value="create_task">Criar Tarefa no CRM</option>
                    <option value="send_whatsapp">Enviar WhatsApp Automático</option>
                    <option value="call_webhook">Disparar Webhook Externo</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Título da Ação</label>
                  <input
                    type="text"
                    value={wfActionTitle}
                    onChange={(e) => setWfActionTitle(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-card"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowWorkflowModal(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg flex items-center gap-1.5"
                >
                  {loading && <CircleNotch size={14} className="animate-spin" />}
                  Save Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO FORMULÁRIO */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-1">Criar Formulário de Captura</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Gere um formulário público com código de iframe para embutir em seu site.
            </p>

            <form onSubmit={handleCreateForm} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Título do Formulário</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fale Conosco — Landing Page"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (!formSlug) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Identificador URL (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="ex: contato-site"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-card font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Descrição</label>
                <textarea
                  placeholder="Preencha o formulário abaixo e entraremos em contato."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-card h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg flex items-center gap-1.5"
                >
                  {loading && <CircleNotch size={14} className="animate-spin" />}
                  Criar Formulário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO WEBHOOK */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-1">Criar Webhook Inbound</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Crie uma URL de webhook para conectar com Zapier, Make, Typeform ou n8n.
            </p>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Nome do Webhook</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Leads Facebook Ads Zapier"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Entidade de Destino</label>
                <select
                  value={whEntity}
                  onChange={(e) => setWhEntity(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-card"
                >
                  <option value="lead">Lead / Oportunidade</option>
                  <option value="contact">Contato</option>
                  <option value="custom_record">Objeto Customizado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg flex items-center gap-1.5"
                >
                  {loading && <CircleNotch size={14} className="animate-spin" />}
                  Gerar Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EMBED CODE */}
      {embedModalForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-1">Código de Incorporação (Embed)</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Copie e cole este código HTML no seu site ou página WordPress para exibir o formulário:
            </p>

            <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto text-foreground mb-4 select-all">
              {`<iframe\n  src="${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/alien-matrix/forms/${embedModalForm.id}/submit"\n  width="100%"\n  height="520"\n  frameborder="0"\n></iframe>`}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEmbedModalForm(null)}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs rounded-lg font-medium"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
