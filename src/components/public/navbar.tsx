import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCategories } from "@/hooks/use-articles";
import { FileText, Menu, X, Search, ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/public/search-dialog";
import { UserMenu } from "@/components/public/user-menu";
import { TranslationButton } from "./translation-button";

export function Navbar() {
  const { data: categories } = useCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpenCategories, setMobileOpenCategories] = useState<Set<string>>(new Set());

  // Jobs category for special handling
  const jobsCategory = categories?.find(cat => cat.slug === 'jobs');
  const jobsSubcategories = jobsCategory?.subcategories || [];

  const toggleMobileCategory = (categoryId: string) => {
    const newSet = new Set(mobileOpenCategories);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setMobileOpenCategories(newSet);
  };

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
          
          {/* Desktop Navigation */}
          <nav className="flex items-center space-x-1" data-no-translate>
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
            >
              Home
            </Link>
            
            {categories?.filter(category => category.slug !== 'jobs' && !category.name.startsWith('Jobs/')).map((category) => {
              const hasSubcategories = category.subcategories && category.subcategories.length > 0;
              
              if (hasSubcategories) {
                return (
                  <div 
                    key={category.id} 
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(category.id)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      to={`/category/${category.slug}`}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                    >
                      {category.name}
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        activeDropdown === category.id && "rotate-180"
                      )} />
                    </Link>
                    
                    {/* Dropdown - Instant visibility on hover */}
                    <div className={cn(
                      "absolute left-0 top-full mt-1 w-56 transition-all duration-150 z-[100]",
                      activeDropdown === category.id 
                        ? "opacity-100 visible translate-y-0" 
                        : "opacity-0 invisible -translate-y-2 pointer-events-none"
                    )}>
                      <div className="bg-popover/98 backdrop-blur-sm border border-border rounded-md shadow-lg py-1.5">
                        <Link
                          to={`/category/${category.slug}`}
                          className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-primary transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          View All
                        </Link>
                        <div className="my-1 border-t border-border/50" />
                        {category.subcategories?.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            to={`/${category.slug}/${subcategory.slug}`}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                >
                  {category.name}
                </Link>
              );
            })}
            
            {/* Jobs Category */}
            {jobsCategory && jobsSubcategories.length > 0 && (
              <div 
                className="relative"
                onMouseEnter={() => setActiveDropdown('jobs')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to="/category/jobs"
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                >
                  Jobs
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    activeDropdown === 'jobs' && "rotate-180"
                  )} />
                </Link>
                
                <div className={cn(
                  "absolute left-0 top-full mt-1 w-56 transition-all duration-150 z-[100]",
                  activeDropdown === 'jobs'
                    ? "opacity-100 visible translate-y-0" 
                    : "opacity-0 invisible -translate-y-2 pointer-events-none"
                )}>
                  <div className="bg-popover/98 backdrop-blur-sm border border-border rounded-md shadow-lg py-1.5">
                    <Link
                      to="/category/jobs"
                      className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-primary transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      View All
                    </Link>
                    <div className="my-1 border-t border-border/50" />
                    {jobsSubcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        to={`/jobs/${subcategory.slug}`}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                        onClick={() => setActiveDropdown(null)}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
          <div className="w-full flex-1 md:w-auto md:flex-none" />
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
            <TranslationButton />
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm" data-no-translate>
          <div className="px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto">
            <Link
              to="/"
              className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            {categories?.filter(category => category.slug !== 'jobs' && !category.name.startsWith('Jobs/')).map((category) => {
              const hasSubcategories = category.subcategories && category.subcategories.length > 0;
              const isOpen = mobileOpenCategories.has(category.id);

              if (hasSubcategories) {
                return (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => toggleMobileCategory(category.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                    >
                      <span>{category.name}</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )} />
                    </button>
                    {isOpen && (
                      <div className="pl-4 space-y-1 py-1">
                        <Link
                          to={`/category/${category.slug}`}
                          className="block px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          View All
                        </Link>
                        {category.subcategories?.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            to={`/${category.slug}/${subcategory.slug}`}
                            className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              );
            })}

            {/* Jobs in Mobile Menu */}
            {jobsCategory && jobsSubcategories.length > 0 && (
              <div className="space-y-1 border-t border-border pt-2 mt-2">
                <button
                  onClick={() => toggleMobileCategory('jobs')}
                  className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                >
                  <span>Jobs</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    mobileOpenCategories.has('jobs') && "rotate-180"
                  )} />
                </button>
                {mobileOpenCategories.has('jobs') && (
                  <div className="pl-4 space-y-1 py-1">
                    <Link
                      to="/category/jobs"
                      className="block px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      View All
                    </Link>
                    {jobsSubcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        to={`/jobs/${subcategory.slug}`}
                        className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
