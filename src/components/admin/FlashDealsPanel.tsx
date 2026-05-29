import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Countdown } from "@/components/admin/Countdown";
import { Button } from "@/components/ui/button";
import { listAdminProducts, setFlashDeal } from "@/lib/products.functions";

export function FlashDealsPanel() {
  const { data, refetch } = useQuery({
    queryKey: ["admin", "flash-deals"],
    queryFn: () => listAdminProducts(),
    refetchInterval: 30_000,
  });

  const deals = (data?.products ?? []).filter(
    (p) => p.is_published && p.is_flash_deal && p.deal_ends_at && new Date(p.deal_ends_at) > new Date(),
  );

  async function end(id: string) {
    try {
      await setFlashDeal({ data: { id, isFlashDeal: false, dealPrice: null, dealEndsAt: null } });
      toast.success("Deal ended");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="rounded-xl border border-admin-border bg-admin-surface">
      <div className="px-4 py-3 border-b border-admin-border flex items-center justify-between">
        <h2 className="text-sm font-semibold">⚡ Active Flash Deals</h2>
        <span className="text-xs text-muted-foreground">{deals.length} active</span>
      </div>
      {deals.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No active flash deals</div>
      ) : (
        <ul className="divide-y divide-admin-border">
          {deals.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 rounded bg-background overflow-hidden shrink-0">
                {d.image_url && <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.name}</div>
                <div className="text-xs">
                  <span className="text-deal font-semibold">₦{Number(d.deal_price ?? 0).toLocaleString()}</span>
                  <span className="line-through text-muted-foreground ml-2">₦{Number(d.price ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <Countdown endsAt={d.deal_ends_at} onExpire={refetch} />
              <Button size="sm" variant="outline" onClick={() => end(d.id)}>End Deal Now</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
