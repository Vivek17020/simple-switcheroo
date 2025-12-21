import { useState, lazy, Suspense, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { Navbar } from "@/components/public/navbar";
import { FeaturedArticles } from '@/components/public/featured-articles';
import { BreakingNews } from '@/components/public/breaking-news';
import { SEOHead, generateOrganizationStructuredData, generateWebSiteStructuredData } from '@/utils/seo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/use-articles';
import { useAuth } from '@/hooks/use-auth';
import { Search, Crown, Play, Home, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

// Lazy load below-fold components for faster initial load
const Footer = lazy(() => import('@/components/public/footer').then(module => ({ default: module.Footer })));
const HomepageVideos = lazy(() => import('@/components/public/homepage-videos').then(module => ({ default: module.HomepageVideos })));
const CategorySections = lazy(() => import('@/components/public/category-sections').then(module => ({ default: module.CategorySections })));
const WebStoriesSection = lazy(() => import('@/components/public/web-stories-section').then(module => ({ default: module.WebStoriesSection })));
const ArticleGrid = lazy(() => import('@/components/public/article-grid').then(module => ({ default: module.ArticleGrid })));
const JustInSection = lazy(() => import('@/components/public/just-in-section').then(module => ({ default: module.JustInSection })));
const CategoryFilter = lazy(() => import('@/components/public/category-filter').then(module => ({ default: module.CategoryFilter })));
const SearchDialog = lazy(() => import('@/components/public/search-dialog').then(module => ({ default: module.SearchDialog })));
const NotificationBell = lazy(() => import('@/components/public/notification-bell').then(module => ({ default: module.NotificationBell })));
const PremiumArticleList = lazy(() => import('@/components/monetization/premium-article-list').then(module => ({ default: module.PremiumArticleList })));
const AdSlot = lazy(() => import('@/components/ads/ad-slot').then(module => ({ default: module.AdSlot })));
const NativeAdContainer = lazy(() => import('@/components/ads/native-ad-container').then(module => ({ default: module.NativeAdContainer })));
const ExploreSections = lazy(() => import('@/components/public/explore-sections'));

// Lightweight loading skeletons
const SectionSkeleton = memo(() => (
  <div className="space-y-4 py-8">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  </div>
));

// Tabs component - inline to reduce imports
const TabButton = memo(({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: any; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
      active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
    }`}
  >
    <Icon className="h-4 w-4" />
    {children}
  </button>
));

export default function NewsHomepage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("for-you");
  
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const { currentLanguage } = useTranslation();

  // Intersection observers for lazy loading sections
  const { ref: videosRef, inView: videosInView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  const { ref: storiesRef, inView: storiesInView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  const { ref: categoriesRef, inView: categoriesInView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  const { ref: exploreRef, inView: exploreInView } = useInView({ triggerOnce: true, rootMargin: '200px' });

  return (
    <>
      <SEOHead 
        title="TheBulletinBriefs - Latest Breaking News & Updates"
        description="Stay informed with the latest breaking news, politics, technology, business, sports, and entertainment news from around the world."
        canonicalUrl={`${window.location.origin}/news`}
        structuredData={[
          generateOrganizationStructuredData(),
          generateWebSiteStructuredData()
        ]}
      />
      
      <div className="min-h-screen bg-background overflow-x-hidden" style={{ touchAction: 'pan-y pinch-zoom' }}>
        {/* Fixed Navbar */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <Navbar />
          
          {/* Breaking News Bar */}
          <BreakingNews />
          
          {/* Secondary Navigation */}
          <div className="border-b bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <Button
                    variant={!selectedCategory ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(undefined)}
                    className="whitespace-nowrap text-xs"
                  >
                    All
                  </Button>
                  {categories?.filter(category => 
                    !category.name.startsWith('Jobs/') && 
                    category.slug !== 'web3forindia' && 
                    category.slug !== 'upscbriefs' &&
                    !category.name.toLowerCase().includes('upsc') &&
                    !category.parent_id
                  ).map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.slug ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category.slug);
                        setActiveTab("browse");
                        setTimeout(() => {
                          document.querySelector('.article-grid-section')?.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="whitespace-nowrap text-xs hover:bg-primary/10 transition-colors"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
                    <NotificationBell />
                  </Suspense>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => navigate('/subscription')}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    <Crown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {currentLanguage !== 'en' && (
          <div className="bg-primary/10 text-primary text-center py-1 text-sm" data-no-translate>
            Translated via AI
          </div>
        )}
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section - Featured Articles - CRITICAL, loaded immediately */}
          <section className="py-4 sm:py-6 lg:py-8 hero-section">
            <FeaturedArticles />
          </section>

          {/* Top Banner Ad - Lazy */}
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <AdSlot id="homepage-top-banner" format="leaderboard" />
          </Suspense>

          <Separator className="my-8" />

          {/* Main Content Tabs */}
          <section className="py-8" ref={videosRef}>
            {/* Custom Tab Navigation */}
            <div className="flex gap-2 mb-8 max-w-md mx-auto bg-muted/50 p-1 rounded-xl">
              <TabButton active={activeTab === "for-you"} onClick={() => setActiveTab("for-you")} icon={Play}>
                Videos
              </TabButton>
              <TabButton active={activeTab === "browse"} onClick={() => setActiveTab("browse")} icon={Home}>
                Browse All
              </TabButton>
              <TabButton active={activeTab === "premium"} onClick={() => setActiveTab("premium")} icon={Crown}>
                Premium
              </TabButton>
            </div>

            {/* Tab Contents */}
            {activeTab === "for-you" && videosInView && (
              <Suspense fallback={<SectionSkeleton />}>
                <HomepageVideos />
              </Suspense>
            )}

            {activeTab === "browse" && (
              <div className="space-y-8 article-grid-section">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                      <CategoryFilter 
                        activeCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                      />
                    </Suspense>
                    
                    <Suspense fallback={<SectionSkeleton />}>
                      <ArticleGrid categorySlug={selectedCategory} />
                    </Suspense>
                    
                    <Suspense fallback={null}>
                      <NativeAdContainer position="between-articles" articleIndex={0} />
                    </Suspense>
                  </div>

                  <div className="space-y-6">
                    <Suspense fallback={<Skeleton className="h-64" />}>
                      <JustInSection />
                    </Suspense>

                    <Suspense fallback={null}>
                      <NativeAdContainer position="sidebar" articleIndex={0} />
                    </Suspense>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "premium" && (
              <Suspense fallback={<SectionSkeleton />}>
                <PremiumArticleList />
              </Suspense>
            )}
          </section>

          <Separator className="my-12" />

          {/* Web Stories Section - Lazy loaded when in view */}
          <section className="py-8" ref={storiesRef}>
            {storiesInView && (
              <Suspense fallback={<SectionSkeleton />}>
                <WebStoriesSection />
              </Suspense>
            )}
          </section>

          <Separator className="my-12" />

          {/* Category-based Article Sections - Lazy loaded when in view */}
          <section className="py-8" ref={categoriesRef}>
            {categoriesInView && (
              <Suspense fallback={<SectionSkeleton />}>
                <CategorySections />
              </Suspense>
            )}
          </section>

          <Separator className="my-12" />

          {/* Explore Our Sections - Lazy loaded when in view */}
          <section className="py-8" ref={exploreRef}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Explore Our Sections
            </h2>
            {exploreInView && (
              <Suspense fallback={<SectionSkeleton />}>
                <ExploreSections onVideoClick={() => {
                  setActiveTab("for-you");
                  document.querySelector('.hero-section')?.scrollIntoView({ behavior: 'smooth' });
                }} />
              </Suspense>
            )}
          </section>
        </main>

        {/* Footer - Lazy loaded for better performance */}
        <Suspense fallback={<div className="h-96 bg-card border-t" />}>
          <Footer />
        </Suspense>

        {/* Search Dialog - Lazy */}
        {isSearchOpen && (
          <Suspense fallback={null}>
            <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
          </Suspense>
        )}
      </div>
    </>
  );
}