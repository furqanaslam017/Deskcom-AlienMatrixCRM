export type CustomFieldType =
  | "text"
  | "long_text"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multi_select"
  | "email"
  | "phone"
  | "url"
  | "file"
  | "relation"
  | "user";

export interface SelectOption {
  label: string;
  value: string;
  color?: string;
}

export interface CustomObject {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  singular_name: string;
  plural_name: string;
  description: string | null;
  icon: string;
  is_system: boolean;
  primary_field_slug: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  fields_count?: number;
  records_count?: number;
}

export interface CustomField {
  id: string;
  organization_id: string;
  object_id: string;
  slug: string;
  label: string;
  field_type: CustomFieldType;
  description: string | null;
  is_required: boolean;
  is_unique: boolean;
  default_value: unknown;
  options: SelectOption[];
  relation_target_object_id: string | null;
  validation_rules: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CustomRecord {
  id: string;
  organization_id: string;
  object_id: string;
  title: string;
  values: Record<string, unknown>;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomObjectRelation {
  id: string;
  organization_id: string;
  source_object_id: string;
  target_object_id: string;
  relation_type: "one_to_many" | "many_to_many" | "many_to_one";
  slug: string;
  label: string;
  reverse_label: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  target_object?: CustomObject;
}

export interface CustomRecordRelation {
  id: string;
  organization_id: string;
  relation_id: string;
  source_record_id: string;
  target_record_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type CustomViewType = "table" | "kanban" | "list";

export interface ViewFilter {
  field: string;
  operator: "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "is_null" | "is_not_null";
  value: unknown;
}

export interface ViewSort {
  field: string;
  direction: "asc" | "desc";
}

export interface CustomViewConfig {
  visible_columns?: string[];
  filters?: ViewFilter[];
  sort?: ViewSort[];
  group_by_field?: string;
}

export interface CustomView {
  id: string;
  organization_id: string;
  object_id: string;
  user_id: string | null;
  name: string;
  view_type: CustomViewType;
  config: CustomViewConfig;
  is_default: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface IndustryTemplatePack {
  slug: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  objects: {
    slug: string;
    name: string;
    singular_name: string;
    plural_name: string;
    description: string;
    icon: string;
    primary_field_slug: string;
    fields: {
      slug: string;
      label: string;
      field_type: CustomFieldType;
      description?: string;
      is_required?: boolean;
      options?: SelectOption[];
      position?: number;
    }[];
    views?: {
      name: string;
      view_type: CustomViewType;
      config: CustomViewConfig;
      is_default?: boolean;
    }[];
  }[];
  relations?: {
    source_slug: string;
    target_slug: string;
    relation_type: "one_to_many" | "many_to_many" | "many_to_one";
    slug: string;
    label: string;
    reverse_label?: string;
  }[];
}
