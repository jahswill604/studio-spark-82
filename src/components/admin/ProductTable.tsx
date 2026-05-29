import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Countdown } from "@/components/admin/Countdown";
import { showUndoToast } from "@/components/admin/undoToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  deleteProduct,
  listAdminProducts,
  setFlashDeal,
} from "@/lib/products.functions";

import { EditProductModal } from "./EditProductModal";

type Row = Awaited<ReturnType<typeof listAdminProducts>>["products"][number];

const PAGE_SIZE = 25;
const TYPES = ["All", "Phone", "Tablet", "Laptop", "Accessory", "Wearable", "Other"];

export function ProductTable({ refreshKey }: { refreshKey: number }) {
  const { data, refetch } = useQuery({
    queryKey: ["admin", "products", refreshKey],
    queryFn: () => listAdminProducts(),
  });
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [dealsOnly, setDealsOnly] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Row>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [editRow, setEditRow] = useState<Row | null>(null);

  const rows = useMemo(() => {
    const list = (data?.products ?? []).filter((p) => p.is_published);
    let filtered = list;
    if (search) filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (type !== "All") filtered = filtered.filter((p) => p.product_type === type);
    if (dealsOnly) filtered = filtered.filter((p) => p.is_flash_deal);
    filtered = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = typeof av === "number" ? av : Number(av ?? 0);
      const bn = typeof bv === "number" ? bv : Number(bv ?? 0);
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? an - bn : bn - an;
    });
    return filtered;
  }, [data, search, type, dealsOnly, sortKey, sortAsc]);

  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const usePaging = (data?.products?.length ?? 0) > 50;

  function toggleSort(k: keyof Row) {
    if (sortKey === k) setSortAsc((s) => !s);
    else {
      setSortKey(k);
      setSortAsc(true);
    }
  }

  async function onDelete(r: Row) {
    if (!confirm(`Delete "${r.name}"? You can undo within 15 seconds.`)) return;
    try {
      const res = await deleteProduct({ data: { id: r.id } });
      showUndoToast(`Deleted ${res.name || r.name}`, () => refetch());
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-xs">
          <Switch id="deals-only" checked={dealsOnly} onCheckedChange={setDealsOnly} />
          <label htmlFor="deals-only">Flash deals only</label>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">{rows.length} products</div>
      </div>

      <div className="rounded-xl border border-admin-border bg-admin-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left border-b border-admin-border">
              <th></th>
              <Th onClick={() => toggleSort("name")}>Name</Th>
              <Th onClick={() => toggleSort("sku")}>SKU</Th>
              <Th onClick={() => toggleSort("price")}>Price</Th>
              <Th onClick={() => toggleSort("cost")}>Cost</Th>
              <th>Margin</th>
              <Th onClick={() => toggleSort("stock_qty")}>Stock</Th>
              <Th onClick={() => toggleSort("product_type")}>Type</Th>
              <th>Badge</th>
              <th>Flash</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <ProductRow key={r.id} row={r} onEdit={() => setEditRow(r)} onDelete={() => onDelete(r)} onRefresh={refetch} />
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-muted-foreground text-sm">No products</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {usePaging && (
        <div className="flex items-center gap-2 justify-end text-xs">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span>Page {page + 1} of {pageCount}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {editRow && (
        <EditProductModal
          product={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => {
            setEditRow(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <th>
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </th>
  );
}

function MarginBadge({ price, cost }: { price: number; cost: number }) {
  if (!price) return <span className="text-muted-foreground">—</span>;
  const m = ((price - cost) / price) * 100;
  const cls = m > 30 ? "bg-success/15 text-success" : m >= 10 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive";
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{m.toFixed(1)}%</span>;
}

function ProductRow({
  row,
  onEdit,
  onDelete,
  onRefresh,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const price = Number(row.price ?? 0);
  const cost = Number(row.cost ?? 0);
  const [dealOpen, setDealOpen] = useState(false);
  const [dealPrice, setDealPrice] = useState(String(row.deal_price ?? ""));
  const [dealEnds, setDealEnds] = useState(
    row.deal_ends_at ? new Date(row.deal_ends_at).toISOString().slice(0, 16) : "",
  );

  async function turnOff() {
    try {
      await setFlashDeal({
        data: { id: row.id, isFlashDeal: false, dealPrice: null, dealEndsAt: null },
      });
      toast.success("Flash deal ended");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function turnOn() {
    if (!dealPrice || !dealEnds) {
      toast.error("Set deal price and end date");
      return;
    }
    try {
      await setFlashDeal({
        data: {
          id: row.id,
          isFlashDeal: true,
          dealPrice: Number(dealPrice),
          dealEndsAt: new Date(dealEnds).toISOString(),
        },
      });
      toast.success("Flash deal activated");
      setDealOpen(false);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <tr className="[&>td]:px-3 [&>td]:py-2 border-b border-admin-border/60 hover:bg-admin-bg/40">
      <td>
        <div className="h-10 w-10 rounded bg-background overflow-hidden">
          {row.image_url && <img src={row.image_url} alt={row.name} className="w-full h-full object-cover" />}
        </div>
      </td>
      <td className="font-medium">{row.name}</td>
      <td className="text-xs text-muted-foreground">{row.sku}</td>
      <td>₦{price.toLocaleString()}</td>
      <td>₦{cost.toLocaleString()}</td>
      <td><MarginBadge price={price} cost={cost} /></td>
      <td>{row.stock_qty ?? 0}</td>
      <td className="text-xs">{row.product_type ?? "—"}</td>
      <td>
        {row.badge && row.badge !== "None"
          ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{row.badge}</span>
          : <span className="text-muted-foreground">—</span>}
      </td>
      <td>
        {row.is_flash_deal ? (
          <button onClick={turnOff} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/20 text-success">ACTIVE</button>
        ) : (
          <Popover open={dealOpen} onOpenChange={setDealOpen}>
            <PopoverTrigger asChild>
              <button className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">OFF</button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-2">
              <div className="text-xs font-medium">Activate flash deal</div>
              <Input type="number" placeholder="Deal price (₦)" value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} />
              <Input type="datetime-local" value={dealEnds} onChange={(e) => setDealEnds(e.target.value)} />
              <Button size="sm" className="w-full" onClick={turnOn}>Activate</Button>
            </PopoverContent>
          </Popover>
        )}
        {row.is_flash_deal && row.deal_ends_at && (
          <div className="mt-1"><Countdown endsAt={row.deal_ends_at} onExpire={onRefresh} /></div>
        )}
      </td>
      <td className="text-right">
        <div className="inline-flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      </td>
    </tr>
  );
}
