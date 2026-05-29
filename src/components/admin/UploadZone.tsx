import { Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { cardToProductInput } from "@/components/admin/cardToProductInput";
import { DuplicateModal, type DuplicateEntry } from "@/components/admin/DuplicateModal";
import { showUndoToast } from "@/components/admin/undoToast";
import { makeEmptyCard, UploadCard, type UploadCardData } from "@/components/admin/UploadCard";
import { Button } from "@/components/ui/button";
import { computeImageHash } from "@/lib/hash";
import { aiAnalyseImage } from "@/lib/ai.functions";
import { createProducts } from "@/lib/products.functions";
import { uploadProductImage } from "@/lib/storage.functions";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function UploadZone({ onSavedRefresh }: { onSavedRefresh: () => void }) {
  const [cards, setCards] = useState<UploadCardData[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dupQueue, setDupQueue] = useState<DuplicateEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    for (const f of list) {
      const tempId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(f);
      const draft = makeEmptyCard({
        tempId,
        imageUrl: previewUrl,
        name: f.name.replace(/\.[^.]+$/, ""),
        aiBusy: true,
      });
      setCards((p) => [...p, draft]);

      (async () => {
        try {
          const [base64, hash] = await Promise.all([fileToBase64(f), computeImageHash(f)]);
          const up = await uploadProductImage({
            data: { filename: f.name, contentType: f.type, base64 },
          });
          setCards((prev) =>
            prev.map((c) =>
              c.tempId === tempId
                ? { ...c, imageUrl: up.imageUrl, imageHash: hash, filename: up.key }
                : c,
            ),
          );
          // AI analyse
          try {
            const ai = await aiAnalyseImage({ data: { imageUrl: up.imageUrl } });
            setCards((prev) =>
              prev.map((c) =>
                c.tempId === tempId
                  ? {
                      ...c,
                      category: ai.category,
                      tags: ai.tags,
                      selectedTags: ai.tags,
                      aiBusy: false,
                      aiDone: true,
                    }
                  : c,
              ),
            );
          } catch (e) {
            console.warn("ai analyse failed", e);
            setCards((prev) => prev.map((c) => (c.tempId === tempId ? { ...c, aiBusy: false } : c)));
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload failed");
          setCards((prev) => prev.filter((c) => c.tempId !== tempId));
        }
      })();
    }
  }

  function updateCard(c: UploadCardData) {
    setCards((p) => p.map((x) => (x.tempId === c.tempId ? c : x)));
  }

  function removeCard(id: string) {
    setCards((p) => p.filter((x) => x.tempId !== id));
  }

  async function saveAll() {
    if (!cards.length) return;
    // validation
    for (const c of cards) {
      if (!c.name.trim()) {
        toast.error("Every card needs a product name");
        return;
      }
      if (c.is_flash_deal) {
        if (!c.deal_price || !c.deal_ends_at) {
          toast.error(`Flash Deal on "${c.name}" needs Deal Price and Deal Ends`);
          return;
        }
        if (Number(c.deal_price) > Number(c.price || 0)) {
          toast.warning(`Deal price for "${c.name}" is higher than regular price`);
        }
      }
    }

    setSaving(true);
    try {
      const items = cards.map(cardToProductInput);
      const r = await createProducts({ data: { items } });
      if (r.saved.length) {
        showUndoToast(`${r.saved.length} product(s) saved`, onSavedRefresh);
      }
      if (r.duplicates.length) {
        const q: DuplicateEntry[] = r.duplicates.map((d) => {
          const snap = cards.find(
            (c) => c.name.trim().toLowerCase() === d.newProduct.name.trim().toLowerCase(),
          ) ?? cards[0];
          return {
            newProduct: d.newProduct,
            existingProduct: d.existingProduct,
            matchType: d.matchType,
            newCardSnapshot: snap,
          };
        });
        setDupQueue(q);
      }
      // Drop saved cards
      const savedNames = new Set(r.saved.map((s) => s.name.trim().toLowerCase()));
      const dupNames = new Set(r.duplicates.map((d) => d.newProduct.name.trim().toLowerCase()));
      setCards((prev) =>
        prev.filter(
          (c) =>
            !savedNames.has(c.name.trim().toLowerCase()) &&
            !dupNames.has(c.name.trim().toLowerCase()),
        ),
      );
      onSavedRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          dragging ? "border-admin-accent bg-admin-accent/5" : "border-admin-border bg-admin-surface/50"
        } px-6 py-10 text-center`}
      >
        <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground" />
        <div className="mt-2 text-sm font-medium">Drop product images here</div>
        <div className="text-xs text-muted-foreground">or click to browse · JPG, PNG, WEBP</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {cards.length > 0 && (
        <>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {cards.map((c) => (
              <UploadCard
                key={c.tempId}
                card={c}
                onChange={updateCard}
                onRemove={() => removeCard(c.tempId)}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={saveAll} disabled={saving} size="lg">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save All Products ({cards.length})
            </Button>
          </div>
        </>
      )}

      {dupQueue.length > 0 && (
        <DuplicateModal
          queue={dupQueue}
          onResolve={() => {
            setDupQueue((q) => q.slice(1));
            onSavedRefresh();
          }}
          onClose={() => setDupQueue([])}
        />
      )}
    </div>
  );
}
