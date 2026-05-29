
-- Fix search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_first_user_admin() FROM PUBLIC, anon, authenticated;

-- Replace overly broad public bucket listing policy with a no-op
-- (Public-visible images are accessed by direct URL, which doesn't need a SELECT policy for public buckets)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

CREATE POLICY "Authenticated can view product images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images');
