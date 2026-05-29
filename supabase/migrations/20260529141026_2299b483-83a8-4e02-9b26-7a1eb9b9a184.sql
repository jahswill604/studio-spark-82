
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- Roles
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- First signup => admin
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_admin();

-- =========================================================
-- Products
-- =========================================================
CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) UNIQUE,
  sku             VARCHAR(100) UNIQUE NOT NULL,
  price           DECIMAL(12,2),
  cost            DECIMAL(12,2),
  color           VARCHAR(100),
  ram             VARCHAR(50),
  storage         VARCHAR(50),
  product_type    VARCHAR(100),
  stock_qty       INTEGER DEFAULT 1,
  image_url       TEXT,
  image_hash      VARCHAR(128),
  description     TEXT,
  category        VARCHAR(100),
  tags            TEXT[] DEFAULT ARRAY[]::TEXT[],
  seo_keywords    TEXT[] DEFAULT ARRAY[]::TEXT[],
  social_caption  TEXT,
  is_flash_deal   BOOLEAN DEFAULT false,
  deal_price      DECIMAL(12,2),
  deal_ends_at    TIMESTAMPTZ,
  badge           VARCHAR(50) DEFAULT 'None',
  is_published    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_published ON public.products(is_published) WHERE is_published = true;
CREATE INDEX idx_products_flash ON public.products(is_flash_deal, deal_ends_at) WHERE is_flash_deal = true;
CREATE INDEX idx_products_type ON public.products(product_type);

GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can read published products
CREATE POLICY "Public can read published products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

-- Admins manage everything (via service_role server fns, but allow direct too)
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- Action log (for undo)
-- =========================================================
CREATE TABLE public.action_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type      VARCHAR(50) NOT NULL,
  product_id       UUID,
  snapshot_before  JSONB,
  snapshot_after   JSONB,
  user_id          UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ
);

CREATE INDEX idx_action_log_expires ON public.action_log(expires_at DESC);

GRANT SELECT, INSERT, DELETE ON public.action_log TO authenticated;
GRANT ALL ON public.action_log TO service_role;

ALTER TABLE public.action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read action log"
  ON public.action_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert action log"
  ON public.action_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete action log"
  ON public.action_log FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Storage bucket: product-images (public)
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
