import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { FlashDealsPanel } from "@/components/admin/FlashDealsPanel";
import { ProductTable } from "@/components/admin/ProductTable";
import { UploadZone } from "@/components/admin/UploadZone";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Studio Admin" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const auth = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (auth.loading) return <div className="min-h-screen bg-admin-bg" />;
  if (!auth.userId || !auth.isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Drop images, fill the cards, save in bulk.</p>
        </div>
        <FlashDealsPanel />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Bulk Upload</h2>
          <UploadZone onSavedRefresh={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">All Products</h2>
          <ProductTable refreshKey={refreshKey} />
        </section>
      </div>
    </AdminLayout>
  );
}
