import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { formatNaira, useCart } from "@/hooks/useCart";
import { createOrder, submitPaymentProof } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — BO Gadgets" },
      { name: "description", content: "Secure checkout with Opay bank transfer. Fast delivery across Nigeria." },
    ],
  }),
});

const BANK = {
  name: "Opay",
  account_name: "Jahswill Omenazu",
  account_number: "8132790078",
};

const DELIVERY_FEE = 2500;

type Step = "details" | "payment" | "done";

function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const createOrderFn = useServerFn(createOrder);
  const submitPaymentFn = useServerFn(submitPaymentProof);

  const [step, setStep] = useState<Step>("details");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [orderTotal, setOrderTotal] = useState<number>(0);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_address: "",
    delivery_city: "",
    delivery_state: "",
    delivery_notes: "",
  });

  const [payRef, setPayRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const subtotal = cart.subtotal;
  const total = subtotal + (cart.items.length > 0 ? DELIVERY_FEE : 0);

  if (cart.items.length === 0 && step === "details") {
    return (
      <StoreLayout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground mb-6">Add items to your cart before checking out.</p>
          <button
            onClick={() => navigate({ to: "/shop" })}
            className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium"
          >
            Shop now
          </button>
        </div>
      </StoreLayout>
    );
  }

  async function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createOrderFn({
        data: {
          ...form,
          delivery_fee: DELIVERY_FEE,
          items: cart.items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            qty: i.qty,
            image_url: i.image_url,
          })),
        },
      });
      setOrderNumber(res.order.order_number);
      setOrderTotal(Number(res.order.total));
      setStep("payment");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create order");
    } finally {
      setSubmitting(false);
    }
  }

  async function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = String(r.result || "");
        resolve(s.split(",")[1] || "");
      };
      r.onerror = reject;
      r.readAsDataURL(f);
    });
  }

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payRef.trim()) {
      toast.error("Enter your transaction reference / Opay transfer ID");
      return;
    }
    setSubmitting(true);
    try {
      let receipt_base64: string | undefined;
      let receipt_filename: string | undefined;
      let receipt_content_type: string | undefined;
      if (receiptFile) {
        receipt_base64 = await fileToBase64(receiptFile);
        receipt_filename = receiptFile.name;
        receipt_content_type = receiptFile.type;
      }
      await submitPaymentFn({
        data: {
          order_number: orderNumber,
          payment_reference: payRef.trim(),
          receipt_base64,
          receipt_filename,
          receipt_content_type,
        },
      });
      cart.clear();
      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <StoreLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Checkout</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {step === "details" && "Step 1 of 2 — Delivery details"}
          {step === "payment" && "Step 2 of 2 — Payment"}
          {step === "done" && "Order received"}
        </p>

        {step === "details" && (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <form onSubmit={handleSubmitDetails} className="space-y-4 bg-card border border-border rounded-xl p-4 md:p-6">
              <Field label="Full name" required>
                <input
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="input"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email" required>
                  <input
                    required
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Phone (WhatsApp)" required>
                  <input
                    required
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Delivery address" required>
                <textarea
                  required
                  rows={2}
                  value={form.delivery_address}
                  onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                  className="input"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="City">
                  <input value={form.delivery_city} onChange={(e) => setForm({ ...form, delivery_city: e.target.value })} className="input" />
                </Field>
                <Field label="State">
                  <input value={form.delivery_state} onChange={(e) => setForm({ ...form, delivery_state: e.target.value })} className="input" />
                </Field>
              </div>
              <Field label="Delivery notes (optional)">
                <textarea rows={2} value={form.delivery_notes} onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })} className="input" />
              </Field>
              <button
                disabled={submitting}
                className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue to payment
              </button>
            </form>

            <OrderSummary subtotal={subtotal} total={total} count={cart.count} />
          </div>
        )}

        {step === "payment" && (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Pay with Opay bank transfer</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Transfer exactly <span className="font-semibold text-foreground">{formatNaira(orderTotal)}</span> to the account
                  below, then submit your transaction reference so we can confirm and ship.
                </p>
                <div className="space-y-2 bg-background rounded-lg p-4 border border-border">
                  <Row label="Bank" value={BANK.name} />
                  <Row label="Account name" value={BANK.account_name} copyable onCopy={() => copy(BANK.account_name)} />
                  <Row label="Account number" value={BANK.account_number} copyable onCopy={() => copy(BANK.account_number)} />
                  <Row label="Amount" value={formatNaira(orderTotal)} copyable onCopy={() => copy(String(orderTotal))} />
                  <Row label="Order #" value={orderNumber} copyable onCopy={() => copy(orderNumber)} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Use your order number <span className="font-mono">{orderNumber}</span> as the transfer narration so we can match it instantly.
                </p>
              </div>

              <form onSubmit={handleSubmitPayment} className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4">
                <h3 className="font-semibold">Confirm your payment</h3>
                <Field label="Transaction reference / Opay transfer ID" required>
                  <input
                    required
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. OPAY-2026..."
                    className="input"
                  />
                </Field>
                <Field label="Upload receipt screenshot (recommended)">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                    className="text-sm w-full file:mr-3 file:h-9 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium"
                  />
                </Field>
                <button
                  disabled={submitting}
                  className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  I've paid — submit for confirmation
                </button>
              </form>
            </div>

            <OrderSummary subtotal={subtotal} total={orderTotal} count={cart.count} />
          </div>
        )}

        {step === "done" && (
          <div className="max-w-lg mx-auto text-center bg-card border border-border rounded-xl p-6 md:p-10">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Payment received for confirmation</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Your order <span className="font-mono text-foreground">{orderNumber}</span> is now awaiting our team's verification.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You'll see live delivery status on the tracking page below. We'll also reach out on WhatsApp.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => navigate({ to: "/orders/$orderNumber", params: { orderNumber } })}
                className="h-11 px-5 rounded-lg bg-primary text-primary-foreground font-semibold"
              >
                Track my order
              </button>
              <button
                onClick={() => navigate({ to: "/shop" })}
                className="h-11 px-5 rounded-lg border border-border"
              >
                Continue shopping
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          background: hsl(var(--background) / 1);
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          color: hsl(var(--foreground));
          font-size: 14px;
        }
        textarea.input { padding: 10px 12px; height: auto; }
        .input:focus { outline: 2px solid hsl(var(--primary) / 0.5); }
      `}</style>
    </StoreLayout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value, copyable, onCopy }: { label: string; value: string; copyable?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium font-mono text-right truncate">{value}</span>
        {copyable && (
          <button type="button" onClick={onCopy} className="h-7 w-7 rounded-md hover:bg-surface-elevated flex items-center justify-center" aria-label={`Copy ${label}`}>
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function OrderSummary({ subtotal, total, count }: { subtotal: number; total: number; count: number }) {
  return (
    <aside className="bg-card border border-border rounded-xl p-4 md:p-6 h-fit md:sticky md:top-20">
      <h2 className="font-semibold mb-3">Order summary</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{count}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatNaira(DELIVERY_FEE)}</span></div>
        <div className="border-t border-border my-2" />
        <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatNaira(total)}</span></div>
      </div>
    </aside>
  );
}
