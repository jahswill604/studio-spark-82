import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductCard, type PublicProduct } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { Button } from "@/components/ui/button";
import { listFlashDeals, listPublicProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Studio Store — Premium Phones, Real Prices" }] }),
  component: HomePage,
});

const CATEGORIES = ["All", "Phone", "Tablet", "Laptop", "Accessory", "Wearable", "Other"];
const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Benin City", "Enugu"];

function HomePage() {
  const products = useQuery({
    queryKey: ["public", "products"],
    queryFn: () => listPublicProducts({ data: {} }),
  });
  const deals = useQuery({
    queryKey: ["public", "deals"],
    queryFn: () => listFlashDeals(),
    refetchInterval: 30_000,
  });

  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("newest");

  const all = (products.data?.products ?? []) as PublicProduct[];
  const dealList = (deals.data?.products ?? []) as PublicProduct[];
  const activeDeals = dealList.filter(
    (d) => d.deal_ends_at && new Date(d.deal_ends_at) > new Date(),
  );

  const filtered = useMemo(() => {
    let list = cat === "All" ? all : all.filter((p) => p.product_type === cat);
    list = [...list];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
        break;
      case "price-desc":
        list.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [all, cat, sort]);

  // Fake purchase notifications
  useEffect(() => {
    if (all.length === 0) return;
    let cancelled = false;
    function schedule() {
      const delay = 45_000 + Math.random() * 45_000;
      setTimeout(() => {
        if (cancelled) return;
        const p = all[Math.floor(Math.random() * all.length)];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        toast(`🔥 Someone in ${city} just bought ${p.name}`, { duration: 4000, position: "bottom-left" });
        schedule();
      }, delay);
    }
    schedule();
    return () => { cancelled = true; };
  }, [all]);

  return (
    <StoreLayout>
      {/* Hero */}
      <section className="relative hero-aurora overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 min-h-[88vh] flex flex-col justify-center py-20">
          <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-4xl">
            Premium Phones.<br />Unreal Prices.
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mt-6 max-w-xl">
            The latest flagship tech, delivered to your door.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <a href="#all-products">Shop Now</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <a href="#flash-deals">View Deals</a>
            </Button>
          </div>
          {all[0]?.image_url && (
            <img
              src={all[0].image_url}
              alt=""
              aria-hidden
              className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 w-[420px] opacity-30 pointer-events-none"
            />
          )}
        </div>
      </section>

      {/* Flash deals */}
      {activeDeals.length > 0 && (
        <section id="flash-deals" className="py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl md:text-3xl font-display font-bold">⚡ Flash Deals</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-deal text-deal-foreground px-2 py-1 rounded-full animate-pulse">
                Limited time
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x">
              {activeDeals.map((p) => (
                <div key={p.id} className="shrink-0 w-72 snap-start rounded-xl deal-glow">
                  <ProductCard product={p} onExpire={() => deals.refetch()} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All products */}
      <section id="all-products" className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-display font-bold">All Products</h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-lg bg-surface-elevated border border-border px-3 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`text-xs px-3 py-1.5 rounded-full transition ${
                  cat === c ? "bg-foreground text-background" : "bg-surface-elevated text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {products.isLoading ? "Loading…" : "No products yet. Sign in as admin to add some."}
              <div className="mt-4">
                <Link to="/admin/dashboard" className="text-primary text-sm hover:underline">Go to Admin →</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onExpire={() => deals.refetch()} />
              ))}
            </div>
          )}
        </div>
      </section>
    </StoreLayout>
  );
}
