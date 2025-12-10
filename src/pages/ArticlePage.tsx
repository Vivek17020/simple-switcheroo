import React, { useEffect, useRef, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useArticle } from "@/hooks/use-articles";
import { supabase } from "@/integrations/supabase/client";
import { useTrackReading } from "@/hooks/use-reading-history";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { useAdjacentArticles } from "@/hooks/use-adjacent-articles";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/public/navbar";
import { Web3Navbar } from "@/components/web3/Web3Navbar";
import { Footer } from "@/components/public/footer";
import { Web3Footer } from "@/components/web3/Web3Footer";
import { RecommendedForYou } from "@/components/public/recommended-for-you";
import { ShareButtons } from "@/components/public/share-buttons";
import { CommentsSection } from "@/components/public/comments-section";
import { RelatedWebStories } from "@/components/public/related-web-stories";
import { RelatedVideos } from "@/components/public/related-videos";
import { LikeButton } from "@/components/public/like-button";
import { AuthorBio } from "@/components/public/author-bio";
import { AdSlot } from "@/components/ads/ad-slot";
import { NativeAdContainer } from "@/components/ads/native-ad-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead, generateArticleStructuredData, generateSEOKeywords } from "@/utils/seo";
import { BreadcrumbSchema, useBreadcrumbs } from "@/components/seo/breadcrumb-schema";
import { Calendar, Clock, Eye, User, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getFirstName } from "@/lib/utils";
import { useAutoTranslate } from "@/hooks/use-auto-translate";
import { useTranslation } from "@/contexts/TranslationContext";
import { FloatingTranslationButton } from "@/components/public/floating-translation-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading, error } = useArticle(slug!);
  const trackReading = useTrackReading();
  const contentRef = useRef<HTMLDivElement>(null);
  const articleContainerRef = useRef<HTMLDivElement>(null);
  const { currentLanguage } = useTranslation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Check if this is a Web3 article by fetching parent category
  const [isWeb3Article, setIsWeb3Article] = React.useState(false);
  
  React.useEffect(() => {
    const checkWeb3Category = async () => {
      if (!article) return;
      
      if (article.categories?.slug === 'web3forindia') {
        setIsWeb3Article(true);
        // Redirect to new Web3 article URL structure if accessed via old URL
        const currentPath = window.location.pathname;
        const expectedPath = `/web3forindia/${article.categories?.slug}/${slug}`;
        if (currentPath !== expectedPath && !currentPath.includes('/web3forindia/' + article.categories?.slug + '/')) {
          navigate(expectedPath, { replace: true });
        }
        return;
      }
      
      if (article.categories?.parent_id) {
        const { data: parentCategory } = await supabase
          .from('categories')
          .select('slug')
          .eq('id', article.categories.parent_id)
          .single();
        
        if (parentCategory?.slug === 'web3forindia') {
          setIsWeb3Article(true);
          // Redirect to new Web3 article URL structure if accessed via old URL
          const currentPath = window.location.pathname;
          const expectedPath = `/web3forindia/${article.categories.slug}/${slug}`;
          if (currentPath !== expectedPath && !currentPath.includes('/web3forindia/' + article.categories.slug + '/')) {
            navigate(expectedPath, { replace: true });
          }
        }
      }
    };
    
    checkWeb3Category();
  }, [article, slug, navigate]);
  
  // Fetch adjacent articles for swipe navigation
  const { data: adjacentArticles } = useAdjacentArticles(
    article?.id || "",
    article?.category_id || ""
  );
  
  // Handle article navigation with loading state
  const navigateToArticle = (articleSlug: string, direction: 'next' | 'previous') => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    const baseUrl = isWeb3Article ? '/web3forindia/article' : '/article';
    
    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: "instant" });
    
    // Navigate after brief delay for smooth transition
    setTimeout(() => {
      navigate(`${baseUrl}/${articleSlug}`);
      setIsNavigating(false);
    }, 100);
  };

  // Handle swipe gestures on mobile - edge-only for better scroll behavior
  const swipeState = useSwipeGesture(articleContainerRef, {
    onSwipeLeft: () => {
      if (adjacentArticles?.nextArticle) {
        navigateToArticle(adjacentArticles.nextArticle.slug, 'next');
      } else {
        toast({
          title: "No more articles",
          description: "You've reached the latest article in this category",
          duration: 2000,
        });
      }
    },
    onSwipeRight: () => {
      if (adjacentArticles?.previousArticle) {
        navigateToArticle(adjacentArticles.previousArticle.slug, 'previous');
      } else {
        toast({
          title: "No more articles",
          description: "You've reached the first article in this category",
          duration: 2000,
        });
      }
    },
    minSwipeDistance: 80,
    maxVerticalDistance: 50, // Strict vertical threshold
    edgeOnly: true, // Only swipe from edges
    edgeThreshold: 15, // 15% from screen edges
  });
  
  // Direct content rendering like Web3 articles for clean format
  const displayContent = useMemo(() => {
    if (!article || !article.content) return '';
    const content = typeof article.content === 'string' ? article.content : String(article.content);
    return content; // Direct rendering without sanitization to prevent breaks
  }, [article?.content]);
  
  useAutoTranslate(contentRef);

  // Track reading when article loads
  useEffect(() => {
    if (article?.id) {
      // Track initial view
      trackReading.mutate({ 
        articleId: article.id,
        duration: 0,
        percentage: 0
      });

      // Track reading time and scroll percentage
      const startTime = Date.now();
      let maxScroll = 0;

      const handleScroll = () => {
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        maxScroll = Math.max(maxScroll, scrolled);
      };

      const handleBeforeUnload = () => {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        trackReading.mutate({ 
          articleId: article.id,
          duration,
          percentage: Math.floor(maxScroll)
        });
      };

      window.addEventListener('scroll', handleScroll);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        // Track final reading stats
        const duration = Math.floor((Date.now() - startTime) / 1000);
        trackReading.mutate({ 
          articleId: article.id,
          duration,
          percentage: Math.floor(maxScroll)
        });
      };
    }
  }, [article?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar /> {/* Use default navbar during loading */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <Skeleton className="aspect-[16/9] w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to={isWeb3Article ? "/web3forindia" : "/"}>
                Return to {isWeb3Article ? "Web3 Home" : "Homepage"}
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const publishedDate = article.published_at ? new Date(article.published_at) : new Date(article.created_at);
  // Use database canonical URL if available, fallback to generated
  const canonicalUrl = (article as any).canonical_url || `https://www.thebulletinbriefs.in/article/${article.slug}`;
  
  // Auto-generate SEO keywords from article content
  const seoKeywords = generateSEOKeywords(article.title, article.content, article.tags);
  
  // Generate breadcrumbs
  const breadcrumbs = useBreadcrumbs(
    article.title, 
    article.categories?.name, 
    article.categories?.slug
  );
  const authorUsername = article.public_profiles?.username || article.profiles?.username;

  const NavbarComponent = isWeb3Article ? Web3Navbar : Navbar;
  const FooterComponent = isWeb3Article ? Web3Footer : Footer;

  return (
    <>
      <SEOHead
        title={article.meta_title || article.title}
        description={article.meta_description || article.excerpt || ""}
        image={article.image_url || undefined}
        url={canonicalUrl}
        type="article"
        publishedTime={article.published_at || article.created_at}
        modifiedTime={article.updated_at}
        author={article.author}
        tags={seoKeywords}
        content={article.content}
        structuredData={generateArticleStructuredData({
          title: article.title,
          description: article.excerpt || "",
          author: article.author,
          authorUsername: article.profiles?.username,
          publishedTime: article.published_at || article.created_at,
          modifiedTime: article.updated_at,
          image: article.image_url || undefined,
          url: canonicalUrl,
          keywords: seoKeywords,
        })}
      />
      
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen bg-background">
        <NavbarComponent />
        
        {/* Navigation Loading Overlay */}
        {isNavigating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Edge Swipe Zones - Visual indicators on mobile */}
        {isMobile && !isNavigating && (
          <>
            {/* Left edge indicator */}
            {adjacentArticles?.previousArticle && (
              <div className="fixed left-0 top-1/2 -translate-y-1/2 w-1 h-24 bg-primary/20 rounded-r-full z-30 pointer-events-none" />
            )}
            {/* Right edge indicator */}
            {adjacentArticles?.nextArticle && (
              <div className="fixed right-0 top-1/2 -translate-y-1/2 w-1 h-24 bg-primary/20 rounded-l-full z-30 pointer-events-none" />
            )}
          </>
        )}
        
        {/* Swipe Indicator - Mobile Only */}
        {isMobile && swipeState.isSwiping && (
          <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-between px-4">
            {swipeState.direction === "right" && adjacentArticles?.previousArticle && (
              <div 
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-xl transition-all"
                style={{ 
                  opacity: swipeState.progress,
                  transform: `translateX(${swipeState.progress * 20}px) scale(${0.9 + swipeState.progress * 0.1})`
                }}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {adjacentArticles.previousArticle.title}
                </span>
              </div>
            )}
            {swipeState.direction === "left" && adjacentArticles?.nextArticle && (
              <div 
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-xl transition-all ml-auto"
                style={{ 
                  opacity: swipeState.progress,
                  transform: `translateX(${-swipeState.progress * 20}px) scale(${0.9 + swipeState.progress * 0.1})`
                }}
              >
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {adjacentArticles.nextArticle.title}
                </span>
                <ChevronRight className="h-5 w-5" />
              </div>
            )}
          </div>
        )}
        
        <main 
          className="container mx-auto px-4 py-8" 
          ref={contentRef}
        >
          <div 
            className="max-w-4xl mx-auto relative"
            ref={articleContainerRef}
            style={{
              transform: swipeState.isSwiping 
                ? `translateX(${swipeState.direction === "right" ? swipeState.progress * 20 : -swipeState.progress * 20}px)`
                : "translateX(0)",
              transition: swipeState.isSwiping ? "none" : "transform 0.3s ease-out",
            }}
          >
            {/* Visual Breadcrumbs */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={isWeb3Article ? "/web3forindia" : "/"}>
                      {isWeb3Article ? "Web3 Home" : "Home"}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={isWeb3Article ? `/web3forindia/${article.categories?.slug}` : `/category/${article.categories?.slug}`}>
                      {article.categories?.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[200px] md:max-w-md truncate">
                    {article.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {article.categories?.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(publishedDate, "MMMM d, yyyy")}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {article.title}
              </h1>
              
              {article.excerpt && (
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground" data-no-translate>
                  {authorUsername && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span>By {authorUsername}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={publishedDate.toISOString()}>
                      {formatDistanceToNow(publishedDate, { addSuffix: true })}
                    </time>
                  </div>
                  {article.updated_at && article.published_at && 
                   new Date(article.updated_at) > new Date(article.published_at) && (
                    <div className="flex items-center gap-1.5 text-primary">
                      <Clock className="h-4 w-4" />
                      <time dateTime={new Date(article.updated_at).toISOString()}>
                        Updated {format(new Date(article.updated_at), "MMM d, yyyy")}
                      </time>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{article.reading_time} min read</span>
                  </div>
                </div>
                
                <ShareButtons 
                  url={canonicalUrl}
                  title={article.title}
                  description={article.excerpt || ""}
                  articleId={article.id}
                />
              </div>
            </header>

            {/* Featured Image */}
            {article.image_url && (
              <div className="mb-8 overflow-hidden rounded-lg">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full aspect-[16/9] object-cover"
                  width="1200"
                  height="675"
                  loading="eager"
                  decoding="async"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  style={{ objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '16/9' }}
                />
              </div>
            )}

            {/* Top Article Ad */}
            <div className="mb-8">
              <AdSlot id={`article-top-${article.id}`} format="rectangle" />
            </div>

            {/* Article Content - Clean format like Web3 articles */}
            <article 
              className="prose prose-lg max-w-none mb-12 prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:my-4 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-gray-900 prose-strong:font-semibold prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-h2:mt-8 prose-h2:mb-4 prose-h3:mt-6 prose-h3:mb-3 prose-ul:my-6 prose-ol:my-6 prose-li:my-2 prose-img:rounded-xl prose-img:my-6 prose-table:my-6 prose-table:border prose-th:border prose-th:p-2 prose-td:border prose-td:p-2"
              dangerouslySetInnerHTML={{ __html: displayContent || '' }}
            />

            {/* In-Content Ad */}
            <div className="my-8">
              <AdSlot id={`article-mid-${article.id}`} format="rectangle" className="mx-auto" />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Section */}
            <div className="border-t border-border pt-8 mb-12">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <LikeButton articleId={article.id} />
                  <h3 className="text-lg font-semibold">Share this article</h3>
                </div>
                <ShareButtons 
                  url={canonicalUrl}
                  title={article.title}
                  description={article.excerpt || ""}
                  articleId={article.id}
                />
              </div>
            </div>

            {/* Author Bio */}
            <AuthorBio 
              authorId={article.author_id || undefined} 
              authorName={article.author}
              authorUsername={article.profiles?.username}
            />

            {/* Mid-Content Ad */}
            <div className="my-8">
              <NativeAdContainer position="between-articles" articleIndex={0} />
            </div>

            {/* Comments Section */}
            <CommentsSection articleId={article.id} />

            {/* Related Web Stories - Internal Links for SEO */}
            {!isWeb3Article && (
              <RelatedWebStories 
                categorySlug={article.categories?.slug}
                tags={article.tags || []}
              />
            )}

            {/* Related Videos - Internal Links for SEO */}
            {!isWeb3Article && (
              <RelatedVideos category={article.categories?.name} />
            )}

            {/* Web3 CTA for Technology Articles */}
            {!isWeb3Article && article.categories?.slug === 'tech' && (
              <div className="my-8 p-6 rounded-xl bg-gradient-to-r from-[#6A5BFF]/10 to-[#4AC4FF]/10 border border-[#6A5BFF]/20">
                <h3 className="text-xl font-bold mb-2">🚀 Learn Web3 & Blockchain</h3>
                <p className="text-muted-foreground mb-4">
                  Interested in blockchain technology? Explore our free Web3 tutorials designed for Indian learners.
                </p>
                <a 
                  href="/web3forindia" 
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  Start Learning Web3 for Free →
                </a>
              </div>
            )}

            {/* Recommended For You */}
            <RecommendedForYou 
              categoryId={article.category_id}
              currentArticleId={article.id}
            />

            {/* Bottom Ad */}
            <div className="mt-12">
              <AdSlot id={`article-bottom-${article.id}`} format="leaderboard" />
            </div>
            
            {/* Navigation Arrows - Mobile Only */}
            {isMobile && (adjacentArticles?.previousArticle || adjacentArticles?.nextArticle) && (
              <div className="fixed bottom-20 left-0 right-0 flex justify-between px-4 pointer-events-none z-30">
                {adjacentArticles?.previousArticle ? (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="pointer-events-auto shadow-lg h-12 w-12 rounded-full"
                    onClick={() => navigateToArticle(adjacentArticles.previousArticle!.slug, 'previous')}
                    disabled={isNavigating}
                    title={adjacentArticles.previousArticle.title}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                ) : (
                  <div />
                )}
                {adjacentArticles?.nextArticle ? (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="pointer-events-auto shadow-lg h-12 w-12 rounded-full"
                    onClick={() => navigateToArticle(adjacentArticles.nextArticle!.slug, 'next')}
                    disabled={isNavigating}
                    title={adjacentArticles.nextArticle.title}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        </main>
        <FooterComponent />
        <FloatingTranslationButton />
      </div>
    </>
  );
}