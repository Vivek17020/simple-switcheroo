import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category_slug: string;
}

interface UPSCSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UPSCSearchDialog = ({ open, onOpenChange }: UPSCSearchDialogProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchArticles = async () => {
      setLoading(true);
      try {
        // Get UPSC category IDs
        const { data: upscCategory } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", "upscbriefs")
          .single();

        if (!upscCategory) return;

        const { data: subCategories } = await supabase
          .from("categories")
          .select("id, slug")
          .eq("parent_id", upscCategory.id);

        const categoryIds = [upscCategory.id, ...(subCategories?.map((c) => c.id) || [])];

        const { data } = await supabase
          .from("articles")
          .select(`
            id,
            title,
            slug,
            excerpt,
            category_id,
            categories!inner(slug)
          `)
          .in("category_id", categoryIds)
          .eq("published", true)
          .ilike("title", `%${query}%`)
          .limit(10);

        const formattedResults: SearchResult[] = (data || []).map((article: any) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          category_slug: article.categories?.slug || "",
        }));

        setResults(formattedResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchArticles, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(`/upscbriefs/${result.category_slug}/${result.slug}`);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search UPSC Articles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search topics, subjects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : results.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => handleSelect(result)}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{result.title}</p>
                          {result.excerpt && (
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {result.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? (
              <p className="text-center py-8 text-gray-500">No articles found</p>
            ) : (
              <p className="text-center py-8 text-gray-400">
                Start typing to search...
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
