-- Create Web3 for India parent category
INSERT INTO public.categories (name, slug, description, color, parent_id)
VALUES (
  'Web3 for India',
  'web3forindia',
  'Learn Blockchain, Crypto & Smart Contracts Made for Indians',
  'purple',
  NULL
)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color;

-- Get the parent category ID
DO $$
DECLARE
  web3_parent_id UUID;
BEGIN
  SELECT id INTO web3_parent_id 
  FROM public.categories 
  WHERE slug = 'web3forindia';

  -- Create subcategories
  INSERT INTO public.categories (name, slug, description, color, parent_id) VALUES
  ('Blockchain Basics', 'blockchain-basics', 'Understanding blockchain technology fundamentals, how it works, and its applications in India', 'blue', web3_parent_id),
  ('Smart Contracts', 'smart-contracts', 'Learn to write and deploy smart contracts using Solidity, Web3.js, and Ethereum', 'green', web3_parent_id),
  ('DeFi', 'defi', 'Decentralized Finance explained: lending, borrowing, yield farming, and DeFi protocols', 'yellow', web3_parent_id),
  ('NFTs', 'nfts', 'Non-Fungible Tokens: creating, buying, and selling digital assets on blockchain', 'pink', web3_parent_id),
  ('Crypto Fundamentals', 'crypto-fundamentals', 'Cryptocurrency basics, trading, wallets, and regulations in India', 'orange', web3_parent_id),
  ('Web3 Development', 'web3-development', 'Build decentralized applications with React, ethers.js, and blockchain integration', 'indigo', web3_parent_id),
  ('Blockchain India', 'blockchain-india', 'Web3 ecosystem, startups, regulations, and opportunities in India', 'red', web3_parent_id)
  ON CONFLICT (slug) DO UPDATE 
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      color = EXCLUDED.color,
      parent_id = EXCLUDED.parent_id;
END $$;