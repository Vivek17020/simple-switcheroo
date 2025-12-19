import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Code2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Web3SearchDialog } from "./Web3SearchDialog";
import { ThemeToggle } from "@/components/theme-toggle";

export function Web3Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navLinks = [
    { name: "← Main Site", href: "/" },
    { name: "Home", href: "/web3forindia" },
    { name: "My Dashboard", href: "/web3forindia/dashboard" },
    { name: "Blockchain Basics", href: "/web3forindia/blockchain-basics" },
    { name: "Smart Contracts", href: "/web3forindia/smart-contracts" },
    { name: "DeFi", href: "/web3forindia/defi" },
    { name: "NFTs", href: "/web3forindia/nfts" },
    { name: "Crypto", href: "/web3forindia/crypto-fundamentals" },
    { name: "Code Playground", href: "/web3forindia/playground" },
    { name: "About", href: "/web3forindia/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
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
                className="text-sm font-medium text-foreground hover:text-[#6A5BFF] transition-colors flex items-center gap-1"
                title={link.name}
              >
                {link.name === "← Main Site" ? (
                  <Home className="w-5 h-5" />
                ) : link.name === "Code Playground" ? (
                  <Code2 className="w-5 h-5" />
                ) : (
                  link.name
                )}
              </Link>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="text-foreground hover:text-[#6A5BFF] transition-colors"
              title="Search (Ctrl+K)"
            >
              <Search className="w-5 h-5" />
            </Button>
            <ThemeToggle />
            <Link to="/web3forindia">
              <Button className="bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white hover:opacity-90 transition-opacity">
                Start Learning
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
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
              className="w-full justify-start gap-2 text-foreground hover:text-[#6A5BFF]"
            >
              <Search className="w-5 h-5" />
              Search
            </Button>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block text-sm font-medium text-foreground hover:text-[#6A5BFF] transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name === "← Main Site" ? (
                  <>
                    <Home className="w-5 h-5" />
                    <span>Main Site</span>
                  </>
                ) : link.name === "Code Playground" ? (
                  <>
                    <Code2 className="w-5 h-5" />
                    <span>{link.name}</span>
                  </>
                ) : (
                  link.name
                )}
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
