import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

/**
 * Basic RFC 4180 compliant CSV parser that supports quotes, line breaks inside quotes, and commas.
 */
export function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      row.push(currentToken.trim());
      currentToken = "";
      if (row.length > 0 && row.some((c) => c !== "")) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || row.length > 0) {
    row.push(currentToken.trim());
    if (row.some((c) => c !== "")) {
      lines.push(row);
    }
  }

  return lines;
}

export function formatCsv(rows: Array<Array<string | number | boolean | null | undefined>>): string {
  return rows
    .map((row) =>
      row
        .map((val) => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    )
    .join("\r\n");
}

export interface ImportOptions {
  entity: "contacts" | "leads" | "products";
  headers: string[];
  rows: string[][];
  fieldMapping: Record<string, string>; // e.g. { "Full Name": "name", "Phone": "phone_number" }
  userId?: string;
  requestId?: string;
}

/**
 * Imports tabular rows into the specified core CRM entity.
 */
export async function importRecords(orgId: string, options: ImportOptions) {
  const admin = createAdminClient();
  const { entity, headers, rows, fieldMapping } = options;

  let importedCount = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const recordObj: Record<string, any> = {};

    headers.forEach((h, colIdx) => {
      const targetField = fieldMapping[h];
      if (targetField && row[colIdx] !== undefined) {
        recordObj[targetField] = row[colIdx];
      }
    });

    try {
      if (entity === "contacts") {
        if (!recordObj.name && !recordObj.email && !recordObj.phone_number) {
          continue;
        }
        await admin.from("contacts").insert({
          organization_id: orgId,
          name: recordObj.name || "Novo Contato",
          email: recordObj.email?.toLowerCase().trim() || null,
          phone_number: recordObj.phone_number || null,
          source: "csv_import",
          created_by_user_id: options.userId || null,
        });
        importedCount++;
      } else if (entity === "products") {
        if (!recordObj.name) continue;
        const priceCents = Math.round(Number(recordObj.unit_price || recordObj.unit_price_cents || 0) * 100);
        await admin.from("crm_products").insert({
          organization_id: orgId,
          name: recordObj.name,
          sku: recordObj.sku || null,
          category: recordObj.category || null,
          unit_price_cents: priceCents,
          currency: recordObj.currency || "USD",
          stock_quantity: Number(recordObj.stock_quantity) || 0,
        });
        importedCount++;
      } else if (entity === "leads") {
        if (!recordObj.title) continue;
        const valCents = Math.round(Number(recordObj.value || recordObj.value_cents || 0) * 100);
        await admin.from("crm_leads").insert({
          organization_id: orgId,
          title: recordObj.title,
          description: recordObj.description || null,
          status: recordObj.status || "open",
          value_cents: valCents,
          currency: recordObj.currency || "USD",
          source: "csv_import",
        });
        importedCount++;
      }
    } catch (err: any) {
      errors.push({ row: i + 1, error: err.message });
    }
  }

  await audit({
    action: "crm.data_imported",
    organizationId: orgId,
    actorUserId: options.userId || null,
    resourceType: entity,
    requestId: options.requestId,
    metadata: {
      entity,
      imported_count: importedCount,
      total_rows: rows.length,
      errors_count: errors.length,
    },
  });

  return {
    success: true,
    importedCount,
    errors,
  };
}

/**
 * Exports records of a given entity into CSV format.
 */
export async function exportRecords(orgId: string, entity: "contacts" | "products" | "leads"): Promise<string> {
  const admin = createAdminClient();

  if (entity === "contacts") {
    const { data } = await admin
      .from("contacts")
      .select("name, email, phone_number, created_at")
      .eq("organization_id", orgId)
      .is("merged_at", null)
      .order("name", { ascending: true });

    const rows: Array<Array<string | number | boolean | null>> = [
      ["Name", "Email", "Phone", "Created At"],
      ...(data ?? []).map((c) => [c.name, c.email, c.phone_number, c.created_at]),
    ];
    return formatCsv(rows);
  }

  if (entity === "products") {
    const { data } = await admin
      .from("crm_products")
      .select("sku, name, category, unit_price_cents, currency, stock_quantity, is_active")
      .eq("organization_id", orgId)
      .order("name", { ascending: true });

    const rows: Array<Array<string | number | boolean | null>> = [
      ["SKU", "Name", "Category", "Price", "Currency", "Stock", "Active"],
      ...(data ?? []).map((p) => [
        p.sku,
        p.name,
        p.category,
        (p.unit_price_cents / 100).toFixed(2),
        p.currency,
        p.stock_quantity,
        p.is_active,
      ]),
    ];
    return formatCsv(rows);
  }

  if (entity === "leads") {
    const { data } = await admin
      .from("crm_leads")
      .select("title, status, value_cents, currency, source, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    const rows: Array<Array<string | number | boolean | null>> = [
      ["Title", "Status", "Value", "Currency", "Source", "Created At"],
      ...(data ?? []).map((l) => [
        l.title,
        l.status,
        (l.value_cents / 100).toFixed(2),
        l.currency,
        l.source,
        l.created_at,
      ]),
    ];
    return formatCsv(rows);
  }

  return "";
}
