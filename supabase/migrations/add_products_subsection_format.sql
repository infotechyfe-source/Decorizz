-- Add new product attributes: subsection, format, frame_color
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subsection text,
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS frame_color text;

-- Drop existing checks to avoid conflicts and re-add with desired constraints
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_format_check,
  DROP CONSTRAINT IF EXISTS products_subsection_check,
  DROP CONSTRAINT IF EXISTS products_frame_color_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_format_check
    CHECK (format IN ('Rolled','Canvas','Frame') OR format IS NULL);

ALTER TABLE public.products
  ADD CONSTRAINT products_subsection_check
    CHECK (subsection IN ('Basic','2-Set','3-Set','Square') OR subsection IS NULL);

ALTER TABLE public.products
  ADD CONSTRAINT products_frame_color_check
    CHECK (
      format <> 'Frame'
      OR frame_color IN ('White','Black','Brown')
    );
