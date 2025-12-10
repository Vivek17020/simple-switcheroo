-- Insert demo UPSC articles for different categories
-- First, get the upscbriefs category and its subcategories

-- Insert demo UPSC articles under the main upscbriefs category and subcategories
INSERT INTO public.articles (
  title, slug, content, excerpt, meta_title, meta_description, 
  category_id, author, published, featured, seo_keywords, reading_time
)
SELECT 
  'Understanding the Indian Constitution: A Complete Guide for UPSC',
  'understanding-indian-constitution-upsc-guide',
  '<h2>Introduction to the Indian Constitution</h2>
<p>The Constitution of India is the supreme law of India, laying down the framework defining fundamental political principles, establishing the structure, procedures, powers, and duties of government institutions.</p>

<h2>Key Features of the Indian Constitution</h2>
<ul>
<li><strong>Lengthiest Written Constitution</strong> - Contains 470 articles in 25 parts</li>
<li><strong>Federal System with Unitary Bias</strong> - Division of powers between Centre and States</li>
<li><strong>Parliamentary Form of Government</strong> - Westminster model</li>
<li><strong>Fundamental Rights</strong> - Part III of the Constitution</li>
<li><strong>Directive Principles</strong> - Part IV guidelines for governance</li>
</ul>

<h2>Important Articles for UPSC</h2>
<p>Article 14-18 deal with Right to Equality, Article 19-22 with Right to Freedom, and Article 32 provides the Right to Constitutional Remedies.</p>

<h2>Practice Questions</h2>
<blockquote>Q: Which article is known as the "Heart and Soul" of the Constitution?<br/>A: Article 32 (Right to Constitutional Remedies)</blockquote>',
  'A comprehensive guide to understanding the Indian Constitution for UPSC aspirants covering key features, important articles, and practice questions.',
  'Indian Constitution Guide for UPSC | Key Features & Articles',
  'Complete guide to Indian Constitution for UPSC exam. Learn key features, fundamental rights, important articles and practice questions.',
  (SELECT id FROM categories WHERE slug = 'polity' LIMIT 1),
  'UPSCBriefs Team',
  true, true,
  ARRAY['indian constitution', 'upsc polity', 'fundamental rights', 'constitutional articles', 'upsc preparation'],
  8
WHERE EXISTS (SELECT 1 FROM categories WHERE slug = 'polity');

INSERT INTO public.articles (
  title, slug, content, excerpt, meta_title, meta_description,
  category_id, author, published, featured, seo_keywords, reading_time
)
SELECT
  'Indian Geography: Physical Features and Climate Patterns',
  'indian-geography-physical-features-climate-upsc',
  '<h2>Physical Features of India</h2>
<p>India''s diverse geography includes the mighty Himalayas in the north, the Indo-Gangetic plains, the peninsular plateau, and coastal plains.</p>

<h2>The Himalayan Mountains</h2>
<ul>
<li><strong>Greater Himalayas (Himadri)</strong> - Average height 6000m, includes Mt. Everest</li>
<li><strong>Lesser Himalayas (Himachal)</strong> - Height ranges 3700-4500m</li>
<li><strong>Outer Himalayas (Shiwaliks)</strong> - Height ranges 900-1100m</li>
</ul>

<h2>Climate Patterns</h2>
<p>India experiences four main seasons: Winter (December-February), Summer (March-May), Monsoon (June-September), and Post-Monsoon (October-November).</p>

<h2>Important Rivers</h2>
<p>Major rivers include the Ganga, Brahmaputra, Indus, Godavari, Krishna, and Kaveri - essential for UPSC Geography preparation.</p>',
  'Comprehensive overview of India''s physical geography including Himalayan ranges, rivers, and climate patterns for UPSC preparation.',
  'Indian Geography Physical Features | UPSC Study Material',
  'Learn Indian Geography for UPSC - Physical features, Himalayan ranges, major rivers, and climate patterns explained.',
  (SELECT id FROM categories WHERE slug = 'geography' LIMIT 1),
  'UPSCBriefs Team',
  true, false,
  ARRAY['indian geography', 'himalayan mountains', 'indian rivers', 'climate patterns', 'upsc geography'],
  7
WHERE EXISTS (SELECT 1 FROM categories WHERE slug = 'geography');

INSERT INTO public.articles (
  title, slug, content, excerpt, meta_title, meta_description,
  category_id, author, published, featured, seo_keywords, reading_time
)
SELECT
  'Modern Indian History: Freedom Struggle Timeline',
  'modern-indian-history-freedom-struggle-timeline',
  '<h2>The Freedom Struggle: A Timeline</h2>
<p>India''s freedom struggle spans from 1857 to 1947, marked by various movements, leaders, and sacrifices.</p>

