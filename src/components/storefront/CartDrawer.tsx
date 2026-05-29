import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

import { formatNaira, useCart } from "@/hooks/useCart";

export function CartDrawer() {
  const cart = useCart();
  if (!cart.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={cart.close} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-surface border-l border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 font-semibold"><ShoppingBag className="h-4 w-4" /> Your cart</div>
          <button onClick={cart.close} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-elevated"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-12">Your cart is empty.</div>
          )}
          {cart.items.map((it) => (
            <div key={it.id} className="flex gap-3 rounded-lg bg-card p-3 border border-border">
              <div className="h-16 w-16 rounded bg-background overflow-hidden shrink-0">
                {it.image_url && <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="text-sm text-muted-foreground">{formatNaira(it.price)}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => cart.setQty(it.id, it.qty - 1)} className="h-6 w-6 rounded bg-surface-elevated"><Minus className="h-3 w-3 mx-auto" /></button>
                  <span className="text-xs tabular-nums w-6 text-center">{it.qty}</span>
                  <button onClick={() => cart.setQty(it.id, it.qty + 1)} className="h-6 w-6 rounded bg-surface-elevated"><Plus className="h-3 w-3 mx-auto" /></button>
                  <button onClick={() => cart.remove(it.id)} className="ml-auto text-xs text-destructive hover:underline">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatNaira(cart.subtotal)}</span>
          </div>
          <button
            onClick={() => toast.info("Checkout coming soon")}
            disabled={cart.items.length === 0}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition disabled:opacity-50"
          >
            Checkout
          </button>
        </div>
      </aside>
    </div>
  );
}
