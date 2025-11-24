import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Web3SearchDialog } from "./Web3SearchDialog";

export function Web3Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/web3forindia" },
    { name: "My Dashboard", href: "/web3forindia/dashboard" },
    { name: "Blockchain Basics", href: "/web3forindia/blockchain-basics" },
    { name: "Smart Contracts", href: "/web3forindia/smart-contracts" },
    { name: "DeFi", href: "/web3forindia/defi" },
    { name: "NFTs", href: "/web3forindia/nfts" },
    { name: "Crypto", href: "/web3forindia/crypto-fundamentals" },
    { name: "About", href: "/web3forindia/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/web3forindia" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6A5BFF] to-[#4AC4FF] flex items-center justify-center">
              <span className="text-white font-bold text-xl">W3</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] bg-clip-text text-transparent">
              Web3 for India
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-gray-700 hover:text-[#6A5BFF] transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="text-gray-700 hover:text-[#6A5BFF] transition-colors"
              title="Search (Ctrl+K)"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Link to="/web3forindia">
              <Button className="bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white hover:opacity-90 transition-opacity">
                Start Learning
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSearchOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full justify-start gap-2 text-gray-700 hover:text-[#6A5BFF]"
            >
              <Search className="w-5 h-5" />
              Search
            </Button>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block text-sm font-medium text-gray-700 hover:text-[#6A5BFF] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/web3forindia" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white hover:opacity-90 transition-opacity">
                Start Learning
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Search Dialog */}
      <Web3SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </nav>
  );
}
