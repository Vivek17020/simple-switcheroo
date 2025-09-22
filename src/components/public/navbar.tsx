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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center">
        <div className="mr-8 hidden md:flex">
          <Link to="/" className="mr-8 flex items-center space-x-3 group">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="TheBulletinBriefs Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-md transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-20 group-hover:opacity-30 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                TheBulletinBriefs
              </span>
              <span className="text-xs text-muted-foreground -mt-1">
                Breaking News & Analysis
              </span>
            </div>
          </Link>
          <nav className="flex items-center space-x-8 text-sm font-medium">
            <Link
              to="/"
              className="relative py-2 px-3 rounded-md transition-all hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="relative py-2 px-3 rounded-md transition-all hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-accent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <img 
            src="/logo.png" 
            alt="TheBulletinBriefs Logo" 
            className="w-8 h-8 rounded-xl object-cover mr-2 shadow-sm"
          />
          <span className="font-serif font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
            TheBulletinBriefs
          </span>
          {mobileMenuOpen ? (
            <X className="ml-2 h-5 w-5" />
          ) : (
            <Menu className="ml-2 h-5 w-5" />
          )}
        </Button>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search functionality */}
          </div>
            <nav className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-10 w-10 p-0 rounded-xl hover:bg-accent transition-colors"
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
          <div className="px-4 pt-4 pb-6 space-y-2 border-t bg-card/50 backdrop-blur">
            <Link
              to="/"
              className="block px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="block px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
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