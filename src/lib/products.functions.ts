import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { generateMetadata } from "./ai.server";
import { hammingDistance } from "./hash.server";
import { generateSku, slugify } from "./sku";

type ProductRow = {
  id: string;
  name: string;
  slug: string | null;
  sku: string;
  price: string | number | null;
  cost: string | number | null;
  color: string | null;
  ram: string | null;
  storage: string | null;
  product_type: string | null;
  stock_qty: number | null;
  image_url: string | null;
  image_hash: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  seo_keywords: string[] | null;
  social_caption: string | null;
  is_flash_deal: boolean | null;
  deal_price: string | number | null;
  deal_ends_at: string | null;
  badge: string | null;
  is_published: boolean | null;
  created_at: string;
  updated_at: string;
};

async function ensureAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

function withMargin(row: ProductRow) {
  const price = Number(row.price ?? 0);
  const cost = Number(row.cost ?? 0);
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";
  return { ...row, margin };
}

// ---------- Admin: list ----------
export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { products: (data as ProductRow[]).map(withMargin) };
  });

// ---------- Public storefront reads ----------
const PUBLIC_FIELDS =
  "id,name,slug,sku,price,color,ram,storage,product_type,stock_qty,image_url,description,category,tags,is_flash_deal,deal_price,deal_ends_at,badge,is_published,created_at";

