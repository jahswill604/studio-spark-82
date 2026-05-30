import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone, RefreshCw, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BO Gadgets" },
      { name: "description", content: "Get in touch with BO Gadgets — WhatsApp, phone, email, or book a device swap." },
      { property: "og:title", content: "Contact BO Gadgets" },
      { property: "og:description", content: "WhatsApp, phone, email, or book a device swap. We're here to help." },
    ],
  }),
  component: ContactPage,
});

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  whatsapp: z.string().trim().regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid phone/WhatsApp number"),
  message: z.string().trim().min(5, "Tell us a bit more").max(1000),
});

const SwapSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  whatsapp: z.string().trim().regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid WhatsApp number"),
  device: z.string().trim().min(2, "Tell us your current device").max(200),
  upgrade: z.string().trim().max(200).optional(),
});

function ContactForm() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = ContactSchema.safeParse({ name, whatsapp, message });
    if (!r.success) {
      toast.error(r.error.issues[0]?.message ?? "Check your inputs");
      return;
    }
    setSending(true);
    const text = `Hi BO Gadgets! I'm ${r.data.name}.\nWhatsApp: ${r.data.whatsapp}\n\n${r.data.message}`;
    const url = `https://wa.me/2348132790078?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp…");
    setTimeout(() => {
      setSending(false);
      setName("");
      setWhatsapp("");
      setMessage("");
    }, 600);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chinonso"
            className="w-full mt-1 h-11 rounded-lg bg-surface-elevated border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            maxLength={100}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">WhatsApp / phone</label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="0813 279 0078"
            className="w-full mt-1 h-11 rounded-lg bg-surface-elevated border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            maxLength={20}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">How can we help?</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about a product, delivery, warranty…"
          rows={5}
          className="w-full mt-1 rounded-lg bg-surface-elevated border border-border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
          maxLength={1000}
        />
      </div>
      <Button type="submit" disabled={sending} size="lg" className="w-full h-12">
        <Send className="h-4 w-4" /> {sending ? "Opening WhatsApp…" : "Send via WhatsApp"}
      </Button>
    </form>
  );
}

function SwapForm() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [device, setDevice] = useState("");
  const [upgrade, setUpgrade] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = SwapSchema.safeParse({ name, whatsapp, device, upgrade });
    if (!r.success) {
      toast.error(r.error.issues[0]?.message ?? "Check your inputs");
      return;
    }
    setSending(true);
    const text =
      `Hi BO Gadgets — I'd like to book a SWAP.\n` +
      `Name: ${r.data.name}\n` +
      `WhatsApp: ${r.data.whatsapp}\n` +
      `Current device: ${r.data.device}\n` +
      (r.data.upgrade ? `Wants to upgrade to: ${r.data.upgrade}\n` : "");
    const url = `https://wa.me/2348132790078?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp — we'll reach you shortly");
    setTimeout(() => {
      setSending(false);
      setName("");
      setWhatsapp("");
      setDevice("");
      setUpgrade("");
    }, 600);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="h-11 rounded-lg bg-surface-elevated border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          maxLength={100}
        />
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp number"
          className="h-11 rounded-lg bg-surface-elevated border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          maxLength={20}
        />
      </div>
      <input
        value={device}
        onChange={(e) => setDevice(e.target.value)}
        placeholder="Your current device (e.g. iPhone 13 128GB)"
        className="w-full h-11 rounded-lg bg-surface-elevated border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        maxLength={200}
      />
      <input
        value={upgrade}
        onChange={(e) => setUpgrade(e.target.value)}
        placeholder="What you want to swap to (optional)"
        className="w-full h-11 rounded-lg bg-surface-elevated border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        maxLength={200}
      />
      <Button type="submit" disabled={sending} size="lg" className="w-full h-12">
        <RefreshCw className="h-4 w-4" /> {sending ? "Opening WhatsApp…" : "Book my swap"}
      </Button>
    </form>
  );
}

function ContactPage() {
  return (
    <StoreLayout>
      <section className="hero-aurora">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center space-y-4">
          <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight">Get in touch</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Questions, orders, support, or a device swap — we respond fast.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid lg:grid-cols-3 gap-6">
          {/* Channels */}
          <div className="space-y-4">
            <a
              href="https://wa.me/2348132790078"
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">WhatsApp</div>
                  <div className="text-sm text-muted-foreground">Fastest reply</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-primary group-hover:underline">+234 813 279 0078</div>
            </a>
            <a href="tel:+2348132790078" className="block rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Call us</div>
                  <div className="text-sm text-muted-foreground">Mon–Sat, 9am–7pm</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-primary group-hover:underline">+234 813 279 0078</div>
            </a>
            <a href="mailto:hello@bogadgets.ng" className="block rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-sm text-muted-foreground">For longer questions</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-primary group-hover:underline">hello@bogadgets.ng</div>
            </a>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-sm text-muted-foreground">Lagos, Nigeria</div>
                </div>
              </div>
            </div>
          </div>

          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            <div id="support" className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display font-bold text-xl mb-1">Send us a message</h2>
              <p className="text-sm text-muted-foreground mb-5">We'll reply on WhatsApp within minutes.</p>
              <ContactForm />
            </div>

            <div id="swap" className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 md:p-8">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="h-5 w-5 text-primary" />
                <h2 className="font-display font-bold text-xl">Book a swap</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Trade in your current device. We'll contact you on WhatsApp with a valuation.
              </p>
              <SwapForm />
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
