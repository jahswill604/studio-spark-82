import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { aiGenerateDescription } from "@/lib/ai.functions";
import { removeBackground } from "@/lib/storage.functions";

export type UploadCardData = {
  tempId: string;
  imageUrl: string;
  imageHash: string;
  filename: string;
  name: string;
  sku: string;
  price: string;
  cost: string;
  color: string;
  ram: string;
  storage: string;
  product_type: string;
  stock_qty: string;
  badge: string;
  is_flash_deal: boolean;
  deal_price: string;
  deal_ends_at: string;
  description: string;
  category: string;
  tags: string[];
  selectedTags: string[];
  aiBusy: boolean;
  aiDone: boolean;
  bgRemoved: boolean;
};

export function makeEmptyCard(extras: Partial<UploadCardData>): UploadCardData {
  return {
    tempId: crypto.randomUUID(),
    imageUrl: "",
    imageHash: "",
    filename: "",
    name: "",
    sku: "",
    price: "",
    cost: "",
    color: "",
    ram: "",
    storage: "",
    product_type: "Phone",
    stock_qty: "1",
    badge: "None",
    is_flash_deal: false,
    deal_price: "",
    deal_ends_at: "",
    description: "",
    category: "",
    tags: [],
    selectedTags: [],
    aiBusy: false,
    aiDone: false,
    bgRemoved: false,
    ...extras,
  };
}

const PRODUCT_TYPES = ["Phone", "Tablet", "Laptop", "Accessory", "Wearable", "Other"];
const BADGES = ["None", "Best Seller", "New Arrival", "Hot Deal"];

