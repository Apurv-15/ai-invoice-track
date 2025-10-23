# Database Migration Guide

This guide will help you migrate your Lovable Cloud database to your own Supabase project.

## Step 1: Create Your Own Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

## Step 2: Export and Run Schema Migrations

You'll need to run the SQL schema in your new Supabase project. Use the SQL Editor in your Supabase dashboard.

### Run this SQL to create your schema:

```sql
-- Create the app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create invoice_categories table
CREATE TABLE public.invoice_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  vendor TEXT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  category_id UUID,
  category_confidence NUMERIC,
  status TEXT DEFAULT 'pending' NOT NULL,
  file_url TEXT,
  recipient_email TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT invoices_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.invoice_categories(id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT unique_user_invoice_number UNIQUE (user_id, invoice_number)
);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' NOT NULL,
  priority TEXT DEFAULT 'medium' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  invoice_id UUID,
  admin_notes TEXT,
  api_key_used TEXT,
  external_notification_sent BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT reminders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_invoice_number 
  ON public.invoices (user_id, invoice_number);

-- Create functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is ad@gmail.com, assign admin role
  IF NEW.email = 'ad@gmail.com' THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role != 'admin';
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for invoice_categories
CREATE POLICY "Authenticated users can view categories" 
  ON public.invoice_categories FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert categories" 
  ON public.invoice_categories FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories" 
  ON public.invoice_categories FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" 
  ON public.invoices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" 
  ON public.invoices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending invoices" 
  ON public.invoices FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all invoices" 
  ON public.invoices FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all invoices" 
  ON public.invoices FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for reminders
CREATE POLICY "Users can view their own reminders" 
  ON public.reminders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" 
  ON public.reminders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reminders" 
  ON public.reminders FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reminders" 
  ON public.reminders FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" 
  ON public.user_roles FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
  ON public.user_roles FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));
```

## Step 3: Create Storage Bucket

In your Supabase dashboard, go to Storage and create a bucket named `invoice-documents` (make it private).

## Step 4: Export Data

To export your data from Lovable Cloud, you can:

1. **Option A**: Use the Lovable Cloud backend interface to view and manually export data from each table
2. **Option B**: Contact Lovable support for a data export

Then import the data into your new Supabase project using the SQL Editor with INSERT statements.

## Step 5: Copy Edge Functions

Copy the edge functions from `supabase/functions/` directory to your new Supabase project and deploy them using the Supabase CLI:

```bash
supabase functions deploy categorize-invoice
supabase functions deploy extract-invoice-data
supabase functions deploy send-admin-reminder
```

## Step 6: Update Your App Configuration

1. Get your new project's URL and anon key from the Supabase dashboard
2. Update your `.env` file with the new credentials
3. Update `supabase/config.toml` with your new project ID

## Step 7: Configure Auth

In your Supabase dashboard:
- Go to Authentication > Settings
- Configure email templates
- Set up any OAuth providers you need
- Enable auto-confirm for development (disable in production)

## Important Notes

- Make sure to migrate your auth users separately
- File storage URLs will change - you'll need to re-upload files to the new storage bucket
- Test thoroughly before switching production traffic
- Keep both databases running during migration to avoid data loss
