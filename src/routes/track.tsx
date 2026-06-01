import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { StoreLayout } from "@/components/storefront/StoreLayout";

export const Route = createFileRoute("/track")({
  component: TrackPage,
  head: () => ({ meta: [{ title: "Track your order — BO Gadgets" }] }),
});

function TrackPage() {
  const [num, setNum] = useState("");
  const navigate = useNavigate();
  return (
    <StoreLayout>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Track your order</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter the order number we sent you (e.g. BOG-XXXXXX).</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (num.trim()) navigate({ to: "/orders/$orderNumber", params: { orderNumber: num.trim().toUpperCase() } });
          }}
          className="flex gap-2"
        >
          <input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="BOG-XXXXXX"
            className="flex-1 h-12 px-4 rounded-lg bg-background border border-border text-sm font-mono uppercase"
          />
          <button className="h-12 px-5 rounded-lg bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2">
            <Search className="h-4 w-4" /> Track
          </button>
        </form>
      </div>
    </StoreLayout>
  );
}
