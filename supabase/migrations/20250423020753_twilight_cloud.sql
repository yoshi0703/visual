/*
  # Add icon_url column to stores table
  
  1. New Fields
     - `icon_url` to store the URL to the store's custom icon
  2. Security
     - Existing RLS policies will cover this field
*/

-- Add the icon_url column to the stores table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'icon_url'
  ) THEN
    ALTER TABLE public.stores 
    ADD COLUMN icon_url text DEFAULT NULL;
    
    COMMENT ON COLUMN public.stores.icon_url IS 'URL to the store''s custom icon image';
  END IF;
END $$;