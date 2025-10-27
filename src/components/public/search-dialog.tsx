import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  views_count: number;
  categories: { name: string; slug: string; color: string };
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<SearchResult[]>([]);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
    
    // Load trending articles
    loadTrendingArticles();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchArticles(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const loadTrendingArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          published_at,
          views_count,
          categories:category_id (
            name,
            slug,
            color
          )
        `)
        .eq('published', true)
        .order('views_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTrendingArticles(data || []);
    } catch (error) {
      console.error('Error loading trending articles:', error);
    }
  };

  const searchArticles = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          published_at,
          views_count,
          categories:category_id (
            name,
            slug,
            color
          )
        `)
        .eq('published', true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
        .order('published_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error searching articles:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Add to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
    
    // Close dialog
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSearch(query.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Search Articles</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-96">
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : query.trim() && results.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Search Results</h3>
                {results.map((article) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.slug}`}
                    onClick={() => {
                      handleSearch(query);
                      onOpenChange(false);
                    }}
                    className="block group"
                  >
                    <div className="p-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          {article.excerpt && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {article.categories.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : query.trim() && !isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No articles found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuery(search);
                            searchArticles(search);
                          }}
                          className="text-xs"
                        >
                          {search}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {recentSearches.length > 0 && <Separator />}

                {/* Trending Articles */}
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Now
                  </h3>
                  <div className="space-y-2">
                    {trendingArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/article/${article.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="block group"
                      >
                        <div className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {article.categories.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {article.views_count} views
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}