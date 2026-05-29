import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ProductCard, type PublicProduct } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { listFlashDeals } from "@/lib/products.functions";

export const Route = createFileRoute("/deals")({
  head: () => ({ meta: [{ title: "Deals — Studio Store" }] }),
  component: DealsPage,
});

function DealsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["public", "deals"],
    queryFn: () => listFlashDeals(),
    refetchInterval: 30_000,
  });
  const list = ((data?.products ?? []) as PublicProduct[]).filter(
    (d) => d.deal_ends_at && new Date(d.deal_ends_at) > new Date(),
  );

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-display font-bold">⚡ Active Deals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {list.length} deal{list.length === 1 ? "" : "s"} live right now
        </p>
        {list.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">No active deals — check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {list.map((p) => (
              <div key={p.id} className="rounded-xl deal-glow">
                <ProductCard product={p} onExpire={() => refetch()} />
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
