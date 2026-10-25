import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface CreateLeadFormInput {
  title: string;
  slug: string;
  description?: string | null;
  targetPipelineId?: string | null;
  targetStageId?: string | null;
  fieldsConfig: FormFieldConfig[];
  primaryColorHex?: string;
  successMessage?: string;
  redirectUrl?: string | null;
  isActive?: boolean;
}

export async function getLeadForms(orgId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_lead_forms")
    .select("*, pipeline:crm_pipelines(name), stage:crm_stages(name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[alienmatrix] failed to get lead forms", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getPublicLeadForm(formId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_lead_forms")
    .select("id, organization_id, title, description, fields_config, primary_color_hex, success_message, redirect_url, is_active")
    .eq("id", formId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Form not found or inactive");
  }
  return data;
}

export async function createLeadForm(
  orgId: string,
  input: CreateLeadFormInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_lead_forms")
    .insert({
      organization_id: orgId,
      title: input.title,
      slug: input.slug.toLowerCase().trim(),
      description: input.description || null,
      target_pipeline_id: input.targetPipelineId || null,
      target_stage_id: input.targetStageId || null,
      fields_config: input.fieldsConfig || [],
      primary_color_hex: input.primaryColorHex || "#2563eb",
      success_message: input.successMessage || "Obrigado! Entraremos em contato em breve.",
      redirect_url: input.redirectUrl || null,
      is_active: input.isActive !== undefined ? input.isActive : true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create lead form: ${error?.message}`);
  }

  await audit({
    action: "crm_form.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_lead_forms",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { title: data.title, slug: data.slug },
  });

  return data;
}

export async function updateLeadForm(
  orgId: string,
  formId: string,
  input: Partial<CreateLeadFormInput>,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updatePayload.title = input.title;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.targetPipelineId !== undefined) updatePayload.target_pipeline_id = input.targetPipelineId;
  if (input.targetStageId !== undefined) updatePayload.target_stage_id = input.targetStageId;
  if (input.fieldsConfig !== undefined) updatePayload.fields_config = input.fieldsConfig;
  if (input.primaryColorHex !== undefined) updatePayload.primary_color_hex = input.primaryColorHex;
  if (input.successMessage !== undefined) updatePayload.success_message = input.successMessage;
  if (input.redirectUrl !== undefined) updatePayload.redirect_url = input.redirectUrl;
  if (input.isActive !== undefined) updatePayload.is_active = input.isActive;

  const { data, error } = await admin
    .from("crm_lead_forms")
    .update(updatePayload)
    .eq("organization_id", orgId)
    .eq("id", formId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update form: ${error?.message}`);
  }

  await audit({
    action: "crm_form.updated",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_lead_forms",
    resourceId: formId,
    requestId: options?.requestId,
  });

  return data;
}

export async function deleteLeadForm(
  orgId: string,
  formId: string,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_lead_forms")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", formId);

  if (error) throw new Error(error.message);

  return { success: true };
}

/**
 * Handles submission of a public form.
 * Creates contact and lead, increments counter, and writes audit log.
 */
export async function submitLeadForm(formId: string, submissionData: Record<string, any>) {
  const admin = createAdminClient();

  const { data: form } = await admin
    .from("crm_lead_forms")
    .select("*")
    .eq("id", formId)
    .single();

  if (!form || !form.is_active) {
    throw new Error("Form is not active");
  }

  const orgId = form.organization_id;
  const name = submissionData.name || submissionData.full_name || "Lead via Formulário";
  const email = submissionData.email ? String(submissionData.email).toLowerCase().trim() : null;
  const phone = submissionData.phone || submissionData.whatsapp || null;

  // 1. Create or match contact
  let contactId: string | null = null;
  if (email || phone) {
    let existing = null;
    if (email) {
      const { data } = await admin.from("contacts").select("id").eq("organization_id", orgId).eq("email", email).maybeSingle();
      existing = data;
    }
    if (!existing && phone) {
      const { data } = await admin.from("contacts").select("id").eq("organization_id", orgId).eq("phone_number", phone).maybeSingle();
      existing = data;
    }
    if (existing) {
      contactId = existing.id;
    }
  }

  if (!contactId) {
    const { data: newContact } = await admin
      .from("contacts")
      .insert({
        organization_id: orgId,
        name,
        email,
        phone_number: phone,
        source: `form:${form.slug}`,
      })
      .select("id")
      .single();
    contactId = newContact?.id || null;
  }

  // 2. Create lead in target pipeline/stage
  const { data: lead, error: leadErr } = await admin
    .from("crm_leads")
    .insert({
      organization_id: orgId,
      contact_id: contactId,
      pipeline_id: form.target_pipeline_id || null,
      stage_id: form.target_stage_id || null,
      title: `${name} — ${form.title}`,
      description: `Capturado via formulário público "${form.title}"`,
      status: "open",
      source: "web_form",
      source_metadata: {
        form_id: form.id,
        form_slug: form.slug,
        fields: submissionData,
      },
    })
    .select("id")
    .single();

  if (leadErr) {
    logger.error("[alienmatrix] failed to create lead from form submission", { error: leadErr });
  }

  // 3. Increment submission counter
  await admin
    .from("crm_lead_forms")
    .update({
      submissions_count: (form.submissions_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", form.id);

  // 4. Audit
  await audit({
    action: "crm_form.submitted",
    organizationId: orgId,
    resourceType: "crm_lead_forms",
    resourceId: form.id,
    metadata: {
      form_title: form.title,
      lead_id: lead?.id,
      contact_id: contactId,
    },
  });

  return {
    success: true,
    message: form.success_message,
    redirectUrl: form.redirect_url,
    leadId: lead?.id,
  };
}