export function UploadCard({
  card,
  onChange,
  onRemove,
}: {
  card: UploadCardData;
  onChange: (c: UploadCardData) => void;
  onRemove: () => void;
}) {
  const [bgBusy, setBgBusy] = useState(false);
  const [descBusy, setDescBusy] = useState(false);

  const price = Number(card.price || 0);
  const cost = Number(card.cost || 0);
  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
  const marginColor = margin > 30 ? "text-success" : margin >= 10 ? "text-warning" : "text-destructive";

  async function toggleBg(next: boolean) {
    if (!next || card.bgRemoved) {
      onChange({ ...card, bgRemoved: next });
      return;
    }
    setBgBusy(true);
    try {
      const r = await removeBackground({ data: { imageUrl: card.imageUrl } });
      if (r.error) toast.error(r.error);
      onChange({ ...card, imageUrl: r.imageUrl, bgRemoved: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Background removal failed");
    } finally {
      setBgBusy(false);
    }
  }

  async function genDescription() {
    if (!card.name) {
      toast.warning("Add a product name first");
      return;
    }
    setDescBusy(true);
    try {
      const r = await aiGenerateDescription({
        data: {
          name: card.name,
          type: card.product_type,
          color: card.color,
          ram: card.ram,
          storage: card.storage,
          price: card.price,
        },
      });
      onChange({ ...card, description: r.description });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate description");
    } finally {
      setDescBusy(false);
    }
  }

  function toggleTag(t: string) {
    const has = card.selectedTags.includes(t);
    onChange({
      ...card,
      selectedTags: has ? card.selectedTags.filter((x) => x !== t) : [...card.selectedTags, t],
    });
  }

  const statusBadge = card.aiBusy
    ? { label: "Processing", cls: "bg-warning/15 text-warning" }
    : card.aiDone
      ? { label: "Done", cls: "bg-success/15 text-success" }
      : { label: "Ready", cls: "bg-muted text-muted-foreground" };

  return (
    <div className="shrink-0 w-[360px] rounded-xl border border-admin-border bg-admin-surface p-4 space-y-3">
      <div className="relative">
        <div className="aspect-square w-full bg-background rounded-lg overflow-hidden flex items-center justify-center">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name || "Product"} className="w-full h-full object-cover" />
          ) : (
            <div className="text-xs text-muted-foreground">No image</div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1.5 hover:bg-destructive hover:text-destructive-foreground transition"
          aria-label="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <span className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-1 rounded-full ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor={`bg-${card.tempId}`} className="text-xs">
          Remove background
        </Label>
        <div className="flex items-center gap-2">
          {bgBusy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <Switch
            id={`bg-${card.tempId}`}
            checked={card.bgRemoved}
            disabled={bgBusy}
            onCheckedChange={toggleBg}
          />
        </div>
      </div>

      {(card.aiBusy || card.tags.length > 0 || card.category) && (
        <div className="space-y-2 pb-2 border-b border-admin-border">
          {card.aiBusy && (
            <div className="flex items-center gap-2">
              <div className="h-5 w-20 bg-muted/40 rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-muted/40 rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-muted/40 rounded-full animate-pulse" />
            </div>
          )}
          {card.category && (
            <button
              onClick={() => onChange({ ...card, category: card.category === "_" ? card.tags[0] ?? "" : "_" })}
              className={`text-[11px] px-2 py-0.5 rounded-full transition ${
                card.category && card.category !== "_"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {card.category && card.category !== "_" ? card.category : "no category"}
            </button>
          )}
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((t) => {
                const on = card.selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`text-[11px] px-2 py-0.5 rounded-full transition ${
                      on ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5 text-xs">
        <div>
          <Label className="text-[11px]">Product Name *</Label>
          <Input
            className="h-8 mt-1"
            value={card.name}
            onChange={(e) => onChange({ ...card, name: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-[11px]">SKU (blank = auto)</Label>
          <Input
            className="h-8 mt-1"
            value={card.sku}
            onChange={(e) => onChange({ ...card, sku: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px]">Price (₦)</Label>
            <Input
              className="h-8 mt-1"
              type="number"
              value={card.price}
              onChange={(e) => onChange({ ...card, price: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[11px]">Cost (₦)</Label>
            <Input
              className="h-8 mt-1"
              type="number"
              value={card.cost}
              onChange={(e) => onChange({ ...card, cost: e.target.value })}
            />
          </div>
        </div>
        {price > 0 && cost >= 0 && (
          <div className={`text-[11px] font-medium ${marginColor}`}>
            Margin: {margin.toFixed(1)}%
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[11px]">Color</Label>
            <Input className="h-8 mt-1" value={card.color} onChange={(e) => onChange({ ...card, color: e.target.value })} />
          </div>
          <div>
            <Label className="text-[11px]">RAM</Label>
            <Input className="h-8 mt-1" value={card.ram} onChange={(e) => onChange({ ...card, ram: e.target.value })} />
          </div>
          <div>
            <Label className="text-[11px]">Storage</Label>
            <Input className="h-8 mt-1" value={card.storage} onChange={(e) => onChange({ ...card, storage: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px]">Type</Label>
            <Select value={card.product_type} onValueChange={(v) => onChange({ ...card, product_type: v })}>
              <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Stock</Label>
            <Input
              className="h-8 mt-1"
              type="number"
              value={card.stock_qty}
              onChange={(e) => onChange({ ...card, stock_qty: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label className="text-[11px]">Badge</Label>
          <Select value={card.badge} onValueChange={(v) => onChange({ ...card, badge: v })}>
            <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BADGES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-admin-border">
          <Label className="text-[11px]">Flash Deal</Label>
          <Switch
            checked={card.is_flash_deal}
            onCheckedChange={(v) => onChange({ ...card, is_flash_deal: v })}
          />
        </div>
        {card.is_flash_deal && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">Deal Price (₦) *</Label>
              <Input
                className="h-8 mt-1"
                type="number"
                value={card.deal_price}
                onChange={(e) => onChange({ ...card, deal_price: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-[11px]">Deal Ends *</Label>
              <Input
                className="h-8 mt-1"
                type="datetime-local"
                value={card.deal_ends_at}
                onChange={(e) => onChange({ ...card, deal_ends_at: e.target.value })}
              />
            </div>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-[11px]">Description</Label>
            <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={genDescription} disabled={descBusy}>
              {descBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Generate
            </Button>
          </div>
          <Textarea
            rows={4}
            className="mt-1 text-xs"
            value={card.description}
            onChange={(e) => onChange({ ...card, description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
