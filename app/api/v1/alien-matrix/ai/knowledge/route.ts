import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listKnowledgeItems,
  createKnowledgeItem,
  searchKnowledgeRAG,
} from "@/lib/alien-matrix/ai-knowledge-service";

const createKnowledgeSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["doc", "faq", "url", "policy"]).optional(),
  source_url: z.string().url().optional().or(z.literal("")),
  content: z.string().min(5),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const url = new URL(req.url);
  const query = url.searchParams.get("query");
  const filterType = url.searchParams.get("type") ?? undefined;

  try {
    const supabase = createAdminClient();

    if (query) {
      const ragResults = await searchKnowledgeRAG(supabase, org.orgId, query);
      return ok({ query, results: ragResults }, { requestId });
    }

    const items = await listKnowledgeItems(supabase, org.orgId, filterType);
    return ok(items, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createKnowledgeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid knowledge item", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const created = await createKnowledgeItem(
      supabase,
      org.orgId,
      {
        ...parsed.data,
        source_url: parsed.data.source_url || undefined,
      },
      user.id
    );

    return ok(created, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
