-- Data Export Queries
-- Run these queries in the Lovable Cloud backend to get your data
-- Then run the output in your new Supabase project's SQL Editor

-- Export invoice_categories
SELECT 
  'INSERT INTO public.invoice_categories (id, name, color, icon, created_at) VALUES ' ||
  string_agg(
    '(' || 
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(name) || ', ' ||
    quote_literal(color) || ', ' ||
    quote_literal(icon) || ', ' ||
    quote_literal(created_at::text) || '::timestamptz' ||
    ')',
    ', '
  ) || ';' as insert_statement
FROM public.invoice_categories;

-- Export profiles (Note: You'll need to create these users in auth first)
SELECT 
  'INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at) VALUES ' ||
  string_agg(
    '(' || 
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(email) || ', ' ||
    coalesce(quote_literal(full_name), 'NULL') || ', ' ||
    coalesce(quote_literal(avatar_url), 'NULL') || ', ' ||
    quote_literal(created_at::text) || '::timestamptz, ' ||
    quote_literal(updated_at::text) || '::timestamptz' ||
    ')',
    ', '
  ) || ';' as insert_statement
FROM public.profiles;

-- Export user_roles
SELECT 
  'INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES ' ||
  string_agg(
    '(' || 
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(user_id::text) || '::uuid, ' ||
    quote_literal(role::text) || '::app_role, ' ||
    quote_literal(created_at::text) || '::timestamptz' ||
    ')',
    ', '
  ) || ';' as insert_statement
FROM public.user_roles;

-- Export invoices
SELECT 
  'INSERT INTO public.invoices (id, user_id, invoice_number, vendor, date, amount, description, category_id, category_confidence, status, file_url, recipient_email, reviewed_at, reviewed_by, rejection_reason, created_at, updated_at) VALUES ' ||
  string_agg(
    '(' || 
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(user_id::text) || '::uuid, ' ||
    quote_literal(invoice_number) || ', ' ||
    quote_literal(vendor) || ', ' ||
    quote_literal(date::text) || '::date, ' ||
    amount || ', ' ||
    coalesce(quote_literal(description), 'NULL') || ', ' ||
    coalesce(quote_literal(category_id::text) || '::uuid', 'NULL') || ', ' ||
    coalesce(category_confidence::text, 'NULL') || ', ' ||
    quote_literal(status) || ', ' ||
    coalesce(quote_literal(file_url), 'NULL') || ', ' ||
    coalesce(quote_literal(recipient_email), 'NULL') || ', ' ||
    coalesce(quote_literal(reviewed_at::text) || '::timestamptz', 'NULL') || ', ' ||
    coalesce(quote_literal(reviewed_by::text) || '::uuid', 'NULL') || ', ' ||
    coalesce(quote_literal(rejection_reason), 'NULL') || ', ' ||
    quote_literal(created_at::text) || '::timestamptz, ' ||
    quote_literal(updated_at::text) || '::timestamptz' ||
    ')',
    ', '
  ) || ';' as insert_statement
FROM public.invoices;

-- Export reminders
SELECT 
  'INSERT INTO public.reminders (id, user_id, title, message, category, priority, status, invoice_id, admin_notes, api_key_used, external_notification_sent, read_at, resolved_at, created_at, updated_at) VALUES ' ||
  string_agg(
    '(' || 
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(user_id::text) || '::uuid, ' ||
    quote_literal(title) || ', ' ||
    quote_literal(message) || ', ' ||
    quote_literal(category) || ', ' ||
    quote_literal(priority) || ', ' ||
    quote_literal(status) || ', ' ||
    coalesce(quote_literal(invoice_id::text) || '::uuid', 'NULL') || ', ' ||
    coalesce(quote_literal(admin_notes), 'NULL') || ', ' ||
    coalesce(quote_literal(api_key_used), 'NULL') || ', ' ||
    coalesce(external_notification_sent::text, 'false') || ', ' ||
    coalesce(quote_literal(read_at::text) || '::timestamptz', 'NULL') || ', ' ||
    coalesce(quote_literal(resolved_at::text) || '::timestamptz', 'NULL') || ', ' ||
    quote_literal(created_at::text) || '::timestamptz, ' ||
    quote_literal(updated_at::text) || '::timestamptz' ||
    ')',
    ', '
  ) || ';' as insert_statement
FROM public.reminders;
