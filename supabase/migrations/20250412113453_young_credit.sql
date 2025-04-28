/*
  # Create and modify stores table

  1. New Tables
    - `stores` table if it doesn't exist
  2. Changes
    - Add various columns to `stores` table including industry, description, etc.
    - Set up row level security policies
*/

-- Check if stores table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'stores'
  ) THEN
    CREATE TABLE public.stores (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL REFERENCES auth.users(id),
      name text NOT NULL,
      website_url text,
      industry text,
      description text,
      features text[],
      location text,
      google_place_id text,
      ai_tone text,
      welcome_message text,
      thanks_message text,
      coupon_type text,
      coupon_value integer,
      coupon_free_item_desc text,
      plan_id text,
      qr_code_url text,
      interview_url text,
      subscription_status text,
      subscription_ends_at timestamptz,
      stripe_customer_id text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

    -- Create policies
    -- Owner can do anything with their stores
    CREATE POLICY "Users can create their own stores" 
      ON public.stores FOR INSERT 
      WITH CHECK (auth.uid() = owner_id);

    CREATE POLICY "Users can view their own stores" 
      ON public.stores FOR SELECT 
      USING (auth.uid() = owner_id);

    CREATE POLICY "Users can update their own stores" 
      ON public.stores FOR UPDATE 
      USING (auth.uid() = owner_id);

    CREATE POLICY "Users can delete their own stores" 
      ON public.stores FOR DELETE 
      USING (auth.uid() = owner_id);

    -- Service role can access all stores
    CREATE POLICY "Service role can manage all stores"
      ON public.stores
      USING (auth.jwt() ->> 'role' = 'service_role');

  ELSE
    -- If table exists, add any missing columns one by one
    
    -- Adding industry column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'industry'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN industry text;
    END IF;

    -- Adding description column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'description'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN description text;
    END IF;

    -- Adding location column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'location'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN location text;
    END IF;

    -- Adding google_place_id column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'google_place_id'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN google_place_id text;
    END IF;

    -- Adding ai_tone column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'ai_tone'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN ai_tone text;
    END IF;

    -- Adding welcome_message column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'welcome_message'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN welcome_message text;
    END IF;

    -- Adding thanks_message column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'thanks_message'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN thanks_message text;
    END IF;

    -- Adding coupon_type column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'coupon_type'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN coupon_type text;
    END IF;

    -- Adding coupon_value column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'coupon_value'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN coupon_value integer;
    END IF;

    -- Adding coupon_free_item_desc column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'coupon_free_item_desc'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN coupon_free_item_desc text;
    END IF;

    -- Adding plan_id column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'plan_id'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN plan_id text;
    END IF;

    -- Adding qr_code_url column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'qr_code_url'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN qr_code_url text;
    END IF;

    -- Adding interview_url column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'interview_url'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN interview_url text;
    END IF;

    -- Adding updated_at column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    -- Adding subscription_status column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'subscription_status'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN subscription_status text;
    END IF;

    -- Adding subscription_ends_at column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'subscription_ends_at'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN subscription_ends_at timestamptz;
    END IF;

    -- Adding stripe_customer_id column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'stripe_customer_id'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN stripe_customer_id text;
    END IF;

    -- Rename url column to website_url if needed
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'url'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name = 'website_url'
    ) THEN
      ALTER TABLE public.stores RENAME COLUMN url TO website_url;
    END IF;
    
    -- Ensure RLS is enabled
    ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create the interviews table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'interviews'
  ) THEN
    CREATE TABLE public.interviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id uuid NOT NULL REFERENCES public.stores(id),
      status text DEFAULT 'active',
      rating integer,
      conversation jsonb DEFAULT '[]'::jsonb,
      generated_review text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz
    );

    -- Enable Row Level Security
    ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

    -- Create policies
    -- Store owners can access their store's interviews
    CREATE POLICY "Store owners can access their store's interviews"
      ON public.interviews
      USING (
        store_id IN (
          SELECT id FROM public.stores 
          WHERE owner_id = auth.uid()
        )
      );

    -- Anyone can read interviews by ID (for answering interviews)
    CREATE POLICY "Anyone can read interviews by ID"
      ON public.interviews FOR SELECT
      USING (true);

    -- Anyone can update interviews (for responding to questions)
    CREATE POLICY "Anyone can update interviews"
      ON public.interviews FOR UPDATE
      USING (true);

    -- Service role can access all interviews
    CREATE POLICY "Service role can manage all interviews"
      ON public.interviews
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;