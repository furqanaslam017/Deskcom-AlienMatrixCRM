import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface CreateLinkInput {
  title: string;
  slug: string;
  whatsappNumberId?: string;
  prefilledText?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  targetPipelineId?: string;
  targetStageId?: string;
}

export async function getWhatsAppLinks(orgId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_whatsapp_links")
    .select("*, number:crm_whatsapp_numbers(name, phone_number)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[alienmatrix] failed to get whatsapp links", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createWhatsAppLink(
  orgId: string,
  input: CreateLinkInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  const { data, error } = await admin
    .from("crm_whatsapp_links")
    .insert({
      organization_id: orgId,
      whatsapp_number_id: input.whatsappNumberId || null,
      title: input.title,
      slug,
      prefilled_text: input.prefilledText || "Olá! Gostaria de mais informações sobre os produtos/serviços.",
      utm_source: input.utmSource || "meta_ads",
      utm_medium: input.utmMedium || "cpc",
      utm_campaign: input.utmCampaign || "direto_whatsapp",
      target_pipeline_id: input.targetPipelineId || null,
      target_stage_id: input.targetStageId || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create WhatsApp link: ${error?.message}`);
  }

  await audit({
    action: "crm_whatsapp_link.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_whatsapp_links",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { slug: data.slug, title: data.title },
  });

  return data;
}

export function generateClickToWhatsAppUrl(phoneNumber: string, prefilledText?: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const encodedText = prefilledText ? encodeURIComponent(prefilledText) : "";
  return `https://wa.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ""}`;
}
