import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import type {
  CustomObject,
  CustomField,
  CustomRecord,
  CustomObjectRelation,
  CustomView,
  CustomViewConfig,
  SelectOption,
} from "./types";
import { BUILT_IN_OBJECTS, INDUSTRY_TEMPLATES } from "./templates";

/**
 * Service Layer for AlienMatrix Custom Objects
 */

async function getDbClient() {
  try {
    return await createClient();
  } catch {
    return createAdminClient();
  }
}

// ==========================================
// 1. OBJECTS
// ==========================================

export async function getCustomObjects(orgId: string): Promise<CustomObject[]> {
  const supabase = await getDbClient();
  const { data: objects, error } = await supabase
    .from("custom_objects")
    .select("*, custom_fields!custom_fields_object_id_fkey(count), custom_records(count)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch custom objects: ${error.message}`);

  return (objects || []).map((obj: Record<string, unknown>) => {
    const fieldsCount = Array.isArray(obj.custom_fields) && obj.custom_fields[0]
      ? (obj.custom_fields[0] as { count?: number }).count ?? 0
      : 0;
    const recordsCount = Array.isArray(obj.custom_records) && obj.custom_records[0]
      ? (obj.custom_records[0] as { count?: number }).count ?? 0
      : 0;

    return {
      ...obj,
      fields_count: fieldsCount,
      records_count: recordsCount,
    } as unknown as CustomObject;
  });
}

export async function getCustomObjectBySlug(
  orgId: string,
  slugOrId: string
): Promise<(CustomObject & { fields: CustomField[] }) | null> {
  const supabase = await getDbClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  let query = supabase.from("custom_objects").select("*").eq("organization_id", orgId);
  if (isUuid) {
    query = query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
  } else {
    query = query.eq("slug", slugOrId);
  }

  const { data: object, error } = await query.maybeSingle();

  if (error || !object) return null;

  const { data: fields } = await supabase
    .from("custom_fields")
    .select("*")
    .eq("organization_id", orgId)
    .eq("object_id", object.id)
    .order("position", { ascending: true });

  return {
    ...object,
    fields: (fields || []) as CustomField[],
  };
}

export async function createCustomObject(
  orgId: string,
  userId: string,
  input: {
    slug: string;
    name: string;
    singular_name: string;
    plural_name: string;
    description?: string;
    icon?: string;
    primary_field_slug?: string;
  }
): Promise<CustomObject> {
  const supabase = await getDbClient();
  const primaryFieldSlug = input.primary_field_slug || "name";

  const { data: object, error } = await supabase
    .from("custom_objects")
    .insert({
      organization_id: orgId,
      slug: input.slug.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_"),
      name: input.name,
      singular_name: input.singular_name,
      plural_name: input.plural_name,
      description: input.description || null,
      icon: input.icon || "Cube",
      primary_field_slug: primaryFieldSlug,
    })
    .select("*")
    .single();

  if (error || !object) throw new Error(error?.message || "Failed to create custom object");

  // Create primary field
  await supabase.from("custom_fields").insert({
    organization_id: orgId,
    object_id: object.id,
    slug: primaryFieldSlug,
    label: `${input.singular_name} Name`,
    field_type: "text",
    is_required: true,
    position: 1,
  });

  // Default table view
  await supabase.from("custom_views").insert({
    organization_id: orgId,
    object_id: object.id,
    name: "All " + input.plural_name,
    view_type: "table",
    config: { visible_columns: [primaryFieldSlug] },
    is_default: true,
  });

  await audit({
    action: "custom_object.created",
    organizationId: orgId,
    actorUserId: userId,
    resourceType: "custom_objects",
    resourceId: object.id,
    metadata: { slug: object.slug, name: object.name },
  });

  return object as CustomObject;
}

// ==========================================
// 2. FIELDS
// ==========================================

export async function getCustomFields(orgId: string, objectId: string): Promise<CustomField[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("custom_fields")
    .select("*")
    .eq("organization_id", orgId)
    .eq("object_id", objectId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as CustomField[];
}

export async function createCustomField(
  orgId: string,
  userId: string,
  objectId: string,
  input: {
    slug: string;
    label: string;
    field_type: CustomField["field_type"];
    description?: string;
    is_required?: boolean;
    is_unique?: boolean;
    options?: SelectOption[];
    relation_target_object_id?: string;
    position?: number;
  }
): Promise<CustomField> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("custom_fields")
    .insert({
      organization_id: orgId,
      object_id: objectId,
      slug: input.slug.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_"),
      label: input.label,
      field_type: input.field_type,
      description: input.description || null,
      is_required: input.is_required ?? false,
      is_unique: input.is_unique ?? false,
      options: input.options || [],
      relation_target_object_id: input.relation_target_object_id || null,
      position: input.position ?? 99,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to create field");

  await audit({
    action: "custom_field.created",
    organizationId: orgId,
    actorUserId: userId,
    resourceType: "custom_fields",
    resourceId: data.id,
    metadata: { object_id: objectId, slug: data.slug, label: data.label },
  });

  return data as CustomField;
}

// ==========================================
// 3. RECORDS
// ==========================================

export async function getCustomRecords(
  orgId: string,
  objectId: string,
  options?: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
): Promise<{ records: CustomRecord[]; total: number }> {
  const supabase = await getDbClient();
  let query = supabase
    .from("custom_records")
    .select("*", { count: "exact" })
    .eq("organization_id", orgId)
    .eq("object_id", objectId);

  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`);
  }

  const sortCol = options?.sortBy || "created_at";
  const ascending = options?.sortOrder === "asc";
  query = query.order(sortCol, { ascending });

  if (options?.limit) {
    const from = options.offset || 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    records: (data || []) as CustomRecord[],
    total: count || 0,
  };
}

export async function getCustomRecordById(
  orgId: string,
  recordId: string
): Promise<CustomRecord | null> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("custom_records")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", recordId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CustomRecord;
}

export async function createCustomRecord(
  orgId: string,
  userId: string,
  objectId: string,
  input: {
    title: string;
    values: Record<string, unknown>;
  }
): Promise<CustomRecord> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("custom_records")
    .insert({
      organization_id: orgId,
      object_id: objectId,
      title: input.title,
      values: input.values,
      created_by_user_id: userId,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to create custom record");

  await audit({
    action: "custom_record.created",
    organizationId: orgId,
    actorUserId: userId,
    resourceType: "custom_records",
    resourceId: data.id,
    metadata: { object_id: objectId, title: data.title },
  });

  return data as CustomRecord;
}

export async function updateCustomRecord(
  orgId: string,
  userId: string,
  recordId: string,
  input: {
    title?: string;
    values?: Record<string, unknown>;
  }
): Promise<CustomRecord> {
  const supabase = await getDbClient();
  const current = await getCustomRecordById(orgId, recordId);
  if (!current) throw new Error("Record not found");

  const newValues = input.values ? { ...current.values, ...input.values } : current.values;
  const newTitle = input.title ?? current.title;

  const { data, error } = await supabase
    .from("custom_records")
    .update({
      title: newTitle,
      values: newValues,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", orgId)
    .eq("id", recordId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to update record");

  await audit({
    action: "custom_record.updated",
    organizationId: orgId,
    actorUserId: userId,
    resourceType: "custom_records",
    resourceId: recordId,
    metadata: { object_id: data.object_id, title: data.title },
  });

  return data as CustomRecord;
}

export async function deleteCustomRecord(
  orgId: string,
  userId: string,
  recordId: string
): Promise<void> {
  const supabase = await getDbClient();
  const { error } = await supabase
    .from("custom_records")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", recordId);

  if (error) throw new Error(error.message);

  await audit({
    action: "custom_record.deleted",
    organizationId: orgId,
    actorUserId: userId,
    resourceType: "custom_records",
    resourceId: recordId,
  });
}

// ==========================================
// 4. VIEWS
// ==========================================

export async function getCustomViews(orgId: string, objectId: string): Promise<CustomView[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("custom_views")
    .select("*")
    .eq("organization_id", orgId)
    .eq("object_id", objectId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as CustomView[];
}

export async function saveCustomView(
  orgId: string,
  userId: string,
  objectId: string,
  input: {
    id?: string;
    name: string;
    view_type: CustomView["view_type"];
    config: CustomViewConfig;
    is_default?: boolean;
  }
): Promise<CustomView> {
  const supabase = await getDbClient();
  if (input.id) {
    const { data, error } = await supabase
      .from("custom_views")
      .update({
        name: input.name,
        view_type: input.view_type,
        config: input.config,
        is_default: input.is_default ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", input.id)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to update view");
    return data as CustomView;
  }

  const { data, error } = await supabase
    .from("custom_views")
    .insert({
      organization_id: orgId,
      object_id: objectId,
      user_id: userId,
      name: input.name,
      view_type: input.view_type,
      config: input.config,
      is_default: input.is_default ?? false,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to create view");
  return data as CustomView;
}

// ==========================================
// 5. TEMPLATES & BUILT-INS
// ==========================================

export async function ensureBuiltInObjects(orgId: string): Promise<void> {
  const admin = createAdminClient();
  for (const item of BUILT_IN_OBJECTS) {
    const { data: existing } = await admin
      .from("custom_objects")
      .select("id")
      .eq("organization_id", orgId)
      .eq("slug", item.slug)
      .maybeSingle();

    let objectId = existing?.id;
    if (!objectId) {
      const { data: created } = await admin
        .from("custom_objects")
        .insert({
          organization_id: orgId,
          slug: item.slug,
          name: item.name,
          singular_name: item.singular_name,
          plural_name: item.plural_name,
          description: item.description,
          icon: item.icon,
          is_system: true,
          primary_field_slug: item.primary_field_slug,
        })
        .select("id")
        .single();
      objectId = created?.id;

      if (objectId) {
        // Create standard view
        await admin.from("custom_views").insert({
          organization_id: orgId,
          object_id: objectId,
          name: "All " + item.plural_name,
          view_type: "table",
          config: { visible_columns: item.fields.map((f) => f.slug) },
          is_default: true,
        });
      }
    }

    if (objectId) {
      for (let i = 0; i < item.fields.length; i++) {
        const field = item.fields[i]!;
        await admin
          .from("custom_fields")
          .upsert(
            {
              organization_id: orgId,
              object_id: objectId,
              slug: field.slug,
              label: field.label,
              field_type: field.field_type,
              options: "options" in field ? (field.options as SelectOption[]) : [],
              is_required: "is_required" in field ? !!field.is_required : false,
              position: i + 1,
            },
            { onConflict: "object_id,slug" }
          );
      }
    }
  }
}

export async function applyIndustryTemplate(
  orgId: string,
  userId: string,
  templateSlug: string
): Promise<{ success: boolean; applied_objects: string[] }> {
  const template = INDUSTRY_TEMPLATES.find((t) => t.slug === templateSlug);
  if (!template) throw new Error(`Template '${templateSlug}' not found.`);

  const admin = createAdminClient();
  const createdObjectIds: Record<string, string> = {};

  for (const objDef of template.objects) {
    // 1. Create or get object
    const { data: existing } = await admin
      .from("custom_objects")
      .select("id")
      .eq("organization_id", orgId)
      .eq("slug", objDef.slug)
      .maybeSingle();

    let objectId = existing?.id;
    if (!objectId) {
      const { data: created, error } = await admin
        .from("custom_objects")
        .insert({
          organization_id: orgId,
          slug: objDef.slug,
          name: objDef.name,
          singular_name: objDef.singular_name,
          plural_name: objDef.plural_name,
          description: objDef.description,
          icon: objDef.icon,
          is_system: false,
          primary_field_slug: objDef.primary_field_slug,
        })
        .select("id")
        .single();

      if (error || !created) throw new Error(`Failed to create object ${objDef.slug}: ${error?.message}`);
      objectId = created.id;
    }
    createdObjectIds[objDef.slug] = objectId;

    // 2. Create fields
    for (const fieldDef of objDef.fields) {
      await admin.from("custom_fields").upsert(
        {
          organization_id: orgId,
          object_id: objectId,
          slug: fieldDef.slug,
          label: fieldDef.label,
          field_type: fieldDef.field_type,
          description: fieldDef.description || null,
          is_required: fieldDef.is_required || false,
          options: fieldDef.options || [],
          position: fieldDef.position || 0,
        },
        { onConflict: "object_id,slug" }
      );
    }

    // 3. Create views
    if (objDef.views) {
      for (const viewDef of objDef.views) {
        await admin.from("custom_views").insert({
          organization_id: orgId,
          object_id: objectId,
          name: viewDef.name,
          view_type: viewDef.view_type,
          config: viewDef.config,
          is_default: viewDef.is_default || false,
        });
      }
    }
  }

  await audit({
    action: "industry_template.applied",
    organizationId: orgId,
    actorUserId: userId,
    metadata: { template: template.slug, name: template.name },
  });

  return {
    success: true,
    applied_objects: Object.keys(createdObjectIds),
  };
}
