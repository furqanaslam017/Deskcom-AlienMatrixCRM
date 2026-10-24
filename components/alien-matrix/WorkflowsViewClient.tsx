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
  const [wfActionTitle, setWfActionTitle] = useState("Priority follow-up call");

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
          workflow_name: workflows[1]?.name || "Deal Won Automated Notification",
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
    setStatusMessage(`Triggering simulation run for "${wf.name}"...`);
    try {
      const res = await fetch(`/api/v1/alien-matrix/workflows/${wf.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            title: "Simulated Lead Qualification",
            value_cents: 650000,
            currency: "USD",
            stage: "won",
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Workflow executed successfully. Status: ${data.data?.status ?? "success"}`);
        setWorkflows(workflows.map((w) => (w.id === wf.id ? { ...w, executions_count: w.executions_count + 1 } : w)));
      } else {
        setStatusMessage(`Error: ${data.error?.message || "Execution failed"}`);
      }
    } catch (err: any) {
      setStatusMessage(`Network error: ${err.message}`);
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
            message: "Automated notification from AlienMatrix Workflow Engine",
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
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Work Email", type: "email", required: true },
        { name: "phone", label: "WhatsApp / Direct Phone", type: "phone", required: true },
        { name: "message", label: "How can our team help?", type: "textarea", required: false },
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
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--line-2)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--well)] text-[var(--tomato)] border border-[var(--line-2)]">
              <FlowArrow size={22} weight="bold" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text)]">
                Automations &amp; Event Engine
              </h1>
              <p className="text-xs text-[var(--muted)] mt-1">
                Visual event triggers, embeddable lead capture forms, and inbound webhooks for Zapier, Make, and n8n.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button based on Tab */}
        <div className="flex items-center gap-2">
          {activeTab === "workflows" && (
            <button
              onClick={() => setShowWorkflowModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={14} weight="bold" />
              New Workflow
            </button>
          )}
          {activeTab === "forms" && (
            <button
              onClick={() => setShowFormModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={14} weight="bold" />
              New Lead Form
            </button>
          )}
          {activeTab === "webhooks" && (
            <button
              onClick={() => setShowWebhookModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={14} weight="bold" />
              New Inbound Webhook
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] text-xs flex items-center justify-between shadow-[var(--shadow-pop)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--pine)]" />
            <span className="text-[var(--text)]">{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
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
            onClick={() => setActiveTab("workflows")}
            data-active={activeTab === "workflows"}
            className="tab"
          >
            <Lightning size={15} />
            Active Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab("forms")}
            data-active={activeTab === "forms"}
            className="tab"
          >
            <Article size={15} />
            Lead Capture Forms ({forms.length})
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            data-active={activeTab === "webhooks"}
            className="tab"
          >
            <WebhooksLogo size={15} />
            Inbound Webhooks ({webhooks.length})
          </button>
          <button
            onClick={() => setActiveTab("executions")}
            data-active={activeTab === "executions"}
            className="tab"
          >
            <ListDashes size={15} />
            Execution Logs
          </button>
        </div>
      </div>

      {/* TAB 1: WORKFLOWS */}
      {activeTab === "workflows" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className={`p-5 rounded-[var(--r-card)] border transition shadow-[var(--shadow-bento)] flex flex-col justify-between backdrop-blur-md ${
                wf.is_active
                  ? "border-[var(--rim)] bg-[var(--glass)]"
                  : "border-[var(--line-2)] bg-[var(--solid)] opacity-70"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`badge text-[10px] font-bold uppercase inline-flex items-center gap-1.5 ${
                      wf.is_active ? "badge--pine" : "badge--plain"
                    }`}
                  >
                    {wf.is_active ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} />}
                    {wf.is_active ? "Active" : "Paused"}
                  </span>

                  <span className="badge badge--plain font-mono text-[10px] text-[var(--muted)]">
                    {wf.trigger_type}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[var(--text)] mb-1">{wf.name}</h3>
                <p className="text-xs text-[var(--muted)] line-clamp-2 mb-4 leading-relaxed">
                  {wf.description || "No description provided."}
                </p>

                {/* Conditions & Actions Summary */}
                <div className="bg-[var(--solid)] border border-[var(--line-2)] rounded-[var(--r-tile)] p-3 text-xs space-y-2 mb-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    <Sliders size={13} className="text-[var(--tomato)]" />
                    <span>
                      Rules: <strong className="text-[var(--text)]">{wf.conditions.length} condition(s)</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    <Lightning size={13} className="text-amber-500" />
                    <span>
                      Actions: <strong className="text-[var(--text)]">{wf.actions.length} sequential step(s)</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    <Clock size={13} />
                    <span>
                      Executions: <strong className="text-[var(--text)] font-numeric">{wf.executions_count} runs</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--line-2)]">
                <button
                  onClick={() => handleToggleWorkflow(wf)}
                  className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  {wf.is_active ? "Pause" : "Activate"}
                </button>

                <button
                  onClick={() => handleTestWorkflow(wf)}
                  disabled={loading}
                  className="btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Play size={12} weight="fill" />
                  Simulate Trigger
                </button>
              </div>
            </div>
          ))}

          {workflows.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-[var(--line-2)] rounded-[var(--r-card)] bg-[var(--solid)]/50">
              <FlowArrow size={36} className="mx-auto text-[var(--muted)] mb-3" />
              <p className="font-semibold text-sm text-[var(--text)]">No workflows configured yet.</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Automate task delegation, instant WhatsApp alerts, and pipeline stage transitions.
              </p>
              <button
                onClick={() => setShowWorkflowModal(true)}
                className="mt-4 btn btn--ink btn--sm text-xs font-semibold"
              >
                Create First Workflow
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEAD FORMS */}
      {activeTab === "forms" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {forms.map((f) => (
            <div
              key={f.id}
              className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] flex flex-col justify-between backdrop-blur-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge--plain font-mono text-[10px]">
                    /forms/f/{f.slug}
                  </span>
                  <span className="badge badge--pine text-[10px] font-bold">
                    {f.submissions_count} submissions
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[var(--text)] mb-1">{f.title}</h3>
                <p className="text-xs text-[var(--muted)] line-clamp-2 mb-4 leading-relaxed">
                  {f.description || "Public lead capture form."}
                </p>

                <div className="bg-[var(--solid)] border border-[var(--line-2)] rounded-[var(--r-tile)] p-3 text-xs space-y-1.5 mb-4 shadow-sm">
                  <p className="text-[var(--muted)]">Fields: <span className="text-[var(--text)] font-semibold">{f.fields_config?.length || 0} configured</span></p>
                  <p className="text-[var(--muted)]">Target: <span className="text-[var(--text)] font-medium">{f.pipeline?.name || "Default Pipeline"}</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--line-2)]">
                <button
                  onClick={() => setEmbedModalForm(f)}
                  className="btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Code size={13} />
                  Embed Snippet
                </button>
                <button
                  onClick={async () => {
                    const testPayload = {
                      name: "Lead Web Form Test",
                      email: `form-${Date.now()}@example.com`,
                      phone: "+1 555 123 4567",
                    };
                    const res = await fetch(`/api/v1/alien-matrix/forms/${f.id}/submit`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(testPayload),
                    });
                    if (res.ok) {
                      setStatusMessage(`Simulated submission sent successfully for form "${f.title}".`);
                      setForms(forms.map((form) => (form.id === f.id ? { ...form, submissions_count: form.submissions_count + 1 } : form)));
                    }
                  }}
                  className="btn btn--ghost btn--sm text-xs font-medium"
                >
                  Simulate Submit
                </button>
              </div>
            </div>
          ))}

          {forms.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-[var(--line-2)] rounded-[var(--r-card)] bg-[var(--solid)]/50">
              <Article size={36} className="mx-auto text-[var(--muted)] mb-3" />
              <p className="font-semibold text-sm text-[var(--text)]">No lead capture forms created yet.</p>
              <p className="text-xs text-[var(--muted)] mt-1">Generate forms to embed into websites, WordPress, and landing pages.</p>
              <button
                onClick={() => setShowFormModal(true)}
                className="mt-4 btn btn--ink btn--sm text-xs font-semibold"
              >
                Create First Form
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INBOUND WEBHOOKS */}
      {activeTab === "webhooks" && (
        <div className="space-y-4">
          <div className="p-4 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div>
              <p className="font-semibold text-[var(--text)]">Ready-to-Use Endpoints for Zapier / Make / n8n / Typeform</p>
              <p className="text-[var(--muted)] mt-0.5">
                Send data via standard JSON POST requests. Inbound events automatically resolve contacts and create pipeline deals.
              </p>
            </div>
            <span className="badge badge--plain font-mono text-xs font-semibold whitespace-nowrap">
              POST /api/v1/alien-matrix/webhooks/inbound/&#123;token&#125;
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] flex flex-col justify-between backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge badge--plain font-mono text-[10px]">
                      Entity: {wh.target_entity}
                    </span>
                    <span className="badge badge--pine text-[10px] font-bold">
                      {wh.calls_count} calls
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-[var(--text)] mb-1">{wh.name}</h3>
                  <p className="text-xs font-mono text-[var(--muted)] bg-[var(--well)] p-2.5 rounded-[var(--r-tile)] border border-[var(--line-2)] truncate mb-4 select-all">
                    /api/v1/alien-matrix/webhooks/inbound/{wh.token}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--line-2)]">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/v1/alien-matrix/webhooks/inbound/${wh.token}`);
                      setStatusMessage("Webhook endpoint URL copied to clipboard.");
                    }}
                    className="btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Copy size={13} />
                    Copy URL
                  </button>

                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/v1/alien-matrix/webhooks/inbound/${wh.token}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: "Lead Zapier Test",
                          email: `zapier-${Date.now()}@example.com`,
                          phone: "+1 555 988 7777",
                          value: 1250,
                          currency: "USD",
                        }),
                      });
                      if (res.ok) {
                        setStatusMessage(`Webhook "${wh.name}" triggered successfully.`);
                        setWebhooks(webhooks.map((w) => (w.id === wh.id ? { ...w, calls_count: w.calls_count + 1 } : w)));
                      }
                    }}
                    className="btn btn--ghost btn--sm text-xs font-medium"
                  >
                    Test Webhook
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXECUTIONS */}
      {activeTab === "executions" && (
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--well)]/80 border-b border-[var(--line-2)] text-[var(--muted)] uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Workflow</th>
                <th className="py-3 px-4">Actions Completed</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Execution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-2)]">
              {executions.map((exec) => (
                <tr key={exec.id} className="hover:bg-[var(--well)]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="badge badge--pine text-[10px] font-bold uppercase inline-flex items-center gap-1">
                      <CheckCircle size={12} weight="fill" />
                      {exec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[var(--text)]">{exec.workflow_name}</td>
                  <td className="py-3.5 px-4 text-[var(--muted)]">{exec.actions_run} steps completed</td>
                  <td className="py-3.5 px-4 font-mono text-[var(--muted)] font-numeric">{exec.duration_ms} ms</td>
                  <td className="py-3.5 px-4 text-[var(--muted)]">{new Date(exec.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
              {executions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[var(--muted)]">
                    No executions recorded recently. Trigger a simulation run above to generate logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: NEW WORKFLOW */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] max-w-lg w-full p-6 shadow-[var(--shadow-pop)] animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-[var(--text)] mb-1">New Automation Workflow</h2>
            <p className="text-xs text-[var(--muted)] mb-4">
              Configure event triggers, conditional validation gates, and automated actions.
            </p>

            <form onSubmit={handleCreateWorkflow} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-Value Deal WhatsApp Notification"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Triggers task and WhatsApp alert when deal exceeds $5,000"
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">Trigger Event</label>
                  <select
                    value={wfTrigger}
                    onChange={(e) => setWfTrigger(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="record_created">New Record Created</option>
                    <option value="stage_changed">Stage Changed</option>
                    <option value="message_received">WhatsApp Message Received</option>
                    <option value="webhook">Inbound Webhook Call</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">Rule Field</label>
                  <input
                    type="text"
                    value={wfConditionField}
                    onChange={(e) => setWfConditionField(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">Operator</label>
                  <select
                    value={wfConditionOp}
                    onChange={(e) => setWfConditionOp(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="gte">Greater than or Equal (&gt;=)</option>
                    <option value="lte">Less than or Equal (&lt;=)</option>
                    <option value="equals">Equals (==)</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">Target Value</label>
                  <input
                    type="text"
                    value={wfConditionVal}
                    onChange={(e) => setWfConditionVal(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">Automated Action</label>
                  <select
                    value={wfActionType}
                    onChange={(e) => setWfActionType(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="create_task">Create CRM Task</option>
                    <option value="send_whatsapp">Send Automated WhatsApp</option>
                    <option value="call_webhook">Trigger External Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">Action Title</label>
                  <input
                    type="text"
                    value={wfActionTitle}
                    onChange={(e) => setWfActionTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setShowWorkflowModal(false)}
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
                  Save Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW FORM */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] max-w-md w-full p-6 shadow-[var(--shadow-pop)] animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-[var(--text)] mb-1">Create Lead Capture Form</h2>
            <p className="text-xs text-[var(--muted)] mb-4">
              Generate a public form endpoint with iframe embed code for websites.
            </p>

            <form onSubmit={handleCreateForm} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Form Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contact Us — Landing Page"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (!formSlug) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">URL Identifier (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. contact-site"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Description</label>
                <textarea
                  placeholder="Fill out the form below and our team will get in touch shortly."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full text-xs p-3 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] h-20 focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
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
                  Create Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW WEBHOOK */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] max-w-md w-full p-6 shadow-[var(--shadow-pop)] animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-[var(--text)] mb-1">Create Inbound Webhook</h2>
            <p className="text-xs text-[var(--muted)] mb-4">
              Generate a unique webhook URL to connect with Zapier, Make, Typeform, or n8n.
            </p>

            <form onSubmit={handleCreateWebhook} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Webhook Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Facebook Ads Zapier Leads"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Target Entity</label>
                <select
                  value={whEntity}
                  onChange={(e) => setWhEntity(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                >
                  <option value="lead">Lead / Opportunity</option>
                  <option value="contact">Contact</option>
                  <option value="custom_record">Custom Object Record</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
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
                  Generate Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EMBED CODE */}
      {embedModalForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] max-w-lg w-full p-6 shadow-[var(--shadow-pop)] animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-[var(--text)] mb-1">Embed Snippet (Iframe)</h2>
            <p className="text-xs text-[var(--muted)] mb-4">
              Copy and paste this HTML snippet into your external site or WordPress theme:
            </p>

            <div className="bg-[var(--well)] border border-[var(--line-2)] p-3.5 rounded-[var(--r-tile)] font-mono text-xs overflow-x-auto text-[var(--text)] mb-4 select-all">
              {`<iframe\n  src="${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/alien-matrix/forms/${embedModalForm.id}/submit"\n  width="100%"\n  height="520"\n  frameborder="0"\n></iframe>`}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setEmbedModalForm(null)}
                className="btn btn--ink btn--sm text-xs font-semibold px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
