/*
  # Row Level Security Policies for Kuchitoru

  1. Security
     - Enable RLS on tables if not already enabled
     - Create policies that don't already exist
     - Ensure proper access control for stores and interviews tables
*/

-- Use a DO block to check for existing policies before creating them
DO $$
BEGIN
    -- Enable RLS on stores table if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'stores' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create policies for stores table (only if they don't already exist)

    -- 1. Users can create their own stores policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Users can create their own stores'
    ) THEN
        CREATE POLICY "Users can create their own stores" 
        ON public.stores FOR INSERT 
        WITH CHECK (auth.uid() = owner_id);
    END IF;

    -- 2. Users can view their own stores policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Users can view their own stores'
    ) THEN
        CREATE POLICY "Users can view their own stores" 
        ON public.stores FOR SELECT 
        USING (auth.uid() = owner_id);
    END IF;

    -- 3. Users can update their own stores policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Users can update their own stores'
    ) THEN
        CREATE POLICY "Users can update their own stores" 
        ON public.stores FOR UPDATE 
        USING (auth.uid() = owner_id);
    END IF;

    -- 4. Users can delete their own stores policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Users can delete their own stores'
    ) THEN
        CREATE POLICY "Users can delete their own stores" 
        ON public.stores FOR DELETE 
        USING (auth.uid() = owner_id);
    END IF;

    -- 5. Service role can manage all stores policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Service role can manage all stores'
    ) THEN
        CREATE POLICY "Service role can manage all stores"
        ON public.stores
        USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;

    -- Enable RLS on interviews table if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'interviews' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create policies for interviews table (only if they don't already exist)

    -- 1. Store owners can access their store's interviews policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'interviews' AND policyname = 'Store owners can access their store''s interviews'
    ) THEN
        CREATE POLICY "Store owners can access their store's interviews"
        ON public.interviews
        USING (
            store_id IN (
                SELECT id FROM public.stores 
                WHERE owner_id = auth.uid()
            )
        );
    END IF;

    -- 2. Anyone can read interviews by ID policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'interviews' AND policyname = 'Anyone can read interviews by ID'
    ) THEN
        CREATE POLICY "Anyone can read interviews by ID"
        ON public.interviews FOR SELECT
        USING (true);
    END IF;

    -- 3. Anyone can update interviews policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'interviews' AND policyname = 'Anyone can update interviews'
    ) THEN
        CREATE POLICY "Anyone can update interviews"
        ON public.interviews FOR UPDATE
        USING (true);
    END IF;

    -- 4. Service role can manage all interviews policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'interviews' AND policyname = 'Service role can manage all interviews'
    ) THEN
        CREATE POLICY "Service role can manage all interviews"
        ON public.interviews
        USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;