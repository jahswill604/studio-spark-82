import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ProductCard, type PublicProduct } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { listPublicProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/category/$type")({
  head: ({ params }) => ({ meta: [{ title: `${params.type}s — BO Gadgets` }] }),
  component: CategoryPage,
});

function CategoryPage() {
  const { type } = Route.useParams();
  const [sort, setSort] = useState("newest");
  const { data, isLoading } = useQuery({
    queryKey: ["category", type],
    queryFn: () => listPublicProducts({ data: { category: type } }),
  });

  const list = useMemo(() => {
    const items = [...((data?.products ?? []) as PublicProduct[])];
    switch (sort) {
      case "price-asc": items.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)); break;
      case "price-desc": items.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0)); break;
      case "name": items.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return items;
  }, [data, sort]);

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">{type}s</h1>
            <div className="text-sm text-muted-foreground mt-1">
              {isLoading ? "Loading…" : `${list.length} product${list.length === 1 ? "" : "s"}`}
            </div>
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </StoreLayout>
  );
}
