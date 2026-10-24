import { z } from "zod";
import { tool } from "ai";
import { convertLead } from "./lead-conversion";
import { getProducts, createProduct } from "./products-service";
import { createInvoice, getInvoices } from "./invoices-service";
import { createCallLog } from "./calendar-service";
import { findDuplicateContacts } from "./duplicate-detection";

/**
 * AlienMatrix Phase 2 Core CRM Tools for AI Agent Engine
 * Enables agents to convert leads, search the product catalog,
 * draft quotes/invoices, log calls/meetings, and check for duplicates.
 */
export function createPhase2AgentTools(orgId: string, actorUserId: string) {
  return {
    alien_matrix_convert_lead: tool({
      description:
        "Converts a qualified sales lead into a verified Contact and creates a Deal in the pipeline. Use when a lead confirms interest or is ready to buy.",
      inputSchema: z.object({
        lead_id: z.string().describe("UUID of the lead in crm_leads"),
        contact_name: z.string().optional().describe("Customer's full name"),
        contact_email: z.string().optional().describe("Customer's email address"),
        contact_phone: z.string().optional().describe("Customer's phone number"),
        company_name: z.string().optional().describe("Company or organization name if B2B"),
        deal_title: z.string().optional().describe("Title for the deal (e.g. 'Software License - ACME Corp')"),
        deal_value_cents: z.number().optional().describe("Estimated deal value in cents (e.g. 50000 = $500.00)"),
        deal_currency: z.string().optional().default("USD").describe("Currency code (USD, BRL, EUR)"),
        notes: z.string().optional().describe("Key context and notes from the conversation"),
      }),
      execute: async (params) => {
        try {
          const result = await convertLead(orgId, {
            leadId: params.lead_id,
            contactName: params.contact_name,
            contactEmail: params.contact_email,
            contactPhone: params.contact_phone,
            companyName: params.company_name,
            dealTitle: params.deal_title,
            dealValueCents: params.deal_value_cents,
            dealCurrency: params.deal_currency,
            notes: params.notes,
            convertedByUserId: actorUserId,
          });
          return { success: true, result };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_search_products: tool({
      description:
        "Searches the organization's product/service catalog for pricing, SKU, description, and availability. Use when answering pricing questions or recommending items.",
      inputSchema: z.object({
        search: z.string().optional().describe("Name, SKU, or keyword to match"),
        category: z.string().optional().describe("Filter by product category"),
      }),
      execute: async (params) => {
        try {
          const products = await getProducts(orgId, {
            search: params.search,
            category: params.category,
            isActiveOnly: true,
          });
          return {
            success: true,
            products: products.map((p) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              category: p.category,
              unit_price: (p.unit_price_cents / 100).toFixed(2),
              currency: p.currency,
              description: p.description,
              stock_quantity: p.stock_quantity,
            })),
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_create_quote_or_invoice: tool({
      description:
        "Drafts a formal Quote (proposal) or Invoice with line items for a contact or deal.",
      inputSchema: z.object({
        kind: z.enum(["quote", "invoice", "proforma"]).default("quote").describe("Document type"),
        title: z.string().describe("Invoice or proposal title (e.g. 'Web Design Proposal - Q4')"),
        contact_id: z.string().optional().describe("Contact UUID"),
        lead_id: z.string().optional().describe("Deal/Lead UUID"),
        currency: z.string().default("USD").describe("Currency code (USD, BRL, EUR)"),
        notes: z.string().optional().describe("Terms, conditions, or validity period"),
        items: z
          .array(
            z.object({
              product_id: z.string().optional().describe("Optional product catalog UUID"),
              description: z.string().describe("Item description or service rendered"),
              quantity: z.number().default(1).describe("Quantity"),
              unit_price_cents: z.number().describe("Price per unit in cents (e.g. 15000 = $150.00)"),
              discount_cents: z.number().optional().default(0),
              tax_rate_percent: z.number().optional().default(0),
            })
          )
          .describe("List of line items"),
      }),
      execute: async (params) => {
        try {
          const invoice = await createInvoice(
            orgId,
            {
              kind: params.kind,
              title: params.title,
              contactId: params.contact_id,
              leadId: params.lead_id,
              currency: params.currency,
              notes: params.notes,
              items: params.items.map((it) => ({
                productId: it.product_id,
                description: it.description,
                quantity: it.quantity,
                unitPriceCents: it.unit_price_cents,
                discountCents: it.discount_cents,
                taxRatePercent: it.tax_rate_percent,
              })),
            },
            { userId: actorUserId }
          );
          return {
            success: true,
            invoice_number: invoice.invoice_number,
            kind: invoice.kind,
            total: (invoice.total_cents / 100).toFixed(2),
            currency: invoice.currency,
            status: invoice.status,
            id: invoice.id,
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_log_activity: tool({
      description:
        "Logs a customer phone call, WhatsApp call, meeting, or demo outcome into the activity timeline.",
      inputSchema: z.object({
        lead_id: z.string().optional().describe("Lead/Deal UUID"),
        contact_id: z.string().optional().describe("Contact UUID"),
        activity_type: z
          .enum(["call", "meeting", "demo", "video_call", "whatsapp_call"])
          .default("call")
          .describe("Type of activity"),
        direction: z.enum(["inbound", "outbound"]).default("outbound"),
        outcome: z
          .enum(["completed", "connected", "busy", "no_answer", "left_voicemail", "rescheduled", "cancelled"])
          .default("completed"),
        subject: z.string().describe("Brief headline (e.g. 'Product Demo Call - 30 min')"),
        notes: z.string().optional().describe("Summary of what was discussed and next steps"),
        duration_minutes: z.number().optional().default(0).describe("Duration in minutes"),
      }),
      execute: async (params) => {
        try {
          const log = await createCallLog(
            orgId,
            {
              leadId: params.lead_id,
              contactId: params.contact_id,
              activityType: params.activity_type,
              direction: params.direction,
              outcome: params.outcome,
              subject: params.subject,
              notes: params.notes,
              durationSeconds: (params.duration_minutes || 0) * 60,
            },
            { userId: actorUserId }
          );
          return { success: true, activity_id: log.id, subject: log.subject };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_check_duplicates: tool({
      description:
        "Scans for duplicate contacts or leads matching phone number or email to avoid duplicate data.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const groups = await findDuplicateContacts(orgId);
          return {
            success: true,
            duplicate_groups_found: groups.length,
            groups: groups.map((g) => ({
              match_key: g.matchKey,
              type: g.matchType,
              records: g.records.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone })),
            })),
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),
  };
}
