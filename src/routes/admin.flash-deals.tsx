import { createFileRoute, Navigate } from "@tanstack/react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { FlashDealsPanel } from "@/components/admin/FlashDealsPanel";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/flash-deals")({
  head: () => ({ meta: [{ title: "Flash Deals — Studio Admin" }] }),
  component: FlashDealsPage,
});

function FlashDealsPage() {
  const auth = useAuth();
  if (auth.loading) return <div className="min-h-screen bg-admin-bg" />;
  if (!auth.userId || !auth.isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Flash Deals</h1>
        <FlashDealsPanel />
      </div>
    </AdminLayout>
  );
}
