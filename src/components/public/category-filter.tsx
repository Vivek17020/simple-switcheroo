import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-articles";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryFilterProps {
  activeCategory?: string;
  onCategoryChange: (category?: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const { data: categories, isLoading } = useCategories();

  const jobsLinks = [
    { label: "Admit Cards", slug: "jobs-admit-cards" },
    { label: "Results", slug: "jobs-results" },
    { label: "Syllabus", slug: "jobs-syllabus" },
    { label: "Previous Year Papers", slug: "jobs-previous-year-papers" },
  ];

  const isJobsActive = jobsLinks.some(link => activeCategory === link.slug);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-20 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Button
        variant={!activeCategory ? "default" : "outline"}
        onClick={() => onCategoryChange(undefined)}
        className={cn(
          "transition-all duration-200",
          !activeCategory && "bg-gradient-primary text-primary-foreground"
        )}
      >
        All
      </Button>
      {categories?.filter(category => !category.name.startsWith('Jobs/') && category.slug !== 'web3forindia').map((category) => {
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        const isActive = activeCategory === category.slug || 
          (hasSubcategories && category.subcategories?.some(sub => sub.slug === activeCategory));
        
        if (hasSubcategories) {
          return (
            <DropdownMenu key={category.id}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "transition-all duration-200",
                    isActive && "bg-gradient-primary text-primary-foreground"
                  )}
                >
                  {category.name}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="z-50 w-56 bg-background border border-border shadow-md">
                <DropdownMenuItem onClick={() => onCategoryChange(category.slug)}>
                  All {category.name}
                </DropdownMenuItem>
                {category.subcategories?.map((subcat) => (
                  <DropdownMenuItem key={subcat.id} onClick={() => onCategoryChange(subcat.slug)}>
                    {subcat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        
        return (
          <Button
            key={category.id}
            variant={isActive ? "default" : "outline"}
            onClick={() => onCategoryChange(category.slug)}
            className={cn(
              "transition-all duration-200",
              isActive && "bg-gradient-primary text-primary-foreground"
            )}
          >
            {category.name}
          </Button>
        );
      })}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isJobsActive ? "default" : "outline"}
            className={cn(
              "transition-all duration-200",
              isJobsActive && "bg-gradient-primary text-primary-foreground"
            )}
          >
            Jobs
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-50 w-56 bg-background border border-border shadow-md">
          {jobsLinks.map((link) => (
            <DropdownMenuItem key={link.slug} onClick={() => onCategoryChange(link.slug)}>
              {link.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}