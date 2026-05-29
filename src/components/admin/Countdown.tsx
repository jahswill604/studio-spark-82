import { useEffect, useState } from "react";

export function Countdown({ endsAt, onExpire }: { endsAt: string | null; onExpire?: () => void }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!endsAt) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  const end = new Date(endsAt).getTime();
  const diff = Math.max(0, end - now);

  if (diff === 0) {
    if (onExpire) setTimeout(onExpire, 0);
    return <span className="font-mono text-xs text-deal">ENDED</span>;
  }

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <span className="font-mono text-xs tabular-nums text-deal">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
