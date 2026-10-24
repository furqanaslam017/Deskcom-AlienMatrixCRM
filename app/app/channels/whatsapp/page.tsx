import type { Metadata } from "next";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WhatsAppFlagshipViewClient } from "@/components/alien-matrix/WhatsAppFlagshipViewClient";
import { getTenantGuardrails } from "@/lib/alien-matrix/tenant-guardrails-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "WhatsApp Flagship & Shared Inbox | CRM" };

export default async function WhatsAppFlagshipPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);

  if (!activeOrg) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Nenhuma organização ativa selecionada.
      </div>
    );
  }

  const admin = createAdminClient();
  const orgId = activeOrg.orgId;

  // 1. WhatsApp Numbers
  const { data: numbers } = await admin
    .from("crm_whatsapp_numbers")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  // 2. Shared Inbox Conversations
  const { data: conversations } = await admin
    .from("crm_whatsapp_conversations")
    .select(`
      *,
      number:crm_whatsapp_numbers(name, phone_number, provider),
      contact:contacts(id, name, email, phone_number, avatar_url),
      deal:crm_leads(id, title, value_cents, currency, status, stage_id)
    `)
    .eq("organization_id", orgId)
    .order("last_message_at", { ascending: false });

  // 3. Broadcasts
  const { data: broadcasts } = await admin
    .from("crm_whatsapp_broadcasts")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  // 4. Chatbots
  const { data: chatbots } = await admin
    .from("crm_whatsapp_chatbots")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  // 5. Links
  const { data: links } = await admin
    .from("crm_whatsapp_links")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  // 6. Guardrails
  const guardrails = await getTenantGuardrails(orgId);

  return (
    <WhatsAppFlagshipViewClient
      initialNumbers={numbers ?? []}
      initialConversations={conversations ?? []}
      initialBroadcasts={broadcasts ?? []}
      initialChatbots={chatbots ?? []}
      initialLinks={links ?? []}
      initialGuardrails={guardrails}
    />
  );
}
