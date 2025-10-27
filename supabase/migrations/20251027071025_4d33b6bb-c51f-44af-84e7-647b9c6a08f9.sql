-- Fix Technology subcategory slugs (remove technology- prefix)
UPDATE categories 
SET slug = 'ai' 
WHERE slug = 'technology-ai';

UPDATE categories 
SET slug = 'apps' 
WHERE slug = 'technology-apps';

UPDATE categories 
SET slug = 'cybersecurity' 
WHERE slug = 'technology-cybersecurity';

-- Add comprehensive SEO descriptions for all main categories (150-200 words)
UPDATE categories 
SET description = 'Explore comprehensive business news coverage including stock market analysis, corporate earnings, startup ecosystem updates, mergers and acquisitions, economic policy changes, and financial market trends. Stay informed about India''s leading companies, emerging startups, investment opportunities, and business leadership insights. Our expert analysis covers banking sector updates, real estate market trends, commodity prices, foreign exchange movements, and global business developments affecting Indian markets. Get timely updates on government economic policies, budget announcements, tax reforms, and regulatory changes impacting businesses across sectors including technology, manufacturing, retail, and services.'
WHERE slug = 'business';

UPDATE categories 
SET description = 'Complete defence news coverage including Indian Armed Forces updates, military procurement, strategic developments, border security, defence technology, and national security affairs. Access comprehensive information for defence exam aspirants including NDA, CDS, AFCAT preparation guides, current affairs, study materials, and motivational success stories. Stay updated with defence ministry announcements, military modernization programs, indigenous defence manufacturing initiatives, tri-service operations, international defence cooperation, military exercises, veterans welfare schemes, and career opportunities in Indian Army, Navy, Air Force, and paramilitary forces. Get expert analysis on geopolitical security challenges and India''s defence preparedness.'
WHERE slug = 'defence';

UPDATE categories 
SET description = 'Stay updated with latest education news covering school education policies, higher education reforms, university admissions, competitive exam notifications, board exam results, CBSE updates, state board announcements, and academic calendar changes. Access information about new courses, skill development programs, online learning initiatives, scholarship opportunities, education technology trends, teaching methodologies, and learning resources. Get comprehensive coverage of entrance exam updates including JEE, NEET, CUET, state-level examinations, professional course admissions, study abroad opportunities, education ministry announcements, NEP 2020 implementation, teacher recruitment, school infrastructure development, digital education initiatives, and career guidance for students across all academic levels from primary to higher education.'
WHERE slug = 'education';

UPDATE categories 
SET description = 'Discover diverse general news covering society, culture, lifestyle, human interest stories, community events, social issues, environmental concerns, health and wellness, entertainment updates, celebrity news, viral stories, inspiring achievements, and miscellaneous current events. Our comprehensive coverage includes trending topics, social media buzz, cultural celebrations, festival updates, heritage conservation, art and literature, science discoveries, space exploration, wildlife conservation, climate action, sustainable living, innovative projects, remarkable individuals, grassroots movements, and stories that matter to everyday life. Stay connected with news that reflects the vibrant tapestry of modern society, celebrating diversity, progress, and human spirit across India and beyond.'
WHERE slug = 'general';

UPDATE categories 
SET description = 'Your one-stop destination for latest government job notifications, sarkari naukri updates, admit card downloads, exam results, vacancy announcements, and recruitment information across central and state government departments. Access comprehensive details about SSC, UPSC, Railway, Banking, Defence, Teaching, Police, and other public sector job opportunities. Get timely updates on application deadlines, eligibility criteria, exam patterns, syllabus, previous year papers, answer keys, merit lists, and selection procedures. Stay informed about employment news, job alerts, career guidance, interview preparation tips, and success stories. Track latest openings in PSUs, government corporations, autonomous bodies, and regulatory authorities with detailed job descriptions and application links.'
WHERE slug = 'jobs';

UPDATE categories 
SET description = 'Comprehensive political news coverage including national politics, state elections, parliamentary proceedings, government policies, political party developments, leadership changes, coalition dynamics, and legislative updates. Get in-depth analysis of election campaigns, voting trends, opinion polls, electoral reforms, political alliances, party manifestos, ministerial appointments, and governance issues. Stay informed about policy debates, bill discussions, committee reports, opposition activities, ruling party initiatives, regional political movements, and grassroots political developments. Our expert commentary covers political strategies, public opinion, democratic processes, constitutional matters, political controversies, accountability issues, and the evolving landscape of Indian democracy at national, state, and local levels.'
WHERE slug = 'politics';

UPDATE categories 
SET description = 'Complete sports news coverage including cricket matches, football tournaments, tennis championships, Olympic games, esports competitions, and major sporting events worldwide. Get live scores, match analysis, player statistics, tournament schedules, team rankings, transfer news, and sports business updates. Access exclusive interviews, expert opinions, match predictions, and comprehensive coverage of Indian and international sports. Stay updated with IPL, ISL, Grand Slams, Olympics, Commonwealth Games, Asian Games, World Cups, Champions League, and premier sporting events. Follow athlete profiles, coaching changes, injury updates, training insights, sports technology, fitness trends, and behind-the-scenes stories. Discover emerging sports talent, grassroots sports development, sports policy changes, and inspiring sports achievements across all disciplines.'
WHERE slug = 'sports';

UPDATE categories 
SET description = 'Latest technology news covering artificial intelligence, machine learning, gadget launches, mobile apps, cybersecurity threats, software updates, tech industry trends, startup innovations, and digital transformation stories. Stay informed about smartphone releases, laptop reviews, consumer electronics, smart home devices, wearable technology, and cutting-edge innovations. Get insights into cloud computing, blockchain, 5G networks, Internet of Things, quantum computing, robotics, automation, and emerging technologies. Access expert analysis on tech company developments, product announcements, software updates, platform changes, digital privacy, data security, tech regulations, and the impact of technology on society. Discover tech startups, innovation hubs, research breakthroughs, and technology adoption trends across industries.'
WHERE slug = 'technology';

