import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface DuplicateGroup {
  matchKey: string;
  matchType: "email" | "phone" | "name";
  records: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    createdAt: string;
    extra?: Record<string, unknown>;
  }>;
}

/**
 * Detects duplicate contacts in an organization based on identical email or phone number.
 */
export async function findDuplicateContacts(orgId: string): Promise<DuplicateGroup[]> {
  const admin = createAdminClient();

  const { data: contacts, error } = await admin
    .from("contacts")
    .select("id, name, email, phone_number, created_at")
    .eq("organization_id", orgId)
    .is("merged_at", null)
    .order("created_at", { ascending: true });

  if (error || !contacts) {
    logger.error("[alienmatrix] failed to scan duplicate contacts", { error });
    return [];
  }

  const byEmail: Record<string, typeof contacts> = {};
  const byPhone: Record<string, typeof contacts> = {};

  for (const c of contacts) {
    if (c.email && c.email.trim()) {
      const em = c.email.toLowerCase().trim();
      if (!byEmail[em]) byEmail[em] = [];
      byEmail[em].push(c);
    }

    if (c.phone_number && c.phone_number.trim()) {
      // Normalize to digits only for accurate matching
      const ph = c.phone_number.replace(/\D/g, "");
      if (ph.length >= 7) {
        if (!byPhone[ph]) byPhone[ph] = [];
        byPhone[ph].push(c);
      }
    }
  }

  const groups: DuplicateGroup[] = [];

  for (const [em, list] of Object.entries(byEmail)) {
    if (list.length > 1) {
      groups.push({
        matchKey: em,
        matchType: "email",
        records: list.map((item) => ({
          id: item.id,
          name: item.name || "Sem nome",
          email: item.email,
          phone: item.phone_number,
          createdAt: item.created_at,
        })),
      });
    }
  }

  for (const [ph, list] of Object.entries(byPhone)) {
    if (list.length > 1) {
      // Avoid duplicate group if same records already grouped by email
      const alreadyGrouped = groups.some(
        (g) => g.records.length === list.length && g.records.every((r) => list.some((l) => l.id === r.id))
      );
      if (!alreadyGrouped) {
        groups.push({
          matchKey: ph,
          matchType: "phone",
          records: list.map((item) => ({
            id: item.id,
            name: item.name || "Sem nome",
            email: item.email,
            phone: item.phone_number,
            createdAt: item.created_at,
          })),
        });
      }
    }
  }

  return groups;
}

/**
 * Merges one or more duplicate contacts into a primary contact.
 * Re-points all associated deals, tasks, invoices, and call logs to the primary contact,
 * then marks duplicates with is_merged_into.
 */
export async function mergeContacts(
  orgId: string,
  primaryId: string,
  duplicateIds: string[],
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();

  if (duplicateIds.length === 0) {
    return { success: true, count: 0 };
  }

  // 1. Verify primary exists
  const { data: primary } = await admin
    .from("contacts")
    .select("id, name, email, phone_number")
    .eq("organization_id", orgId)
    .eq("id", primaryId)
    .single();

  if (!primary) {
    throw new Error(`Primary contact not found: ${primaryId}`);
  }

  for (const dupId of duplicateIds) {
    if (dupId === primaryId) continue;

    // A. Re-point deals (crm_leads)
    await admin
      .from("crm_leads")
      .update({ contact_id: primaryId })
      .eq("organization_id", orgId)
      .eq("contact_id", dupId);

    // B. Re-point tasks (crm_tasks)
    await admin
      .from("crm_tasks")
      .update({ contact_id: primaryId })
      .eq("organization_id", orgId)
      .eq("contact_id", dupId);

    // C. Re-point invoices (crm_invoices)
    await admin
      .from("crm_invoices")
      .update({ contact_id: primaryId })
      .eq("organization_id", orgId)
      .eq("contact_id", dupId);

    // D. Re-point call logs (crm_call_logs)
    await admin
      .from("crm_call_logs")
      .update({ contact_id: primaryId })
      .eq("organization_id", orgId)
      .eq("contact_id", dupId);

    // E. Mark contact as merged
    await admin
      .from("contacts")
      .update({
        is_merged_into: primaryId,
        merged_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", dupId);
  }

  await audit({
    action: "crm.duplicates_merged",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "contacts",
    resourceId: primaryId,
    requestId: options?.requestId,
    metadata: {
      primary_id: primaryId,
      merged_ids: duplicateIds,
      count: duplicateIds.length,
    },
  });

  return { success: true, mergedCount: duplicateIds.length };
}
