import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatNaira } from "@/hooks/useCart";
import { listAdminOrders, updateOrderAdmin } from "@/lib/orders.functions";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
});

const STATUSES = [
  "pending_payment",
  "payment_submitted",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<Status, string> = {
  pending_payment: "Awaiting payment",
  payment_submitted: "Review payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<Status, string> = {
  pending_payment: "bg-yellow-500/15 text-yellow-500",
  payment_submitted: "bg-blue-500/15 text-blue-400",
  paid: "bg-green-500/15 text-green-500",
  processing: "bg-purple-500/15 text-purple-400",
  shipped: "bg-cyan-500/15 text-cyan-400",
  delivered: "bg-emerald-500/15 text-emerald-500",
  cancelled: "bg-red-500/15 text-red-500",
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string | null;
  delivery_state: string | null;
  items: Array<{ id: string; name: string; price: number; qty: number; image_url?: string | null }>;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  status: Status;
  payment_reference: string | null;
  payment_receipt_url: string | null;
  receipt_signed_url: string | null;
  tracking_number: string | null;
  admin_notes: string | null;
  created_at: string;
};

function AdminOrdersPage() {
  const listFn = useServerFn(listAdminOrders);
  const updateFn = useServerFn(updateOrderAdmin);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listFn(),
    refetchInterval: 30000,
  });

  const orders = (data?.orders ?? []) as unknown as OrderRow[];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  async function setStatus(o: OrderRow, status: Status) {
    setUpdatingId(o.id);
    try {
      await updateFn({ data: { id: o.id, status, tracking_number: trackingDraft[o.id] ?? o.tracking_number } });
      toast.success(`Order ${o.order_number} → ${STATUS_LABEL[status]}`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Orders</h1>
        <p className="text-sm text-muted-foreground mb-6">Approve payments and update delivery status.</p>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
          <FilterChip label={`All (${orders.length})`} active={filter === "all"} onClick={() => setFilter("all")} />
          {STATUSES.map((s) => (
            <FilterChip key={s} label={`${STATUS_LABEL[s]} (${counts[s] ?? 0})`} active={filter === s} onClick={() => setFilter(s)} />
          ))}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No orders.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const expanded = expandedId === o.id;
              return (
                <div key={o.id} className="bg-card border border-border rounded-xl">
                  <button
                    onClick={() => setExpandedId(expanded ? null : o.id)}
                    className="w-full text-left p-4 flex flex-wrap items-center gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-semibold">{o.order_number}</div>
                      <div className="text-xs text-muted-foreground truncate">{o.customer_name} · {o.customer_phone}</div>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <div className="text-sm font-semibold w-full sm:w-auto sm:text-right">{formatNaira(Number(o.total))}</div>
                  </button>

                  {expanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-semibold mb-1">Customer</div>
                          <div className="text-muted-foreground space-y-0.5">
                            <div>{o.customer_email}</div>
                            <div>{o.customer_phone}</div>
                            <div>{o.delivery_address}</div>
                            <div>{[o.delivery_city, o.delivery_state].filter(Boolean).join(", ")}</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">Payment</div>
                          <div className="text-muted-foreground space-y-1">
                            <div>Ref: <span className="font-mono text-foreground">{o.payment_reference ?? "—"}</span></div>
                            {o.receipt_signed_url ? (
                              <a href={o.receipt_signed_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                View receipt <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <div>No receipt uploaded</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-2 text-sm">Items</div>
                        <ul className="text-sm divide-y divide-border">
                          {o.items.map((it) => (
                            <li key={it.id} className="py-2 flex justify-between gap-2">
                              <span className="truncate">{it.name} × {it.qty}</span>
                              <span className="font-medium">{formatNaira(it.price * it.qty)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap items-end gap-3">
                        <label className="text-sm flex-1 min-w-[200px]">
                          <span className="block text-xs text-muted-foreground mb-1">Tracking number</span>
                          <input
                            value={trackingDraft[o.id] ?? o.tracking_number ?? ""}
                            onChange={(e) => setTrackingDraft({ ...trackingDraft, [o.id]: e.target.value })}
                            className="w-full h-9 px-3 rounded-md bg-background border border-border text-sm"
                          />
                        </label>
                        <select
                          value={o.status}
                          onChange={(e) => setStatus(o, e.target.value as Status)}
                          disabled={updatingId === o.id}
                          className="h-9 px-3 rounded-md bg-background border border-border text-sm"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
