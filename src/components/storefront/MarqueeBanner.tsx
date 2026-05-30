export function MarqueeBanner() {
  const text =
    "FAST DELIVERY ACROSS NIGERIA  ·  100% ORIGINAL PRODUCTS  ·  12-MONTH WARRANTY  ·  TRADE-IN YOUR OLD DEVICE  ·  PAY ON DELIVERY IN LAGOS  ·  ";
  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <div className="flex whitespace-nowrap marquee-scroll text-[11px] font-medium py-1.5">
        <span className="px-4">{text.repeat(4)}</span>
        <span className="px-4" aria-hidden="true">{text.repeat(4)}</span>
      </div>
    </div>
  );
}
