import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard, type PublicProduct } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { Button } from "@/components/ui/button";
import { listPublicProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Shop — BO Gadgets" }] }),
  component: ShopPage,
});

const CATEGORIES = ["All", "Phone", "Tablet", "Laptop", "Accessory", "Wearable", "Other"];

function ShopPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["shop", "all"],
    queryFn: () => listPublicProducts({ data: {} }),
  });

  const all = (data?.products ?? []) as PublicProduct[];

  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const list = useMemo(() => {
    let l = all;
    if (cat !== "All") l = l.filter((p) => p.product_type === cat);
    if (search) {
      const q = search.toLowerCase();
      l = l.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (maxPrice !== "" && Number(maxPrice) > 0) {
      l = l.filter((p) => Number(p.price ?? 0) <= Number(maxPrice));
    }
    if (onlyDeals) {
      l = l.filter((p) => p.is_flash_deal && p.deal_ends_at && new Date(p.deal_ends_at) > new Date());
    }
    if (inStock) l = l.filter((p) => (p.stock_qty ?? 0) > 0);

    l = [...l];
    switch (sort) {
      case "price-asc":
        l.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
        break;
      case "price-desc":
        l.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
        break;
      case "name":
        l.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return l;
  }, [all, cat, search, sort, maxPrice, onlyDeals, inStock]);

  const activeFilters =
    (cat !== "All" ? 1 : 0) + (maxPrice !== "" ? 1 : 0) + (onlyDeals ? 1 : 0) + (inStock ? 1 : 0);

  const Filters = (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Category</div>
        <div className="space-y-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                cat === c ? "bg-primary text-primary-foreground" : "hover:bg-surface-elevated text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Max price (₦)</div>
        <input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 500000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full h-10 rounded-lg bg-surface-elevated border border-border px-3 text-sm focus-visible:ring-2 focus-visible:ring-primary outline-none"
        />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={onlyDeals} onChange={(e) => setOnlyDeals(e.target.checked)} className="accent-primary h-4 w-4" />
          Flash deals only
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-primary h-4 w-4" />
          In stock only
        </label>
      </div>
      {activeFilters > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setCat("All");
            setMaxPrice("");
            setOnlyDeals(false);
            setInStock(false);
          }}
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold">Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "Loading…" : `${list.length} product${list.length === 1 ? "" : "s"} available`}
          </p>
        </div>

        {/* Search + sort + mobile filter trigger */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-elevated border border-border text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-lg bg-surface-elevated border border-border px-3 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="name">Name A–Z</option>
          </select>
          <Button
            variant="outline"
            className="lg:hidden h-10"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Desktop filters */}
          <aside className="hidden lg:block sticky top-20 self-start rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Filters</span>
            </div>
            {Filters}
          </aside>

          {/* Mobile filter drawer */}
          {filterOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setFilterOpen(false)}>
              <div
                className="absolute right-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-background border-l border-border p-5 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <span className="font-medium">Filters</span>
                  </div>
                  <button onClick={() => setFilterOpen(false)} className="h-8 w-8 rounded-full hover:bg-surface-elevated flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {Filters}
                <Button className="w-full mt-6" onClick={() => setFilterOpen(false)}>
                  Show {list.length} products
                </Button>
              </div>
            </div>
          )}

          <div>
            {list.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-16 text-center">
                <div className="text-muted-foreground">No products match your filters.</div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setCat("All");
                    setSearch("");
                    setMaxPrice("");
                    setOnlyDeals(false);
                    setInStock(false);
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {list.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
