import { useState } from 'react';
import { useCategories, useArticles } from '@/hooks/use-articles';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Clock, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export function CategorySections() {
  const { data: categories, isLoading } = useCategories();
  const navigate = useNavigate();

  // Filter main categories (no parent) and exclude Jobs subcategories, web3forindia, and upscbriefs
  const mainCategories = categories?.filter(
    cat => !cat.parent_id && 
           !cat.name.startsWith('Jobs/') && 
           cat.slug !== 'web3forindia' && 
           cat.slug !== 'upscbriefs' &&
           !cat.name.toLowerCase().includes('upsc')
  ) || [];

  // Custom order: Business, Defence, then others, then World, Jobs at the end
  const categoryOrder = ['business', 'defence', 'technology', 'education', 'general', 'politics', 'sports', 'world', 'jobs'];
  const sortedCategories = mainCategories.sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.slug.toLowerCase());
    const indexB = categoryOrder.indexOf(b.slug.toLowerCase());
    
    // If both found in order array, use their defined order
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only A found, A comes first
    if (indexA !== -1) return -1;
    // If only B found, B comes first
    if (indexB !== -1) return 1;
    // If neither found, maintain alphabetical order
    return a.name.localeCompare(b.name);
  });

  if (isLoading) {
    return (
      <div className="space-y-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Skeleton className="lg:col-span-5 h-96" />
              <Skeleton className="lg:col-span-4 h-96" />
              <Skeleton className="lg:col-span-3 h-96" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {sortedCategories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          allCategories={categories || []}
        />
      ))}
    </div>
  );
}

interface CategorySectionProps {
  category: any;
  allCategories: any[];
}

function CategorySection({ category, allCategories }: CategorySectionProps) {
  const navigate = useNavigate();
  
  // Get subcategories for this category
  const subcategories = allCategories.filter(
    cat => cat.parent_id === category.id
  );

  // Fetch articles for main category only
  const { data: articlesData, isLoading } = useArticles(category.slug, 1, 8);
  const articles = articlesData?.articles || [];

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-5 h-96" />
          <Skeleton className="lg:col-span-4 h-96" />
          <Skeleton className="lg:col-span-3 h-96" />
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  // Split articles: 1 featured, 2 medium, rest small
  const featuredArticle = articles[0];
  const mediumArticles = articles.slice(1, 3);
  const smallArticles = articles.slice(3, 8);

  // Extract ONE tag per article from newest 5 articles
  const tagArticlePairs: Array<[string, typeof articles[0]]> = [];
  const newestFiveArticles = articles.slice(0, 5);
  
  for (const article of newestFiveArticles) {
    if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
      // Take only the first tag from each article
      tagArticlePairs.push([article.tags[0], article]);
    }
  }
  const latestTags = tagArticlePairs;

  return (
    <section className="space-y-6">
      {/* Category Header */}
      <div className="border-b-2 border-border pb-2">
        <h2 className="text-3xl font-bold uppercase tracking-tight text-foreground">
          {category.name}
        </h2>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Featured Article */}
        <div className="lg:col-span-5">
          {featuredArticle && (
            <Link 
              to={`/article/${featuredArticle.slug}`}
              className="group block h-full"
            >
              <div className="h-full flex flex-col">
                {featuredArticle.image_url ? (
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-4">
                    <img
                      src={featuredArticle.image_url}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-6xl font-bold text-primary/30">
                      {featuredArticle.title.charAt(0)}
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-3 line-clamp-3 group-hover:text-primary transition-colors">
                  {featuredArticle.title}
                </h3>
                {featuredArticle.excerpt && (
                  <p className="text-muted-foreground line-clamp-3 mb-3">
                    {featuredArticle.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto" data-no-translate>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(featuredArticle.published_at || featuredArticle.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{featuredArticle.reading_time}m</span>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Middle: Medium Articles */}
        <div className="lg:col-span-4 space-y-6">
          {mediumArticles.map((article) => (
            <Link
              key={article.id}
              to={`/article/${article.slug}`}
              className="group block"
            >
              <div className="flex gap-4">
                {article.image_url ? (
                  <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-24 flex-shrink-0 bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground/30">
                      {article.title.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-xs text-muted-foreground" data-no-translate>
                    {formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right: Small Article List */}
        <div className="lg:col-span-3 space-y-4 border-l border-border pl-6">
          {smallArticles.map((article, index) => (
            <Link
              key={article.id}
              to={`/article/${article.slug}`}
              className="group block"
            >
              <div className="pb-4 border-b border-border last:border-0">
                <h5 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h5>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Subcategories or Article Tags & More Button */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-border">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {subcategories.length > 0 ? (
            subcategories.map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => navigate(`/category/${subcat.slug}`)}
                className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                {subcat.name}
              </button>
            ))
          ) : latestTags.length > 0 ? (
            latestTags.map(([tag, article]) => (
              <button
                key={tag}
                onClick={() => navigate(`/article/${article.slug}`)}
                className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                {tag}
              </button>
            ))
          ) : null}
        </div>

        {/* More Category Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/category/${category.slug}`)}
          className="gap-1 group px-4 py-2 text-sm font-semibold hover:text-primary transition-colors whitespace-nowrap flex-shrink-0"
        >
          <span>More</span>
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  );
}
