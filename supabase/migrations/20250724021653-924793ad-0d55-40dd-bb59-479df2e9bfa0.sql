-- Create the app_role enum type that's missing
CREATE TYPE public.app_role AS ENUM ('engineer', 'project_manager', 'admin');

-- Update the profiles table to use the enum if it doesn't already
DO $$ 
BEGIN
    -- Check if the column exists and update it if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'role' AND table_schema = 'public') THEN
        -- Drop the column and recreate it with the proper enum type
        ALTER TABLE public.profiles DROP COLUMN role;
        ALTER TABLE public.profiles ADD COLUMN role app_role NOT NULL DEFAULT 'engineer';
    END IF;
END $$;