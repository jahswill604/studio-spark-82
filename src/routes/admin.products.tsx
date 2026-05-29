import { createFileRoute, Navigate } from "@tanstack/react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductTable } from "@/components/admin/ProductTable";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Studio Admin" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const auth = useAuth();
  if (auth.loading) return <div className="min-h-screen bg-admin-bg" />;
  if (!auth.userId || !auth.isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <ProductTable refreshKey={0} />
      </div>
    </AdminLayout>
  );
}
