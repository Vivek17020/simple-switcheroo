import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, X, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WebStoryPage() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchStoryMetadata();
      trackWebStoryView(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (!storyData) return;

    const duration = 5000; // 5 seconds per slide
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Auto-advance to next slide
          if (currentSlide < (storyData.slides?.length || 0) - 1) {
            setCurrentSlide(currentSlide + 1);
          }
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentSlide, storyData]);

  const fetchStoryMetadata = async () => {
    try {
      const { data: story, error } = await supabase
        .from('web_stories')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error || !story) {
        setError(true);
        setLoading(false);
        return;
      }

      setStoryData(story);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch story metadata:', err);
      setError(true);
      setLoading(false);
    }
  };

  const trackWebStoryView = async (storySlug: string) => {
    try {
      const { data: story } = await supabase
        .from('web_stories')
        .select('id')
        .eq('slug', storySlug)
        .single();

      if (!story) return;

      await supabase.from('web_stories_analytics').insert({
        story_id: story.id,
        event_type: 'view',
        device_type: /Mobile/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to track web story view:', error);
    }
  };

  const nextSlide = () => {
    if (storyData && currentSlide < storyData.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setProgress(0);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setProgress(0);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: storyData.title,
          text: storyData.description || storyData.title,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !storyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
        <p className="text-gray-400 mb-6">The web story you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/web-stories')} variant="secondary">
          View All Stories
        </Button>
      </div>
    );
  }

  const baseUrl = 'https://www.thebulletinbriefs.in';
  const categorySlug = storyData.category.toLowerCase();
  const storyUrl = `${baseUrl}/webstories/${categorySlug}/${storyData.slug}`;
  const ampUrl = `${baseUrl}/amp-story/${categorySlug}/${storyData.slug}`;
  const posterImage = storyData.featured_image || storyData.slides[0]?.image || `${baseUrl}/logo.png`;
  const currentSlideData = storyData.slides[currentSlide];

  // Structured data for Google Discover and Google News
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": storyUrl
    },
    "headline": storyData.title,
    "description": storyData.description || storyData.title,
    "image": {
      "@type": "ImageObject",
      "url": posterImage,
      "width": 1200,
      "height": 630
    },
    "datePublished": storyData.published_at,
    "dateModified": storyData.updated_at || storyData.published_at,
    "author": {
      "@type": "Organization",
      "name": "TheBulletinBriefs",
      "url": baseUrl
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "TheBulletinBriefs",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 200,
        "height": 60
      }
    },
    "articleSection": storyData.category,
    "articleBody": storyData.slides.map((slide: any) => slide.text).filter(Boolean).join(' '),
    "keywords": `${storyData.category}, web stories, visual stories, news`,
    "isAccessibleForFree": true,
    "inLanguage": "en-US"
  };

  return (
    <>
      <Helmet>
        <title>{storyData.title} | TheBulletinBriefs Web Stories</title>
        <meta name="description" content={storyData.description || storyData.title} />
        <link rel="canonical" href={storyUrl} />
        
        {/* Link to AMP version for Google Discover */}
        <link rel="amphtml" href={ampUrl} />
        
        {/* Google Discover optimization */}
        <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large" />
        
        {/* News-specific meta tags */}
        <meta name="news_keywords" content={`${storyData.category}, web stories, visual stories`} />
        <meta name="article:published_time" content={storyData.published_at} />
        <meta name="article:modified_time" content={storyData.updated_at || storyData.published_at} />
        <meta name="article:section" content={storyData.category} />
        <meta name="article:publisher" content="TheBulletinBriefs" />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={storyData.title} />
        <meta property="og:description" content={storyData.description || storyData.title} />
        <meta property="og:image" content={posterImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={storyUrl} />
        <meta property="og:site_name" content="TheBulletinBriefs" />
        <meta property="article:published_time" content={storyData.published_at} />
        <meta property="article:modified_time" content={storyData.updated_at || storyData.published_at} />
        <meta property="article:section" content={storyData.category} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@TheBulletinBriefs" />
        <meta name="twitter:creator" content="@TheBulletinBriefs" />
        <meta name="twitter:title" content={storyData.title} />
        <meta name="twitter:description" content={storyData.description || storyData.title} />
        <meta name="twitter:image" content={posterImage} />
        <meta name="twitter:image:alt" content={storyData.title} />

        {/* Structured Data for Google Discover & News */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        <style>{`
          body { margin: 0; padding: 0; overflow: hidden; }
        `}</style>
      </Helmet>

      {/* Full-screen immersive viewer */}
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 text-white hover:bg-white/20"
          onClick={() => navigate(-1)}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Share button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50 text-white hover:bg-white/20"
          onClick={handleShare}
        >
          <Share2 className="w-6 h-6" />
        </Button>

        {/* Story viewer container - mobile sized */}
        <div className="relative w-full max-w-[414px] h-full max-h-[896px] bg-black shadow-2xl">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-40 flex gap-1 p-4">
            {storyData.slides.map((_: any, index: number) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: index < currentSlide ? '100%' : index === currentSlide ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story content */}
          <div className="relative w-full h-full overflow-hidden">
            <img
              key={currentSlide}
              src={currentSlideData.image}
              alt={currentSlideData.text || `Slide ${currentSlide + 1}`}
              className="w-full h-full object-cover animate-fade-in"
            />
            
            {/* Cover slide styling */}
            {currentSlideData.slideType === 'cover' && currentSlideData.text && (
              <div 
                key={`text-${currentSlide}`}
                className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 animate-slide-in-bottom"
              >
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full mb-4 animate-fade-in">
                    {storyData.category?.toUpperCase()}
                  </span>
                  <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight mb-3">
                    {currentSlideData.text}
                  </h1>
                  {currentSlideData.subtext && (
                    <p className="text-white/90 text-lg leading-relaxed">
                      {currentSlideData.subtext}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* CTA slide styling */}
            {currentSlideData.slideType === 'cta' && (
              <div 
                key={`text-${currentSlide}`}
                className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-t from-black/95 via-black/70 to-black/40 p-8 animate-fade-in"
              >
                <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight text-center mb-4">
                  {currentSlideData.text}
                </h2>
                {currentSlideData.subtext && (
                  <p className="text-white/80 text-center text-lg mb-6 max-w-xs">
                    {currentSlideData.subtext}
                  </p>
                )}
                {currentSlideData.ctaUrl && (
                  <a
                    href={currentSlideData.ctaUrl}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-semibold transition-all hover:scale-105"
                  >
                    {currentSlideData.ctaText || 'Read Full Article'}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Content/Summary slide styling */}
            {(!currentSlideData.slideType || currentSlideData.slideType === 'content' || currentSlideData.slideType === 'summary') && currentSlideData.text && (
              <div 
                key={`text-${currentSlide}`}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-8 animate-slide-in-bottom"
              >
                {currentSlideData.slideType === 'summary' && (
                  <span className="inline-block px-2 py-0.5 bg-white/20 text-white text-xs font-medium rounded mb-3">
                    KEY TAKEAWAY
                  </span>
                )}
                <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-2">
                  {currentSlideData.text}
                </h2>
                {currentSlideData.subtext && (
                  <p className="text-white/85 text-base md:text-lg leading-relaxed">
                    {currentSlideData.subtext}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Story info */}
          <div className="absolute top-20 left-4 right-4 z-40 animate-fade-in">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold animate-scale-in">
                TB
              </div>
              <div>
                <h3 className="font-semibold text-sm">{storyData.title}</h3>
                <p className="text-xs text-white/80">The Bulletin Briefs</p>
              </div>
            </div>
          </div>

          {/* Slide counter */}
          <div className="absolute bottom-4 right-4 z-40 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm animate-fade-in">
            {currentSlide + 1} / {storyData.slides.length}
          </div>
        </div>

        {/* Navigation arrows - outside the mobile container */}
        {currentSlide > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-8 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 hover:scale-110 w-14 h-14 rounded-full hidden md:flex transition-all duration-300 animate-fade-in"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {currentSlide < storyData.slides.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-8 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 hover:scale-110 w-14 h-14 rounded-full hidden md:flex transition-all duration-300 animate-fade-in"
            onClick={nextSlide}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>
    </>
  );
}
