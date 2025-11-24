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
    <nav className="sticky top-0 z-50 bg-[hsl(var(--web3-bg-dark-elevated))]/95 backdrop-blur-lg border-b border-[hsl(var(--web3-border-dark))]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/web3forindia" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--web3-primary))] to-[hsl(var(--web3-secondary))] flex items-center justify-center">
              <span className="text-white font-bold text-xl">W3</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--web3-primary))] to-[hsl(var(--web3-secondary))] bg-clip-text text-transparent">
              Web3 for India
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-[hsl(var(--web3-text-dark-muted))] hover:text-[hsl(var(--web3-primary))] transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="text-[hsl(var(--web3-text-dark-muted))] hover:text-[hsl(var(--web3-primary))] transition-colors"
              title="Search (Ctrl+K)"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Link to="/web3forindia">
              <Button className="bg-gradient-to-r from-[hsl(var(--web3-primary))] to-[hsl(var(--web3-secondary))] text-white hover:opacity-90 transition-opacity">
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
              <X className="w-6 h-6 text-[hsl(var(--web3-text-dark))]" />
            ) : (
              <Menu className="w-6 h-6 text-[hsl(var(--web3-text-dark))]" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-[hsl(var(--web3-border-dark))]">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSearchOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full justify-start gap-2 text-[hsl(var(--web3-text-dark-muted))] hover:text-[hsl(var(--web3-primary))]"
            >
              <Search className="w-5 h-5" />
              Search
            </Button>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block text-sm font-medium text-[hsl(var(--web3-text-dark-muted))] hover:text-[hsl(var(--web3-primary))] transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/web3forindia" onClick={() => setIsMenuOpen(false)} className="px-4">
              <Button className="w-full bg-gradient-to-r from-[hsl(var(--web3-primary))] to-[hsl(var(--web3-secondary))] text-white hover:opacity-90 transition-opacity">
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
