import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Heart, Shield, Sparkles, Target, Truck, Users } from "lucide-react";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — BO Gadgets" },
      { name: "description", content: "BO Gadgets is Nigeria's trusted source for premium phones, tablets and accessories — verified original, warranted, delivered." },
      { property: "og:title", content: "About BO Gadgets" },
      { property: "og:description", content: "Smart tech for modern living. Built for Nigerians, by Nigerians." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <StoreLayout>
      {/* Hero */}
      <section className="hero-aurora">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 md:py-28 text-center space-y-6">
          <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
            <Sparkles className="h-3 w-3" /> About us
          </span>
          <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight">
            Smart tech for <span className="text-primary">modern living.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            BO Gadgets is Nigeria's trusted source for premium phones, tablets, laptops and accessories — verified original, warranted, and delivered to your door.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-primary">Our story</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Built for Nigerians, by Nigerians.</h2>
          </div>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              We started BO Gadgets because buying a phone in Nigeria shouldn't be a gamble. Too many people lose money to fake devices, inflated prices, and zero after-sales support.
            </p>
            <p>
              Today, we deliver verified-original devices with real warranty, fair pricing, and human support — the way it should always have been.
            </p>
            <p>
              From flagship phones to wearables and accessories, every product is checked, sealed and shipped fast. And if you want to upgrade, our trade-in program makes it easy.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-surface/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-wider text-primary mb-2">What we stand for</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Our values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { Icon: Shield, title: "Authenticity", text: "Every device is verified original, sealed, and tested before shipping." },
              { Icon: Heart, title: "Honesty", text: "Fair pricing, transparent specs, and no hidden fees. Ever." },
              { Icon: Truck, title: "Speed", text: "Most Lagos orders arrive same-day. Nationwide in 24–72 hours." },
              { Icon: Users, title: "Real support", text: "Talk to a human on WhatsApp, phone, or email — fast." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-medium">{title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-6 grid sm:grid-cols-3 gap-4 md:gap-6 text-center">
          {[
            { n: "5,000+", l: "Happy customers", Icon: Users },
            { n: "98%", l: "5-star reviews", Icon: Award },
            { n: "24h", l: "Average delivery", Icon: Target },
          ].map(({ n, l, Icon }) => (
            <div key={l} className="rounded-2xl border border-border bg-card p-8 space-y-2">
              <Icon className="h-6 w-6 mx-auto text-primary" />
              <div className="font-display font-bold text-3xl md:text-4xl text-primary">{n}</div>
              <div className="text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-surface/40 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Ready when you are.</h2>
          <p className="text-muted-foreground">Browse the shop or reach out — we're happy to help you pick the right device.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6"><Link to="/shop">Shop now</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6"><Link to="/contact">Contact us</Link></Button>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
