import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/audit";

export interface AIInsight {
  id: string;
  organization_id: string;
  target_type: "conversation" | "lead" | "contact";
  target_id: string;
  lead_score: number;
  score_reasons: Array<{ factor: string; delta: number; note: string }>;
  sentiment: "positive" | "neutral" | "negative" | "frustrated";
  sentiment_score: number;
  summary: string | null;
  next_best_actions: Array<{ title: string; priority: "high" | "medium" | "low"; action_type: string }>;
  extracted_fields: Record<string, string | number | boolean>;
  fields_applied: boolean;
  created_at: string;
  updated_at: string;
}

export function computeLeadScoreAndSentiment(messagesText: string): {
  score: number;
  reasons: Array<{ factor: string; delta: number; note: string }>;
  sentiment: AIInsight["sentiment"];
  sentimentScore: number;
  summary: string;
  nextBestActions: AIInsight["next_best_actions"];
  extractedFields: Record<string, string | number | boolean>;
} {
  const text = messagesText.toLowerCase();

  let score = 50; // base score
  const reasons: Array<{ factor: string; delta: number; note: string }> = [];

  // Positive signals
  if (text.includes("preço") || text.includes("quanto custa") || text.includes("orçamento") || text.includes("price") || text.includes("cost")) {
    score += 15;
    reasons.push({ factor: "pricing_interest", delta: 15, note: "Cliente perguntou ativamente sobre valores/orçamento" });
  }

  if (text.includes("fechar") || text.includes("comprar") || text.includes("contrato") || text.includes("pix") || text.includes("buy")) {
    score += 20;
    reasons.push({ factor: "purchase_intent", delta: 20, note: "Demonstrou forte intenção de compra ou fechamento" });
  }

  if (text.includes("reunião") || text.includes("demo") || text.includes("apresentação") || text.includes("horário")) {
    score += 10;
    reasons.push({ factor: "meeting_ready", delta: 10, note: "Disposição para demonstração ou alinhamento de horários" });
  }

  // Negative / Frustration signals
  let sentiment: AIInsight["sentiment"] = "neutral";
  let sentimentScore = 0.1;

  if (text.includes("demora") || text.includes("horrível") || text.includes("péssimo") || text.includes("cancelar") || text.includes("reclamação")) {
    score -= 25;
    sentiment = "frustrated";
    sentimentScore = -0.8;
    reasons.push({ factor: "frustration_detected", delta: -25, note: "Identificadas palavras de insatisfação ou reclamação de atendimento" });
  } else if (text.includes("não quero") || text.includes("caro demais") || text.includes("depois vejo")) {
    score -= 10;
    sentiment = "negative";
    sentimentScore = -0.4;
    reasons.push({ factor: "objection_cost", delta: -10, note: "Objeção direta de preço ou desinteresse no momento" });
  } else if (score >= 70) {
    sentiment = "positive";
    sentimentScore = 0.75;
  }

  // Bound score 0 - 100
  score = Math.max(0, Math.min(100, score));

  // Auto-extract candidate fields from text regex
  const extractedFields: Record<string, string | number | boolean> = {};

  const emailMatch = messagesText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    extractedFields.email = emailMatch[0];
  }

  const phoneMatch = messagesText.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/);
  if (phoneMatch && phoneMatch[0].length >= 8) {
    extractedFields.phone = phoneMatch[0].replace(/\s+/g, "");
  }

  const budgetMatch = messagesText.match(/(?:orçamento|budget|valor|investimento|r\$)\s*(?:de|até|em)?\s*(\d+[\d.,]*)/i);
  if (budgetMatch && budgetMatch[1]) {
    const rawNum = budgetMatch[1].replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      extractedFields.budget = parsed;
    }
  }

  // Generate Next Best Actions based on state
  const nextBestActions: AIInsight["next_best_actions"] = [];
  if (sentiment === "frustrated") {
    nextBestActions.push({
      title: "Realizar Handoff Humano Imediato",
      priority: "high",
      action_type: "human_escalation",
    });
    nextBestActions.push({
      title: "Enviar Mensagem de Acolhimento e Prioridade",
      priority: "high",
      action_type: "send_message",
    });
  } else if (score >= 75) {
    nextBestActions.push({
      title: "Enviar Proposta Comercial / Link de Pagamento",
      priority: "high",
      action_type: "send_quote",
    });
    nextBestActions.push({
      title: "Agendar Demonstração Guiada com Especialista",
      priority: "medium",
      action_type: "book_meeting",
    });
  } else {
    nextBestActions.push({
      title: "Enviar Case de Sucesso no Nicho",
      priority: "medium",
      action_type: "send_content",
    });
    nextBestActions.push({
      title: "Qualificar Tamanho da Equipe e Prazo de Decisão",
      priority: "low",
      action_type: "qualify",
    });
  }

  const summary = `Lead com score ${score}/100 e sentimento ${sentiment}. Mostrou ${
    reasons.map((r) => r.note).join("; ") || "interações padrão de consulta"
  }. Ação recomendada: ${nextBestActions[0]?.title ?? "Continuar atendimento"}.`;

  return {
    score,
    reasons,
    sentiment,
    sentimentScore,
    summary,
    nextBestActions,
    extractedFields,
  };
}

