import { useEffect, useRef } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

const TRANSLATED_ATTR = 'data-translated';
const ORIGINAL_ATTR = 'data-original';

export function useAutoTranslate(containerRef?: React.RefObject<HTMLElement>) {
  const { currentLanguage, translateTexts, isTranslating } = useTranslation();
  const processingRef = useRef(false);
  const translationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isTranslating) return;

    const translatePage = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const container = containerRef?.current || document.body;
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              
              // Skip script, style, and already translated elements
              if (
                parent.tagName === 'SCRIPT' ||
                parent.tagName === 'STYLE' ||
                parent.tagName === 'NOSCRIPT' ||
                parent.closest('[data-no-translate]')
              ) {
                return NodeFilter.FILTER_REJECT;
              }

              const text = node.textContent?.trim();
              if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;

              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        const textNodes: { node: Node; parent: HTMLElement; original: string }[] = [];
        let node: Node | null;

        while (node = walker.nextNode()) {
          const parent = node.parentElement;
          if (!parent) continue;

          const text = node.textContent?.trim();
          if (!text) continue;

          // Store original if not already stored
          if (!parent.hasAttribute(ORIGINAL_ATTR)) {
            parent.setAttribute(ORIGINAL_ATTR, text);
          }

          const original = parent.getAttribute(ORIGINAL_ATTR) || text;
          textNodes.push({ node, parent, original });
        }

        if (textNodes.length === 0) {
          processingRef.current = false;
          return;
        }

        // If English, restore originals
        if (currentLanguage === 'en') {
          textNodes.forEach(({ node, parent, original }) => {
            if (node.textContent !== original) {
              node.textContent = original;
            }
            parent.removeAttribute(TRANSLATED_ATTR);
          });
          processingRef.current = false;
          return;
        }

        // Get texts that need translation
        const textsToTranslate = textNodes.map(({ original }) => original);
        const translations = await translateTexts(textsToTranslate);

        // Apply translations
        textNodes.forEach(({ node, parent }, index) => {
          const translation = translations[index];
          if (translation && node.textContent !== translation) {
            node.textContent = translation;
            parent.setAttribute(TRANSLATED_ATTR, currentLanguage);
          }
        });
      } catch (error) {
        console.error('Auto-translate error:', error);
      } finally {
        processingRef.current = false;
      }
    };

    translatePage();

    // Observe dynamic content with enhanced CMS article detection
    const container = containerRef?.current || document.body;
    const observer = new MutationObserver((mutations) => {
      // Skip mutations inside data-no-translate elements
      const filteredMutations = mutations.filter(mutation => {
        const target = mutation.target as HTMLElement;
        return !target.closest?.('[data-no-translate]');
      });
      
      if (filteredMutations.length === 0) return;
      let hasNewContent = false;
      let hasCMSContent = false;
      
      for (const mutation of filteredMutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              
              // Check if it's CMS article content
              if (
                element.matches?.('.article-content') ||
                element.matches?.('#cms-article') ||
                element.matches?.('article') ||
                element.matches?.('main') ||
                element.querySelector?.('.article-content') ||
                element.querySelector?.('#cms-article') ||
                element.querySelector?.('article')
              ) {
                hasCMSContent = true;
              }
              
              hasNewContent = true;
            } else if (node.nodeType === Node.TEXT_NODE) {
              hasNewContent = true;
            }
          });
        } else if (mutation.type === 'characterData') {
          hasNewContent = true;
        }
      }

      if (hasNewContent && !processingRef.current) {
        // Debounce translation calls, with shorter delay for CMS content
        if (translationTimeoutRef.current) {
          clearTimeout(translationTimeoutRef.current);
        }
        
        const delay = hasCMSContent ? 300 : 500;
        translationTimeoutRef.current = setTimeout(() => {
          translatePage();
        }, delay);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [currentLanguage, translateTexts, isTranslating, containerRef]);
}
