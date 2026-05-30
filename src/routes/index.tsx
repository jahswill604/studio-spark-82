import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Headphones,
  Laptop,
  Package,
  RefreshCw,
  Shield,
  Smartphone,
  Star,
  Tablet,
  Truck,
  Watch,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductCard, type PublicProduct } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { Button } from "@/components/ui/button";
import { listFlashDeals, listPublicProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "BO Gadgets — Smart Tech for Modern Living" }] }),
  component: HomePage,
});

const CATEGORIES: { type: string; label: string; Icon: typeof Smartphone }[] = [
  { type: "Phone", label: "Phones", Icon: Smartphone },
  { type: "Tablet", label: "Tablets", Icon: Tablet },
  { type: "Laptop", label: "Laptops", Icon: Laptop },
  { type: "Accessory", label: "Accessories", Icon: Headphones },
  { type: "Wearable", label: "Wearables", Icon: Watch },
  { type: "Other", label: "Others", Icon: Package },
];

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Benin City", "Enugu"];

const TESTIMONIALS = [
  { name: "Chinonso A.", city: "Lagos", text: "Got my iPhone delivered in under 24 hours. Sealed, original, with warranty. BO Gadgets is my plug now." },
  { name: "Aisha M.", city: "Abuja", text: "Traded my old Samsung and topped up — got a brand new flagship. Process was smooth and honest pricing." },
  { name: "Tunde O.", city: "Port Harcourt", text: "Customer support actually picks up. Bought a tablet for work, arrived perfectly packaged." },
];

