import { Languages, Globe } from 'lucide-react';
import { useTranslation, LANGUAGES } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';

export function TranslationLoader() {
  const { isTranslating, currentLanguage } = useTranslation();

  if (!isTranslating) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 animate-scale-in">
        {/* Animated Globe Icon */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <Globe className="h-20 w-20 text-primary/30" />
          </div>
          <Globe className="h-20 w-20 text-primary animate-pulse" />
          <Languages className="h-8 w-8 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-2xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Translating...
          </h3>
          <p className="text-muted-foreground text-sm">
            Converting to {LANGUAGES[currentLanguage]}
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
