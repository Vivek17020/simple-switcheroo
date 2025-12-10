import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useWebStoryBySlug } from '@/hooks/use-web-stories';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// React-based preview for CMS admin
export default function WebStoryPreview() {
  const { slug } = useParams<{ slug: string }>();
  const { story, loading } = useWebStoryBySlug(slug!);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!story) return;

    const duration = 5000; // 5 seconds per slide
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Auto-advance to next slide
          if (currentSlide < (story.slides?.length || 0) - 1) {
            setCurrentSlide(currentSlide + 1);
          }
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentSlide, story]);

  const nextSlide = () => {
    if (story && currentSlide < story.slides.length - 1) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
        <p className="text-gray-400">The web story you're looking for doesn't exist.</p>
      </div>
    );
  }

  const currentSlideData = story.slides[currentSlide];

  return (
    <>
      <Helmet>
        <title>Preview: {story.title} | TheBulletinBriefs</title>
        <style>{`
          body { margin: 0; padding: 0; overflow: hidden; }
        `}</style>
      </Helmet>

      <div className="fixed inset-0 bg-black">
        {/* Preview Badge */}
        <div className="fixed top-4 left-4 z-50 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
          PREVIEW MODE
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50 text-white hover:bg-white/20"
          onClick={() => window.history.back()}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Progress bars */}
        <div className="fixed top-0 left-0 right-0 z-40 flex gap-1 p-4">
          {story.slides.map((_, index) => (
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

        {/* Slide content */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <img
            key={`slide-${currentSlide}`}
            src={currentSlideData.image}
            alt={currentSlideData.text || `Slide ${currentSlide + 1}`}
            className="w-full h-full object-cover animate-in zoom-in fade-in duration-700"
            style={{ animationFillMode: 'forwards' }}
          />
          
          {/* Cover slide */}
          {currentSlideData.slideType === 'cover' && currentSlideData.text && (
            <div 
              key={`text-${currentSlide}`}
              className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 animate-in slide-in-from-bottom fade-in duration-500"
              style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
            >
              <div className="mb-8">
                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-4">
                  {story?.category?.toUpperCase()}
                </span>
                <h1 className="text-white text-3xl font-bold leading-tight mb-3">
                  {currentSlideData.text}
                </h1>
                {currentSlideData.subtext && (
                  <p className="text-white/90 text-lg">
                    {currentSlideData.subtext}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CTA slide */}
          {currentSlideData.slideType === 'cta' && (
            <div 
              key={`text-${currentSlide}`}
              className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-t from-black/95 via-black/70 to-black/40 p-8 animate-in fade-in duration-500"
            >
              <h2 className="text-white text-2xl font-bold text-center mb-4">
                {currentSlideData.text}
              </h2>
              {currentSlideData.subtext && (
                <p className="text-white/80 text-center mb-6">
                  {currentSlideData.subtext}
                </p>
              )}
              {currentSlideData.ctaUrl && (
                <a
                  href={currentSlideData.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold"
                >
                  {currentSlideData.ctaText || 'Read Full Article'}
                </a>
              )}
            </div>
          )}

          {/* Content/Summary slides */}
          {(!currentSlideData.slideType || currentSlideData.slideType === 'content' || currentSlideData.slideType === 'summary') && currentSlideData.text && (
            <div 
              key={`text-${currentSlide}`}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-8 animate-in slide-in-from-bottom fade-in duration-500"
              style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
            >
              {currentSlideData.slideType === 'summary' && (
                <span className="inline-block px-2 py-0.5 bg-white/20 text-white text-xs font-medium rounded mb-3">
                  KEY TAKEAWAY
                </span>
              )}
              <h2 className="text-white text-2xl font-bold leading-tight mb-2">
                {currentSlideData.text}
              </h2>
              {currentSlideData.subtext && (
                <p className="text-white/85 text-base leading-relaxed">
                  {currentSlideData.subtext}
                </p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {currentSlide > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {currentSlide < story.slides.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
              onClick={nextSlide}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}
        </div>

        {/* Story info */}
        <div className="fixed top-20 left-4 right-4 z-40">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
              TB
            </div>
            <div>
              <h3 className="font-semibold">{story.title}</h3>
              <p className="text-xs text-white/80">The Bulletin Briefs</p>
            </div>
          </div>
        </div>

        {/* Slide counter */}
        <div className="fixed bottom-4 right-4 z-40 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
          {currentSlide + 1} / {story.slides.length}
        </div>
      </div>
    </>
  );
}