export async function generateAIInsight(
  supabase: SupabaseClient,
  organizationId: string,
  targetType: "conversation" | "lead" | "contact",
  targetId: string,
  contentToAnalyze: string,
  actorUserId?: string
): Promise<AIInsight> {
  const analysis = computeLeadScoreAndSentiment(contentToAnalyze);

  const { data, error } = await supabase
    .from("crm_ai_insights")
    .insert({
      organization_id: organizationId,
      target_type: targetType,
      target_id: targetId,
      lead_score: analysis.score,
      score_reasons: analysis.reasons,
      sentiment: analysis.sentiment,
      sentiment_score: analysis.sentimentScore,
      summary: analysis.summary,
      next_best_actions: analysis.nextBestActions,
      extracted_fields: analysis.extractedFields,
      fields_applied: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to generate AI insight: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_ai_insight.generated",
    resourceType: "crm_ai_insights",
    resourceId: data.id,
    metadata: {
      targetType,
      targetId,
      score: analysis.score,
      sentiment: analysis.sentiment,
    },
  });

  return data as AIInsight;
}

export async function listAIInsights(
  supabase: SupabaseClient,
  organizationId: string,
  targetId?: string
): Promise<AIInsight[]> {
  let query = supabase
    .from("crm_ai_insights")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (targetId) {
    query = query.eq("target_id", targetId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list AI insights: ${error.message}`);
  }

  return (data || []) as AIInsight[];
}

export async function applyExtractedFields(
  supabase: SupabaseClient,
  organizationId: string,
  insightId: string,
  contactId?: string,
  leadId?: string,
  actorUserId?: string
): Promise<AIInsight> {
  const { data: insight, error } = await supabase
    .from("crm_ai_insights")
    .select("*")
    .eq("id", insightId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !insight) {
    throw new Error(`Insight not found: ${error?.message}`);
  }

  const fields = (insight.extracted_fields as Record<string, unknown>) || {};

  // If email/phone extracted and contactId provided, update contact
  if (contactId && (fields.email || fields.phone)) {
    const contactUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (fields.email) contactUpdates.email = fields.email;
    if (fields.phone) contactUpdates.phone = fields.phone;

    await supabase
      .from("contacts")
      .update(contactUpdates)
      .eq("id", contactId)
      .eq("organization_id", organizationId);
  }

  // If budget extracted and leadId provided, update deal value
  if (leadId && fields.budget && typeof fields.budget === "number") {
    await supabase
      .from("crm_leads")
      .update({
        value_cents: Math.round(fields.budget * 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .eq("organization_id", organizationId);
  }

  // Mark insight as fields_applied
  const { data: updated, error: updateErr } = await supabase
    .from("crm_ai_insights")
    .update({ fields_applied: true, updated_at: new Date().toISOString() })
    .eq("id", insightId)
    .select()
    .single();

  if (updateErr) {
    throw new Error(`Failed to mark insight fields as applied: ${updateErr.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_ai_insight.applied",
    resourceType: "crm_ai_insights",
    resourceId: insightId,
    metadata: { contactId, leadId, appliedFields: Object.keys(fields) },
  });

  return updated as AIInsight;
}
