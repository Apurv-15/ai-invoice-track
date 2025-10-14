-- Add invoice_id to reminders table
ALTER TABLE public.reminders
ADD COLUMN invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX idx_reminders_invoice_id ON public.reminders(invoice_id);