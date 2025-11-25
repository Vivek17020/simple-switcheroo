import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Clock, TrendingUp, X, Filter } from "lucide-react";

interface Web3SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  reading_time: number | null;
  tags: string[] | null;
  image_url: string | null;
  views_count: number | null;
  categories: {
    name: string;
    slug: string;
    color: string | null;
  };
}

const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];
const POPULAR_TAGS = [
  "solidity",
  "ethereum",
  "bitcoin",
  "dapp",
  "wallet",
  "defi",
  "nft",
  "smart-contract",
  "blockchain",
  "web3",
];

export function Web3SearchDialog({ open, onOpenChange }: Web3SearchDialogProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("web3-recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  // Save search term to recent searches
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("web3-recent-searches", JSON.stringify(updated));
  };

  // Fetch Web3 category and subcategories
  const { data: web3Category } = useQuery({
    queryKey: ["web3-category-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", "web3forindia")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: subcategories } = useQuery({
    queryKey: ["web3-subcategories-search", web3Category?.id],
    queryFn: async () => {
      if (!web3Category?.id) return [];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", web3Category.id)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!web3Category?.id,
  });

  // Search articles
  const { data: searchResults, isLoading } = useQuery({
    queryKey: [
      "web3-search",
      debouncedSearch,
      selectedCategory,
      selectedDifficulty,
      selectedTags,
      subcategories,
    ],
    queryFn: async () => {
      if (!subcategories || subcategories.length === 0) return [];

      const subcatIds = subcategories.map((s) => s.id);

      let query = supabase
        .from("articles")
        .select(
          `
          id,
          title,
          slug,
          excerpt,
          published_at,
          reading_time,
          tags,
          image_url,
          views_count,
          category_id
        `
        )
        .in("category_id", subcatIds)
        .eq("published", true);

      // Apply search term
      if (debouncedSearch) {
        query = query.or(
          `title.ilike.%${debouncedSearch}%,content.ilike.%${debouncedSearch}%,excerpt.ilike.%${debouncedSearch}%`
        );
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      // Apply difficulty filter
      if (selectedDifficulty) {
        query = query.contains("tags", [selectedDifficulty]);
      }

      // Apply tags filter
      if (selectedTags.length > 0) {
        query = query.overlaps("tags", selectedTags);
      }

      const { data, error } = await query
        .order("published_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Manually join category data
      const results: SearchResult[] = (data || []).map((article) => {
        const category = subcategories.find((cat) => cat.id === article.category_id);
        return {
          ...article,
          categories: {
            name: category?.name || "Unknown",
            slug: category?.slug || "",
            color: category?.color || "general",
          },
        };
      });

      return results;
    },
    enabled: !!subcategories && subcategories.length > 0,
  });

  // Fetch trending tutorials
  const { data: trendingTutorials } = useQuery({
    queryKey: ["web3-trending-tutorials", subcategories],
    queryFn: async () => {
      if (!subcategories || subcategories.length === 0) return [];

      const subcatIds = subcategories.map((s) => s.id);

      const { data, error } = await supabase
        .from("articles")
        .select(
          `
          id,
          title,
          slug,
          views_count,
          reading_time,
          category_id
        `
        )
        .in("category_id", subcatIds)
        .eq("published", true)
        .order("views_count", { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((article) => {
        const category = subcategories.find((cat) => cat.id === article.category_id);
        return {
          ...article,
          categories: {
            name: category?.name || "Unknown",
            slug: category?.slug || "",
            color: category?.color || "general",
          },
        };
      });
    },
    enabled: !!subcategories && subcategories.length > 0 && !debouncedSearch,
  });

  const handleArticleClick = (slug: string) => {
    saveRecentSearch(searchTerm);
    navigate(`/web3forindia/article/${slug}`);
    onOpenChange(false);
    // Reset search state
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedDifficulty("");
    setSelectedTags([]);
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("web3-recent-searches");
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSelectedDifficulty("");
    setSelectedTags([]);
  };

  const hasActiveFilters =
    selectedCategory || selectedDifficulty || selectedTags.length > 0;

  const getDifficultyFromTags = (tags: string[] | null): string | null => {
    if (!tags) return null;
    return (
      DIFFICULTY_LEVELS.find((level) =>
        tags.map((t) => t.toLowerCase()).includes(level)
      ) || null
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] bg-clip-text text-transparent">
            <Search className="w-5 h-5 text-[#6A5BFF]" />
            Search Web3 for India
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tutorials, guides, and articles..."
              className="pl-10 pr-4 h-12 text-base"
              autoFocus
            />
          </div>
        </div>

        {/* Filters Toggle */}
        <div className="px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {[
                  selectedCategory ? 1 : 0,
                  selectedDifficulty ? 1 : 0,
                  selectedTags.length,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="px-6 py-4 bg-muted/30 border-y space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filters</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {subcategories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Difficulty Level
              </label>
              <div className="flex gap-2">
                {DIFFICULTY_LEVELS.map((level) => (
                  <Button
                    key={level}
                    variant={selectedDifficulty === level ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSelectedDifficulty(selectedDifficulty === level ? "" : level)
                    }
                    className="flex-1 capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <ScrollArea className="flex-1 px-6 pb-6" style={{ maxHeight: "400px" }}>
          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground">
              <div className="animate-pulse">Searching...</div>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && searchResults && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleArticleClick(result.slug)}
                  className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {result.image_url && (
                      <img
                        src={result.image_url}
                        alt={result.title}
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:bg-gradient-to-r group-hover:from-[#6A5BFF] group-hover:to-[#4AC4FF] group-hover:bg-clip-text group-hover:text-transparent transition-all line-clamp-1">
                        {result.title}
                      </h3>
                      {result.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {result.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {result.categories.name}
                        </Badge>
                        {getDifficultyFromTags(result.tags) && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {getDifficultyFromTags(result.tags)}
                          </Badge>
                        )}
                        {result.reading_time && (
                          <span className="text-xs text-muted-foreground">
                            {result.reading_time} min read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading &&
            debouncedSearch &&
            searchResults &&
            searchResults.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-2">
                  No results found for "{debouncedSearch}"
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}

          {/* Empty State - Recent Searches & Trending */}
          {!isLoading && !debouncedSearch && (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent Searches
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="h-6 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(term)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Tutorials */}
              {trendingTutorials && trendingTutorials.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    Trending Tutorials
                  </h3>
                  <div className="space-y-2">
                    {trendingTutorials.map((tutorial) => (
                      <button
                        key={tutorial.id}
                        onClick={() => handleArticleClick(tutorial.slug)}
                        className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all group"
                      >
                        <h4 className="font-medium text-sm group-hover:bg-gradient-to-r group-hover:from-[#6A5BFF] group-hover:to-[#4AC4FF] group-hover:bg-clip-text group-hover:text-transparent transition-all line-clamp-1">
                          {tutorial.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {tutorial.categories.name}
                          </Badge>
                          {tutorial.reading_time && (
                            <span className="text-xs text-muted-foreground">
                              {tutorial.reading_time} min read
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Category Links */}
              {subcategories && subcategories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Quick Access</h3>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((cat) => (
                      <Badge
                        key={cat.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setShowFilters(true);
                        }}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Keyboard Shortcuts Hint */}
        <div className="px-6 py-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-2 py-1 bg-background rounded border text-xs">ESC</kbd>{" "}
            to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
