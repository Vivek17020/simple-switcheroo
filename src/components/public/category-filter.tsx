import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-articles";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  activeCategory?: string;
  onCategoryChange: (category?: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const { data: categories, isLoading } = useCategories();

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
      {categories?.map((category) => (
        <Button
          key={category.id}
          variant={activeCategory === category.slug ? "default" : "outline"}
          onClick={() => onCategoryChange(category.slug)}
          className={cn(
            "transition-all duration-200",
            activeCategory === category.slug && "bg-gradient-primary text-primary-foreground"
          )}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}