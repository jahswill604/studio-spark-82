import { type ReactNode } from "react";

import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { MarqueeBanner } from "./MarqueeBanner";
import { Navbar } from "./Navbar";

export function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarqueeBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
