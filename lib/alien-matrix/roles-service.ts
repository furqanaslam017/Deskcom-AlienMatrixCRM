import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface CustomRoleInput {
  name: string;
  slug: string;
  description?: string;
  permissions: {
    objects?: Record<string, string[]>; // e.g. { "properties": ["read", "create", "update", "delete"] }
    fields?: Record<string, "readonly" | "hidden" | "editable">; // e.g. { "properties.price": "readonly" }
    allRecordsVisibility?: boolean; // team vs personal ownership
  };
}

export async function getCustomRoles(orgId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_custom_roles")
    .select("*, assignments:crm_role_assignments(count)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("[alienmatrix] failed to get custom roles", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createCustomRole(
  orgId: string,
  input: CustomRoleInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_custom_roles")
    .insert({
      organization_id: orgId,
      name: input.name,
      slug: input.slug.toLowerCase().trim(),
      description: input.description || null,
      permissions: input.permissions || {},
      is_system: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create custom role: ${error?.message}`);
  }

  await audit({
    action: "crm_role.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_custom_roles",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { name: data.name, slug: data.slug },
  });

  return data;
}

export async function updateCustomRole(
  orgId: string,
  roleId: string,
  input: Partial<CustomRoleInput>,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name) updatePayload.name = input.name;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.permissions) updatePayload.permissions = input.permissions;

  const { data, error } = await admin
    .from("crm_custom_roles")
    .update(updatePayload)
    .eq("organization_id", orgId)
    .eq("id", roleId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update custom role: ${error?.message}`);
  }

  await audit({
    action: "crm_role.updated",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_custom_roles",
    resourceId: roleId,
    requestId: options?.requestId,
  });

  return data;
}

export async function deleteCustomRole(
  orgId: string,
  roleId: string,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_custom_roles")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", roleId);

  if (error) {
    throw new Error(error.message);
  }

  await audit({
    action: "crm_role.deleted",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_custom_roles",
    resourceId: roleId,
    requestId: options?.requestId,
  });

  return { success: true };
}

export async function assignUserRole(
  orgId: string,
  userId: string,
  roleId: string,
  options?: { actorUserId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_role_assignments")
    .insert({
      organization_id: orgId,
      user_id: userId,
      custom_role_id: roleId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to assign role: ${error?.message}`);
  }

  await audit({
    action: "crm_role.assigned",
    organizationId: orgId,
    actorUserId: options?.actorUserId || null,
    resourceType: "crm_role_assignments",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { user_id: userId, role_id: roleId },
  });

  return data;
}
