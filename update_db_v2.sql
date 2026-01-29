-- 1. Add support for Multiple Images
-- We use JSONB to store an array of URLs ['url1', 'url2']
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. Add support for Size-Specific Stock
-- We use JSONB to store a map of size -> quantity {"S": 10, "M": 5, "L": 0}
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_stock JSONB DEFAULT '{}'::jsonb;

-- 3. Add support for Size in Order Items
-- To track which size was purchased
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size TEXT;

-- 4. Data Migration (Optional)
-- Copy old image_url to new images array if empty
UPDATE public.products 
SET images = jsonb_build_array(image_url) 
WHERE (images IS NULL OR jsonb_array_length(images) = 0) AND image_url IS NOT NULL;