<h2>Key Events</h2>
<ul>
<li><strong>1857</strong> - First War of Independence (Sepoy Mutiny)</li>
<li><strong>1885</strong> - Formation of Indian National Congress</li>
<li><strong>1905</strong> - Partition of Bengal</li>
<li><strong>1920</strong> - Non-Cooperation Movement</li>
<li><strong>1930</strong> - Civil Disobedience Movement, Dandi March</li>
<li><strong>1942</strong> - Quit India Movement</li>
<li><strong>1947</strong> - Independence and Partition</li>
</ul>

<h2>Important Leaders</h2>
<p>Mahatma Gandhi, Jawaharlal Nehru, Sardar Patel, Subhas Chandra Bose, and Bhagat Singh played pivotal roles in the freedom movement.</p>

<h2>Revolutionary Movements</h2>
<p>Apart from non-violent movements, revolutionary activities by Bhagat Singh, Chandrashekhar Azad, and others significantly contributed to the independence struggle.</p>',
  'Timeline of India''s freedom struggle from 1857 to 1947 covering key events, movements, and important leaders for UPSC History.',
  'Indian Freedom Struggle Timeline | Modern History UPSC',
  'Complete timeline of Indian freedom struggle for UPSC. Key events from 1857 Revolt to 1947 Independence with important leaders.',
  (SELECT id FROM categories WHERE slug = 'history' LIMIT 1),
  'UPSCBriefs Team',
  true, false,
  ARRAY['freedom struggle', 'indian history', 'independence movement', 'upsc history', 'national leaders'],
  9
WHERE EXISTS (SELECT 1 FROM categories WHERE slug = 'history');

-- Insert demo UPSC flashcards
INSERT INTO public.upsc_flashcards (title, subject, topic, front_content, back_content, difficulty, is_published)
VALUES 
  ('Article 14 - Right to Equality', 'Polity', 'Fundamental Rights', 
   'What does Article 14 of the Indian Constitution guarantee?',
   'Article 14 guarantees equality before the law and equal protection of the laws within the territory of India. It ensures that the State shall not deny any person equality before law.',
   'easy', true),
   
  ('Dandi March Date', 'History', 'Freedom Movement',
   'When did Mahatma Gandhi start the Dandi March (Salt Satyagraha)?',
   'The Dandi March began on March 12, 1930, from Sabarmati Ashram and concluded on April 6, 1930, at Dandi beach after covering 385 km.',
   'easy', true),
   
  ('Western Ghats', 'Geography', 'Physical Features',
   'Which states are covered by the Western Ghats?',
   'The Western Ghats run through 6 states: Gujarat, Maharashtra, Goa, Karnataka, Kerala, and Tamil Nadu. They are also known as Sahyadri.',
   'medium', true),
   
  ('42nd Amendment', 'Polity', 'Constitutional Amendments',
   'What significant changes were made by the 42nd Constitutional Amendment?',
   'The 42nd Amendment (1976) added "Socialist" and "Secular" to the Preamble, reduced power of judiciary, added Fundamental Duties (Part IVA), and transferred subjects from State to Concurrent List.',
   'medium', true),
   
  ('Monsoon Mechanism', 'Geography', 'Climate',
   'What causes the Indian monsoon?',
   'Indian monsoon is caused by differential heating of land and sea, shift of ITCZ, role of jet streams (especially Somali jet), El Niño/La Niña effects, and the Himalayan barrier preventing cold winds.',
   'hard', true),
   
  ('Fundamental Duties Count', 'Polity', 'Fundamental Duties',
   'How many Fundamental Duties are mentioned in the Indian Constitution?',
   'There are 11 Fundamental Duties listed in Article 51A of the Constitution. Originally 10 duties were added by 42nd Amendment; the 11th duty (education of children) was added by 86th Amendment.',
   'easy', true),
   
  ('First War of Independence', 'History', 'British India',
   'What were the immediate causes of the 1857 Revolt?',
   'Immediate causes: Introduction of Enfield rifles with greased cartridges (beef and pig fat), Doctrine of Lapse, annexation of Awadh, and ill-treatment of Indian sepoys.',
   'medium', true),
   
  ('Article 370', 'Polity', 'Centre-State Relations',
   'What was Article 370 and what happened to it?',
   'Article 370 granted special autonomous status to Jammu & Kashmir. It was effectively abrogated on August 5, 2019, through a Presidential Order and the J&K Reorganisation Act, 2019.',
   'medium', true),
   
  ('Tropic of Cancer States', 'Geography', 'Physical Geography',
   'Which Indian states does the Tropic of Cancer pass through?',
   'Tropic of Cancer passes through 8 states (West to East): Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.',
   'medium', true),
   
  ('Constituent Assembly', 'Polity', 'Constitution Making',
   'Who was the Chairman of the Drafting Committee of the Constitution?',
   'Dr. B.R. Ambedkar was the Chairman of the Drafting Committee. The Constituent Assembly had 299 members; the Constitution was adopted on November 26, 1949, and came into effect on January 26, 1950.',
   'easy', true);