import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface ProductInput {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  unitPriceCents: number;
  currency?: string;
  costPriceCents?: number;
  taxRatePercent?: number;
  stockQuantity?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DealProductInput {
  leadId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  currency?: string;
  discountCents?: number;
  taxRatePercent?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Returns products for an organization with optional filtering.
 */
export async function getProducts(
  orgId: string,
  options?: {
    search?: string;
    category?: string;
    isActiveOnly?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  const admin = createAdminClient();
  let query = admin
    .from("crm_products")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (options?.isActiveOnly) {
    query = query.eq("is_active", true);
  }
  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("[alienmatrix] failed to get products", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Creates a new product catalog item.
 */
export async function createProduct(
  orgId: string,
  input: ProductInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_products")
    .insert({
      organization_id: orgId,
      name: input.name,
      sku: input.sku?.trim() || null,
      description: input.description || null,
      category: input.category || null,
      unit_price_cents: input.unitPriceCents,
      currency: input.currency || "USD",
      cost_price_cents: input.costPriceCents || null,
      tax_rate_percent: input.taxRatePercent || 0.0,
      stock_quantity: input.stockQuantity || 0,
      is_active: input.isActive !== undefined ? input.isActive : true,
      metadata: input.metadata || {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create product: ${error?.message}`);
  }

  await audit({
    action: "crm_product.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_products",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { name: data.name, sku: data.sku, price_cents: data.unit_price_cents },
  });

  return data;
}

/**
 * Updates a product catalog item.
 */
export async function updateProduct(
  orgId: string,
  productId: string,
  input: Partial<ProductInput>,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.sku !== undefined) updatePayload.sku = input.sku?.trim() || null;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.category !== undefined) updatePayload.category = input.category;
  if (input.unitPriceCents !== undefined) updatePayload.unit_price_cents = input.unitPriceCents;
  if (input.currency !== undefined) updatePayload.currency = input.currency;
  if (input.costPriceCents !== undefined) updatePayload.cost_price_cents = input.costPriceCents;
  if (input.taxRatePercent !== undefined) updatePayload.tax_rate_percent = input.taxRatePercent;
  if (input.stockQuantity !== undefined) updatePayload.stock_quantity = input.stockQuantity;
  if (input.isActive !== undefined) updatePayload.is_active = input.isActive;
  if (input.metadata !== undefined) updatePayload.metadata = input.metadata;

  const { data, error } = await admin
    .from("crm_products")
    .update(updatePayload)
    .eq("organization_id", orgId)
    .eq("id", productId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update product: ${error?.message}`);
  }

  await audit({
    action: "crm_product.updated",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_products",
    resourceId: productId,
    requestId: options?.requestId,
  });

  return data;
}

/**
 * Deletes a product catalog item.
 */
export async function deleteProduct(
  orgId: string,
  productId: string,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_products")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  await audit({
    action: "crm_product.deleted",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_products",
    resourceId: productId,
    requestId: options?.requestId,
  });

  return { success: true };
}

/**
 * Deal line items: get products attached to a deal (crm_leads).
 */
export async function getDealProducts(orgId: string, leadId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_deal_products")
    .select("*, product:crm_products(*)")
    .eq("organization_id", orgId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Adds a product line item to a deal and updates deal total value_cents.
 */
export async function addDealProduct(
  orgId: string,
  input: DealProductInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();

  const quantity = Number(input.quantity) || 1;
  const unitPrice = Number(input.unitPriceCents) || 0;
  const discount = Number(input.discountCents) || 0;
  const taxRate = Number(input.taxRatePercent) || 0;

  // subtotal = qty * price - discount + tax
  const subtotal = Math.round(quantity * unitPrice) - discount;
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const totalCents = Math.max(0, subtotal + taxAmount);

  const { data, error } = await admin
    .from("crm_deal_products")
    .insert({
      organization_id: orgId,
      lead_id: input.leadId,
      product_id: input.productId || null,
      product_name: input.productName,
      quantity: quantity,
      unit_price_cents: unitPrice,
      currency: input.currency || "USD",
      discount_cents: discount,
      tax_rate_percent: taxRate,
      total_cents: totalCents,
      metadata: input.metadata || {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to add deal product: ${error?.message}`);
  }

  // Recalculate and update deal value in crm_leads
  await recalculateDealValue(orgId, input.leadId);

  return data;
}

/**
 * Removes a deal line item and recalculates total deal value.
 */
export async function removeDealProduct(
  orgId: string,
  dealProductId: string,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data: item } = await admin
    .from("crm_deal_products")
    .select("lead_id")
    .eq("organization_id", orgId)
    .eq("id", dealProductId)
    .single();

  const { error } = await admin
    .from("crm_deal_products")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", dealProductId);

  if (error) {
    throw new Error(error.message);
  }

  if (item?.lead_id) {
    await recalculateDealValue(orgId, item.lead_id);
  }

  return { success: true };
}

/**
 * Internal helper to sum all deal line items and update crm_leads.value_cents.
 */
async function recalculateDealValue(orgId: string, leadId: string) {
  const admin = createAdminClient();
  const { data: items } = await admin
    .from("crm_deal_products")
    .select("total_cents")
    .eq("organization_id", orgId)
    .eq("lead_id", leadId);

  const sumTotal = (items ?? []).reduce((acc, curr) => acc + (Number(curr.total_cents) || 0), 0);

  await admin
    .from("crm_leads")
    .update({
      value_cents: sumTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", orgId)
    .eq("id", leadId);
}
