-- Add unique constraint on invoice_number per user to prevent duplicates
-- This ensures that the same user cannot upload invoices with identical invoice numbers

-- First, add the constraint
ALTER TABLE public.invoices
ADD CONSTRAINT unique_user_invoice_number
UNIQUE (user_id, invoice_number);

-- Add index for better performance when checking duplicates
CREATE INDEX IF NOT EXISTS idx_invoices_user_invoice_number
ON public.invoices (user_id, invoice_number);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_user_invoice_number ON public.invoices IS
'Ensures each user can only have one invoice with a given invoice number';
