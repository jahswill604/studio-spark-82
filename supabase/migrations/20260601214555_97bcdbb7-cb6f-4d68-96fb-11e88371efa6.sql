
-- Order status enum
CREATE TYPE public.order_status AS ENUM (
  'pending_payment',
  'payment_submitted',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  user_id UUID,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(100),
  delivery_notes TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  delivery_fee NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending_payment',
  payment_reference VARCHAR(255),
  payment_receipt_url TEXT,
  payment_submitted_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  tracking_number VARCHAR(100),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_email ON public.orders(customer_email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can create an order (guest checkout)
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own orders if logged in
CREATE POLICY "Users view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins update orders
CREATE POLICY "Admins update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Payment receipts bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload to payment-receipts (during checkout)
CREATE POLICY "Anyone can upload payment receipts"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'payment-receipts');

-- Admins can view receipts
CREATE POLICY "Admins view payment receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
