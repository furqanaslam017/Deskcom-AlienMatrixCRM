import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface InvoiceItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents?: number;
  taxRatePercent?: number;
  position?: number;
}

export interface CreateInvoiceInput {
  kind?: "invoice" | "quote" | "proforma";
  title: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  paymentInstructions?: string;
  paymentUrl?: string;
  items: InvoiceItemInput[];
}

export interface InvoiceFilterOptions {
  kind?: "invoice" | "quote" | "proforma";
  status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  contactId?: string;
  leadId?: string;
  search?: string;
  limit?: number;
}

/**
 * Lists invoices / quotes with their item counts and customer info.
 */
export async function getInvoices(orgId: string, options?: InvoiceFilterOptions) {
  const admin = createAdminClient();
  let query = admin
    .from("crm_invoices")
    .select(`
      *,
      contact:contacts(id, name, email, phone_number),
      company:companies(id, trade_name, legal_name),
      lead:crm_leads(id, title),
      items:crm_invoice_items(*)
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (options?.kind) {
    query = query.eq("kind", options.kind);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.contactId) {
    query = query.eq("contact_id", options.contactId);
  }
  if (options?.leadId) {
    query = query.eq("lead_id", options.leadId);
  }
  if (options?.search) {
    query = query.or(`invoice_number.ilike.%${options.search}%,title.ilike.%${options.search}%`);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("[alienmatrix] failed to get invoices", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Gets a single invoice by ID with items, contact, and company details.
 */
export async function getInvoiceById(orgId: string, invoiceId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_invoices")
    .select(`
      *,
      contact:contacts(*),
      company:companies(*),
      lead:crm_leads(*),
      items:crm_invoice_items(*)
    `)
    .eq("organization_id", orgId)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }
  return data;
}

/**
 * Creates a new Quote, Proforma, or Invoice with items and calculated totals.
 */
export async function createInvoice(
  orgId: string,
  input: CreateInvoiceInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const kind = input.kind || "invoice";

  // Generate sequential number
  const prefix = kind === "quote" ? "QTE" : kind === "proforma" ? "PRF" : "INV";
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `${prefix}-${year}-${randomSuffix}`;

  // Compute totals across all items
  let subtotalCents = 0;
  let totalDiscountCents = 0;
  let totalTaxCents = 0;

  const preparedItems = input.items.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPriceCents) || 0;
    const discount = Number(item.discountCents) || 0;
    const taxRate = Number(item.taxRatePercent) || 0;

    const lineBase = Math.round(qty * unitPrice);
    const lineDiscounted = Math.max(0, lineBase - discount);
    const lineTax = Math.round((lineDiscounted * taxRate) / 100);
    const lineTotal = lineDiscounted + lineTax;

    subtotalCents += lineBase;
    totalDiscountCents += discount;
    totalTaxCents += lineTax;

    return {
      product_id: item.productId || null,
      description: item.description,
      quantity: qty,
      unit_price_cents: unitPrice,
      discount_cents: discount,
      tax_rate_percent: taxRate,
      total_cents: lineTotal,
      position: item.position ?? idx,
    };
  });

  const totalCents = Math.max(0, subtotalCents - totalDiscountCents + totalTaxCents);

  // 1. Insert invoice header
  const { data: invoice, error: invError } = await admin
    .from("crm_invoices")
    .insert({
      organization_id: orgId,
      invoice_number: invoiceNumber,
      kind: kind,
      status: "draft",
      lead_id: input.leadId || null,
      contact_id: input.contactId || null,
      company_id: input.companyId || null,
      title: input.title,
      subtotal_cents: subtotalCents,
      discount_cents: totalDiscountCents,
      tax_cents: totalTaxCents,
      total_cents: totalCents,
      currency: input.currency || "USD",
      issue_date: input.issueDate || new Date().toISOString().split("T")[0],
      due_date: input.dueDate || null,
      notes: input.notes || null,
      payment_instructions: input.paymentInstructions || null,
      payment_url: input.paymentUrl || null,
      created_by_user_id: options?.userId || null,
    })
    .select("*")
    .single();

  if (invError || !invoice) {
    logger.error("[alienmatrix] failed to create invoice header", { error: invError });
    throw new Error(`Failed to create invoice: ${invError?.message}`);
  }

  // 2. Insert items
  if (preparedItems.length > 0) {
    const itemsToInsert = preparedItems.map((pi) => ({
      ...pi,
      organization_id: orgId,
      invoice_id: invoice.id,
    }));

    const { error: itemsError } = await admin
      .from("crm_invoice_items")
      .insert(itemsToInsert);

    if (itemsError) {
      logger.error("[alienmatrix] failed to insert invoice items", { error: itemsError });
    }
  }

  // 3. Fire audit log
  await audit({
    action: "crm_invoice.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_invoices",
    resourceId: invoice.id,
    requestId: options?.requestId,
    metadata: {
      number: invoiceNumber,
      kind: kind,
      total_cents: totalCents,
    },
  });

  return invoice;
}

/**
 * Updates invoice status (e.g. sent, paid, overdue, cancelled).
 */
export async function updateInvoiceStatus(
  orgId: string,
  invoiceId: string,
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled",
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "paid") {
    updatePayload.paid_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from("crm_invoices")
    .update(updatePayload)
    .eq("organization_id", orgId)
    .eq("id", invoiceId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update invoice status: ${error?.message}`);
  }

  await audit({
    action: status === "sent" ? "crm_invoice.sent" : "crm_invoice.updated",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_invoices",
    resourceId: invoiceId,
    requestId: options?.requestId,
    metadata: { new_status: status },
  });

  return data;
}

