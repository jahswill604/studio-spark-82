import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Package, Zap } from "lucide-react";
import { type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/flash-deals", label: "Flash Deals", icon: Zap },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-admin-bg text-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="flex">
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-admin-border bg-admin-surface min-h-screen">
          <div className="px-5 py-5 border-b border-admin-border">
            <div className="text-lg font-bold tracking-tight">Studio Admin</div>
            <div className="text-xs text-muted-foreground truncate">{auth.email ?? ""}</div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {items.map((it) => {
              const active = path.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
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
          <div className="p-3 border-t border-admin-border">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-admin-surface hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 min-h-screen p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
