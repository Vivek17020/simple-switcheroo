-- Create parent category "Web3 for India"
INSERT INTO categories (name, slug, description, color, parent_id)
VALUES (
  'Web3 for India',
  'web3forindia',
  'Comprehensive blockchain and Web3 knowledge hub for Indian developers and enthusiasts',
  '#9333ea',
  NULL
);

-- Create subcategories for organized learning
INSERT INTO categories (name, slug, description, parent_id)
SELECT 
  name,
  slug,
  description,
  (SELECT id FROM categories WHERE slug = 'web3forindia')
FROM (VALUES 
  ('Blockchain Basics', 'blockchain-basics', 'Fundamental concepts of blockchain technology'),
  ('Smart Contracts', 'smart-contracts', 'Learn Solidity and smart contract development'),
  ('DeFi', 'defi', 'Decentralized Finance protocols and applications'),
  ('NFTs', 'nfts', 'Non-Fungible Tokens and digital assets'),
  ('Web3 Development', 'web3-development', 'Building dApps and Web3 applications'),
  ('Crypto Fundamentals', 'crypto-fundamentals', 'Cryptocurrency fundamentals and trading'),
  ('Blockchain in India', 'blockchain-india', 'Indian blockchain ecosystem and regulations')
) AS subcats(name, slug, description);