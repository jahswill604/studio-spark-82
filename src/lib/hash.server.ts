// Hamming distance helper for server-side dup check.
export function hammingDistance(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b || a.length !== b.length) return 999;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}
