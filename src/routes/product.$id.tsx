import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Countdown } from "@/components/admin/Countdown";
import { ProductCard, type PublicProduct, StarRating } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { Button } from "@/components/ui/button";
import { formatNaira, useCart } from "@/hooks/useCart";
import { getPublicProduct, listPublicProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Product — BO Gadgets" }] }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [viewers, setViewers] = useState(() => 4 + Math.floor(Math.random() * 20));

  const { data, isLoading } = useQuery({
    queryKey: ["public", "product", id],
    queryFn: () => getPublicProduct({ data: { id } }),
  });
  const product = data?.product as PublicProduct | null | undefined;

  const related = useQuery({
    queryKey: ["public", "related", product?.product_type],
    enabled: !!product?.product_type,
    queryFn: () => listPublicProducts({ data: { category: product?.product_type ?? undefined } }),
  });

  useEffect(() => {
    const id = setInterval(() => setViewers(4 + Math.floor(Math.random() * 20)), 30_000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) {
    return <StoreLayout><div className="max-w-7xl mx-auto p-10">Loading…</div></StoreLayout>;
  }
  if (!product) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto p-16 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button onClick={() => navigate({ to: "/" })} className="mt-4">Go Home</Button>
        </div>
      </StoreLayout>
    );
  }

  const dealActive =
    !!product.is_flash_deal && !!product.deal_ends_at && new Date(product.deal_ends_at) > new Date();
  const price = Number(product.price ?? 0);
  const dealPrice = Number(product.deal_price ?? 0);
  const stock = product.stock_qty ?? 0;
  const stockState = stock <= 0 ? "out" : stock <= 5 ? "low" : "ok";

  const relatedList = ((related.data?.products ?? []) as PublicProduct[])
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <div className="aspect-square rounded-2xl bg-surface-elevated/40 flex items-center justify-center overflow-hidden">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-8" />
              )}
            </div>
            {stockState === "low" && (
              <div className="mt-3 rounded-lg bg-deal/10 border border-deal/40 text-deal text-xs px-3 py-2 animate-pulse">
                🔥 Only {stock} left in stock! Order now.
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-deal animate-pulse" />
              Live · {viewers} people viewing
            </div>
          </div>
          <div className="space-y-4">
            {product.product_type && (
              <span className="inline-block text-[11px] px-2 py-1 rounded-full bg-primary/15 text-primary">
                {product.product_type}
              </span>
            )}
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight">{product.name}</h1>
            <StarRating id={product.id} />
            <div className="flex flex-wrap gap-2">
              {product.ram && <span className="text-[11px] px-2 py-1 rounded-full bg-primary/15 text-primary">RAM {product.ram}</span>}
              {product.storage && <span className="text-[11px] px-2 py-1 rounded-full bg-purple-500/15 text-purple-300">{product.storage}</span>}
              {product.color && <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{product.color}</span>}
            </div>
            <div className="text-xs text-muted-foreground">SKU: {(product as PublicProduct & { sku?: string }).sku ?? ""}</div>

            {dealActive ? (
              <div className="space-y-1">
                <span className="inline-block text-[11px] font-bold px-2 py-1 rounded bg-deal text-deal-foreground">🔥 FLASH DEAL</span>
                <div className="text-sm text-muted-foreground line-through">{formatNaira(price)}</div>
                <div className="font-display font-bold text-4xl text-deal">{formatNaira(dealPrice)}</div>
                <div className="text-xs text-deal">ENDS IN <Countdown endsAt={product.deal_ends_at} /></div>
              </div>
            ) : (
              <div className="font-display font-bold text-3xl">{formatNaira(price)}</div>
            )}

            <div>
              {stockState === "ok" && <span className="text-success text-sm">✓ In Stock</span>}
              {stockState === "low" && <span className="text-warning text-sm">⚠ Only {stock} left!</span>}
              {stockState === "out" && <span className="text-destructive text-sm">✗ Out of Stock</span>}
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-7 pt-2">{product.description}</p>
            )}

            <Button
              size="lg"
              className="w-full h-14 text-base mt-4"
              disabled={stockState === "out"}
              onClick={() =>
                cart.add({
                  id: product.id,
                  name: product.name,
                  price: dealActive ? dealPrice : price,
                  image_url: product.image_url,
                })
              }
            >
              {stockState === "out" ? "Out of stock" : "Add to Cart"}
            </Button>
          </div>
        </div>

        {relatedList.length > 0 && (
          <section className="mt-20">
            <h2 className="text-xl font-display font-bold mb-6">Related products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedList.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        <div className="mt-12 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Continue shopping</Link>
        </div>
      </div>
    </StoreLayout>
  );
}
