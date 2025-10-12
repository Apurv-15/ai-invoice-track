-- Drop the existing foreign key that references auth.users (which cannot be queried via the API)
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;

-- Add new foreign key that references profiles.id instead
-- This allows Supabase to properly join invoices with user profile data
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;