function HomePage() {
  const products = useQuery({
    queryKey: ["public", "products"],
    queryFn: () => listPublicProducts({ data: {} }),
  });
  const deals = useQuery({
    queryKey: ["public", "deals"],
    queryFn: () => listFlashDeals(),
    refetchInterval: 30_000,
  });

  const all = (products.data?.products ?? []) as PublicProduct[];
  const dealList = (deals.data?.products ?? []) as PublicProduct[];
  const activeDeals = dealList.filter(
    (d) => d.deal_ends_at && new Date(d.deal_ends_at) > new Date(),
  );

  const featured = useMemo(() => all.slice(0, 8), [all]);
  const newArrivals = useMemo(() => [...all].slice(0, 4), [all]);
  const phones = useMemo(() => all.filter((p) => p.product_type === "Phone").slice(0, 4), [all]);

  // Fake purchase notifications
  useEffect(() => {
    if (all.length === 0) return;
    let cancelled = false;
    function schedule() {
      const delay = 45_000 + Math.random() * 45_000;
      setTimeout(() => {
        if (cancelled) return;
        const p = all[Math.floor(Math.random() * all.length)];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        toast(`🔥 Someone in ${city} just bought ${p.name}`, { duration: 4000, position: "bottom-left" });
        schedule();
      }, delay);
    }
    schedule();
    return () => { cancelled = true; };
  }, [all]);

  const heroProduct = activeDeals[0] ?? featured[0];

  return (
    <StoreLayout>
      {/* ===== Hero ===== */}
      <section className="relative hero-aurora overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 min-h-[78vh] md:min-h-[88vh] grid md:grid-cols-2 gap-8 items-center py-16 md:py-20">
          <div className="space-y-6 relative z-10">
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
              <Zap className="h-3 w-3" /> New drops every week
            </span>
            <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              Smart Tech for<br /><span className="text-primary">Modern Living.</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-md">
              Premium phones, tablets and laptops — verified, warranted and delivered across Nigeria.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/shop">Shop now <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/deals">View deals</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> 12-month warranty</div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Fast delivery</div>
              <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" /> Easy trade-in</div>
            </div>
          </div>
          {heroProduct?.image_url && (
            <div className="relative hidden md:flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
              <img
                src={heroProduct.image_url}
                alt={heroProduct.name}
                className="relative w-full max-w-md object-contain drop-shadow-2xl"
              />
            </div>
          )}
        </div>
      </section>

      {/* ===== Trust / Value strip ===== */}
      <section className="border-y border-border bg-surface/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { Icon: Truck, title: "Fast delivery", text: "Across Nigeria" },
            { Icon: Shield, title: "Verified original", text: "Sealed & tested" },
            { Icon: RefreshCw, title: "Trade-in", text: "Swap your old device" },
            { Icon: Headphones, title: "Real support", text: "WhatsApp & phone" },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{title}</div>
                <div className="text-xs text-muted-foreground truncate">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Shop by category ===== */}
      <section className="py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between gap-3 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold">Shop by category</h2>
              <p className="text-sm text-muted-foreground mt-1">Find exactly what you need.</p>
            </div>
            <Link to="/shop" className="text-sm text-primary hover:underline shrink-0">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {CATEGORIES.map(({ type, label, Icon }) => (
              <Link
                key={type}
                to="/category/$type"
                params={{ type }}
                className="group rounded-2xl border border-border bg-card p-4 md:p-6 flex flex-col items-center text-center gap-3 hover:border-primary/40 hover:bg-surface-elevated transition-all hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm">{label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Flash deals ===== */}
      {activeDeals.length > 0 && (
        <section id="flash-deals" className="py-14 md:py-20 border-t border-border bg-surface/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-deal" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold">Flash deals</h2>
                  <p className="text-sm text-muted-foreground mt-1">Limited stock. Real discounts.</p>
                </div>
              </div>
              <Link to="/deals" className="text-sm text-primary hover:underline shrink-0">All deals →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-hide">
              {activeDeals.map((p) => (
                <div key={p.id} className="shrink-0 w-64 sm:w-72 snap-start rounded-2xl deal-glow">
                  <ProductCard product={p} onExpire={() => deals.refetch()} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Featured ===== */}
      {featured.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between gap-3 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold">Featured products</h2>
                <p className="text-sm text-muted-foreground mt-1">Hand-picked by our team.</p>
              </div>
              <Link to="/shop" className="text-sm text-primary hover:underline shrink-0">Shop all →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== Trade-in CTA ===== */}
      <section className="py-14 md:py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-8 md:p-14 grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-primary/20 text-primary">
                <RefreshCw className="h-3 w-3" /> Trade-in program
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                Swap your old device.<br />Upgrade today.
              </h2>
              <p className="text-muted-foreground max-w-md">
                Send us your old phone or tablet, top up the difference, walk away with the latest tech. Book a swap and we'll contact you on WhatsApp.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="h-12 px-6">
                  <Link to="/contact" hash="swap">Book a swap</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6">
                  <a href="https://wa.me/2348132790078" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { n: "5K+", l: "Happy customers" },
                { n: "98%", l: "5-star reviews" },
                { n: "24h", l: "Avg delivery" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-background/50 border border-border p-4">
                  <div className="font-display font-bold text-2xl md:text-3xl text-primary">{s.n}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Phones spotlight ===== */}
      {phones.length > 0 && (
        <section className="py-14 md:py-20 bg-surface/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between gap-3 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold">Trending phones</h2>
                <p className="text-sm text-muted-foreground mt-1">The flagships everyone's buying.</p>
              </div>
              <Link to="/category/$type" params={{ type: "Phone" }} className="text-sm text-primary hover:underline shrink-0">
                All phones →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {phones.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== Testimonials ===== */}
      <section className="py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold">What customers say</h2>
            <p className="text-sm text-muted-foreground mt-2">Real reviews from real Nigerians.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                <div className="text-xs font-medium pt-2 border-t border-border">
                  {t.name} <span className="text-muted-foreground">· {t.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== New arrivals ===== */}
      {newArrivals.length > 0 && (
        <section className="py-14 md:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between gap-3 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold">Just dropped</h2>
                <p className="text-sm text-muted-foreground mt-1">Newest in stock right now.</p>
              </div>
              <Link to="/shop" className="text-sm text-primary hover:underline shrink-0">See all →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== Final CTA ===== */}
      <section className="py-14 md:py-20 bg-surface/40 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Ready to upgrade?</h2>
          <p className="text-muted-foreground">
            Browse our full catalog or talk to us on WhatsApp — we'll help you pick the right device.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6">
              <Link to="/shop">Browse shop</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6">
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>

      {all.length === 0 && !products.isLoading && (
        <section className="py-16 text-center text-muted-foreground">
          No products yet. Sign in as admin to add some.
          <div className="mt-4">
            <Link to="/admin/dashboard" className="text-primary text-sm hover:underline">Go to Admin →</Link>
          </div>
        </section>
      )}
    </StoreLayout>
  );
}
