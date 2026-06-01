import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Clock, Loader2, Package, Truck } from "lucide-react";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { formatNaira } from "@/hooks/useCart";
import { getOrderByNumber } from "@/lib/orders.functions";

export const Route = createFileRoute("/orders/$orderNumber")({
  component: OrderTrackPage,
  head: () => ({ meta: [{ title: "Track order — BO Gadgets" }] }),
});

const STEPS = [
  { key: "pending_payment", label: "Awaiting payment", icon: Clock },
  { key: "payment_submitted", label: "Payment under review", icon: Clock },
  { key: "paid", label: "Payment confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Preparing your order", icon: Package },
  { key: "shipped", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

function OrderTrackPage() {
  const { orderNumber } = Route.useParams();
  const getOrder = useServerFn(getOrderByNumber);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => getOrder({ data: { order_number: orderNumber } }),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="py-20 text-center text-muted-foreground"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>
      </StoreLayout>
    );
  }

  if (!data?.order) {
    return (
      <StoreLayout>
        <div className="max-w-md mx-auto py-16 px-4 text-center">
          <h1 className="text-xl font-bold mb-2">Order not found</h1>
          <p className="text-sm text-muted-foreground mb-6">We couldn't find an order with that number.</p>
          <Link to="/shop" className="h-11 px-5 inline-flex items-center rounded-lg bg-primary text-primary-foreground font-semibold">Shop</Link>
        </div>
      </StoreLayout>
    );
  }

  const order = data.order;
  const items = (order.items as Array<{ id: string; name: string; price: number; qty: number; image_url?: string | null }>) ?? [];
  const status = order.status as typeof STEPS[number]["key"] | "cancelled";
  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <StoreLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Order {order.order_number}</h1>
            <p className="text-sm text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <button onClick={() => refetch()} className="h-9 px-3 rounded-md border border-border text-xs flex items-center gap-1.5">
            {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            Refresh
          </button>
        </div>

        {status === "cancelled" ? (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 mb-6">
            This order was cancelled. Contact support if you need help.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
            <h2 className="font-semibold mb-4">Delivery status</h2>
            <ol className="space-y-3">
              {STEPS.map((s, i) => {
                const reached = i <= currentIdx;
                const Icon = reached ? s.icon : Circle;
                return (
                  <li key={s.key} className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${reached ? "text-primary" : "text-muted-foreground/40"}`} />
                    <span className={`text-sm ${reached ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
                    {i === currentIdx && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">Current</span>}
                  </li>
                );
              })}
            </ol>
            {order.tracking_number && (
              <div className="mt-4 text-sm">
                <span className="text-muted-foreground">Tracking #: </span>
                <span className="font-mono">{order.tracking_number}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-sm">Delivery to</h3>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <div className="text-foreground">{order.customer_name}</div>
              <div>{order.customer_phone}</div>
              <div>{order.delivery_address}</div>
              {(order.delivery_city || order.delivery_state) && (
                <div>{[order.delivery_city, order.delivery_state].filter(Boolean).join(", ")}</div>
              )}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-sm">Totals</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatNaira(Number(order.delivery_fee))}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1"><span>Total</span><span>{formatNaira(Number(order.total))}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3 text-sm">Items</h3>
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3">
                <div className="h-14 w-14 rounded bg-background overflow-hidden shrink-0">
                  {it.image_url && <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.name}</div>
                  <div className="text-xs text-muted-foreground">Qty {it.qty}</div>
                </div>
                <div className="text-sm font-semibold">{formatNaira(it.price * it.qty)}</div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Save this page or the order number <span className="font-mono">{order.order_number}</span> to check status anytime at /orders/{order.order_number}.
        </p>
      </div>
    </StoreLayout>
  );
}
