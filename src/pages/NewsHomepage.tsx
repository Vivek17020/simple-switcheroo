import { useState, lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/public/navbar";
import { CategoryFilter } from "@/components/public/category-filter";
import { ArticleGrid } from "@/components/public/article-grid";
import { PersonalizedFeed } from "@/components/public/personalized-feed";
const Footer = lazy(() => import('@/components/public/footer').then(module => ({ default: module.Footer })));
import { PushNotificationButton } from '@/components/public/push-notification-button';
import { SearchDialog } from '@/components/public/search-dialog';
import { FloatingTranslationButton } from '@/components/public/floating-translation-button';
import { HomepageVideos } from '@/components/public/homepage-videos';
import { BreakingNews } from '@/components/public/breaking-news';
import { FeaturedArticles } from '@/components/public/featured-articles';
import { JustInSection } from '@/components/public/just-in-section';
import { CategorySections } from '@/components/public/category-sections';
import { WebStoriesSection } from '@/components/public/web-stories-section';
import { AdSlot } from '@/components/ads/ad-slot';
import { NativeAdContainer } from '@/components/ads/native-ad-container';
import { PremiumArticleList } from '@/components/monetization/premium-article-list';
import { SEOHead, generateOrganizationStructuredData, generateWebSiteStructuredData } from '@/utils/seo';
import { CoreWebVitals } from '@/components/performance/core-web-vitals';
import { PreloadCriticalResources } from '@/components/performance/preload-critical-resources';
import { PWAInstaller } from '@/components/pwa/pwa-installer';
import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useArticles, useCategories } from '@/hooks/use-articles';
import { useAuth } from '@/hooks/use-auth';
import { Search, TrendingUp, Clock, Play, User, Home, Crown } from 'lucide-react';
import { useAutoTranslate } from '@/hooks/use-auto-translate';
import { useTranslation } from '@/contexts/TranslationContext';

export default function NewsHomepage() {
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("for-you");
  
  const { user } = useAuth();
  const { isOnline, updateAvailable, updateApp } = usePWA();
  const { data: categories } = useCategories();
  const { data: latestArticles } = useArticles(undefined, 1, 6);
  const { currentLanguage } = useTranslation();
  useAutoTranslate(mainRef);

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
      
      {/* Performance Optimizations */}
      <PreloadCriticalResources />
      <CoreWebVitals />
      
      <div className="min-h-screen bg-background">
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
                  {categories?.filter(category => !category.name.startsWith('Jobs/')).map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.slug ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category.slug);
                        setActiveTab("browse"); // Switch to browse tab when clicking category
                        // Scroll to articles section smoothly
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
                  <PushNotificationButton />
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
        
        <main ref={mainRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 critical-above-fold">
          {/* Hero Section - Featured Articles */}
          <section className="py-4 sm:py-6 lg:py-8 hero-section">
            <FeaturedArticles />
          </section>

          {/* Top Banner Ad */}
          <AdSlot id="homepage-top-banner" format="leaderboard" />

          <Separator className="my-8" />

          {/* Main Content Tabs */}
          <section className="py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 max-w-md mx-auto">
                <TabsTrigger value="for-you" className="gap-2">
                  <Play className="h-4 w-4" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="browse" className="gap-2">
                  <Home className="h-4 w-4" />
                  Browse All
                </TabsTrigger>
                <TabsTrigger value="premium" className="gap-2">
                  <Crown className="h-4 w-4" />
                  Premium
                </TabsTrigger>
              </TabsList>

              <TabsContent value="for-you" className="space-y-8">
                <HomepageVideos />
              </TabsContent>

              <TabsContent value="browse" className="space-y-8 article-grid-section">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Main Articles Column */}
                  <div className="lg:col-span-3 space-y-8">
                    <CategoryFilter 
                      activeCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                    />
                    
                    <ArticleGrid categorySlug={selectedCategory} />
                    
                    {/* Native Ad between articles */}
                    <NativeAdContainer position="between-articles" articleIndex={0} />
                  </div>

                  {/* Sidebar Content */}
                  <div className="space-y-6">
                    <JustInSection />

                    {/* Sidebar Ad */}
                    <NativeAdContainer position="sidebar" articleIndex={0} />

                    {/* Newsletter moved to footer only */}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="premium">
                <PremiumArticleList />
              </TabsContent>
            </Tabs>
          </section>

          <Separator className="my-12" />

          {/* Web Stories Section */}
          <section className="py-8">
            <WebStoriesSection />
          </section>

          <Separator className="my-12" />

          {/* Category-based Article Sections */}
          <section className="py-8">
            <CategorySections />
          </section>

          <Separator className="my-12" />

          {/* Quick Actions */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📱 Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Get instant news updates delivered to your device
                </p>
                <PushNotificationButton />
              </CardContent>
            </Card>

            {/* Additional features can be added here */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Latest Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stay informed with our latest breaking news and analysis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Premium Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Access exclusive articles and ad-free reading
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/subscription')}
                  className="w-full"
                >
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer - Lazy loaded for better performance */}
        <Suspense fallback={<div className="h-96 bg-card border-t" />}>
          <Footer />
        </Suspense>

        {/* PWA Components */}
        <PWAInstaller />
        
        {/* Update Available Banner */}
        {updateAvailable && (
          <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground p-3 text-center z-50">
            <span className="mr-4">New version available!</span>
            <Button variant="secondary" size="sm" onClick={updateApp}>
              Update Now
            </Button>
          </div>
        )}

        {/* Offline Banner */}
        {!isOnline && (
          <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-3 text-center z-50">
            📵 You're offline. Some features may not work.
          </div>
        )}

        {/* Search Dialog */}
        <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />

        {/* Floating Translation Button */}
        <FloatingTranslationButton />
      </div>
    </>
  );
}