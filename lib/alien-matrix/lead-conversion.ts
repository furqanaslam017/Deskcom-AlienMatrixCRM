import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface ConvertLeadInput {
  leadId: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  createDeal?: boolean;
  dealTitle?: string;
  pipelineId?: string;
  stageId?: string;
  dealValueCents?: number;
  dealCurrency?: string;
  notes?: string;
  convertedByUserId?: string;
}

export interface ConvertLeadResult {
  success: boolean;
  leadId: string;
  contactId: string;
  companyId?: string | null;
  dealId?: string | null;
  conversionId: string;
}

/**
 * Converts a raw Lead into a qualified Contact, optional Company, and Deal.
 * Strictly tenant-isolated and records to crm_lead_conversions & audit log.
 */
export async function convertLead(
  orgId: string,
  input: ConvertLeadInput,
  options?: { requestId?: string }
): Promise<ConvertLeadResult> {
  const admin = createAdminClient();

  // 1. Fetch source lead
  const { data: lead, error: leadErr } = await admin
    .from("crm_leads")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", input.leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    throw new Error(`Lead not found: ${input.leadId}`);
  }

  // 2. Identify or create Contact
  let contactId = lead.contact_id as string | null;
  const contactName = input.contactName || lead.title || "Novo Contato";
  const contactEmail = input.contactEmail;
  const contactPhone = input.contactPhone;

  if (contactId) {
    // If contact exists, optionally update email/phone if provided
    const updateData: Record<string, unknown> = {};
    if (contactEmail) updateData.email = contactEmail;
    if (contactPhone) updateData.phone_number = contactPhone;
    if (Object.keys(updateData).length > 0) {
      await admin
        .from("contacts")
        .update(updateData)
        .eq("organization_id", orgId)
        .eq("id", contactId);
    }
  } else {
    // Search if matching email or phone already exists
    let existingContact = null;
    if (contactEmail) {
      const { data } = await admin
        .from("contacts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("email", contactEmail.toLowerCase().trim())
        .maybeSingle();
      existingContact = data;
    }
    if (!existingContact && contactPhone) {
      const { data } = await admin
        .from("contacts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone_number", contactPhone.trim())
        .maybeSingle();
      existingContact = data;
    }

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: newContact, error: createContactErr } = await admin
        .from("contacts")
        .insert({
          organization_id: orgId,
          name: contactName,
          email: contactEmail?.toLowerCase().trim() || null,
          phone_number: contactPhone?.trim() || null,
          source: lead.source || "lead_conversion",
          created_by_user_id: input.convertedByUserId || null,
        })
        .select("id")
        .single();

      if (createContactErr || !newContact) {
        throw new Error(`Failed to create contact: ${createContactErr?.message}`);
      }
      contactId = newContact.id;
    }
  }

  // 3. Optional: Create or Link Company
  let companyId: string | null = null;
  if (input.companyName && input.companyName.trim()) {
    const trimmedCompany = input.companyName.trim();
    const { data: existingCompany } = await admin
      .from("companies")
      .select("id")
      .eq("organization_id", orgId)
      .ilike("trade_name", trimmedCompany)
      .maybeSingle();

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const { data: newCompany } = await admin
        .from("companies")
        .insert({
          organization_id: orgId,
          trade_name: trimmedCompany,
          legal_name: trimmedCompany,
          created_by: input.convertedByUserId || null,
        })
        .select("id")
        .single();
      companyId = newCompany?.id || null;
    }
  }

  // 4. Create or Upgrade to Deal
  let dealId: string | null = null;
  if (input.createDeal !== false) {
    let pipelineId = input.pipelineId || lead.pipeline_id;
    let stageId = input.stageId;

    // If pipeline not provided, find default pipeline
    if (!pipelineId) {
      const { data: defaultPipe } = await admin
        .from("crm_pipelines")
        .select("id")
        .eq("organization_id", orgId)
        .eq("is_default", true)
        .maybeSingle();
      pipelineId = defaultPipe?.id;
    }

    // If stage not provided, find first non-won, non-lost stage
    if (pipelineId && !stageId) {
      const { data: stages } = await admin
        .from("crm_stages")
        .select("id")
        .eq("organization_id", orgId)
        .eq("pipeline_id", pipelineId)
        .eq("is_archived", false)
        .order("position", { ascending: true })
        .limit(1);
      stageId = stages?.[0]?.id;
    }

    const dealTitle = input.dealTitle || lead.title || `Negócio — ${contactName}`;
    const valueCents = input.dealValueCents ?? lead.value_cents ?? 0;
    const currency = input.dealCurrency || lead.currency || "USD";

    // Create the deal record (in crm_leads with pipeline/stage)
    const { data: deal, error: dealErr } = await admin
      .from("crm_leads")
      .insert({
        organization_id: orgId,
        contact_id: contactId,
        pipeline_id: pipelineId,
        stage_id: stageId,
        title: dealTitle,
        description: input.notes || lead.description,
        status: "open",
        value_cents: valueCents,
        currency: currency,
        owner_user_id: lead.owner_user_id || input.convertedByUserId || null,
        source: "lead_conversion",
        source_metadata: {
          converted_from_lead_id: lead.id,
          company_id: companyId,
        },
      })
      .select("id")
      .single();

    if (dealErr || !deal) {
      logger.error("[alienmatrix] failed to create deal from lead", { error: dealErr });
      throw new Error(`Failed to create deal: ${dealErr?.message}`);
    }
    dealId = deal.id;
  }

  // 5. Update original lead status to converted
  await admin
    .from("crm_leads")
    .update({
      status: "converted",
      contact_id: contactId,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", orgId)
    .eq("id", lead.id);

  // 6. Record conversion trace
  const { data: conversionRecord, error: convErr } = await admin
    .from("crm_lead_conversions")
    .insert({
      organization_id: orgId,
      source_lead_id: lead.id,
      target_contact_id: contactId,
      target_company_id: companyId,
      target_deal_id: dealId,
      converted_by_user_id: input.convertedByUserId || null,
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (convErr) {
    logger.warn("[alienmatrix] error writing crm_lead_conversions trace", { error: convErr });
  }

  // 7. Fire audit log
  await audit({
    action: "lead.converted",
    organizationId: orgId,
    actorUserId: input.convertedByUserId || null,
    resourceType: "crm_leads",
    resourceId: lead.id,
    requestId: options?.requestId,
    metadata: {
      contact_id: contactId,
      company_id: companyId,
      deal_id: dealId,
      conversion_id: conversionRecord?.id,
    },
  });

  return {
    success: true,
    leadId: lead.id,
    contactId: contactId || "",
    companyId,
    dealId,
    conversionId: conversionRecord?.id || "",
  };
}
