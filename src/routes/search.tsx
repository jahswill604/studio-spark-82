import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import { ProductCard, type PublicProduct } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { Button } from "@/components/ui/button";
import { listPublicProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional().default("") }),
  head: () => ({ meta: [{ title: "Search — Studio Store" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => listPublicProducts({ data: { search: q } }),
    enabled: !!q,
  });
  const list = (data?.products ?? []) as PublicProduct[];

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          Results for &ldquo;{q}&rdquo;
        </h1>
        <div className="text-sm text-muted-foreground mt-1">
          {isLoading ? "Searching…" : `${list.length} result${list.length === 1 ? "" : "s"}`}
        </div>
        {list.length === 0 && !isLoading ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-muted-foreground">No products match your search.</p>
            <Button asChild><Link to="/">Browse all products</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
