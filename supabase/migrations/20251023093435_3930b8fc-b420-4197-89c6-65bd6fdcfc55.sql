-- Remove duplicate invoices, keeping only the oldest one per user_id + invoice_number
DELETE FROM public.invoices
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, invoice_number ORDER BY created_at ASC) as rn
    FROM public.invoices
  ) t
  WHERE t.rn > 1
);

-- Add unique constraint on invoice_number per user
ALTER TABLE public.invoices
ADD CONSTRAINT unique_user_invoice_number
UNIQUE (user_id, invoice_number);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_invoice_number
ON public.invoices (user_id, invoice_number);