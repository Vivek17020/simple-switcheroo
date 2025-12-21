import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Flashcard } from "@/hooks/use-upsc-flashcards";
import { Lightbulb, BookOpen, Link as LinkIcon } from "lucide-react";

interface UPSCFlashcardCardProps {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

const difficultyColors = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard: "bg-red-100 text-red-700 border-red-200",
};

const subjectColors: Record<string, string> = {
  "History": "from-amber-500 to-orange-500",
  "Geography": "from-green-500 to-emerald-500",
  "Polity": "from-blue-500 to-indigo-500",
  "Economy": "from-purple-500 to-violet-500",
  "Science": "from-cyan-500 to-teal-500",
  "Science & Technology": "from-cyan-500 to-teal-500",
  "Environment": "from-lime-500 to-green-500",
  "Current Affairs": "from-pink-500 to-rose-500",
  "Ethics": "from-indigo-500 to-purple-500",
  "Art & Culture": "from-rose-500 to-pink-500",
  "default": "from-gray-500 to-slate-500",
};

export const UPSCFlashcardCard = ({ flashcard, isFlipped, onFlip }: UPSCFlashcardCardProps) => {
  const gradientColor = subjectColors[flashcard.subject] || subjectColors.default;

  return (
    <div 
      className="flashcard-container w-full max-w-md mx-auto cursor-pointer select-none"
      onClick={onFlip}
      role="button"
      aria-label={isFlipped ? "Show question" : "Show answer"}
      tabIndex={0}
      onKeyDown={(e) => e.key === " " && onFlip()}
    >
      <div 
        className={cn(
          "flashcard relative w-full",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front - Question */}
        <div 
          className={cn(
            "flashcard-front rounded-2xl shadow-xl overflow-hidden",
            "bg-gradient-to-br", gradientColor
          )}
          style={{ minHeight: '400px' }}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative h-full flex flex-col p-6 text-white" style={{ minHeight: '400px' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-white/20 text-white border-white/30 text-xs backdrop-blur-sm">
                {flashcard.subject}
              </Badge>
              <Badge className={cn("text-xs border", difficultyColors[flashcard.difficulty])}>
                {flashcard.difficulty}
              </Badge>
            </div>
            
            {/* Topic */}
            {flashcard.topic && (
              <span className="text-sm text-white/80 mb-2 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {flashcard.topic}
              </span>
            )}
            
            {/* Title/Question */}
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-2">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold leading-relaxed">
                  {flashcard.title}
                </h3>
                <p className="text-lg text-white/90 leading-relaxed">
                  {flashcard.front_content}
                </p>
              </div>
            </div>
            
            {/* AI generated badge */}
            {flashcard.generated_by === 'ai' && (
              <div className="flex items-center gap-1 text-white/60 text-xs mb-2">
                <LinkIcon className="h-3 w-3" />
                AI Generated
              </div>
            )}
            
            {/* Tap hint */}
            <div className="text-center text-white/60 text-sm py-3 border-t border-white/20">
              👆 Tap to reveal answer
            </div>
          </div>
        </div>

        {/* Back - Answer */}
        <div 
          className="flashcard-back rounded-2xl shadow-xl overflow-hidden bg-card"
          style={{ minHeight: '400px' }}
        >
          <div className={cn("h-2 bg-gradient-to-r", gradientColor)} />
          <div className="flex flex-col p-6" style={{ minHeight: 'calc(400px - 8px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-primary flex items-center gap-1">
                ✅ Answer
              </span>
              <Badge variant="outline" className="text-xs">
                {flashcard.subject}
              </Badge>
            </div>
            
            {/* Answer content */}
            <div className="flex-1 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                  {flashcard.back_content}
                </p>
              </div>
            </div>
            
            {/* Source link if from article */}
            {flashcard.article_id && (
              <div className="mt-4 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  From UPSC Article
                </span>
              </div>
            )}
            
            {/* Tap hint */}
            <div className="text-center text-muted-foreground text-sm py-3 border-t border-border mt-4">
              👆 Tap to see question
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
