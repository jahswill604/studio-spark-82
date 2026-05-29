import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const UploadInput = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  base64: z.string().min(1),
});

// Upload a base64 image to the product-images bucket. Returns public URL.
export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UploadInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Admin check
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roles) throw new Error("Forbidden: admin only");

    const ext = (data.filename.split(".").pop() || "bin").toLowerCase();
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));

    const { error } = await supabaseAdmin.storage
      .from("product-images")
      .upload(key, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: pub } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(key);

    return { imageUrl: pub.publicUrl, key };
  });

// Remove background via Remove.bg API, save result, return new URL.
const RemoveBgInput = z.object({ imageUrl: z.string().url() });
export const removeBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RemoveBgInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return { imageUrl: data.imageUrl, error: "Background removal unavailable" };
    }

    // Admin check
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roles) throw new Error("Forbidden");

    try {
      const fd = new FormData();
      fd.append("image_url", data.imageUrl);
      fd.append("size", "auto");
      const resp = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: fd,
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        console.error("remove.bg error", resp.status, t);
        return { imageUrl: data.imageUrl, error: "Background removal failed" };
      }
      const buf = new Uint8Array(await resp.arrayBuffer());
      const key = `nobg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const { error } = await supabaseAdmin.storage
        .from("product-images")
        .upload(key, buf, { contentType: "image/png", upsert: false });
      if (error) throw error;
      const { data: pub } = supabaseAdmin.storage
        .from("product-images")
        .getPublicUrl(key);
      return { imageUrl: pub.publicUrl };
    } catch (e) {
      console.error("removeBackground exception", e);
      return { imageUrl: data.imageUrl, error: "Background removal failed" };
    }
  });
