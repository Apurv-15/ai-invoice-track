-- Function to handle admin user assignment for ad@gmail.com
CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is ad@gmail.com, assign admin role
  IF NEW.email = 'ad@gmail.com' THEN
    -- Delete any existing non-admin role for this user
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role != 'admin';
    -- Insert admin role (use ON CONFLICT to avoid duplicates)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table to auto-assign admin role
DROP TRIGGER IF EXISTS on_admin_user_profile_created ON public.profiles;
CREATE TRIGGER on_admin_user_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user();

-- Update existing user if ad@gmail.com already exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find user with ad@gmail.com in profiles table
  SELECT id INTO admin_user_id FROM public.profiles WHERE email = 'ad@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Delete any existing non-admin roles
    DELETE FROM public.user_roles WHERE user_id = admin_user_id AND role != 'admin';
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;