export const listPublicProducts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("products")
      .select(PUBLIC_FIELDS)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.category && data.category !== "All") {
      q = q.eq("product_type", data.category);
    }
    if (data.search) {
      q = q.ilike("name", `%${data.search}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { products: rows ?? [] };
  });

export const listFlashDeals = createServerFn({ method: "GET" })
  .handler(async () => {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(PUBLIC_FIELDS)
      .eq("is_published", true)
      .eq("is_flash_deal", true)
      .gt("deal_ends_at", nowIso)
      .order("deal_ends_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { products: data ?? [] };
  });

export const getPublicProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .select(PUBLIC_FIELDS)
      .eq("id", data.id)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { product: row };
  });

// ---------- Create batch with duplicate check ----------
const ProductInputSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().max(100).optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  cost: z.coerce.number().optional().nullable(),
  color: z.string().max(100).optional().nullable(),
  ram: z.string().max(50).optional().nullable(),
  storage: z.string().max(50).optional().nullable(),
  product_type: z.string().max(100).optional().nullable(),
  stock_qty: z.coerce.number().int().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  image_hash: z.string().max(128).optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  badge: z.string().max(50).optional().nullable(),
  is_flash_deal: z.boolean().optional().nullable(),
  deal_price: z.coerce.number().optional().nullable(),
  deal_ends_at: z.string().optional().nullable(),
});
export type ProductInput = z.infer<typeof ProductInputSchema>;

export const createProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ items: z.array(ProductInputSchema).min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);

    const saved: ProductRow[] = [];
    const duplicates: { newProduct: ProductInput; existingProduct: ProductRow; matchType: "name" | "image" }[] = [];

    // pre-fetch all published for dup detection
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_published", true);
    const pool = (existing ?? []) as ProductRow[];

    for (const item of data.items) {
      // name match
      const byName = pool.find(
        (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
      );
      if (byName) {
        duplicates.push({ newProduct: item, existingProduct: byName, matchType: "name" });
        continue;
      }
      // image match
      if (item.image_hash) {
        const byImg = pool.find(
          (p) => p.image_hash && hammingDistance(item.image_hash!, p.image_hash) <= 10,
        );
        if (byImg) {
          duplicates.push({ newProduct: item, existingProduct: byImg, matchType: "image" });
          continue;
        }
      }

      // metadata
      let socialCaption = "";
      let seoKeywords: string[] = [];
      try {
        const meta = await generateMetadata(
          {
            name: item.name,
            type: item.product_type ?? undefined,
            color: item.color ?? undefined,
            price: item.price ?? undefined,
          },
          item.tags ?? [],
        );
        socialCaption = meta.socialCaption;
        seoKeywords = meta.seoKeywords;
      } catch (e) {
        console.warn("metadata gen failed", e);
      }

      const sku = item.sku && item.sku.trim() ? item.sku.trim() : generateSku();
      const slug = `${slugify(item.name)}-${sku.toLowerCase()}`;

      const insert = {
        name: item.name,
        sku,
        slug,
        price: item.price,
        cost: item.cost,
        color: item.color,
        ram: item.ram,
        storage: item.storage,
        product_type: item.product_type,
        stock_qty: item.stock_qty ?? 1,
        image_url: item.image_url,
        image_hash: item.image_hash,
        description: item.description,
        category: item.category,
        tags: item.tags ?? [],
        seo_keywords: seoKeywords,
        social_caption: socialCaption,
        badge: item.badge ?? "None",
        is_flash_deal: !!item.is_flash_deal,
        deal_price: item.deal_price,
        deal_ends_at: item.deal_ends_at,
        is_published: true,
      };

      const { data: row, error } = await supabaseAdmin
        .from("products")
        .insert(insert)
        .select("*")
        .single();
      if (error) {
        console.error("insert failed", error.message);
        continue;
      }
      const created = row as ProductRow;
      saved.push(created);
      pool.push(created);

      await supabaseAdmin.from("action_log").insert({
        action_type: "create",
        product_id: created.id,
        snapshot_after: created,
        user_id: context.userId,
        expires_at: new Date(Date.now() + 15_000).toISOString(),
      });
    }

    return { saved: saved.map(withMargin), duplicates };
  });

// ---------- Merge ----------
export const mergeProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        existingId: z.string().uuid(),
        newProductData: ProductInputSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);

    const { data: existing, error: e1 } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.existingId)
      .single();
    if (e1 || !existing) throw new Error("Existing product not found");

    const ex = existing as ProductRow;
    const nu = data.newProductData;
    const updated = {
      name: nu.name,
      price: nu.price,
      cost: nu.cost,
      color: nu.color,
      ram: nu.ram,
      storage: nu.storage,
      product_type: nu.product_type,
      image_url: nu.image_url ?? ex.image_url,
      image_hash: nu.image_hash ?? ex.image_hash,
      description: nu.description,
      category: nu.category,
      tags: nu.tags ?? ex.tags,
      badge: nu.badge ?? ex.badge,
      is_flash_deal: !!nu.is_flash_deal,
      deal_price: nu.deal_price,
      deal_ends_at: nu.deal_ends_at,
      stock_qty: (ex.stock_qty ?? 0) + (nu.stock_qty ?? 0),
      // sku preserved
    };

    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update(updated)
      .eq("id", data.existingId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("action_log").insert({
      action_type: "merge",
      product_id: data.existingId,
      snapshot_before: ex,
      snapshot_after: row,
      user_id: context.userId,
      expires_at: new Date(Date.now() + 15_000).toISOString(),
    });

    return { product: withMargin(row as ProductRow) };
  });

// ---------- Keep both ----------
export const keepBothProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ newProductData: ProductInputSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const nu = data.newProductData;
    const sku =
      (nu.sku && nu.sku.trim() ? nu.sku.trim() : generateSku()) + "-copy";
    const slug = `${slugify(nu.name)}-${sku.toLowerCase()}`;
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert({
        name: nu.name,
        sku,
        slug,
        price: nu.price,
        cost: nu.cost,
        color: nu.color,
        ram: nu.ram,
        storage: nu.storage,
        product_type: nu.product_type,
        stock_qty: nu.stock_qty ?? 1,
        image_url: nu.image_url,
        image_hash: nu.image_hash,
        description: nu.description,
        category: nu.category,
        tags: nu.tags ?? [],
        badge: nu.badge ?? "None",
        is_flash_deal: !!nu.is_flash_deal,
        deal_price: nu.deal_price,
        deal_ends_at: nu.deal_ends_at,
        is_published: true,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("action_log").insert({
      action_type: "create",
      product_id: (row as ProductRow).id,
      snapshot_after: row,
      user_id: context.userId,
      expires_at: new Date(Date.now() + 15_000).toISOString(),
    });
    return { product: withMargin(row as ProductRow) };
  });

// ---------- Update ----------
export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), patch: ProductInputSchema.partial() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { data: before } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.id)
      .single();
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("action_log").insert({
      action_type: "update",
      product_id: data.id,
      snapshot_before: before,
      snapshot_after: row,
      user_id: context.userId,
      expires_at: new Date(Date.now() + 15_000).toISOString(),
    });
    return { product: withMargin(row as ProductRow) };
  });

// ---------- Soft delete ----------
export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { data: before } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.id)
      .single();
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_published: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("action_log").insert({
      action_type: "delete",
      product_id: data.id,
      snapshot_before: before,
      user_id: context.userId,
      expires_at: new Date(Date.now() + 15_000).toISOString(),
    });
    return { success: true, name: (before as ProductRow | null)?.name ?? "" };
  });

// ---------- Flash deal patch ----------
export const setFlashDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        isFlashDeal: z.boolean(),
        dealPrice: z.coerce.number().optional().nullable(),
        dealEndsAt: z.string().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update({
        is_flash_deal: data.isFlashDeal,
        deal_price: data.dealPrice ?? null,
        deal_ends_at: data.dealEndsAt ?? null,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { product: withMargin(row as ProductRow) };
  });

// ---------- Undo ----------
export const undoLastAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const nowIso = new Date().toISOString();
    const { data: logRow } = await supabaseAdmin
      .from("action_log")
      .select("*")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!logRow) return { success: false, message: "Nothing to undo" };

    const log = logRow as {
      id: string;
      action_type: string;
      product_id: string | null;
      snapshot_before: ProductRow | null;
      snapshot_after: ProductRow | null;
    };

    let restoredName = "";
    if (log.action_type === "create" && log.snapshot_after?.id) {
      await supabaseAdmin.from("products").delete().eq("id", log.snapshot_after.id);
      restoredName = log.snapshot_after.name;
    } else if ((log.action_type === "update" || log.action_type === "merge") && log.snapshot_before?.id) {
      const b = log.snapshot_before;
      await supabaseAdmin
        .from("products")
        .update({
          name: b.name,
          price: b.price,
          cost: b.cost,
          color: b.color,
          ram: b.ram,
          storage: b.storage,
          product_type: b.product_type,
          stock_qty: b.stock_qty,
          image_url: b.image_url,
          image_hash: b.image_hash,
          description: b.description,
          category: b.category,
          tags: b.tags,
          badge: b.badge,
          is_flash_deal: b.is_flash_deal,
          deal_price: b.deal_price,
          deal_ends_at: b.deal_ends_at,
          is_published: b.is_published,
        })
        .eq("id", b.id);
      restoredName = b.name;
    } else if (log.action_type === "delete" && log.snapshot_before?.id) {
      await supabaseAdmin
        .from("products")
        .update({ is_published: true })
        .eq("id", log.snapshot_before.id);
      restoredName = log.snapshot_before.name;
    }

    await supabaseAdmin.from("action_log").delete().eq("id", log.id);
    return { success: true, restoredName };
  });
