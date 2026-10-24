import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface CreateChatbotInput {
  name: string;
  whatsappNumberId?: string;
  keywords: string[];
  flowType?: "keyword" | "menu" | "business_hours";
  menuOptions?: Array<{ key: string; label: string; action: string }>;
  responseText: string;
  fallbackMode?: "ai_agent" | "human_handoff" | "end";
  isActive?: boolean;
}

export async function getChatbots(orgId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_whatsapp_chatbots")
    .select("*, number:crm_whatsapp_numbers(name, phone_number)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[alienmatrix] failed to get chatbots", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createChatbot(
  orgId: string,
  input: CreateChatbotInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_whatsapp_chatbots")
    .insert({
      organization_id: orgId,
      whatsapp_number_id: input.whatsappNumberId || null,
      name: input.name,
      keywords: input.keywords.map((k) => k.toLowerCase().trim()),
      flow_type: input.flowType || "keyword",
      menu_options: input.menuOptions || [],
      response_text: input.responseText,
      fallback_mode: input.fallbackMode || "ai_agent",
      is_active: input.isActive !== undefined ? input.isActive : true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create chatbot: ${error?.message}`);
  }

  await audit({
    action: "crm_whatsapp_chatbot.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_whatsapp_chatbots",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { name: data.name, keywords: data.keywords },
  });

  return data;
}

export function evaluateChatbotResponse(
  chatbots: any[],
  incomingMessage: string
): { matched: boolean; responseText?: string; fallbackMode?: string; botName?: string } {
  const normalized = incomingMessage.toLowerCase().trim();

  for (const bot of chatbots) {
    if (!bot.is_active) continue;
    const keywords: string[] = Array.isArray(bot.keywords) ? bot.keywords : [];
    const hasMatch = keywords.some((kw) => normalized.includes(kw.toLowerCase()));

    if (hasMatch) {
      return {
        matched: true,
        responseText: bot.response_text,
        fallbackMode: bot.fallback_mode,
        botName: bot.name,
      };
    }
  }

  return { matched: false, fallbackMode: "ai_agent" };
}
