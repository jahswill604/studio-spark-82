import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  analyseImage,
  generateDescription,
  generateMetadata,
} from "./ai.server";

export const aiAnalyseImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ imageUrl: z.string().url() }).parse(input),
  )
  .handler(async ({ data }) => analyseImage(data.imageUrl));

export const aiGenerateDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1),
        type: z.string().optional(),
        color: z.string().optional(),
        ram: z.string().optional(),
        storage: z.string().optional(),
        price: z.union([z.number(), z.string()]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => ({ description: await generateDescription(data) }));

export const aiGenerateMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1),
        type: z.string().optional(),
        color: z.string().optional(),
        price: z.union([z.number(), z.string()]).optional(),
        tags: z.array(z.string()).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    generateMetadata(
      { name: data.name, type: data.type, color: data.color, price: data.price },
      data.tags,
    ),
  );
