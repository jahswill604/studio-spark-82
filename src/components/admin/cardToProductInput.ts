import type { UploadCardData } from "./UploadCard";

export function cardToProductInput(c: UploadCardData) {
  return {
    name: c.name.trim(),
    sku: c.sku.trim() || null,
    price: c.price === "" ? null : Number(c.price),
    cost: c.cost === "" ? null : Number(c.cost),
    color: c.color.trim() || null,
    ram: c.ram.trim() || null,
    storage: c.storage.trim() || null,
    product_type: c.product_type || null,
    stock_qty: c.stock_qty === "" ? 1 : Number(c.stock_qty),
    image_url: c.imageUrl || null,
    image_hash: c.imageHash || null,
    description: c.description || null,
    category: c.category && c.category !== "_" ? c.category : null,
    tags: c.selectedTags.length ? c.selectedTags : c.tags,
    badge: c.badge || "None",
    is_flash_deal: c.is_flash_deal,
    deal_price: c.deal_price === "" ? null : Number(c.deal_price),
    deal_ends_at: c.deal_ends_at ? new Date(c.deal_ends_at).toISOString() : null,
  };
}
