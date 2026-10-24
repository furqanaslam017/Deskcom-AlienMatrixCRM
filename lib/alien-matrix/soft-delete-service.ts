import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function softDeleteRecord(
  orgId: string,
  entityType: "lead" | "contact" | "product" | "invoice" | "custom_record",
  entityId: string,
  entityName: string,
  entityData: Record<string, unknown>,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();

  // 1. Record in trash table
  const { data, error } = await admin
    .from("crm_soft_deletes")
    .insert({
      organization_id: orgId,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      entity_data: entityData,
      deleted_by_user_id: options?.userId || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error("[alienmatrix] failed to soft delete", { error });
    throw new Error(`Failed to trash record: ${error?.message}`);
  }

  // 2. Remove or mark deleted in source table
  if (entityType === "product") {
    await admin.from("crm_products").delete().eq("organization_id", orgId).eq("id", entityId);
  } else if (entityType === "custom_record") {
    await admin.from("custom_records").delete().eq("organization_id", orgId).eq("id", entityId);
  } else if (entityType === "invoice") {
    await admin.from("crm_invoices").update({ status: "cancelled" }).eq("organization_id", orgId).eq("id", entityId);
  }

  await audit({
    action: "crm_record.soft_deleted",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: entityType,
    resourceId: entityId,
    requestId: options?.requestId,
    metadata: { entity_name: entityName },
  });

  return data;
}

export async function getDeletedRecords(orgId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_soft_deletes")
    .select("*")
    .eq("organization_id", orgId)
    .is("restored_at", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function restoreRecord(
  orgId: string,
  deleteId: string,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data: record, error: findError } = await admin
    .from("crm_soft_deletes")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", deleteId)
    .single();

  if (findError || !record) {
    throw new Error("Registro excluído não encontrado");
  }

  // Restore into original table
  if (record.entity_type === "product") {
    const p = record.entity_data as any;
    await admin.from("crm_products").insert({
      id: record.entity_id,
      organization_id: orgId,
      name: p.name || record.entity_name,
      sku: p.sku || null,
      unit_price_cents: p.unit_price_cents || 0,
      currency: p.currency || "USD",
      stock_quantity: p.stock_quantity || 0,
    });
  } else if (record.entity_type === "custom_record") {
    const cr = record.entity_data as any;
    await admin.from("custom_records").insert({
      id: record.entity_id,
      organization_id: orgId,
      object_id: cr.object_id,
      title: record.entity_name,
      values: cr.values || {},
    });
  }

  // Mark as restored
  await admin
    .from("crm_soft_deletes")
    .update({ restored_at: new Date().toISOString() })
    .eq("organization_id", orgId)
    .eq("id", deleteId);

  await audit({
    action: "crm_record.restored",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: record.entity_type,
    resourceId: record.entity_id,
    requestId: options?.requestId,
    metadata: { entity_name: record.entity_name },
  });

  return { success: true, restoredRecord: record };
}

export async function purgeDeletedRecord(orgId: string, deleteId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_soft_deletes")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", deleteId);

  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
}
