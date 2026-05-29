import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { showUndoToast } from "@/components/admin/undoToast";
import type { UploadCardData } from "@/components/admin/UploadCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { keepBothProduct, mergeProduct } from "@/lib/products.functions";

import { cardToProductInput } from "./cardToProductInput";

export type DuplicateEntry = {
  newProduct: ReturnType<typeof cardToProductInput>;
  existingProduct: {
    id: string;
    name: string;
    sku: string;
    price: number | string | null;
    stock_qty: number | null;
    image_url: string | null;
    description: string | null;
    updated_at: string;
  };
  matchType: "name" | "image";
  // Reference back to original card for image preview
  newCardSnapshot: UploadCardData;
};

export function DuplicateModal({
  queue,
  onResolve,
  onClose,
}: {
  queue: DuplicateEntry[];
  onResolve: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const current = queue[0];
  if (!current) return null;

  async function doMerge() {
    setBusy(true);
    try {
      const r = await mergeProduct({
        data: {
          existingId: current.existingProduct.id,
          newProductData: current.newProduct,
        },
      });
      showUndoToast(`Merged into ${r.product.name}`);
      onResolve();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setBusy(false);
    }
  }

  async function doKeepBoth() {
    setBusy(true);
    try {
      const r = await keepBothProduct({
        data: { newProductData: current.newProduct },
      });
      showUndoToast(`Saved as ${r.product.name} (${r.product.sku})`);
      onResolve();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function doDiscard() {
    toast.info("New upload discarded");
    onResolve();
  }

  const ex = current.existingProduct;
  const nu = current.newCardSnapshot;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <div className="mb-2">
          <div className="text-xs uppercase tracking-wider text-warning">
            Duplicate detected · {current.matchType === "name" ? "matching name" : "matching image"} ·
            {" "}{queue.length} remaining
          </div>
          <h2 className="text-xl font-semibold mt-1">Resolve duplicate</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Existing Product</div>
            <div className="aspect-square w-full bg-background rounded mb-3 overflow-hidden">
              {ex.image_url && <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />}
            </div>
            <div className="text-sm font-semibold">{ex.name}</div>
            <div className="text-xs text-muted-foreground">SKU: {ex.sku}</div>
            <div className="text-xs mt-1">Price: ₦{Number(ex.price ?? 0).toLocaleString()}</div>
            <div className="text-xs">Stock: {ex.stock_qty ?? 0}</div>
            <div className="text-[11px] text-muted-foreground mt-2 line-clamp-3">{ex.description}</div>
            <div className="text-[10px] text-muted-foreground mt-2">
              Updated {new Date(ex.updated_at).toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-primary/40 bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-primary mb-2">New Upload</div>
            <div className="aspect-square w-full bg-background rounded mb-3 overflow-hidden">
              {nu.imageUrl && <img src={nu.imageUrl} alt={nu.name} className="w-full h-full object-cover" />}
            </div>
            <div className="text-sm font-semibold">{nu.name}</div>
            <div className="text-xs text-muted-foreground">SKU: {nu.sku || "(auto)"}</div>
            <div className="text-xs mt-1">Price: ₦{Number(nu.price || 0).toLocaleString()}</div>
            <div className="text-xs">Stock: {nu.stock_qty}</div>
            <div className="text-[11px] text-muted-foreground mt-2 line-clamp-3">{nu.description}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={doDiscard} disabled={busy}>Discard New</Button>
          <Button variant="outline" onClick={doKeepBoth} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Keep Both"}
          </Button>
          <Button onClick={doMerge} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Merge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
