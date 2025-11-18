import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'mr' | 'bn' | 'gu' | 'pa' | 'ur';

export const LANGUAGES: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  ml: 'മലയാളം (Malayalam)',
  mr: 'मराठी (Marathi)',
  bn: 'বাংলা (Bengali)',
  gu: 'ગુજરાતી (Gujarati)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  ur: 'اردو (Urdu)',
};

interface TranslationCache {
  [key: string]: {
    [language: string]: string;
  };
}

interface TranslationContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isTranslating: boolean;
  translateTexts: (texts: string[]) => Promise<string[]>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const CACHE_KEY = 'translation_cache';
const LANG_KEY = 'selected_language';

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'en';
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [cache, setCache] = useState<TranslationCache>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }, [cache]);

  const translateTexts = useCallback(async (texts: string[]): Promise<string[]> => {
    if (currentLanguage === 'en') return texts;
    if (texts.length === 0) return texts;

    // Check cache first
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];
    const results: string[] = new Array(texts.length);

    texts.forEach((text, index) => {
      const cached = cache[text]?.[currentLanguage];
      if (cached) {
        results[index] = cached;
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(index);
      }
    });

    if (uncachedTexts.length === 0) {
      return results;
    }

    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { texts: uncachedTexts, targetLanguage: currentLanguage }
      });

      if (error) throw error;
      if (!data?.translations) throw new Error('No translations received');

      const translations = data.translations;

      // Update cache and results
      const newCache = { ...cache };
      uncachedIndices.forEach((resultIndex, i) => {
        const originalText = uncachedTexts[i];
        const translation = translations[i];
        
        if (!newCache[originalText]) {
          newCache[originalText] = {};
        }
        newCache[originalText][currentLanguage] = translation;
        results[resultIndex] = translation;
      });

      setCache(newCache);
      return results;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Showing original text.');
      return texts;
    }
  }, [currentLanguage, cache]);

  const setLanguage = useCallback(async (lang: Language) => {
    if (lang === currentLanguage) return;
    
    setIsTranslating(true);
    
    // Minimum loading time for smooth UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setCurrentLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
    
    // Allow new language to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsTranslating(false);
  }, [currentLanguage]);

  return (
    <TranslationContext.Provider value={{ currentLanguage, setLanguage, isTranslating, translateTexts }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}
