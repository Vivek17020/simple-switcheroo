-- Add sport_type field to cricket_matches table to support multiple sports
ALTER TABLE cricket_matches 
ADD COLUMN sport_type text NOT NULL DEFAULT 'cricket';

-- Add check constraint for valid sport types
ALTER TABLE cricket_matches 
ADD CONSTRAINT valid_sport_type 
CHECK (sport_type IN ('cricket', 'football', 'tennis', 'esports', 'olympic'));

-- Add comment
COMMENT ON COLUMN cricket_matches.sport_type IS 'Type of sport: cricket, football, tennis, esports, olympic';