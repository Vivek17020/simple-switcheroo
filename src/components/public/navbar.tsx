import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCategories } from "@/hooks/use-articles";
import { FileText, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/public/search-dialog";
import { UserMenu } from "@/components/public/user-menu";

export function Navbar() {
  const { data: categories } = useCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="TheBulletinBriefs Logo" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
              TheBulletinBriefs
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Home
            </Link>
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <img 
            src="/logo.png" 
            alt="TheBulletinBriefs Logo" 
            className="w-8 h-8 rounded-full object-cover mr-2"
          />
          <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
            TheBulletinBriefs
          </span>
          {mobileMenuOpen ? (
            <X className="ml-2 h-4 w-4" />
          ) : (
            <Menu className="ml-2 h-4 w-4" />
          )}
        </Button>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search functionality */}
          </div>
            <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-9 w-9 p-0"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border bg-background">
            <Link
              to="/"
              className="block px-3 py-2 text-base font-medium text-foreground/60 hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="block px-3 py-2 text-base font-medium text-foreground/60 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}