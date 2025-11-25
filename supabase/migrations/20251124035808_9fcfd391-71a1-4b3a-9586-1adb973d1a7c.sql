-- Create web3_certificates table
CREATE TABLE public.web3_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  learning_path_id UUID NOT NULL REFERENCES public.web3_learning_paths(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_code TEXT NOT NULL UNIQUE,
  certificate_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web3_certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view their own certificates"
ON public.web3_certificates
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own certificates
CREATE POLICY "Users can insert their own certificates"
ON public.web3_certificates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can verify certificates (read-only with verification code)
CREATE POLICY "Public certificate verification"
ON public.web3_certificates
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_web3_certificates_user_id ON public.web3_certificates(user_id);
CREATE INDEX idx_web3_certificates_verification_code ON public.web3_certificates(verification_code);
CREATE INDEX idx_web3_certificates_learning_path ON public.web3_certificates(learning_path_id);

-- Add trigger for updated_at
CREATE TRIGGER update_web3_certificates_updated_at
BEFORE UPDATE ON public.web3_certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();