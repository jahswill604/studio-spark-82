import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Package, ShoppingBag, X, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/flash-deals", label: "Flash Deals", icon: Zap },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  const Nav = (
    <nav className="flex-1 p-3 space-y-1">
      {items.map((it) => {
        const active = path.startsWith(it.to);
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
              active
                ? "bg-admin-accent/15 text-foreground"
                : "text-muted-foreground hover:bg-admin-surface hover:text-foreground"
            }`}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-admin-bg text-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-admin-surface border-b border-admin-border flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 rounded-md hover:bg-admin-bg flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="font-bold tracking-tight">BO Admin</div>
        <Link to="/" className="ml-auto text-xs text-muted-foreground">View site</Link>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-admin-surface border-r border-admin-border flex flex-col">
            <div className="px-5 py-5 border-b border-admin-border flex items-center justify-between">
              <div>
                <div className="text-lg font-bold tracking-tight">BO Admin</div>
                <div className="text-xs text-muted-foreground truncate">{auth.email ?? ""}</div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="h-8 w-8 rounded-md hover:bg-admin-bg flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            {Nav}
            <div className="p-3 border-t border-admin-border">
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-admin-bg hover:text-foreground">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex">
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-admin-border bg-admin-surface min-h-screen sticky top-0">
          <div className="px-5 py-5 border-b border-admin-border">
            <div className="text-lg font-bold tracking-tight">BO Admin</div>
            <div className="text-xs text-muted-foreground truncate">{auth.email ?? ""}</div>
          </div>
          {Nav}
          <div className="p-3 border-t border-admin-border">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-admin-bg hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0 min-h-screen p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
