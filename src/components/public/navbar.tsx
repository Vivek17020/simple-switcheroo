import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCategories } from "@/hooks/use-articles";
import { Menu, X } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/public/user-menu";

export function Navbar() {
  const { data: categories } = useCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Preload categories data on mount to eliminate hover delays
  React.useEffect(() => {
    if (categories) {
      // Data is loaded, preload is complete
      console.log('Categories preloaded:', categories.length);
    }
  }, [categories]);

  // Jobs subcategories will be fetched dynamically from the database
  const jobsCategory = categories?.find(cat => cat.slug === 'jobs');
  const jobsSubcategories = jobsCategory?.subcategories || [];

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
          <nav className="flex items-center space-x-6 text-sm font-medium" data-no-translate>
            <Link
              to="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Home
            </Link>
            {categories?.filter(category => category.slug !== 'jobs' && category.slug !== 'web3forindia' && !category.name.startsWith('Jobs/')).map((category) => {
              const hasSubcategories = category.subcategories && category.subcategories.length > 0;
              
              if (hasSubcategories) {
                return (
                  <div key={category.id} className="relative group/category">
                    <Link
                      to={`/category/${category.slug}`}
                      className="transition-all duration-200 hover:text-foreground hover:scale-105 text-foreground/60 cursor-pointer relative inline-block"
                    >
                      {category.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/category:w-full"></span>
                    </Link>
                    {/* Invisible bridge for smooth hover - always interactive */}
                    <div className="absolute top-full left-0 w-56 h-2 pointer-events-auto z-[99999]" />
                    <div className="absolute top-full left-0 mt-2 w-56 bg-popover border border-border shadow-xl rounded-md opacity-0 invisible group-hover/category:!opacity-100 group-hover/category:!visible transition-all duration-200 !z-[99999] pointer-events-auto" data-no-translate>
                      <Link to={`/category/${category.slug}`} className="block px-4 py-2 text-sm hover:bg-accent hover:text-foreground rounded-t-md transition-colors">
                        All {category.name}
                      </Link>
                      {category.subcategories?.map((subcat: any) => (
                        <Link key={subcat.id} to={`/${category.slug}/${subcat.slug}`} className="block px-4 py-2 text-sm hover:bg-accent hover:text-foreground last:rounded-b-md transition-colors">
                          {subcat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  {category.name}
                </Link>
              );
            })}
            {jobsCategory && jobsSubcategories.length > 0 && (
              <div className="relative group/jobs">
                <Link
                  to="/category/jobs"
                  className="transition-all duration-200 hover:text-foreground hover:scale-105 text-foreground/60 cursor-pointer relative inline-block"
                >
                  Jobs
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/jobs:w-full"></span>
                </Link>
                {/* Invisible bridge for smooth hover - always interactive */}
                <div className="absolute top-full left-0 w-56 h-2 pointer-events-auto z-[99999]" />
                <div className="absolute top-full left-0 mt-2 w-56 bg-popover border border-border shadow-xl rounded-md opacity-0 invisible group-hover/jobs:!opacity-100 group-hover/jobs:!visible transition-all duration-200 !z-[99999] pointer-events-auto" data-no-translate>
                  <Link to="/category/jobs" className="block px-4 py-2 text-sm hover:bg-accent hover:text-foreground rounded-t-md transition-colors">
                    All Jobs
                  </Link>
                  {jobsSubcategories.map((subcat: any) => (
                    <Link
                      key={subcat.id}
                      to={`/jobs/${subcat.slug}`}
                      className="block px-4 py-2 text-sm hover:bg-accent hover:text-foreground last:rounded-b-md transition-colors"
                    >
                      {subcat.name}
                    </Link>
                  ))}
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

        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border" data-no-translate>
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className="block px-3 py-3 text-base font-medium text-foreground/60 hover:text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              {categories?.filter(category => category.slug !== 'jobs' && category.slug !== 'web3forindia' && !category.name.startsWith('Jobs/')).map((category: any) => (
                <div key={category.id} className="space-y-1">
                  <Link
                    to={`/category/${category.slug}`}
                    className="block px-3 py-3 text-base font-medium text-foreground/60 hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="pl-3 space-y-1 border-l-2 border-border ml-3">
                      {category.subcategories.map((subcat: any) => (
                        <Link
                          key={subcat.id}
                          to={`/${category.slug}/${subcat.slug}`}
                          className="block px-3 py-2 text-sm text-foreground/60 hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subcat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {jobsCategory && jobsSubcategories.length > 0 && (
                <div className="border-t border-border mt-2 pt-2 space-y-1">
                  <Link
                    to="/category/jobs"
                    className="block px-3 py-3 text-base font-medium text-foreground/60 hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Jobs
                  </Link>
                  <div className="pl-3 space-y-1 border-l-2 border-border ml-3">
                    {jobsSubcategories.map((subcat: any) => (
                      <Link
                        key={subcat.id}
                        to={`/jobs/${subcat.slug}`}
                        className="block px-3 py-2 text-sm text-foreground/60 hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subcat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}