UPDATE categories 
SET description = 'International news coverage bringing you global events, world politics, international conflicts, diplomatic relations, climate change, humanitarian crises, and breaking news from every continent. Stay updated with developments from major economies, geopolitical tensions, international summits, trade agreements, global health issues, and cross-border developments affecting India and the world. Get comprehensive coverage of United Nations activities, international organizations, global economic trends, foreign policy changes, refugee situations, natural disasters, pandemic responses, and worldwide social movements. Access expert analysis on regional conflicts, peace initiatives, international law, human rights issues, global terrorism, nuclear developments, and the interconnected challenges facing our world in an increasingly globalized era.'
WHERE slug = 'world';

-- Add SEO descriptions for subcategories (Politics)
UPDATE categories 
SET description = 'Comprehensive election news covering Lok Sabha elections, Vidhan Sabha polls, local body elections, by-elections, and election commission announcements. Get live election results, exit polls, constituency analysis, candidate profiles, campaign updates, voting statistics, election schedules, nomination details, and electoral trends across India.'
WHERE slug = 'elections' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'Latest government policy updates including new schemes, policy reforms, budget announcements, regulatory changes, cabinet decisions, ministry circulars, implementation guidelines, and impact analysis. Stay informed about central and state government policies affecting economy, society, and governance with expert commentary and citizen perspectives.'
WHERE slug = 'government-policies' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'In-depth coverage of Indian national politics including parliamentary activities, political party strategies, leadership developments, coalition politics, state politics, political appointments, policy debates, and political controversies. Get expert analysis on India''s political landscape, democratic processes, and governance challenges at national and regional levels.'
WHERE slug = 'indian-politics' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'India''s foreign policy coverage including bilateral relations, diplomatic engagements, international summits, strategic partnerships, defence cooperation, trade negotiations, geopolitical developments, and India''s role in global affairs. Stay updated with visits by foreign dignitaries, international agreements, border issues, and India''s position on global challenges.'
WHERE slug = 'international-relations' AND parent_id IS NOT NULL;

-- Add SEO descriptions for subcategories (Sports)
UPDATE categories 
SET description = 'Latest cricket news including IPL updates, international matches, Test cricket, ODI series, T20 tournaments, player performances, team rankings, cricket board decisions, domestic cricket, women''s cricket, and live cricket scores. Get ball-by-ball commentary, match analysis, player statistics, and cricket insights from experts.'
WHERE slug = 'cricket' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'Football news covering ISL, Premier League, La Liga, Champions League, FIFA World Cup, international football, transfer updates, match results, player news, club developments, football tactics, and tournament schedules. Stay updated with Indian football, European leagues, and global football events with comprehensive match analysis and expert opinions.'
WHERE slug = 'football' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'Tennis updates including Grand Slam tournaments, ATP rankings, WTA rankings, player performances, tournament results, tennis records, Indian tennis players, Davis Cup, Fed Cup, and professional tennis circuit news. Get match highlights, player interviews, tennis technique analysis, and coverage of all major tennis events worldwide.'
WHERE slug = 'tennis' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'Olympic Games coverage including medal tallies, athlete performances, event schedules, Olympic records, Indian contingent updates, sports categories, Olympic qualifying events, and behind-the-scenes stories. Access comprehensive coverage of Summer Olympics, Winter Olympics, Paralympic Games, youth Olympics, and Olympic sports development programs.'
WHERE slug = 'olympics' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'Esports news covering competitive gaming, BGMI tournaments, Valorant championships, DOTA competitions, CS:GO events, mobile gaming, esports teams, pro players, tournament prize pools, gaming industry, esports organizations, and the growing professional gaming ecosystem in India and globally. Stay updated with live streaming, match results, and esports career opportunities.'
WHERE slug = 'esports' AND parent_id IS NOT NULL;

-- Add SEO descriptions for subcategories (Technology)
UPDATE categories 
SET description = 'Artificial intelligence and machine learning news including ChatGPT updates, generative AI, AI tools, deep learning breakthroughs, neural networks, AI applications, AI ethics, automation, AI startups, research developments, and AI''s impact across industries. Get insights into AI policy, regulations, job market changes, and the future of artificial intelligence technology.'
WHERE slug = 'ai' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'Mobile and web application news including app launches, app updates, popular apps, app reviews, app development trends, mobile gaming, productivity apps, social media apps, app monetization, app security, platform updates for iOS and Android, and emerging app technologies. Discover new apps, app features, and digital tools that enhance productivity and entertainment.'
WHERE slug = 'apps' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'Cybersecurity news covering data breaches, hacking incidents, security vulnerabilities, malware threats, phishing attacks, ransomware, cyber fraud, online safety tips, security patches, encryption technologies, privacy protection, identity theft prevention, cybersecurity tools, and best practices for digital security. Stay protected with latest threat alerts and expert security recommendations.'
WHERE slug = 'cybersecurity' AND parent_id IS NOT NULL;

UPDATE categories 
SET description = 'Latest gadget news including smartphone launches, laptop releases, tablet reviews, smartwatch updates, wireless earbuds, gaming consoles, cameras, smart home devices, wearable tech, consumer electronics, gadget comparisons, tech specs, pricing, availability, and expert gadget reviews. Discover cutting-edge technology products and make informed purchase decisions with detailed analysis.'
WHERE slug = 'gadgets' AND parent_id IS NOT NULL;