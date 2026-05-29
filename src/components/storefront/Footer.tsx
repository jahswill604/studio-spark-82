import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-display font-bold text-lg">STUDIO STORE</div>
          <p className="text-sm text-muted-foreground mt-2">Premium devices. Real prices.</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Quick links</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-foreground text-muted-foreground">Home</Link></li>
            <li><Link to="/category/Phone" className="hover:text-foreground text-muted-foreground">Phones</Link></li>
            <li><Link to="/category/Tablet" className="hover:text-foreground text-muted-foreground">Tablets</Link></li>
            <li><Link to="/deals" className="hover:text-foreground text-muted-foreground">Deals</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Contact</div>
          <p className="text-sm text-muted-foreground">support@studiostore.example<br />Lagos, Nigeria</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Studio Store. All rights reserved.
      </div>
    </footer>
  );
}
