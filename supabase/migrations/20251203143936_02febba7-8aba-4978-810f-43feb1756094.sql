-- Fix publisher logo to be square (Google requirement for Discover)
UPDATE web_stories_config 
SET 
  publisher_logo_url = 'https://www.thebulletinbriefs.in/tb-briefs-favicon.png',
  publisher_logo_width = 96,
  publisher_logo_height = 96,
  updated_at = now()
WHERE id = 'adb5b2fe-a70a-414c-b33d-33833e178daf';