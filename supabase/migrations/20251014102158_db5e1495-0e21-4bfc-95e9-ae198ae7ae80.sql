-- Create admit_cards table
CREATE TABLE IF NOT EXISTS public.admit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  exam_name TEXT NOT NULL,
  download_link TEXT,
  published_date DATE,
  content TEXT,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_id UUID REFERENCES auth.users(id)
);

-- Create admit_card_content_sections table for editable content blocks
CREATE TABLE IF NOT EXISTS public.admit_card_content_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admit_card_content_sections ENABLE ROW LEVEL SECURITY;

-- Policies for admit_cards
CREATE POLICY "Published admit cards viewable by everyone"
  ON public.admit_cards
  FOR SELECT
  USING (published = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage admit cards"
  ON public.admit_cards
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Policies for content sections
CREATE POLICY "Content sections viewable by everyone"
  ON public.admit_card_content_sections
  FOR SELECT
  USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage content sections"
  ON public.admit_card_content_sections
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert default content sections
INSERT INTO public.admit_card_content_sections (section_key, title, content, display_order) VALUES
('how_to_download', 'How to Download the Admit Card for Government Exams in India?', '<p>To download the admit card for various exams held in India, candidates can follow the steps we have shared below. These steps may vary slightly depending on the specific exam and conducting authority.</p><ul><li><strong>Visit the Official Website:</strong> Go to the official website of the organization conducting the exam. This could be the Staff Selection Commission (SSC), Union Public Service Commission (UPSC), Railway Recruitment Board (RRB), or any other relevant authority.</li><li><strong>Navigate to Admit Card Section:</strong> Look for the "Admit Card" or "Hall Ticket" section on the homepage of the website. It may also be listed under the "Recruitment" or "Latest Updates" section.</li><li><strong>Click on the Admit Card Link:</strong> Once you find the admit card section, click on the link provided to download the admit card for your exam.</li><li><strong>Enter Required Details:</strong> You will likely be asked to enter details such as your registration number, date of birth, or other relevant information. Make sure to enter the correct details as provided during the application process.</li><li><strong>Download Admit Card:</strong> After entering the required details, click on the "Submit" or "Download" button. Your admit card will be displayed on the screen.</li><li><strong>Print Admit Card:</strong> Verify all the details mentioned on the admit card such as your name, exam date, time, venue, etc. If everything is correct, download the admit card and take a printout.</li><li><strong>Instructions:</strong> Read any instructions mentioned on the admit card carefully. Pay attention to the exam day guidelines and any documents or items you need to carry to the exam centre.</li><li><strong>Keep Admit Card Safe:</strong> It''s important to keep your admit card safe until the completion of the exam and the subsequent selection process.</li></ul>', 1),
('details_mentioned', 'Details Mentioned on Admit Card of Government Exam', '<p>The details mentioned on the admit card of a government exam typically include:</p><ul><li><strong>Candidate''s Name:</strong> Your full name as mentioned in the application form.</li><li><strong>Roll Number/Registration Number:</strong> A unique identifier assigned to you for the exam.</li><li><strong>Exam Date and Time:</strong> The date and time slot allotted for your examination.</li><li><strong>Exam Venue:</strong> The address of the examination centre where you''re supposed to appear for the exam.</li><li><strong>Photograph:</strong> Your passport-sized photograph uploaded during the application process.</li><li><strong>Signature:</strong> Your digital signature, which may be uploaded during the application process.</li><li><strong>Instructions:</strong> Important instructions regarding the exam, including reporting time, items allowed/prohibited in the exam hall, etc.</li><li><strong>Exam Code:</strong> A unique code assigned to the examination.</li><li><strong>Category:</strong> Your category (General, OBC, SC, ST, etc.), if applicable.</li><li><strong>Exam Duration:</strong> The duration of the exam, i.e., the time allotted for attempting the paper.</li><li><strong>Space for Invigilator''s Signature:</strong> A space provided for the invigilator to sign during the exam.</li><li><strong>Emergency Contact Information:</strong> Contact details in case of any emergency or query related to the exam.</li><li><strong>QR Code:</strong> Some admit cards may include a QR code for easy verification at the exam centre.</li><li><strong>Important Dates:</strong> Any important dates related to the exam, such as the date of issuance of the admit card, result declaration date, etc.</li></ul>', 2)
ON CONFLICT (section_key) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_admit_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admit_cards_updated_at
  BEFORE UPDATE ON public.admit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_admit_cards_updated_at();

CREATE TRIGGER update_admit_card_sections_updated_at
  BEFORE UPDATE ON public.admit_card_content_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_admit_cards_updated_at();