import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OrderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  qty: z.number().int().min(1),
  image_url: z.string().nullable().optional(),
});

const CreateOrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(200),
  customer_phone: z.string().trim().min(7).max(40),
  delivery_address: z.string().trim().min(5).max(500),
  delivery_city: z.string().trim().max(100).optional().nullable(),
  delivery_state: z.string().trim().max(100).optional().nullable(),
  delivery_notes: z.string().trim().max(500).optional().nullable(),
  items: z.array(OrderItemSchema).min(1).max(50),
  delivery_fee: z.coerce.number().min(0).default(0),
});

function genOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  const r = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `BOG-${ts}${r}`;
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const subtotal = data.items.reduce((s, i) => s + i.price * i.qty, 0);
    const total = subtotal + (data.delivery_fee || 0);
    const order_number = genOrderNumber();

    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        delivery_address: data.delivery_address,
        delivery_city: data.delivery_city ?? null,
        delivery_state: data.delivery_state ?? null,
        delivery_notes: data.delivery_notes ?? null,
        items: data.items,
        subtotal,
        delivery_fee: data.delivery_fee || 0,
        total,
        status: "pending_payment",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { order: row };
  });

const SubmitPaymentSchema = z.object({
  order_number: z.string().min(3).max(40),
  payment_reference: z.string().trim().min(2).max(120),
  receipt_base64: z.string().optional().nullable(),
  receipt_filename: z.string().max(255).optional().nullable(),
  receipt_content_type: z.string().max(100).optional().nullable(),
});

export const submitPaymentProof = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitPaymentSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: order, error: e1 } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_number", data.order_number)
      .maybeSingle();
    if (e1 || !order) throw new Error("Order not found");

    let receipt_url: string | null = null;
    if (data.receipt_base64 && data.receipt_filename) {
      const ext = (data.receipt_filename.split(".").pop() || "bin").toLowerCase();
      const key = `${order.order_number}/${Date.now()}.${ext}`;
      const bytes = Uint8Array.from(atob(data.receipt_base64), (c) => c.charCodeAt(0));
      const { error: upErr } = await supabaseAdmin.storage
        .from("payment-receipts")
        .upload(key, bytes, {
          contentType: data.receipt_content_type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) throw new Error("Receipt upload failed: " + upErr.message);
      receipt_url = key;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_reference: data.payment_reference,
        payment_receipt_url: receipt_url ?? order.payment_receipt_url,
        payment_submitted_at: new Date().toISOString(),
        status: "payment_submitted",
      })
      .eq("id", order.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { order: updated };
  });

export const getOrderByNumber = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ order_number: z.string().min(3).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_number", data.order_number)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { order: row };
  });

// ---------- Admin ----------
async function ensureAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    // Sign receipt URLs (private bucket)
    const withSigned = await Promise.all(
      (data ?? []).map(async (o) => {
        let signed: string | null = null;
        if (o.payment_receipt_url) {
          const { data: s } = await supabaseAdmin.storage
            .from("payment-receipts")
            .createSignedUrl(o.payment_receipt_url, 3600);
          signed = s?.signedUrl ?? null;
        }
        return { ...o, receipt_signed_url: signed };
      }),
    );
    return { orders: withSigned };
  });

const UpdateOrderSchema = z.object({
  id: z.string().uuid(),
  status: z
    .enum([
      "pending_payment",
      "payment_submitted",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .optional(),
  tracking_number: z.string().max(100).optional().nullable(),
  admin_notes: z.string().max(2000).optional().nullable(),
});

export const updateOrderAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch.status = data.status;
      if (data.status === "paid") patch.payment_confirmed_at = new Date().toISOString();
    }
    if (data.tracking_number !== undefined) patch.tracking_number = data.tracking_number;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;

    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .update(patch as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { order: row };
  });
