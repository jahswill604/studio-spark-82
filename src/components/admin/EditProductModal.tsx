import { useState } from "react";
import { toast } from "sonner";

import { showUndoToast } from "@/components/admin/undoToast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { updateProduct, type listAdminProducts } from "@/lib/products.functions";

type Row = Awaited<ReturnType<typeof listAdminProducts>>["products"][number];

const TYPES = ["Phone", "Tablet", "Laptop", "Accessory", "Wearable", "Other"];
const BADGES = ["None", "Best Seller", "New Arrival", "Hot Deal"];

export function EditProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    price: String(product.price ?? ""),
    cost: String(product.cost ?? ""),
    color: product.color ?? "",
    ram: product.ram ?? "",
    storage: product.storage ?? "",
    product_type: product.product_type ?? "Phone",
    stock_qty: String(product.stock_qty ?? 1),
    badge: product.badge ?? "None",
    is_flash_deal: !!product.is_flash_deal,
    deal_price: String(product.deal_price ?? ""),
    deal_ends_at: product.deal_ends_at ? new Date(product.deal_ends_at).toISOString().slice(0, 16) : "",
    description: product.description ?? "",
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const r = await updateProduct({
        data: {
          id: product.id,
          patch: {
            name: form.name,
            sku: form.sku,
            price: form.price === "" ? null : Number(form.price),
            cost: form.cost === "" ? null : Number(form.cost),
            color: form.color || null,
            ram: form.ram || null,
            storage: form.storage || null,
            product_type: form.product_type || null,
            stock_qty: Number(form.stock_qty || 0),
            badge: form.badge || "None",
            is_flash_deal: form.is_flash_deal,
            deal_price: form.deal_price === "" ? null : Number(form.deal_price),
            deal_ends_at: form.deal_ends_at ? new Date(form.deal_ends_at).toISOString() : null,
            description: form.description || null,
          },
        },
      });
      showUndoToast(`Updated ${r.product.name}`, onSaved);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <h2 className="text-xl font-semibold">Edit product</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
          <Field label="Price (₦)"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Cost (₦)"><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
          <Field label="Color"><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
          <Field label="Stock"><Input type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} /></Field>
          <Field label="RAM"><Input value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })} /></Field>
          <Field label="Storage"><Input value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} /></Field>
          <Field label="Type">
            <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Badge">
            <Select value={form.badge} onValueChange={(v) => setForm({ ...form, badge: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BADGES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Flash deal" className="col-span-2 flex-row items-center justify-between">
            <Switch checked={form.is_flash_deal} onCheckedChange={(v) => setForm({ ...form, is_flash_deal: v })} />
          </Field>
          {form.is_flash_deal && (
            <>
              <Field label="Deal price (₦)"><Input type="number" value={form.deal_price} onChange={(e) => setForm({ ...form, deal_price: e.target.value })} /></Field>
              <Field label="Deal ends"><Input type="datetime-local" value={form.deal_ends_at} onChange={(e) => setForm({ ...form, deal_ends_at: e.target.value })} /></Field>
            </>
          )}
          <Field label="Description" className="col-span-2">
            <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
