import { Link } from "@tanstack/react-router";
import { Eye, ShoppingBag, Star } from "lucide-react";

import { Countdown } from "@/components/admin/Countdown";
import { Button } from "@/components/ui/button";
import { formatNaira, useCart } from "@/hooks/useCart";

export type PublicProduct = {
  id: string;
  name: string;
  sku?: string | null;
  price: number | string | null;
  color: string | null;
  ram: string | null;
  storage: string | null;
  product_type: string | null;
  stock_qty: number | null;
  image_url: string | null;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  badge: string | null;
  is_flash_deal: boolean | null;
  deal_price: number | string | null;
  deal_ends_at: string | null;
};


export function fakeReviewCount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return 120 + (Math.abs(h) % 770);
}

function BadgeChip({ badge }: { badge: string }) {
  const map: Record<string, string> = {
    "Best Seller": "bg-amber-500/90 text-black",
    "New Arrival": "bg-primary text-primary-foreground",
    "Hot Deal": "bg-deal text-deal-foreground",
  };
  const cls = map[badge] ?? "bg-muted text-foreground";
  return (
    <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${cls}`}>
      {badge}
    </span>
  );
}

export function StarRating({ id }: { id: string }) {
  const count = fakeReviewCount(id);
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <div className="flex">
        {[0, 1, 2, 3].map((i) => (
          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
        ))}
        <div className="relative">
          <Star className="h-3 w-3 text-amber-400" />
          <div className="absolute inset-0 overflow-hidden w-1/2"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /></div>
        </div>
      </div>
      <span>4.5 ({count})</span>
    </div>
  );
}

export function ProductCard({ product, onExpire }: { product: PublicProduct; onExpire?: () => void }) {
  const cart = useCart();
  const dealActive =
    !!product.is_flash_deal && !!product.deal_ends_at && new Date(product.deal_ends_at) > new Date();
  const price = Number(product.price ?? 0);
  const dealPrice = Number(product.deal_price ?? 0);
  const specs = [product.ram, product.storage, product.color].filter(Boolean).join(" · ");
  const outOfStock = (product.stock_qty ?? 0) <= 0;
  const discountPct = dealActive && price > 0 ? Math.round(((price - dealPrice) / price) * 100) : 0;

  return (
    <div className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
      {product.badge && product.badge !== "None" && <BadgeChip badge={product.badge} />}
      {dealActive && discountPct > 0 && (
        <span className="absolute top-3 right-3 z-10 text-[10px] font-bold px-2 py-1 rounded bg-deal text-deal-foreground">
          -{discountPct}%
        </span>
      )}
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="aspect-square bg-surface-elevated/40 flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="text-xs text-muted-foreground">No image</div>
          )}
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <Link to="/product/$id" params={{ id: product.id }} className="block">
          <h3 className="font-display font-medium text-base truncate hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        {specs && <div className="text-xs text-muted-foreground truncate">{specs}</div>}
        <StarRating id={product.id} />
        <div className="flex items-baseline gap-2 pt-1">
          {dealActive ? (
            <>
              <span className="text-deal font-bold text-lg">{formatNaira(dealPrice)}</span>
              <span className="text-xs text-muted-foreground line-through">{formatNaira(price)}</span>
            </>
          ) : (
            <span className="text-foreground font-bold text-lg">{formatNaira(price)}</span>
          )}
        </div>
        {dealActive && (
          <div className="text-[11px] text-deal font-semibold">
            ENDS IN <Countdown endsAt={product.deal_ends_at} onExpire={onExpire} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button asChild size="sm" variant="outline" className="h-9">
            <Link to="/product/$id" params={{ id: product.id }}>
              <Eye className="h-3.5 w-3.5" /> View
            </Link>
          </Button>
          <Button
            size="sm"
            className="h-9"
            onClick={() =>
              cart.add({
                id: product.id,
                name: product.name,
                price: dealActive ? dealPrice : price,
                image_url: product.image_url,
              })
            }
            disabled={outOfStock}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> {outOfStock ? "Sold" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
