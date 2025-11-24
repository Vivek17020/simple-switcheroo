import { useState } from 'react';
import { Languages, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation, LANGUAGES, Language } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';

export function FloatingTranslationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, setLanguage, isTranslating } = useTranslation();

  const handleLanguageSelect = async (lang: Language) => {
    await setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className={cn(
          "!fixed !bottom-6 !right-6 !z-[9999] h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-500 hover:scale-110",
          isOpen && "scale-95 rotate-90",
          isTranslating && "animate-pulse cursor-wait scale-105"
        )}
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}
        aria-label="Select Language"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Languages className={cn(
            "h-6 w-6 transition-transform duration-300",
            isTranslating && "animate-spin"
          )} />
        )}
      </Button>

      {/* Language Selector Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Language Menu */}
          <Card 
            className="!fixed !bottom-24 !right-6 !z-[9998] w-72 shadow-xl border-2 animate-scale-in transition-all duration-300"
            style={{ position: 'fixed', bottom: '6rem', right: '1.5rem', zIndex: 9998 }}
          >
            <div className="p-4 border-b bg-card">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Globe className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isTranslating && "animate-pulse"
                )} />
                <span>{isTranslating ? "Translating..." : "Select Language"}</span>
              </div>
            </div>
            
            <ScrollArea className="h-80">
              <div className="p-2">
                {Object.entries(LANGUAGES).map(([code, name]) => {
                  const isActive = currentLanguage === code;
                  const isEnglish = code === 'en';
                  
                  return (
                    <button
                      key={code}
                      onClick={() => handleLanguageSelect(code as Language)}
                      disabled={isTranslating}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg mb-1 transition-all duration-200",
                        "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary",
                        isActive && "bg-primary/10 text-primary font-medium border-l-4 border-primary",
                        isEnglish && !isActive && "text-primary",
                        !isActive && "hover:translate-x-1",
                        isTranslating && "opacity-50 cursor-wait"
                      )}
                    >
                      <span className={cn(
                        "text-sm",
                        isActive && "font-medium"
                      )}>
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </>
      )}
    </>
  );
}
