import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="font-display font-bold text-xl tracking-tight">BO Gadgets</div>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            Smart tech for modern living. Premium phones, tablets and accessories — verified, warranted, delivered.
          </p>
          <div className="flex gap-3 mt-4">
            <a
              href="https://wa.me/2348132790078"
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 rounded-full bg-surface-elevated hover:bg-primary hover:text-primary-foreground transition flex items-center justify-center"
              aria-label="WhatsApp"
            >
              <Phone className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 rounded-full bg-surface-elevated hover:bg-primary hover:text-primary-foreground transition flex items-center justify-center"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Shop</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-foreground text-muted-foreground">All products</Link></li>
            <li><Link to="/category/$type" params={{ type: "Phone" }} className="hover:text-foreground text-muted-foreground">Phones</Link></li>
            <li><Link to="/category/$type" params={{ type: "Tablet" }} className="hover:text-foreground text-muted-foreground">Tablets</Link></li>
            <li><Link to="/category/$type" params={{ type: "Laptop" }} className="hover:text-foreground text-muted-foreground">Laptops</Link></li>
            <li><Link to="/category/$type" params={{ type: "Accessory" }} className="hover:text-foreground text-muted-foreground">Accessories</Link></li>
            <li><Link to="/deals" className="hover:text-foreground text-muted-foreground">Flash deals</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-foreground text-muted-foreground">About us</Link></li>
            <li><Link to="/contact" className="hover:text-foreground text-muted-foreground">Contact</Link></li>
            <li><Link to="/contact" hash="swap" className="hover:text-foreground text-muted-foreground">Book a swap</Link></li>
            <li><Link to="/contact" hash="support" className="hover:text-foreground text-muted-foreground">Support</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Contact</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Phone className="h-3.5 w-3.5 mt-0.5 shrink-0" /> +234 813 279 0078</li>
            <li className="flex items-start gap-2"><Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" /> hello@bogadgets.ng</li>
            <li className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> Lagos, Nigeria</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground px-4">
        © {new Date().getFullYear()} BO Gadgets · Smart Tech for Modern Living. All rights reserved.
      </div>
    </footer>
  );
}
