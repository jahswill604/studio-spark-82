import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/hooks/useCart";
import { listPublicProducts } from "@/lib/products.functions";

type SearchHit = {
  id: string;
  name: string;
  price: number | string | null;
  image_url: string | null;
};

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/category/$type", params: { type: "Phone" }, label: "Phones" },
  { to: "/category/$type", params: { type: "Tablet" }, label: "Tablets" },
  { to: "/category/$type", params: { type: "Accessory" }, label: "Accessories" },
  { to: "/deals", label: "Deals" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { count, open } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!q) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await listPublicProducts({ data: { search: q } });
        setHits(r.products.slice(0, 6) as SearchHit[]);
      } catch {
        setHits([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-background"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 md:px-6 h-16">
        <Link to="/" className="font-display font-bold tracking-tight text-lg md:text-xl shrink-0">
          BO <span className="text-primary">Gadgets</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-5 mx-auto text-sm">
          {NAV_LINKS.map((l) => (
            <Link
              key={`${l.to}-${l.label}`}
              to={l.to}
              params={"params" in l ? l.params : undefined}
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground font-medium" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <div className={`relative flex items-center transition-all ${searchOpen ? "w-44 md:w-64" : "w-9"}`}>
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="absolute right-0 h-9 w-9 flex items-center justify-center rounded-full hover:bg-surface-elevated transition z-10"
              aria-label="Search"
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q) {
                  navigate({ to: "/search", search: { q } });
                  setSearchOpen(false);
                  setQ("");
                }
              }}
              placeholder="Search products…"
              className={`h-9 w-full pl-3 pr-9 rounded-full bg-surface-elevated text-sm outline-none transition-opacity ${
                searchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              } focus-visible:ring-2 focus-visible:ring-primary`}
            />
            {searchOpen && hits.length > 0 && (
              <div className="absolute top-12 right-0 w-72 rounded-xl bg-card border border-border shadow-xl overflow-hidden">
                {hits.map((h) => (
                  <Link
                    key={h.id}
                    to="/product/$id"
                    params={{ id: h.id }}
                    onClick={() => {
                      setSearchOpen(false);
                      setQ("");
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-surface-elevated"
                  >
                    <div className="h-9 w-9 bg-background rounded overflow-hidden shrink-0">
                      {h.image_url && <img src={h.image_url} alt={h.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="text-xs flex-1 min-w-0">
                      <div className="truncate">{h.name}</div>
                      <div className="text-muted-foreground">₦{Number(h.price ?? 0).toLocaleString()}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={open}
            className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-surface-elevated transition"
            aria-label="Cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-9 w-9 flex items-center justify-center rounded-full hover:bg-surface-elevated"
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border">
            <div className="font-display font-bold text-lg">BO <span className="text-primary">Gadgets</span></div>
            <button onClick={() => setMobileOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-surface-elevated" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex flex-col p-4 gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={`m-${l.to}-${l.label}`}
                to={l.to}
                params={"params" in l ? l.params : undefined}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 rounded-lg text-base hover:bg-surface-elevated active:bg-surface-elevated/80"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-4 px-3 text-[11px] uppercase tracking-wider text-muted-foreground">Get in touch</div>
            <a
              href="https://wa.me/2348132790078"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileOpen(false)}
              className="mx-1 mt-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground text-center font-medium"
            >
              Chat on WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
