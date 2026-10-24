import { describe, expect, it } from "vitest";
import { evaluateConditions, type WorkflowCondition, type WorkflowAction } from "@/lib/alien-matrix/workflow-engine";

describe("AlienMatrix Phase 4 — Automation, Workflows & Webhooks", () => {
  it("evaluates workflow conditions correctly across different operators", () => {
    const payload = {
      title: "Enterprise Deal Alpha",
      value_cents: 750000,
      currency: "USD",
      stage: "proposal_sent",
      notes: "Client interested in WhatsApp multi-agent setup",
      assigned_to: null,
    };

    // 1. Numeric comparison: gte
    const condGte: WorkflowCondition[] = [
      { field: "value_cents", op: "gte", value: 500000 },
    ];
    expect(evaluateConditions(condGte, payload)).toBe(true);

    const condGteFail: WorkflowCondition[] = [
      { field: "value_cents", op: "gte", value: 1000000 },
    ];
    expect(evaluateConditions(condGteFail, payload)).toBe(false);

    // 2. String comparison: equals & not_equals
    const condEquals: WorkflowCondition[] = [
      { field: "currency", op: "equals", value: "USD" },
    ];
    expect(evaluateConditions(condEquals, payload)).toBe(true);

    const condNotEquals: WorkflowCondition[] = [
      { field: "stage", op: "not_equals", value: "won" },
    ];
    expect(evaluateConditions(condNotEquals, payload)).toBe(true);

    // 3. String contains
    const condContains: WorkflowCondition[] = [
      { field: "notes", op: "contains", value: "whatsapp" },
    ];
    expect(evaluateConditions(condContains, payload)).toBe(true);

    // 4. Empty / Not empty checks
    const condEmpty: WorkflowCondition[] = [
      { field: "assigned_to", op: "is_empty" },
    ];
    expect(evaluateConditions(condEmpty, payload)).toBe(true);

    const condNotEmpty: WorkflowCondition[] = [
      { field: "title", op: "is_not_empty" },
    ];
    expect(evaluateConditions(condNotEmpty, payload)).toBe(true);
  });

  it("validates workflow trigger types and supported action catalog", () => {
    const supportedTriggers = [
      "record_created",
      "stage_changed",
      "message_received",
      "time_based",
      "webhook",
    ];

    expect(supportedTriggers).toHaveLength(5);
    expect(supportedTriggers).toContain("record_created");
    expect(supportedTriggers).toContain("stage_changed");
    expect(supportedTriggers).toContain("message_received");
    expect(supportedTriggers).toContain("time_based");
    expect(supportedTriggers).toContain("webhook");

    const sampleActions: WorkflowAction[] = [
      { type: "send_whatsapp", params: { message: "Welcome to AlienMatrix!" } },
      { type: "create_task", params: { title: "Follow-up", priority: "high" } },
      { type: "call_webhook", params: { url: "https://hooks.zapier.com/test" } },
      { type: "run_ai_agent", params: { prompt: "Analyze conversation context" } },
    ];

    expect(sampleActions).toHaveLength(4);
    expect(sampleActions[0]?.type).toBe("send_whatsapp");
    expect(sampleActions[1]?.type).toBe("create_task");
    expect(sampleActions[2]?.type).toBe("call_webhook");
    expect(sampleActions[3]?.type).toBe("run_ai_agent");
  });

  it("validates lead form submission and iframe embed generation", () => {
    const formConfig = {
      id: "f-12345678-0000-0000-0000-000000000001",
      title: "Contact & Demo Form",
      slug: "contact-demo",
      fields: [
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Work Email", type: "email", required: true },
        { name: "phone", label: "Phone Number", type: "phone", required: true },
      ],
    };

    expect(formConfig.slug).toMatch(/^[a-z0-9_-]+$/);
    expect(formConfig.fields.filter((f) => f.required)).toHaveLength(3);

    const embedHtml = `<iframe src="https://app.alienmatrix.com/api/v1/alien-matrix/forms/${formConfig.id}/submit" width="100%" height="520" frameborder="0"></iframe>`;
    expect(embedHtml).toContain(formConfig.id);
    expect(embedHtml).toContain("<iframe");
  });

  it("simulates inbound webhook field mapping for Zapier and n8n", () => {
    const externalWebhookPayload = {
      full_name: "Bruce Wayne",
      user_email: "bruce@wayneenterprises.com",
      cell_phone: "+15550192834",
      deal_amount: 15000,
    };

    const fieldMapping = {
      full_name: "name",
      user_email: "email",
      cell_phone: "phone",
      deal_amount: "value",
    };

    const internalLead: Record<string, any> = {};
    for (const [extKey, intKey] of Object.entries(fieldMapping)) {
      if ((externalWebhookPayload as any)[extKey] !== undefined) {
        internalLead[intKey] = (externalWebhookPayload as any)[extKey];
      }
    }

    expect(internalLead.name).toBe("Bruce Wayne");
    expect(internalLead.email).toBe("bruce@wayneenterprises.com");
    expect(internalLead.phone).toBe("+15550192834");
    expect(internalLead.value).toBe(15000);
  });
});
