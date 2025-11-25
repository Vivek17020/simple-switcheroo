-- Add missing columns to web3_learning_paths
ALTER TABLE web3_learning_paths
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- Populate web3_learning_paths with structured learning paths
INSERT INTO web3_learning_paths (title, slug, description, difficulty, duration, category_ids, display_order, steps, is_published)
VALUES 
  (
    'Complete Blockchain Beginner Path',
    'complete-beginner-path',
    'Start from zero and build your blockchain foundation. Perfect for absolute beginners who want to understand Web3 technology from the ground up.',
    'Beginner',
    '4-6 weeks',
    ARRAY[(SELECT id FROM categories WHERE slug = 'blockchain-basics')]::uuid[],
    1,
    jsonb_build_array(
      jsonb_build_object(
        'title', 'What is Blockchain?',
        'description', 'Understand the fundamentals of blockchain technology',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Understanding Cryptocurrency',
        'description', 'Learn about digital currencies and how they work',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Web3 Wallets Setup',
        'description', 'Set up and secure your first crypto wallet',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Your First Transaction',
        'description', 'Make your first blockchain transaction safely',
        'completed', false
      )
    ),
    true
  ),
  (
    'Smart Contract Developer Path',
    'smart-contract-developer',
    'Master Solidity programming and become a blockchain developer. Learn to write, test, and deploy smart contracts on Ethereum.',
    'Intermediate',
    '8-10 weeks',
    ARRAY[(SELECT id FROM categories WHERE slug = 'smart-contracts'), (SELECT id FROM categories WHERE slug = 'web3-development')]::uuid[],
    2,
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Solidity Basics',
        'description', 'Learn the fundamentals of Solidity programming language',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Smart Contract Patterns',
        'description', 'Common patterns and best practices for smart contracts',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Testing & Security',
        'description', 'Write tests and secure your smart contracts',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Deployment & Gas Optimization',
        'description', 'Deploy contracts and optimize gas costs',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Building a DApp',
        'description', 'Connect your smart contracts to a frontend',
        'completed', false
      )
    ),
    true
  ),
  (
    'DeFi Specialist Path',
    'defi-specialist',
    'Understand decentralized finance protocols, yield farming, and liquidity provision. Become an expert in the DeFi ecosystem.',
    'Advanced',
    '6-8 weeks',
    ARRAY[(SELECT id FROM categories WHERE slug = 'defi')]::uuid[],
    3,
    jsonb_build_array(
      jsonb_build_object(
        'title', 'DeFi Fundamentals',
        'description', 'Understanding decentralized finance basics',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Lending & Borrowing Protocols',
        'description', 'Learn about Aave, Compound, and lending mechanisms',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'DEX & Liquidity Pools',
        'description', 'Master Uniswap, PancakeSwap, and liquidity provision',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'Yield Farming Strategies',
        'description', 'Advanced yield farming and risk management',
        'completed', false
      ),
      jsonb_build_object(
        'title', 'DeFi Security & Risks',
        'description', 'Understand smart contract risks and security practices',
        'completed', false
      )
    ),
    true
  );