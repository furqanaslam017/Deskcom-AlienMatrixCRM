import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface SendMessageInput {
  conversationId: string;
  messageType?: "text" | "image" | "video" | "audio" | "document" | "location" | "contact" | "sticker" | "invoice" | "quote";
  content: string;
  mediaUrl?: string;
  mediaMetadata?: Record<string, any>;
  quotedMessageId?: string;
}

export interface InternalNoteInput {
  conversationId: string;
  content: string;
  mentionedUserIds?: string[];
}

export async function getConversations(
  orgId: string,
  filter?: {
    status?: string;
    assignedUserId?: string;
    numberId?: string;
    search?: string;
  }
) {
  const admin = createAdminClient();
  let query = admin
    .from("crm_whatsapp_conversations")
    .select(`
      *,
      number:crm_whatsapp_numbers(name, phone_number, provider),
      contact:contacts(id, name, email, phone_number, avatar_url),
      deal:crm_leads(id, title, value_cents, currency, status, stage_id)
    `)
    .eq("organization_id", orgId)
    .order("last_message_at", { ascending: false });

  if (filter?.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }
  if (filter?.numberId) {
    query = query.eq("whatsapp_number_id", filter.numberId);
  }
  if (filter?.assignedUserId) {
    query = query.eq("assigned_user_id", filter.assignedUserId);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("[alienmatrix] failed to get whatsapp conversations", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getConversationDetails(orgId: string, conversationId: string) {
  const admin = createAdminClient();

  const [convRes, msgsRes, notesRes] = await Promise.all([
    admin
      .from("crm_whatsapp_conversations")
      .select(`
        *,
        number:crm_whatsapp_numbers(name, phone_number, provider),
        contact:contacts(id, name, email, phone_number, avatar_url),
        deal:crm_leads(id, title, value_cents, currency, status, stage_id)
      `)
      .eq("organization_id", orgId)
      .eq("id", conversationId)
      .single(),
    admin
      .from("crm_whatsapp_messages")
      .select("*")
      .eq("organization_id", orgId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    admin
      .from("crm_whatsapp_internal_notes")
      .select("*")
      .eq("organization_id", orgId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (convRes.error || !convRes.data) {
    throw new Error("Conversation not found");
  }

  return {
    conversation: convRes.data,
    messages: msgsRes.data ?? [],
    internalNotes: notesRes.data ?? [],
  };
}

export async function sendWhatsAppMessage(
  orgId: string,
  input: SendMessageInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();

  // 1. Insert message
  const { data: msg, error: msgError } = await admin
    .from("crm_whatsapp_messages")
    .insert({
      organization_id: orgId,
      conversation_id: input.conversationId,
      sender_type: "agent",
      sender_id: options?.userId || null,
      direction: "outbound",
      message_type: input.messageType || "text",
      content: input.content,
      media_url: input.mediaUrl || null,
      media_metadata: input.mediaMetadata || {},
      quoted_message_id: input.quotedMessageId || null,
      delivery_status: "delivered",
    })
    .select("*")
    .single();

  if (msgError || !msg) {
    throw new Error(`Failed to send message: ${msgError?.message}`);
  }

  // 2. Update conversation last message
  await admin
    .from("crm_whatsapp_conversations")
    .update({
      last_message_text: input.content.slice(0, 100),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.conversationId);

  await audit({
    action: "crm_whatsapp_message.sent",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_whatsapp_messages",
    resourceId: msg.id,
    requestId: options?.requestId,
    metadata: { type: msg.message_type, conversationId: input.conversationId },
  });

  return msg;
}

export async function addInternalNote(
  orgId: string,
  input: InternalNoteInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_whatsapp_internal_notes")
    .insert({
      organization_id: orgId,
      conversation_id: input.conversationId,
      author_user_id: options?.userId || null,
      content: input.content,
      mentioned_user_ids: input.mentionedUserIds || [],
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to add note: ${error?.message}`);
  }

  await audit({
    action: "crm_whatsapp_note.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_whatsapp_internal_notes",
    resourceId: data.id,
    requestId: options?.requestId,
  });

  return data;
}

export async function updateConversation(
  orgId: string,
  conversationId: string,
  updates: {
    assignedUserId?: string | null;
    status?: "open" | "pending" | "snoozed" | "closed";
    priority?: "urgent" | "high" | "normal" | "low";
    labels?: string[];
    dealId?: string | null;
    snoozedUntil?: string | null;
  },
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };

  if (updates.assignedUserId !== undefined) payload.assigned_user_id = updates.assignedUserId;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.labels !== undefined) payload.labels = updates.labels;
  if (updates.dealId !== undefined) payload.deal_id = updates.dealId;
  if (updates.snoozedUntil !== undefined) payload.snoozed_until = updates.snoozedUntil;

  const { data, error } = await admin
    .from("crm_whatsapp_conversations")
    .update(payload)
    .eq("organization_id", orgId)
    .eq("id", conversationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update conversation: ${error?.message}`);
  }

  if (updates.status) {
    await audit({
      action: "crm_whatsapp_conversation.status_changed",
      organizationId: orgId,
      actorUserId: options?.userId || null,
      resourceType: "crm_whatsapp_conversations",
      resourceId: conversationId,
      requestId: options?.requestId,
      metadata: { newStatus: updates.status },
    });
  }

  return data;
}

export async function addMessageReaction(
  orgId: string,
  messageId: string,
  emoji: string,
  sender: string = "agent"
) {
  const admin = createAdminClient();
  const { data: msg } = await admin
    .from("crm_whatsapp_messages")
    .select("reactions")
    .eq("organization_id", orgId)
    .eq("id", messageId)
    .single();

  const currentReactions = Array.isArray(msg?.reactions) ? msg.reactions : [];
  const updatedReactions = [...currentReactions, { emoji, sender, timestamp: new Date().toISOString() }];

  const { data, error } = await admin
    .from("crm_whatsapp_messages")
    .update({ reactions: updatedReactions })
    .eq("id", messageId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to add reaction");
  }

  return data;
}
