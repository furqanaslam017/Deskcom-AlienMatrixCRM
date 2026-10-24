import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/audit";

export interface AgentPersona {
  id: string;
  organization_id: string;
  name: string;
  role_title: string;
  tone: "formal" | "casual" | "professional_friendly" | "assertive_sales" | "empathetic_support";
  language: string;
  system_prompt: string;
  first_message_greeting: string | null;
  fallback_behavior: "handoff" | "book_call" | "ask_rephrase";
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export async function listAgentPersonas(
  supabase: SupabaseClient,
  organizationId: string
): Promise<AgentPersona[]> {
  const { data, error } = await supabase
    .from("crm_agent_personas")
    .select("*")
    .eq("organization_id", organizationId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list agent personas: ${error.message}`);
  }

  return (data || []) as AgentPersona[];
}

export async function createAgentPersona(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    name: string;
    role_title?: string;
    tone?: AgentPersona["tone"];
    language?: string;
    system_prompt: string;
    first_message_greeting?: string;
    fallback_behavior?: AgentPersona["fallback_behavior"];
    is_active?: boolean;
    is_default?: boolean;
  },
  actorUserId?: string
): Promise<AgentPersona> {
  if (input.is_default) {
    // Clear existing defaults
    await supabase
      .from("crm_agent_personas")
      .update({ is_default: false })
      .eq("organization_id", organizationId);
  }

  const { data, error } = await supabase
    .from("crm_agent_personas")
    .insert({
      organization_id: organizationId,
      name: input.name,
      role_title: input.role_title || "Consultor Comercial",
      tone: input.tone || "professional_friendly",
      language: input.language || "pt-BR",
      system_prompt: input.system_prompt,
      first_message_greeting: input.first_message_greeting || null,
      fallback_behavior: input.fallback_behavior || "handoff",
      is_active: input.is_active ?? true,
      is_default: input.is_default ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create agent persona: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_agent_persona.created",
    resourceType: "crm_agent_personas",
    resourceId: data.id,
    metadata: { name: data.name, role: data.role_title, tone: data.tone },
  });

  return data as AgentPersona;
}

export async function updateAgentPersona(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  input: Partial<{
    name: string;
    role_title: string;
    tone: AgentPersona["tone"];
    language: string;
    system_prompt: string;
    first_message_greeting: string;
    fallback_behavior: AgentPersona["fallback_behavior"];
    is_active: boolean;
    is_default: boolean;
  }>,
  actorUserId?: string
): Promise<AgentPersona> {
  if (input.is_default) {
    await supabase
      .from("crm_agent_personas")
      .update({ is_default: false })
      .eq("organization_id", organizationId)
      .neq("id", id);
  }

  const { data, error } = await supabase
    .from("crm_agent_personas")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update agent persona: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_agent_persona.updated",
    resourceType: "crm_agent_personas",
    resourceId: id,
    metadata: { name: data.name, changes: Object.keys(input) },
  });

  return data as AgentPersona;
}

export async function deleteAgentPersona(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  actorUserId?: string
): Promise<void> {
  const { error } = await supabase
    .from("crm_agent_personas")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(`Failed to delete agent persona: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_agent_persona.deleted",
    resourceType: "crm_agent_personas",
    resourceId: id,
    metadata: { deleted: true },
  });
}
