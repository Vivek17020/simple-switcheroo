-- Update existing learning paths with article slugs for each step
-- Complete Blockchain Beginner Path
UPDATE web3_learning_paths
SET steps = jsonb_build_array(
  jsonb_build_object(
    'title', 'What is Blockchain?',
    'description', 'Understand the fundamentals of blockchain technology',
    'article_slug', 'blockchain-basics-explained',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Understanding Cryptocurrency',
    'description', 'Learn about digital currencies and how they work',
    'article_slug', 'what-is-cryptocurrency',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Web3 Wallets Setup',
    'description', 'Set up and secure your first crypto wallet',
    'article_slug', 'web3-wallet-guide',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Your First Transaction',
    'description', 'Make your first blockchain transaction safely',
    'article_slug', 'first-blockchain-transaction',
    'required', true
  )
)
WHERE slug = 'complete-beginner-path';

-- Smart Contract Developer Path
UPDATE web3_learning_paths
SET steps = jsonb_build_array(
  jsonb_build_object(
    'title', 'Solidity Basics',
    'description', 'Learn the fundamentals of Solidity programming language',
    'article_slug', 'solidity-basics-tutorial',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Smart Contract Patterns',
    'description', 'Common patterns and best practices for smart contracts',
    'article_slug', 'smart-contract-design-patterns',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Testing & Security',
    'description', 'Write tests and secure your smart contracts',
    'article_slug', 'smart-contract-security-testing',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Deployment & Gas Optimization',
    'description', 'Deploy contracts and optimize gas costs',
    'article_slug', 'ethereum-gas-optimization',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Building a DApp',
    'description', 'Connect your smart contracts to a frontend',
    'article_slug', 'build-decentralized-app',
    'required', true
  )
)
WHERE slug = 'smart-contract-developer';

-- DeFi Specialist Path
UPDATE web3_learning_paths
SET steps = jsonb_build_array(
  jsonb_build_object(
    'title', 'DeFi Fundamentals',
    'description', 'Understanding decentralized finance basics',
    'article_slug', 'defi-explained-beginners',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Lending & Borrowing Protocols',
    'description', 'Learn about Aave, Compound, and lending mechanisms',
    'article_slug', 'defi-lending-protocols',
    'required', true
  ),
  jsonb_build_object(
    'title', 'DEX & Liquidity Pools',
    'description', 'Master Uniswap, PancakeSwap, and liquidity provision',
    'article_slug', 'dex-liquidity-pools-guide',
    'required', true
  ),
  jsonb_build_object(
    'title', 'Yield Farming Strategies',
    'description', 'Advanced yield farming and risk management',
    'article_slug', 'yield-farming-strategies',
    'required', true
  ),
  jsonb_build_object(
    'title', 'DeFi Security & Risks',
    'description', 'Understand smart contract risks and security practices',
    'article_slug', 'defi-security-risks',
    'required', true
  )
)
WHERE slug = 'defi-specialist';

COMMENT ON COLUMN web3_learning_paths.steps IS 'JSONB array of step objects with title, description, article_slug (required article to read), and required flag';