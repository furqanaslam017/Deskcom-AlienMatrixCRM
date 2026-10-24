import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/audit";

export interface KnowledgeItem {
  id: string;
  organization_id: string;
  title: string;
  type: "doc" | "faq" | "url" | "policy";
  source_url: string | null;
  content: string;
  tags: string[];
  status: "ready" | "processing" | "failed";
  token_count: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Approximate ~4 characters per token
  return Math.ceil(text.length / 4);
}

export function calculateChunks(text: string, chunkSize = 500): number {
  if (!text) return 1;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / (chunkSize / 4)));
}

export async function listKnowledgeItems(
  supabase: SupabaseClient,
  organizationId: string,
  filterType?: string
): Promise<KnowledgeItem[]> {
  let query = supabase
    .from("crm_knowledge_items")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filterType && filterType !== "all") {
    query = query.eq("type", filterType);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list knowledge items: ${error.message}`);
  }

  return (data || []) as KnowledgeItem[];
}

export async function createKnowledgeItem(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    title: string;
    type?: KnowledgeItem["type"];
    source_url?: string;
    content: string;
    tags?: string[];
  },
  actorUserId?: string
): Promise<KnowledgeItem> {
  const tokenCount = estimateTokenCount(input.content);
  const chunkCount = calculateChunks(input.content);

  const { data, error } = await supabase
    .from("crm_knowledge_items")
    .insert({
      organization_id: organizationId,
      title: input.title,
      type: input.type || "doc",
      source_url: input.source_url || null,
      content: input.content,
      tags: input.tags || [],
      status: "ready",
      token_count: tokenCount,
      chunk_count: chunkCount,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create knowledge item: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_knowledge.created",
    resourceType: "crm_knowledge_items",
    resourceId: data.id,
    metadata: { title: data.title, type: data.type, tokens: tokenCount },
  });

  return data as KnowledgeItem;
}

export async function updateKnowledgeItem(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  input: Partial<{
    title: string;
    type: KnowledgeItem["type"];
    source_url: string;
    content: string;
    tags: string[];
    status: KnowledgeItem["status"];
  }>,
  actorUserId?: string
): Promise<KnowledgeItem> {
  const updates: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  if (input.content) {
    updates.token_count = estimateTokenCount(input.content);
    updates.chunk_count = calculateChunks(input.content);
  }

  const { data, error } = await supabase
    .from("crm_knowledge_items")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update knowledge item: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_knowledge.updated",
    resourceType: "crm_knowledge_items",
    resourceId: id,
    metadata: { title: data.title, updates: Object.keys(input) },
  });

  return data as KnowledgeItem;
}

export async function deleteKnowledgeItem(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  actorUserId?: string
): Promise<void> {
  const { error } = await supabase
    .from("crm_knowledge_items")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(`Failed to delete knowledge item: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_knowledge.deleted",
    resourceType: "crm_knowledge_items",
    resourceId: id,
    metadata: { deleted: true },
  });
}

export async function searchKnowledgeRAG(
  supabase: SupabaseClient,
  organizationId: string,
  query: string,
  limit = 3
): Promise<Array<{ id: string; title: string; content: string; score: number }>> {
  const items = await listKnowledgeItems(supabase, organizationId);
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  const scored = items.map((item) => {
    let score = 0;
    const hay = `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase();
    for (const term of terms) {
      if (hay.includes(term)) {
        score += 1;
      }
    }
    return {
      id: item.id,
      title: item.title,
      content: item.content.slice(0, 500),
      score,
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
