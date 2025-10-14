-- Create reminders table for user-to-admin communication
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'resolved')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'invoice', 'payment', 'technical', 'urgent')),
  admin_notes TEXT,
  external_notification_sent BOOLEAN DEFAULT false,
  api_key_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reminders
CREATE POLICY "Users can insert their own reminders"
ON public.reminders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own reminders
CREATE POLICY "Users can view their own reminders"
ON public.reminders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all reminders
CREATE POLICY "Admins can view all reminders"
ON public.reminders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all reminders
CREATE POLICY "Admins can update all reminders"
ON public.reminders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for reminders
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;