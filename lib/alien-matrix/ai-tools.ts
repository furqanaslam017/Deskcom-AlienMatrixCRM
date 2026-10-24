import { z } from "zod";
import { tool } from "ai";
import {
  getCustomObjects,
  getCustomObjectBySlug,
  getCustomRecords,
  getCustomRecordById,
  createCustomRecord,
  updateCustomRecord,
} from "./service";

/**
 * AlienMatrix Custom Objects Tools for AI Agent Engine
 * Enables agents to discover, query, create, and update records
 * in any industry's custom object schema (Real Estate, Clinic, School, etc.).
 */

export function createAlienMatrixAgentTools(orgId: string, actorUserId: string) {
  return {
    alien_matrix_list_objects: tool({
      description:
        "Lists all custom objects available in this CRM organization (e.g., properties, students, patients, projects, deals). Use this to see what entities exist.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const objects = await getCustomObjects(orgId);
          return {
            success: true,
            objects: objects.map((o) => ({
              slug: o.slug,
              name: o.name,
              singular_name: o.singular_name,
              plural_name: o.plural_name,
              description: o.description,
              records_count: o.records_count,
            })),
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_search_records: tool({
      description:
        "Searches records within a custom object by query text or filters (e.g. search available villas in 'properties', find active students in 'students', look up a patient in 'patients').",
      inputSchema: z.object({
        object_slug: z.string().describe("The slug of the custom object (e.g., 'properties', 'students', 'patients')"),
        query: z.string().optional().describe("Search query matching title or primary fields"),
        limit: z.number().optional().default(10).describe("Max records to return (default 10)"),
      }),
      execute: async ({ object_slug, query, limit }) => {
        try {
          const object = await getCustomObjectBySlug(orgId, object_slug);
          if (!object) return { success: false, error: `Object '${object_slug}' not found.` };

          const result = await getCustomRecords(orgId, object.id, {
            search: query,
            limit: limit || 10,
          });

          return {
            success: true,
            object: { name: object.name, slug: object.slug },
            total: result.total,
            records: result.records.map((r) => ({
              id: r.id,
              title: r.title,
              values: r.values,
              created_at: r.created_at,
            })),
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_get_record: tool({
      description:
        "Retrieves a single record by its ID with all its custom fields and attributes.",
      inputSchema: z.object({
        record_id: z.string().describe("UUID of the custom record to retrieve"),
      }),
      execute: async ({ record_id }) => {
        try {
          const record = await getCustomRecordById(orgId, record_id);
          if (!record) return { success: false, error: "Record not found." };
          return { success: true, record };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_create_record: tool({
      description:
        "Creates a new record for a custom object (e.g., register a new patient, record an apartment inquiry, add a property viewing).",
      inputSchema: z.object({
        object_slug: z.string().describe("The slug of the custom object (e.g., 'properties', 'patients', 'students')"),
        title: z.string().describe("The title or primary name of the record"),
        values: z.record(z.string(), z.unknown()).describe("Key-value dictionary of custom fields (e.g. { price: 500000, status: 'available' })"),
      }),
      execute: async ({ object_slug, title, values }) => {
        try {
          const object = await getCustomObjectBySlug(orgId, object_slug);
          if (!object) return { success: false, error: `Object '${object_slug}' not found.` };

          const record = await createCustomRecord(orgId, actorUserId, object.id, {
            title,
            values,
          });

          return {
            success: true,
            record_id: record.id,
            title: record.title,
            message: `Created ${object.singular_name} '${record.title}' successfully.`,
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_update_record: tool({
      description:
        "Updates custom fields on an existing record (e.g., change patient status, update property offer, set course enrollment).",
      inputSchema: z.object({
        record_id: z.string().describe("UUID of the record to update"),
        title: z.string().optional().describe("Optional new title"),
        values: z.record(z.string(), z.unknown()).describe("Dictionary of fields to update"),
      }),
      execute: async ({ record_id, title, values }) => {
        try {
          const updated = await updateCustomRecord(orgId, actorUserId, record_id, {
            title,
            values,
          });

          return {
            success: true,
            record_id: updated.id,
            title: updated.title,
            message: `Record '${updated.title}' updated successfully.`,
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_move_deal: tool({
      description:
        "Moves a deal to a new stage or updates its value and status (e.g. advance deal to 'Negotiation', mark as 'won' or 'lost').",
      inputSchema: z.object({
        deal_id: z.string().describe("UUID of the deal (crm_leads table)"),
        stage_id: z.string().optional().describe("Optional target stage UUID"),
        status: z.enum(["open", "won", "lost"]).optional().describe("Status of the deal"),
        value_cents: z.number().optional().describe("Monetary value in cents"),
      }),
      execute: async ({ deal_id, stage_id, status, value_cents }) => {
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const admin = createAdminClient();
          const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (stage_id) updates.stage_id = stage_id;
          if (status) updates.status = status;
          if (value_cents !== undefined) updates.value_cents = value_cents;

          const { data, error } = await admin
            .from("crm_leads")
            .update(updates)
            .eq("id", deal_id)
            .eq("organization_id", orgId)
            .select()
            .single();

          if (error) throw error;
          return { success: true, deal: data, message: `Deal ${deal_id} updated.` };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_create_task: tool({
      description:
        "Creates a reminder or follow-up task associated with a contact or deal.",
      inputSchema: z.object({
        title: z.string().describe("Title of the task"),
        description: z.string().optional().describe("Detailed notes"),
        due_date: z.string().optional().describe("ISO date string for due date"),
        priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
        lead_id: z.string().optional().describe("UUID of the associated deal"),
        contact_id: z.string().optional().describe("UUID of the associated contact"),
      }),
      execute: async ({ title, description, due_date, priority, lead_id, contact_id }) => {
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const admin = createAdminClient();
          const { data, error } = await admin
            .from("crm_tasks")
            .insert({
              organization_id: orgId,
              title,
              description: description || null,
              due_date: due_date || new Date(Date.now() + 86400000).toISOString(),
              priority: priority || "medium",
              status: "pending",
              lead_id: lead_id || null,
              contact_id: contact_id || null,
            })
            .select()
            .single();

          if (error) throw error;
          return { success: true, task: data, message: `Task '${title}' created.` };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_draft_quote: tool({
      description:
        "Drafts a formal quote or invoice with line items for a client.",
      inputSchema: z.object({
        title: z.string().describe("Title or subject of the quote/invoice"),
        contact_id: z.string().optional().describe("Contact UUID"),
        lead_id: z.string().optional().describe("Deal UUID"),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().default(1),
            unit_price_cents: z.number(),
          })
        ),
        notes: z.string().optional().describe("Terms or payment conditions"),
      }),
      execute: async ({ title, contact_id, lead_id, items, notes }) => {
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const admin = createAdminClient();
          const totalCents = items.reduce(
            (sum, it) => sum + it.quantity * it.unit_price_cents,
            0
          );

          const { data, error } = await admin
            .from("crm_invoices")
            .insert({
              organization_id: orgId,
              type: "quote",
              title,
              contact_id: contact_id || null,
              lead_id: lead_id || null,
              items,
              subtotal_cents: totalCents,
              total_cents: totalCents,
              status: "draft",
              notes: notes || "Proposta gerada automaticamente pelo agente de IA",
            })
            .select()
            .single();

          if (error) throw error;
          return {
            success: true,
            quote: data,
            message: `Draft quote '${title}' created with total ${totalCents / 100} BRL.`,
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),

    alien_matrix_book_meeting: tool({
      description:
        "Schedules an appointment, demo, or meeting for a contact or deal.",
      inputSchema: z.object({
        title: z.string().describe("Meeting title (e.g. 'Demonstração de Produto')"),
        start_time: z.string().describe("ISO datetime string for start time"),
        end_time: z.string().describe("ISO datetime string for end time"),
        contact_id: z.string().optional().describe("Contact UUID"),
        lead_id: z.string().optional().describe("Deal UUID"),
        meeting_url: z.string().optional().describe("Link for video call"),
      }),
      execute: async ({ title, start_time, end_time, contact_id, lead_id, meeting_url }) => {
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const admin = createAdminClient();
          const { data, error } = await admin
            .from("crm_tasks")
            .insert({
              organization_id: orgId,
              title: `Reunião: ${title}`,
              description: `Horário: ${start_time} - ${end_time}. Link: ${meeting_url || "A definir"}`,
              due_date: start_time,
              priority: "high",
              status: "pending",
              contact_id: contact_id || null,
              lead_id: lead_id || null,
            })
            .select()
            .single();

          if (error) throw error;
          return {
            success: true,
            meeting: data,
            message: `Meeting '${title}' booked for ${start_time}.`,
          };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
    }),
  };
}
