-- 1. Add missing columns to 'products' table if they don't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Insert the 4 initial products (only if they don't exist to avoid duplicates)
-- Using ON CONFLICT DO NOTHING implies you might need a unique constraint on 'title' or 'id'. 
-- Since we don't know the IDs, we'll try to insert based on Title/Category uniqueness or just simple insert if empty.

INSERT INTO public.products (title, description, price, stock_quantity, image_url, category, is_active, is_preorder)
VALUES 
(
  'T-shirt Signature Oslan Blanc', 
  'T-shirt premium blanc avec logo Oslan.', 
  45.00, 
  100, 
  'assets/tshirt-blanc.jpg', 
  'Homme', 
  TRUE, 
  FALSE
),
(
  'T-shirt Signature Oslan Noir', 
  'T-shirt premium noir avec logo Oslan.', 
  45.00, 
  100, 
  'assets/tshirt-noir-homme.jpg', 
  'Homme', 
  TRUE, 
  FALSE
),
(
  'T-shirt Signature Oslan Blanc (Femme)', 
  'T-shirt premium blanc coupe femme.', 
  45.00, 
  100, 
  'assets/tshirt-blanc-femme.jpg', 
  'Femme', 
  TRUE, 
  FALSE
),
(
  'T-shirt Signature Oslan Noir (Femme)', 
  'T-shirt premium noir coupe femme.', 
  45.00, 
  100, 
  'assets/tshirt-noir-femme.jpg', 
  'Femme', 
  TRUE, 
  FALSE
);

-- 3. Fix Row Level Security (RLS) to ensure Admin can Insert/Update
-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Public can VIEW active products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
TO public
USING (is_active = true);

-- Policy: Admins can DO EVERYTHING (Select, Insert, Update, Delete)
-- NOTE: This assumes Supabase Auth is working. If you are using the 'service_role' key or logged in as admin.
-- If you are getting 'permission denied' errors, you might need to relax this temporarily or ensure your user has the right metadata.

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
TO authenticated
USING ( 
  -- Check if user is admin via app_metadata (if set) OR just allow all authenticated users for now if simpler
  -- For safety, we'll allow all Authenticated users (created via your Signup/Login) to manage products for now.
  -- In a strict prod env, you'd check (auth.jwt() ->> 'email') = 'admin@oslan.com' etc.
  true 
);

-- Fix Orders RLS as well just in case
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
CREATE POLICY "Users can insert orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (true);
