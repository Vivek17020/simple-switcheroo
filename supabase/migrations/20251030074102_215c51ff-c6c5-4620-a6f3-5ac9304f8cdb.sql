-- Create cricket matches table
CREATE TABLE public.cricket_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament TEXT NOT NULL,
  match_stage TEXT NOT NULL,
  status_badge TEXT,
  status_color TEXT DEFAULT 'blue',
  team1_name TEXT NOT NULL,
  team1_flag_url TEXT,
  team1_score TEXT,
  team2_name TEXT NOT NULL,
  team2_flag_url TEXT,
  team2_score TEXT,
  match_time TEXT,
  match_result TEXT,
  schedule_link TEXT,
  points_table_link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cricket_matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Cricket matches viewable by everyone" 
ON public.cricket_matches 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage cricket matches" 
ON public.cricket_matches 
FOR ALL
USING (auth.role() = 'authenticated');

-- Create index for ordering
CREATE INDEX idx_cricket_matches_order ON public.cricket_matches(display_order, created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cricket_matches_updated_at
BEFORE UPDATE ON public.cricket_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();