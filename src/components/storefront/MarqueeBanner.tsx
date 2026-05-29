export function MarqueeBanner() {
  const text =
    "FREE DELIVERY ON ORDERS OVER ₦50,000  ·  ORIGINAL PRODUCTS ONLY  ·  12-MONTH WARRANTY ON ALL DEVICES  ·  VERIFIED SELLER  ·  ";
  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <div className="flex whitespace-nowrap marquee-scroll text-[11px] font-medium py-1.5">
        <span className="px-4">{text.repeat(4)}</span>
        <span className="px-4" aria-hidden="true">{text.repeat(4)}</span>
      </div>
    </div>
  );
}
