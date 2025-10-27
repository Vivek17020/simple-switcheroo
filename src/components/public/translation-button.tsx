import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation, LANGUAGES, Language } from '@/contexts/TranslationContext';

export function TranslationButton() {
  const { currentLanguage, setLanguage, isTranslating } = useTranslation();

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isTranslating}
          >
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">
              {LANGUAGES[currentLanguage].split('(')[0].trim()}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code as Language)}
              className={`cursor-pointer ${
                currentLanguage === code ? 'bg-primary/10 font-medium' : ''
              }`}
            >
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {currentLanguage !== 'en' && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
      )}
    </div>
  );
}