/**
 * Renders an executive, printable HTML document for an invoice or quote.
 * Includes clean typography, responsive layout, print-specific CSS, and PDF-friendly margins.
 */
export function renderInvoiceHtml(
  invoice: any,
  items: any[],
  branding?: { companyName?: string; logoUrl?: string; address?: string; email?: string }
): string {
  const formatMoney = (cents: number, cur: string) => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: cur || "USD",
    });
  };

  const clientName =
    invoice.contact?.name ||
    invoice.company?.trade_name ||
    invoice.company?.legal_name ||
    "Valued Customer";
  const clientEmail = invoice.contact?.email || invoice.company?.email || "";
  const clientPhone = invoice.contact?.phone_number || invoice.company?.phone || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${invoice.kind.toUpperCase()}: ${invoice.invoice_number}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 30px;
      line-height: 1.5;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 900;
      text-transform: uppercase;
      color: #3b82f6;
      text-align: right;
      letter-spacing: 1px;
    }
    .invoice-meta {
      text-align: right;
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 35px;
    }
    .party-box {
      width: 48%;
    }
    .party-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .party-name {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .party-detail {
      font-size: 13px;
      color: #475569;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 14px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .text-right { text-align: right; }
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 35px;
    }
    .totals-table {
      width: 320px;
    }
    .totals-table tr td {
      padding: 6px 10px;
      border: none;
    }
    .totals-table tr.grand-total td {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      padding-top: 12px;
    }
    .notes-box {
      background: #f8fafc;
      border-radius: 8px;
      padding: 18px;
      border: 1px solid #e2e8f0;
      font-size: 13px;
      color: #475569;
      margin-top: 20px;
    }
    .notes-title {
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-paid { background: #dcfce7; color: #15803d; }
    .status-draft { background: #f1f5f9; color: #475569; }
    .status-sent { background: #dbeafe; color: #1d4ed8; }
    .status-overdue { background: #fee2e2; color: #b91c1c; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; padding: 10px 18px; border-radius: 6px; font-weight: 600; border: none; cursor: pointer;">
      🖨️ Print or Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="brand-title">${branding?.companyName || "AlienMatrix CRM"}</div>
      <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
        ${branding?.address || "Enterprise Sales Division"}<br/>
        ${branding?.email || "billing@alienmatrix.io"}
      </div>
    </div>
    <div>
      <div class="invoice-title">${invoice.kind}</div>
      <div class="invoice-meta">
        <strong>${invoice.invoice_number}</strong><br/>
        Date: ${invoice.issue_date}<br/>
        ${invoice.due_date ? `Due: ${invoice.due_date}<br/>` : ""}
        <span class="status-badge status-${invoice.status}">${invoice.status}</span>
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <div class="party-label">Billed To</div>
      <div class="party-name">${clientName}</div>
      ${clientEmail ? `<div class="party-detail">${clientEmail}</div>` : ""}
      ${clientPhone ? `<div class="party-detail">${clientPhone}</div>` : ""}
    </div>
    <div class="party-box" style="text-align: right;">
      <div class="party-label">Subject / Title</div>
      <div class="party-name">${invoice.title}</div>
      ${invoice.lead ? `<div class="party-detail">Ref Deal: ${invoice.lead.title}</div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td>
            <strong>${item.description}</strong>
          </td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatMoney(item.unit_price_cents, invoice.currency)}</td>
          <td class="text-right">${formatMoney(item.total_cents, invoice.currency)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals-wrap">
    <table class="totals-table">
      <tr>
        <td style="color: #64748b;">Subtotal:</td>
        <td class="text-right">${formatMoney(invoice.subtotal_cents, invoice.currency)}</td>
      </tr>
      ${
        invoice.discount_cents > 0
          ? `<tr>
              <td style="color: #64748b;">Discount:</td>
              <td class="text-right" style="color: #15803d;">-${formatMoney(invoice.discount_cents, invoice.currency)}</td>
            </tr>`
          : ""
      }
      ${
        invoice.tax_cents > 0
          ? `<tr>
              <td style="color: #64748b;">Tax:</td>
              <td class="text-right">${formatMoney(invoice.tax_cents, invoice.currency)}</td>
            </tr>`
          : ""
      }
      <tr class="grand-total">
        <td>Total:</td>
        <td class="text-right">${formatMoney(invoice.total_cents, invoice.currency)}</td>
      </tr>
    </table>
  </div>

  ${
    invoice.payment_instructions
      ? `<div class="notes-box">
          <div class="notes-title">Payment Instructions</div>
          <div>${invoice.payment_instructions}</div>
          ${
            invoice.payment_url
              ? `<div style="margin-top: 8px;"><a href="${invoice.payment_url}" target="_blank" style="color: #2563eb; font-weight: 600;">Click here to pay online &rarr;</a></div>`
              : ""
          }
        </div>`
      : ""
  }

  ${
    invoice.notes
      ? `<div class="notes-box" style="margin-top: 15px;">
          <div class="notes-title">Notes & Terms</div>
          <div>${invoice.notes}</div>
        </div>`
      : ""
  }
</body>
</html>`;
}
